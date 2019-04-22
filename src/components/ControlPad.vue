<template>
  <div class="controlpad">
    <div class="startmsg">
      <p>Start at kaptivo.com</p>
    </div>
    <div>
      <p class="logo">kaptivo</p>
      <p class="branding">Live Whiteboard Sharing</p>
    </div>
    <div class="ledbutton" v-bind:class="{ ledon: ledOn, ledoff: !ledOn }" @click="pushControlPadButton"></div>
  </div>
</template>

<script>

import { mapGetters, mapActions } from 'vuex'

export default {
  mounted () {
    this.startControlPadMirroring();
    this.blinkTimerId = setInterval(()=>{
      this.blinkOn = !this.blinkOn;
    }, 1000);
  },
  beforeDestroy () {
    if (this.blinkTimerId) {
      clearInterval(this.blinkTimerId);
      this.blinkTimerId = null;
    }
  },
  data () {
    return {
      blinkTimerId: null,
      blinkOn: false,
    };
  },
  computed: {
    ledOn () {
      return (this.controlPadStatus.share_state === 'sharing' || (this.blinkOn && this.controlPadStatus.share_state == 'requested'));
    },
    ...mapGetters([
      'controlPadStatus'
    ]),
  },
  methods: {
    ...mapActions([
      'startControlPadMirroring',
      'pushControlPadButton',
    ]),
  },
}
</script>

<style scoped>

  p {
    margin: 0;
  }

  .controlpad {
    margin: 10px auto;
    width: 160px;
    height: 160px;
    background-color: ivory;
    border: 1px solid black;
    border-radius: 10%;
  }

  .startmsg {
    background-color: darkgrey;
    margin: 20px 30px;
    padding: 4px;
    font-size: xx-small;
    color: white;
  }

  .logo {
    color: black;
    font-size: large;
    margin: 0;
    padding: 0;
  }

  .branding {
    color: black;
    font-size: x-small;
    margin: 0;
    padding: 0;
  }

  .ledbutton {
    margin: 15px auto;
    width: 20%;
    height: 20%;
    border: 1px solid black;
    border-radius: 50%;
    cursor: pointer;
  }

  .ledon {
    background-color: deepskyblue;
  }

  .ledoff {
    background-color: lightgray;
  }

</style>
