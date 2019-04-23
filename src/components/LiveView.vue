<template>
  <div ref="liveview" class="liveview">
    <canvas ref="livecanvas" class="livecanvas"></canvas>
  </div>
</template>

<script>

import { mapGetters, mapActions } from 'vuex'
import {KLiveViewer} from '@lightblue/remote-frame-buffer';

export default {
  mounted () {
    let liveview = this.$refs.liveview;
    if (liveview && liveview.style) {
      liveview.style.width = this.pxWidth + 'px';
      liveview.style.height = this.pxHeight + 'px';
    }
  },
  beforeDestroy () {
  },
  data () {
    return {
      currLiveUrl: '',
      liveViewer: null,
    };
  },
  props: {
    pxWidth: {
      type: Number,
      default: 400,
    },
    pxHeight: {
      type: Number,
      default: 300,
    },
  },
  watch: {
    liveUrl (val) {
      if (this.currLiveUrl !== val) {
        this.closeLiveView();
        if (val) {
          this.openLiveView(val);
        }
      }
    },
  },
  computed: {
    ...mapGetters([
      'liveUrl',
      'frameWidth',
      'frameHeight',
    ]),
  },
  methods: {
    closeLiveView () {
      if (this.liveViewer) {
        this.liveViewer.close();
        this.liveViewer = null;
      }
      let canvas = this.$refs.livecanvas;
      if (canvas) {
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      }
    },
    openLiveView (url) {
      if (url) {
        let canvas = this.$refs.livecanvas;
        if (canvas) {
          this.currLiveUrl = url;
          this.liveViewer = new KLiveViewer(canvas, this.currLiveUrl);
        }
      }
    },
    ...mapActions([
      'startWatchingKaptivo',
    ]),
  },
}
</script>

<style scoped>

  .liveview {
    margin: 0 auto;
    background-color: darkslategrey;
    border: 1px solid black;
  }

  .livecanvas {
    width: 100%;
    height: 100%;
    background-color: lightgray;
  }

</style>
