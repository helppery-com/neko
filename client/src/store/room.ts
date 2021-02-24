import { getterTree, mutationTree, actionTree } from 'typed-vuex'
import { get, set } from '~/utils/localstorage'
import { EVENT } from '~/neko/events'
import { Member } from '~/neko/types'

const io = require("socket.io-client");
/*@ts-ignore */
window.io = io
const { RTCNavroom } = require('~/assets/RTCMultiConnectionClient')

import { accessor } from '~/store'
import { stat } from 'fs'
import { messages } from '~/locale';

export const namespaced = true
interface Message {
  id: string
  content: string
  created: Date
  type: 'text',
  event: string
}

export const state = () => ({
  connecting: false,
  connected: false,
  connection: null,
  userStream: null,
  guestStreams: {},
  paused: false,
  muted: false,
  lastRoomMessage: {},
  pointers: {}
})

export const getters = getterTree(state, {})

export const mutations = mutationTree(state, {
  setConnecting(state, connecting: boolean) {
    state.connecting = connecting
  },

  setConnection(state, connection: any ) {
    state.connection = connection
  },

  setUserStream(state, stream: any) {
    state.userStream = stream
    state.connected = !!stream
    state.connecting = false
  },

  addGuestStream(state, event: any) {
    const id: string = event.extra.id
    state.guestStreams = {
      ...state.guestStreams,
      [id]: event
    }
  },

  setPaused(state, paused) {
    state.paused = paused
  },

  setMuted(state, muted) {
    state.muted = muted
  },

  addMessage(state, message: Message) {
    const member = accessor.user.members[message.id]
    if (member) {
      message = { ...message, member }
      state.lastRoomMessage = {
        ...state.lastRoomMessage,
        [message.id]: message
      }
      if (message.event === 'mousemove') {
        state.pointers = {
          ...state.pointers,
          [message.id]: message
        }
      }
    }
  }
})

export const actions = actionTree(
  { state, getters, mutations },
  {
    async connect({ state }) {
      if (state.connected) {
        return
      }
      const user = {
        id: accessor.user.member.id,
        username: accessor.displayname,
        role: { type: 'user' }
      }
      const room = {
        roomId: accessor.roomId,
        host: {
          id: accessor.user.member.id
        }
      }
      // @ts-ignore
      const connection = new RTCNavroom(user, room)
      connection.onUserConnected = (stream: any) => accessor.room.setUserStream(stream)
      connection.onGuestConnected = (stream: any) => accessor.room.addGuestStream(stream)
      accessor.room.setConnection(connection)
      return connection.open()
    },

    disConnect({ state }) {
      // @ts-ignore
      state.connection?.leave()
      state.connected = false
      state.userStream = null
      state.guestStreams = {}
    },

    async toggleVideo ({ state }) {
      if (!state.connected) {
        await accessor.room.connect()
      } else {
        // @ts-ignore
        state.connection!.toggleVideo()
      }
      // @ts-ignore
      accessor.room.setPaused(state.connection.paused)
    },

    async toggleAudio ({ state }) {
      if (!state.connected) {
        await accessor.room.connect()
      } else {
        // @ts-ignore
        state.connection!.toggleAudio()
      }
      // @ts-ignore
      accessor.room.setMuted(state.connection.muted)
    },

    sendRoomMessage({ state }, data: object) {
      if (!accessor.connected || accessor.user.muted) {
        return
      }
      // TODO: Create custome message
      const content = JSON.stringify({
          type: 'room',
          data
        })
      $client.sendMessage(EVENT.CHAT.MESSAGE, { content })
    },

    newMessage(store, message: Message) {
      try {
        const content = JSON.parse(message.content)
        if (content.type === 'room') {
          if (message.id !== accessor.user.member.id) {
            accessor.room.addMessage({
              ...message,
              ...content.data
            })
          }
          return true // Stop propagation
        }
      } catch {}
      return false
    }
  }
)
