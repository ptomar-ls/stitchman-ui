<template>
  <div>
    <h1>{{state}}</h1>
    <div>
      <input type="button" :disabled="stitchmanState!=='idle'" class='button' value="Start Cast" @click="startCasting">
      <input type="button" :disabled="stitchmanState!=='live'" class='button' value="Stop Cast" @click="stopCasting">
    </div>
    <div>
      <input type="button" :disabled="stitchmanState!=='idle'" class='button' value="Clear configuration" @click="clearSettings">
      <input type="button" :disabled="stitchmanState!=='idle'" class='button' value="Restitch" @click="setupRefresh">
    </div>
  </div>
</template>

<script>
  import {mapGetters, mapActions} from 'vuex';
  export default {
    name: "running",
    mounted(){
      this.startMon();
    },
    destroyed(){
      this.stopMon();
    },
    data(){
      return {
        interval:null,
      }
    },
    computed:{
      ...mapGetters([
        'stitchmanState'
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
</style>