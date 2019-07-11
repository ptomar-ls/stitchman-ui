<template>
  <div class="corners">
    <h2>Check that the stitched images overlap well.</h2>
    <h3>Use the slider to swipe between images.  Click 'Done' if alignment is good or 'Back' to retry after modifying the board contents.</h3>
    <div class="container">
      <div class="innercontainer">
        <div class="kaptivocolumn" v-for="i of 2" :key="i">
          <canvas ref="canvas"></canvas>
        </div>
      </div>
      <div class="innercontainer">
        <template v-for="(s,i) of setupStitched">
          <span :key="i" :style="{height:s.height*8+'px', width:(s.widths[1]+s.widths[2])*8+'px', 'z-index':-i}">
            <span v-for="(w,iw) of s.widths" :key="iw">
              <span :style="{height:s.height*8+'px', width:(iw && w*8)+'px', 'text-align':'left'}">
                <span :style="{height:s.height*8+'px', width:(iw===2?swipe:1)*w*8+'px', overflow:'hidden', transform:`translate(${iw?0:-w*8}px)`}">
                  <img :style="{height:s.height*8+'px', left:-(iw===0?0:s.widths[0]+(iw===1?0:s.widths[1]))*8+'px'}" ref="images" :src="s.final">
                </span>
              </span>
            </span>
          </span>
        </template>
      </div>
      <div class="swiper">
        <input type="range" v-model="swipe" min="0" max="1" step="0.01">
      </div>
      <div class="next_button">
        <input type="button" class='button' value="Prev" @click="setupBack">
        <input type="button" class='button' value="Done" @click="setupNext">
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
        swipe:0,
      }
    },
    computed:{
      ...mapGetters([
        'setupLive',
        'setupStitched',
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

  .innercontainer span, .innercontainer img{
    display:inline-block;
    position:relative;
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
  .swiper input{
    width:600px
  }
</style>