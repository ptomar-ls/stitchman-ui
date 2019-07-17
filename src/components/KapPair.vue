<template>

    <div :class="{auth:thisPairInProgress, paired}">
      <div class="form">
        <form>
          <h2>{{label}}</h2>
          <div class="formrow">
            <div class="itemlabel">Kaptivo ID</div>
            <div class="itemvalue"><input type="text" :disabled="pairInProgress" v-model.trim="id" placeholder="(Required)"></div>
          </div>
          <div class="formrow">
            <div class="itemlabel">Kaptivo admin name</div>
            <div class="itemvalue"><input type="text" :disabled="pairInProgress" v-model.trim="name" placeholder="(Optional)"></div>
          </div>
          <div class="formrow">
            <div class="itemlabel">Kaptivo admin password</div>
            <div class="itemvalue"><input type="password" :disabled="pairInProgress" v-model.trim="password" placeholder="(Optional)"></div>
          </div>
          <input type="submit" :disabled='pairInProgress || id.length < 6' class='button' value="Pair" @click="pairClick()">
        </form>
      </div>
      <div class="authbox" ref="auth"></div>
    </div>
</template>

<script>
  import { mapActions, mapGetters, mapMutations } from 'vuex'
  export default {
    props:{
      index:Number,
      label:String,
    },
    data(){
      return {
        thisPairInProgress:false
      }
    },
    computed:{
      ...mapGetters([
        "pairInProgress",
        "kaptivos",
        "adminNames",
        "adminPasswords",
      ]),
      paired(){
        return !!this.kaptivos[this.index].pairingToken;
      },
      id:{
        set(kaptivoId){
          this.setID({i:this.index, kaptivoId});
        },
        get(){
          return this.kaptivos[this.index].id;
        }
      },
      name:{
        set(name){
          this.setAdminName({i:this.index, name})
        },
        get(){
          return this.adminNames[this.index];
        }
      },
      password:{
        set(password){
          this.setAdminPassword({i:this.index, password})
        },
        get(){
          return this.adminPasswords[this.index];
        }
      },
    },
    methods:{
      ...mapActions([
        'pairKaptivo',
        'setMessage',
      ]),
      ...mapMutations([
        'setPairInProgress',
        'setID',
        'setAdminName',
        'setAdminPassword',
      ]),
      async pairClick(){
        if (this.pairInProgress) return;
        this.setPairInProgress(true);
        this.setMessage({message:`Pairing with kaptivo ${this.id}`, timeout:5000});
        try{
          await this.doPair()
        } finally {
          this.setPairInProgress(false);
        }
      },
      async doPair(){
        this.thisPairInProgress = true;
        try {
          await this.pairKaptivo({i: this.index, el: this.$refs.auth});
        } finally {
          this.thisPairInProgress = false
        }
      }
    },
    name: "KapPair"
  }
</script>

<style>
  .authbox iframe{
    border:none;
  }
</style>

<style scoped>
  .paired::after{
    content:"\2713";
    position:absolute;
    color:green;
    right:8px;
    bottom:0;
    font-size:64px;
  }
  .form {
    margin: 0 20px 20px;
    /*background-color: yellow;*/
    width: 100%;
    flex: 0 0 auto;
  }

  .authbox{
    width:100%;
    height:100%;
    background:white;
    position:absolute;
    top:0;
    left:0;
    z-index:100;
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