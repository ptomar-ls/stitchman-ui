<template>
  <div>
    <h1>{{state}}</h1>
    <div>
      <input type="button" :disabled="stitchmanState!=='idle'" class='button' value="Start Cast" @click="startCasting">
      <input type="button" :disabled="stitchmanState!=='live'" class='button' value="Stop Cast" @click="stopCasting">
    </div>
    <canvas ref="live"></canvas>
    <div>
      <input type="button" :disabled="stitchmanState!=='idle'" class='button' value="Clear configuration" @click="clearSettings">
      <input type="button" :disabled="stitchmanState!=='idle'" class='button' value="Restitch" @click="setupRefresh">
    </div>
  </div>
</template>

<script>
  import {mapGetters, mapActions} from 'vuex';
  import {KLiveViewer} from '@lightblue/remote-frame-buffer';
  export default {
    name: "running",
    mounted(){
      this.startMon();
      this.showLiveView();
    },
    destroyed(){
      this.stopMon();
      this.clearLiveView();
    },
    data(){
      return {
        interval:null,
        liveView:null,
      }
    },
    watch:{
      castLiveView(){
        this.showLiveView();
      }
    },
    computed:{
      ...mapGetters([
        'stitchmanState',
        'castLiveView',
      ]),
      state(){
        switch(this.stitchmanState){
          case "live": return "Live and casting!";
          case "up": return "Starting";
          case "down": return "Stopping";
          default: return "Idle";
        }
      }
    },
    methods:{
      ...mapActions([
        'setupRefresh',
        'clearSettings',
        'refreshStitchmanState',
        'startCasting',
        'stopCasting',
      ]),
      startMon(){
        this.stopMon();
        this.interval = setInterval(()=>{
          this.refreshStitchmanState();
        },3000)
      },
      stopMon(){
        if (this.interval) clearInterval(this.interval);
        this.interval=null;
      },
      showLiveView(){
        this.clearLiveView();
        if (this.castLiveView){
          this.liveView = new KLiveViewer(this.$refs.live, this.castLiveView);
        }
      },
      clearLiveView(){
        if (this.liveView) this.liveView.close();
        this.liveView=null;
        this.$refs.live.getContext('2d').clearRect(0,0,this.$refs.live.width, this.$refs.live.height)
      }
    }
  }
</script>

<style scoped>
  .button {
    font-size: x-large;
    padding: 20px;
    margin: 10px;
  }
  canvas {
    width:100%;
    box-shadow:0 0 5px #0003;
  }
</style>