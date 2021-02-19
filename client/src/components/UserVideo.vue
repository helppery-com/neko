<template>
  <div ref="v" class="user-video relative-position">
    <div class="user-info" v-if="showUserInfo" :dummy="updatedAt">{{ stream.extra.username }} <q-icon name="mic_off" color="red" v-if="isAudioMuted" /></div>
  </div>
</template>
<script>
export default {
  props: ['stream', 'muted', 'controls', 'poster', 'showUserInfo', 'videoClass'],
  data () {
    return {
      isAudioMuted: false,
      isLocal: this.stream.type === 'local'
    }
  },
  computed: {
    updatedAt () {
      return this.stream.updatedAt
    }
  },
  watch: {
    updatedAt () {
      if (!this.isLocal) {
        this.isAudioMuted = this.stream.isAudioMuted
      }
    }
  },
  mounted () {
    const video = this.stream.mediaElement
    video.controls = this.controls
    if (this.muted) {
      video.volumen = 0
    }
    video.setAttribute('autoplay', true)
    if (this.videoClass) {
      video.className = this.videoClass
    }
    this.$refs.v.appendChild(video)
    if (!this.isLocal) {
      this.isAudioMuted = this.stream.isAudioMuted
    }
    if (video.paused && !video.getAttribute('poster')) {
      video.play()
    }
  }
}
</script>
<style lang="css">
    .video {
      width: 100%;
    }
    .user-info {
      position: absolute;
      bottom: 0;
      z-index: 1;
      padding: 10px;
      width: 100%;
      background-color: #9e9ea91f;
      font-weight: bold;
      color: white;
    }
</style>
