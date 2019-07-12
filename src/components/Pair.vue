<template>
  <div class="pair">
    <h1>Pair with your Kaptivos and KaptivoCast</h1>
    <div class="container">

      <div class="innercontainer">
        <kap-pair class="kaptivocolumn" v-for="(label,i) of kapLabels" :key="i" :index="i" :label="label" ref="kapPair"></kap-pair>

        <div class="castcolumn" :class="{paired:castProven}">
          <div class="form">
            <form>
              <h2>Kaptivo Cast</h2>
              <div class="formrow">
                <div class="itemlabel">KaptivoCast IP Address</div>
                <div class="itemvalue"><input type="text" :disabled="pairInProgress" v-model.trim="castIp" placeholder="(Required)"></div>
              </div>
              <input type="submit" :disabled='pairInProgress || !castIpValid' class='button' value="Pair" @click="pairCastClick">
            </form>
          </div>
        </div>
      </div>

      <div class="next_button">
        <input type="button" :disabled='pairInProgress || allPaired' class='button' value="Pair All" @click="pairAllClick">
        <input type="button" :disabled='pairInProgress || !allPaired' class='button' value="Next" @click="submitSettings">
      </div>
    </div>
  </div>
</template>

<script>
  import { mapActions, mapMutations, mapGetters } from 'vuex'
  import KapPair from '@/components/KapPair.vue'

  export default {
    components: {
      KapPair,
    },
    mounted() {
      this.init();
    },
    watch: {
      kaptivoId (val) {
        let upperVal = val.trim().toUpperCase();
        if (val !== upperVal) {
          this.kaptivoId = upperVal;
        }
      },
    },
    data() {
      return {
        kapLabels:["Left Kaptivo","Right Kaptivo"]
      };
    },
    computed:{
      ...mapGetters([
        "castProven",
        "allPaired",
        "castIpValid",
        "pairInProgress",
      ]),
      castIp:{
        set(ip){
          this.setCastIp(ip);
        },
        get(){
          return this.$store.getters.castIp;
        }
      },
    },
    methods: {
      async pairAllClick(){
        if (this.pairInProgress) return;
        this.setPairInProgress(true);
        this.setMessage({message:`Pairing all unpaired kaptivos and cast`, timeout:5000});
        await Promise.all([
          this.testCast(),
          ...this.$refs.kapPair.map(kp=>kp.doPair())
        ]);
        this.setPairInProgress(false);
      },
      async pairCastClick(){
        if (this.pairInProgress) return;
        this.setPairInProgress(true);
        this.setMessage({message:`Checking connection with cast at ${this.castIp}`, timeout:5000});
        await this.testCast();
        this.setPairInProgress(false);
      },

      ...mapActions([
        'setMessage',
        'setupRoomPairing',
        'init',
        'pairKaptivo',
        'testCast',
        'submitSettings',
      ]),

      ...mapMutations([
        'setCastIp',
        'setPairInProgress',
      ]),
    },
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
    overflow: auto;
    /*background-color: lime;*/
  }

  .innercontainer {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }

  .kaptivocolumn {
    margin: 10px;
    box-shadow: 3px 3px 10px #0003;
    padding: 10px;
    flex: 0 0  auto;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: center;
    position:relative;
  }
  .paired::after{
    content:"\2713";
    position:absolute;
    color:green;
    right:8px;
    bottom:0;
    font-size:64px;
  }

  .castcolumn {
    margin: 10px;
    box-shadow: 3px 3px 10px #0003;
    flex: 0 0  auto;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: center;
    align-items: center;
    position:relative;
  }

  .form {
    margin: 0 20px 20px;
    /*background-color: yellow;*/
    width: 100%;
    flex: 0 0 auto;
  }
  .auth .form{
    display:none;
  }
  .authbox{
    width:427px;
    height:265px;
    display:none;
  }
  .auth .authbox{
    display:block;
  }

  .formrow {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    margin: 5px;
  }
  .itemlabel {
    width: 50%;
    padding: 5px;
    flex: 1 0 auto;
    text-align: right;
    /*background-color: magenta;*/
  }
  .itemvalue {
    width: 50%;
    padding: 5px;
    flex: 1 0 auto;
    text-align: left;
    /*background-color: white;*/
  }

  .button {
    font-size: x-large;
    padding: 20px;
    margin: 10px;
  }
</style>
