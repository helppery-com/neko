import { getterTree, mutationTree, actionTree } from 'typed-vuex'
import { get, set } from '~/utils/localstorage'
const io = require("socket.io-client");
/*@ts-ignore */
window.io = io
const { RTCNavroom } = require('~/assets/RTCMultiConnectionClient')

import { accessor } from '~/store'
import { stat } from 'fs'

export const namespaced = true

export const state = () => ({
  connected: false,
  connection: null,
  userStream: null,
  guestStreams: {}
})

export const getters = getterTree(state, {})

export const mutations = mutationTree(state, {
  setConnection(state, connection: any ) {
    state.connection = connection
  },
  setUserStream(state, stream: any) {
    state.userStream = stream
    state.connected = !!stream
  },
  addGuestStream(state, event: any) {
    const id: string = event.extra.id
    state.guestStreams = {
      ...state.guestStreams,
      [id]: event
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
      const connection = new RTCNavroom(user, room)
      connection.onUserConnected = (stream: any) => accessor.room.setUserStream(stream)
      connection.onGuestConnected = (stream: any) => accessor.room.addGuestStream(stream)
      connection.open()
      accessor.room.setConnection(connection)
    },
    disConnect({ state }) {
      // @ts-ignore
      state.connection?.leave()
      state.connected = false
      state.userStream = null
      state.guestStreams = {}
    }
  }
)
