<template>
  <div class="home">
    <h3>{{kaptivos.map(k=>k.id).join(',')}}</h3>
<!--    <control-pad></control-pad>-->
<!--    <div class="sessioninfo">-->
<!--      <div>kaptivos: {{}}</div>-->
<!--    </div>-->
<!--    <live-view :px-width="200" :px-height="150"></live-view>-->
  </div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  // import ControlPad from '../components/ControlPad.vue'
  // import LiveView from '../components/LiveView.vue'

  export default {
    mounted() {
      if (!this.allPaired) {
        this.$router.push('settings');
      }
    },
    computed: {
      ...mapGetters([
        'kaptivos',
        'allPaired',
      ]),
    },
    methods: {
      ...mapActions([
        'setMessage',
      ]),
    },
    components: {
      // ControlPad,
      // LiveView,
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