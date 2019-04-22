<template>
  <div class="settings">
    <h1>Settings</h1>
    <div v-if="isPaired">
      <input type="button" value="Clear Pairing" @click="clearRoomPairing()">
    </div>
    <div v-else>
      <input type="button" value="Setup Pairing" @click="$router.push('pair')">
    </div>
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  export default {
    mounted() {
    },
    computed: {
      ...mapGetters([
        'isPaired',
      ]),
    },
    methods: {
      ...mapActions([
        'clearRoomPairing',
        'setMessage',
      ]),
    },
  }
</script>
