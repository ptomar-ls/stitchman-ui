<template>
  <div class="pair">
    <h1>Pair with your Kaptivo</h1>
    <div class="container">
      <div class="form">
        <form>
          <div class="formrow">
            <div class="itemlabel">Kaptivo ID</div>
            <div class="itemvalue"><input type="text" :disabled="pairingInProgress" v-model.trim="kaptivoId"></div>
          </div>
          <div class="formrow">
            <div class="itemlabel">Kaptivo admin name</div>
            <div class="itemvalue"><input type="text" :disabled="pairingInProgress" v-model="adminName" placeholder="(Optional)"></div>
          </div>
          <div class="formrow">
            <div class="itemlabel">Kaptivo admin password</div>
            <div class="itemvalue"><input type="password" :disabled="pairingInProgress" v-model="adminPassword" placeholder="(Optional)"></div>
          </div>
          <input type="submit" :disabled='!pairEnabled' class='button' value="Pair" @click="pairKaptivo">
        </form>
      </div>
      <div id="kaptivo_auth">
      </div>
    </div>
  </div>
</template>

<script>
  import { mapActions } from 'vuex'
  export default {
    mounted() {
    },
    watch: {
      kaptivoId (val) {
        let upperVal = val.trim().toUpperCase();
        if (val !== upperVal) {
          this.kaptivoId = upperVal;
        }
      }
    },
    data() {
      return {
        kaptivoId: (this.$store.getters.kaptivoId || ''),
        adminName: '',
        adminPassword: '',
        pairingInProgress: false,
      };
    },
    computed: {
      pairEnabled () {
        return (!this.pairingInProgress && this.kaptivoId.length === 6);
      },
    },
    methods: {
      pairKaptivo() {
        if (!this.pairEnabled) return;

        this.pairingInProgress = true;
        this.setMessage({ message: `Pairing with ${this.kaptivoId} in progress...`, timeout: 5000});
        this.setupRoomPairing({kaptivoId: this.kaptivoId, admin_name: this.adminName, admin_password: this.adminPassword})
          .then(() => {
            this.setMessage({ message: 'Pairing done', timeout: 5000});
            setTimeout(() => { this.$router.push({name: 'home'}); }, 500)
          })
          .catch(err => { this.setMessage({ message: err.toString(), timeout: 5000}); })
          .finally(() => { this.pairingInProgress = false });
      },
      ...mapActions([
        'setMessage',
        'setupRoomPairing',
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
    /*background-color: lime;*/
  }

  .form {
    margin: 30px;
    /*background-color: yellow;*/
    width: 100%;
    flex: 0 0 auto;
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

  #kaptivo_auth {
    /*background-color: skyblue;*/
    width: 100%;
    height: 200px;
    max-height: 360px;
    flex: 1 1 auto;
  }
</style>