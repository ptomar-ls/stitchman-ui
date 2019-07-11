<template>
  <div>
    <component :is="uiState"></component>
    <div class="blocker" v-if="busy">
    </div>
  </div>
</template>

<script>
  import {mapGetters, mapActions} from 'vuex';
  import Pair from '@/components/Pair.vue'
  import Corner from '@/components/Corner.vue'
  import Stitch from '@/components/stitch.vue'
  import Check from '@/components/check.vue'
  import Running from '@/components/running.vue'
  import Busy from '@/components/busy.vue'

  export default {
    mounted(){
      this.init();
      this.startStateMonitor();
    },
    destroyed(){
      this.stopStateMonitor();
    },
    data(){
      return {
        interval:null
      }
    },
    name: "setup",
    computed:{
      ...mapGetters([
        'uiState',
        'busy'
      ])
    },
    components:{
      Pair, Corner, Stitch, Check, Running, Busy
    },
    methods:{
      ...mapActions([
        'init',
        'refreshUiState',
      ]),
      startStateMonitor(){
        if (this.interval) this.stopStateMonitor();
        this.interval = setInterval(this.refreshUiState,3000);
      },
      stopStateMonitor(){
        clearInterval(this.interval);
        this.interval=null;
      }
    }
  }
</script>

<style scoped>
  .blocker{
    top:0;
    position:absolute;
    width:100%;
    height:100%;
    cursor:wait;
    background:#ddd7;
  }

</style>