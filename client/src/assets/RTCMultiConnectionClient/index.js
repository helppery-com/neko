/* eslint-disable */
import RTCMultiConnection from '~/assets/RTCMutiConnection'
import * as io from 'socket.io-client'
global.io = io

export class RTCNavroom {
  room = null
  connection = null
  connected = false
  user = null
  streams = {}
  userStrem = null
  guests = []
  waitingUsers = []
  anyHostConnected = false
  muted = false
  connectedRoomId = null
  acceptedParticipants = []
  onMessage = () => {}
  updatedAt = new Date()
  
  onUserConnected (event) {}
  onUserDisconnected () {}
  onGuestConnected (event) {}
  onGuestDisconnected (event) {}

  constructor (user, room) {
    this.user = user
    this.room = room
  }

  get isHost () {
    return this.room && this.room.host &&
      this.room.host.id === this.user.id
  }

  // @Log
  async open () {
    console.log('RTC open')
    // logging.info('connectRTC')

    const connection = this.connection = new RTCMultiConnection()
    connection.password = this.room.roomPassword
    connection.socketURL = 'https://rtcmulticonnection.herokuapp.com/' //process.env.RTC_IO_SERVER

    connection.session = {
      audio: true,
      video: true,
      data: true
    }
    if (this.lowBandwith) {
      // logging.info('lowBandwith', connection)
      connection.bandwidth = {
        audio: 50, // 50 kbps
        video: 256, // 256 kbps
        screen: 300 // 300 kbps
      }
      connection.mediaConstraints = {
        audio: true,
        video: {
          mandatory: {
            minFrameRate: 15,
            maxFrameRate: 15
          },
          optional: []
        }
      }
    }
    // STUN / TURN Servers
    connection.iceServers = []
    connection.iceServers.push({
      urls: 'stun:stun.meetnav.com:3478'
    })
    connection.iceServers.push({
      urls: 'turn:turn.meetnav.com:3478',
      credential: 'M3tNav',
      username: 'coturn'
    })
    connection.iceTransportPolicy = 'relay'

    // socket
    const { roomId } = this.room
    connection.socketMessageEvent = 'channel-' + roomId
    connection.channel = connection.sessionid = roomId

    // connection.chunkSize = chunk_size;
    
    connection.onstream = this.onStream.bind(this)

    connection.onstreamended = this.onStreamEnded.bind(this)

    connection.onUserIdAlreadyTaken = this.onUserIdAlreadyTaken.bind(this)

    connection.onmessage = this.onMessage.bind(this)

    connection.onmute = this.onMute()

    connection.onunmute = this.onUnmute()

    connection.extra = this.encodeExtra({
      id: this.user.id,
      username: this.user.username,
      incognito: this.user.role.type === 'incognito',
      isHost: this.isHost
    })

    /* if (this.isHost) {
      connection.onNewParticipant = this.onNewParticipant.bind(this)
    } */
    this.connect()
  }

  // @Log
  connect () {
    let roomId = this.room.roomId || new Date()
    const onOpenOrJoin = this.onOpenOrJoin.bind(this)
    this.connection.checkPresence(roomId, (isRoomExist, roomid, roomInfo) => {
      // logging.info('RTC check presence', roomInfo)
      if (isRoomExist) {
          this.connection.join(roomid, onOpenOrJoin);
      } else {
          this.connection.open(roomid, onOpenOrJoin);
      }
    });
  }

  get isTemp () {
    return !this.room.roomId
  }

  send (msg) {
    this.connection.send(msg)
  }

  onMessage (msg) {
    if (this.onMessage) {
      this.onMessage(msg)
    }
  }

  // @Log
  onMute () {
    const org = this.connection.onmute
    return function (e) {
      org.call(this.connection, e)
      this.updatedAt = e.updatedAt = new Date()
      if (e.muteType === 'video') {
        e.mediaElement.setAttribute('poster', '/incognito-mode.png');
      }
    }
  }

  // @Log
  onUnmute () {
    const org = this.connection.onunmute
    return function (e) {
      org.call(this.connection, e)
      this.updatedAt = e.updatedAt = new Date()
    }
  }

