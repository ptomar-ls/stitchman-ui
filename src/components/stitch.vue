<template>
  <div class="corners">
    <h2>Add a large 'X' and 'O', above each other, in the area visible to both boards.</h2>
    <h3>The images below show what will be used for stitching.  To update these images after changing the board contents click 'refresh'. Click 'next' once done.  If the found board-edges seem wrong click 'back'.</h3>
    <div class="container">
      <div class="innercontainer">
        <div class="kaptivocolumn" v-for="i of 2" :key="i">
          <canvas ref="canvas"></canvas>
        </div>
      </div>
      <div class="innercontainer">
        <div class="kaptivocolumn" v-for="i of 2" :key="i">
          <img ref="images" :src="setupImages && setupImages[i-1] && setupImages[i-1].interImage">
        </div>
      </div>
      <div class="next_button">
        <input type="button" class='button' value="Back" @click="setupBack">
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
    name: "Stitch",
    mounted(){
      this.$nextTick(()=>{
        this.refreshViews();
      });
    },
    beforeDestroy(){
      this.clearLiveViews();
    },
    data(){
      return {
        liveViewers:[],
      }
    },
    computed:{
      ...mapGetters([
        'setupLive',
        'setupImages',
      ]),
    },
    watch:{
      setupLive(){
        this.refreshViews();
      },
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
        'setupNext',
        'setupBack',
      ]),
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
    width:420px;
    height:270px;
  }
  .kaptivocolumn img{
    width:420px;
    height:270px;
  }
  .kaptivocolumn svg{
    width:420px;
    height:270px;
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