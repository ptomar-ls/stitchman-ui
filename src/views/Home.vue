<template>
  <div class="home">
    <h3>{{kaptivoId}}</h3>
    <control-pad></control-pad>
    <div class="sessioninfo">
      <div>session-id: {{sessionId}}</div>
      <div>live-url: {{liveUrl}}</div>
    </div>
    <live-view :px-width="200" :px-height="150"></live-view>
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  import ControlPad from '../components/ControlPad.vue'
  import LiveView from '../components/LiveView.vue'

  export default {
    mounted() {
      if (!this.isPaired) {
        this.$router.push('pair');
      }
    },
    computed: {
      ...mapGetters([
        'kaptivoId',
        'isPaired',
        'liveUrl',
        'sessionId',
      ]),
    },
    methods: {
      ...mapActions([
        'setMessage',
      ]),
    },
    components: {
      ControlPad,
      LiveView,
    },
  }
</script>


<style>
  .home {
    height: 100%;
  }

  .sessioninfo {
    margin: 20px auto;
    padding: 20px;
  }
</style>