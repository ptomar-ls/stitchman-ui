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
      <div class="swiper">
        <span>Swipe between:</span>
        <input type="range" v-model="swipe" min="0" max="1" step="0.01">
        <span>Scale:</span>
        <button @click="incScale">+</button>
        <button @click="decScale">-</button>
      </div>
      <div class="innercontainer">
        <template v-for="s of previewImages">
          <span :key="s.key" :style="s.imgContainerStyle">
            <span :style="s.cropStyle">
              <img :style="s.imgStyle" :src="s.final">
            </span>
          </span>
        </template>
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
        scale:12,
      }
    },
    computed:{
      ...mapGetters([
        'setupLive',
        'setupStitched',
      ]),
      previewImages(){
        return this.setupStitched.map((s,i)=>{
          const imgStyle={height: `${s.height*this.scale}px`};
          const cropStyle={
            width:`${(s.widths[0]+s.widths[1]+s.widths[2]*this.swipe)*this.scale}px`,
            transform:`translate(${-s.widths[0]*this.scale}px)`,
            overflow:"hidden",
            ...imgStyle};
          const imgContainerStyle={
            width:`${(s.widths[1]+s.widths[2])*this.scale}px`,
            "z-index":-i,
            "text-align":"left",
            ...imgStyle
          };
          return {key:i, imgStyle, cropStyle, imgContainerStyle, final:s.final};
        })
      },
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
      },
      incScale(){
        this.scale+=this.scale<16?1:0;
      },
      decScale(){
        this.scale-=this.scale>4?1:0;
      },
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
  .kaptivocolumn canvas, .kaptivocolumn img{
    width:480px;
    height:288px;
  }
  .button {
    font-size: x-large;
    padding: 20px;
    margin: 10px;
  }
  .swiper{
    display:flex;
    flex-direction:row;
  }
  .swiper span{
    height:1.25em;
    font-size:1.6em;
    padding:0 0.2em 0 0.5em;
  }
  .swiper input[type="range"]{
    width:30vw;
    height:2em;
  }
  .swiper button{
    width:2em;
    height:2em;
  }
</style>