  // @Log
  onStream (stream) {
    // logging.info('RTC on stream', stream)
    stream.updatedAt = new Date()
    stream.mediaElement.snapshot = '/incognito-mode.png'
    stream.extra = this.decodeExtra(stream.extra)
    const { userid, extra } = stream
    this.streams[extra.username || userid] = stream
    if (extra.username === this.user.username) {
      this.userStream = stream
      this.onUserConnected(stream)
    } else {
      this.guests.push(stream)
      this.onGuestConnected(stream)
    }
    if (this.isHost || extra.isHost) {
      this.anyHostConnected = true
    }
  }

  // @Log
  onOpenOrJoin (isRoomExist, roomId, error) {
    // logging.info('Join RTC room', isRoomExist, roomId, error)
    if (error) {
      this.connectError = error
    } else {
      this.connectedRoomId = roomId
    }
  }

  // @Log
  onUserIdAlreadyTaken (useridAlreadyTaken, yourNewUserId) {
    // logging.warn('Userid already taken.', useridAlreadyTaken, 'Your new userid:', yourNewUserId)
    this.connection.userid = this.connection.token()
    this.connect();
  }


  // @Log
  onStreamEnded (event) {
    let {userid, extra } = event
    delete this.streams[extra.username]
    if (event.userid === this.user.username) {
      this.onUserDisconnected()
    } else {
      this.guests.splice(this.guests.findIndex(v => v.userid === event.userid), 1)
    }
  }

  // @Log
  onNewParticipant (participantId, userPreferences) {
    // logging.info('RTC New participant request', participantId, userPreferences)
    // if OfferToReceiveAudio/OfferToReceiveVideo should be enabled for specific users
    userPreferences.localPeerSdpConstraints.OfferToReceiveAudio = true
    userPreferences.localPeerSdpConstraints.OfferToReceiveVideo = true

    // userPreferences.dontAttachStream = false // according to situation
    // userPreferences.dontGetRemoteStream = false  // according to situation

    // below line must be included. Above all lines are optional.
    // if below line is NOT included; "join-request" will be considered rejected.
    const extra = this.decodeExtra(userPreferences.extra)
    if (this.acceptedParticipants.indexOf(extra.username) === -1) {
      this.waitingUsers.push({participantId: extra.username, userPreferences, extra})
    } else {
      this.connection.acceptParticipationRequest(participantId, userPreferences)
    }
  }

  acceptUser (participantId) {
    const ix = this.waitingUsers.findIndex(e => e.participantId === participantId)
    const { userPreferences } = this.waitingUsers[ix]
    const { sender } = userPreferences.connectionDescription
    this.acceptedParticipants.push(participantId)
    this.connection.acceptParticipationRequest(sender, userPreferences)
    this.waitingUsers.splice(ix, 1)
    this.connection.send('Welcome', sender)
  }

  rejectUser (participantId) {
    const ix = this.waitingUsers.findIndex(e => e.participantId === participantId)
    this.waitingUsers.splice(ix, 1)
  }

  leave () {
    if (!this.connection) {
      return
    }
    // disconnect with all users
    this.connection.getAllParticipants().forEach(pid => this.connection.disconnectWith(pid));

    // stop all local cameras
    this.connection.attachStreams.forEach(stream =>
      stream.getTracks().forEach(track => track.stop())
    )
    this.connection.closeSocket()
    delete this.connection
  }

  get paused () {
    return this.userStream.mediaElement.paused
  }

  get muted () {
    return this.muted
  }

  toggleVideo () {
    const pause = !this.paused
    this.userStream.stream[pause ? "mute": "unmute"]('video')
  }

  toggleAudio () {
    if (this.muted) {
      this.userStream.stream.unmute('audio')
      this.userStream.mediaElement.muted = true
      if (this.paused) {
        this.toggleVideo ()
      }
      this.muted = false
    } else {
      this.userStream.stream.mute('audio')
      this.muted = true
    }
  }

  encodeExtra (extra) {
    return encodeURIComponent(JSON.stringify(extra))
  }

  decodeExtra (extra) {
    try {
      return JSON.parse(decodeURIComponent(extra))
    } catch (ex) {
      console.error('Error decoding user extra', ex)
    }
    return {}
  }
}
