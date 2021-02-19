<template>
  <span class="rtc-controls">
    <i :class="[video ? 'fa-video-slash' : 'fa-video', 'fas', 'btn']"
        @click.stop.prevent="toggleVideo"
      />
    <i :class="[audio ? 'fa-microphone-slash' : 'fa-microphone', 'fas', 'btn']"
        @click.stop.prevent="toggleAudio"
      />
  </span>
</template>
<script>

export default {
  data () {
    return {
      video: true,
      audio: true
    }
  },
  methods: {
    toggleVideo () {
      this.video = !this.video
      if (!this.$accessor.room.connected) {
        this.$accessor.room.connect()
      }
    },
    toggleAudio () {
      this.audio = !this.audio
    }
  }
}
</script>
<style scoped>
  .rtc-controls .btn {
    cursor: pointer;
  }
</style>