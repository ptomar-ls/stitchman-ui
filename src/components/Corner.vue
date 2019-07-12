<template>
  <div class="corners">
    <h1>Ensure that board edges have been found.</h1>
    <h2>The board should be fully visible between the views and board edges should be marked in green.
      Inner edges are approximate and will be corrected later in the process.</h2>
    <h2>Click 'Refresh' to recalculate the board edges or 'Next' if the edges have been correctly found.</h2>
    <div class="container">
      <div class="innercontainer">
        <div class="kaptivocolumn" v-for="i of 2" :key="i">
          <canvas ref="canvas"></canvas>
          <svg viewBox="0 0 1920 1152">
            <path :d="paths[i-1]"></path>
          </svg>
        </div>
      </div>
      <div class="next_button">
<!--        <input type="button" class='button' value="Prev">-->
        <input type="button" class='button' value="Refresh" @click="setupRefresh">
        <input type="button" class='button' value="Next" @click="setupNext">
      </div>
    </div>
  </div>
</template>

<script>
  import {mapGetters, mapActions} from 'vuex';
  import {KLiveViewer} from '@lightblue/remote-frame-buffer';
  export default {
    name: "Corners",
    mounted(){
      this.$nextTick(()=>{
        this.refreshViews();
        this.refreshPaths();
      });
    },
    beforeDestroy(){
      this.clearLiveViews();
    },
    data(){
      return {
        liveViewers:[],
        paths:[],
      }
    },
    computed:{
      ...mapGetters([
        'setupLive',
        'setupCorners',
      ]),
    },
    watch:{
      setupLive(){
        this.refreshViews();
      },
      setupCorners(){
        this.refreshPaths();
      }
    },
    methods:{
      refreshViews(){
        this.clearLiveViews();
        let i=0;
        for (let ws of this.setupLive){
          this.liveViewers.push(new KLiveViewer(this.$refs.canvas[i++],ws));
        }
      },
      ...mapActions([
        'setupRefresh',
        'setupNext'
      ]),
      refreshPaths(){
        this.paths=this.setupCorners && this.setupCorners.map(sc=>'M'+[0,1,3,2].map(i=>(sc[i].x+960)+','+(sc[i].y+1152*0.4)).join('L')+'Z');
      },
      clearLiveViews(){
        while (this.liveViewers.length){
          this.liveViewers.pop().close();
        }
      }
    }
  }
</script>

<style scoped>
  .container {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    /*background-color: lime;*/
  }

  .innercontainer {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }

  .kaptivocolumn {
    margin: 10px;
    border: solid black 1px;
    flex: 0 0  auto;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    position:relative;
  }
  .kaptivocolumn canvas{
    width:480px;
    height:288px;
  }
  .kaptivocolumn svg{
    width:480px;
    height:288px;
    position:absolute;
    fill:none;
    stroke: green;
    stroke-width: 10px;
  }
  .button {
    font-size: x-large;
    padding: 20px;
    margin: 10px;
  }
</style>