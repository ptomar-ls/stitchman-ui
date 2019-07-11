<template>
  <div class="settings">
    <h1>Settings</h1>
      <input type="button" value="Setup Pairing" @click="$router.push('configure')">
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  export default {
    mounted() {
    },
    computed: {
      ...mapGetters([
      ]),
    },
    methods: {
      ...mapActions([
      ]),
    },
  }
</script>
