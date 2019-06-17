<template>
  <div class="pair">
    <h1>Pair with your Kaptivos and KaptivoCast</h1>
    <div class="container">

      <div class="innercontainer">

        <div class="kaptivocolumn">
          <div class="form">
            <form>
              <div class="formrow">
                <div class="itemlabel">Kaptivo ID</div>
                <div class="itemvalue"><input type="text" :disabled="pairingInProgress" v-model.trim="kaptivoIds[0]" placeholder="(Required)"></div>
              </div>
              <div class="formrow">
                <div class="itemlabel">Kaptivo admin name</div>
                <div class="itemvalue"><input type="text" :disabled="pairingInProgress" v-model="adminNames[0]" placeholder="(Optional)"></div>
              </div>
              <div class="formrow">
                <div class="itemlabel">Kaptivo admin password</div>
                <div class="itemvalue"><input type="password" :disabled="pairingInProgress" v-model="adminPasswords[0]" placeholder="(Optional)"></div>
              </div>
              <input type="submit" :disabled='!pairEnabled' class='button' value="Pair" @click="pairKaptivo(0)">
            </form>
          </div>
        </div>

        <div class="kaptivocolumn">
          <div class="form">
            <form>
              <div class="formrow">
                <div class="itemlabel">Kaptivo ID</div>
                <div class="itemvalue"><input type="text" :disabled="pairingInProgress" v-model.trim="kaptivoIds[1]" placeholder="(Required)"></div>
              </div>
              <div class="formrow">
                <div class="itemlabel">Kaptivo admin name</div>
                <div class="itemvalue"><input type="text" :disabled="pairingInProgress" v-model="adminNames[1]" placeholder="(Optional)"></div>
              </div>
              <div class="formrow">
                <div class="itemlabel">Kaptivo admin password</div>
                <div class="itemvalue"><input type="password" :disabled="pairingInProgress" v-model="adminPasswords[1]" placeholder="(Optional)"></div>
              </div>
              <input type="submit" :disabled='!pairEnabled' class='button' value="Pair" @click="pairKaptivo(1)">
            </form>
          </div>
        </div>

        <div class="castcolumn">
          <div class="form">
            <form>
              <div class="formrow">
                <div class="itemlabel">KaptivoCast IP Address</div>
                <div class="itemvalue"><input type="text" :disabled="pairingInProgress" v-model.trim="castIp" placeholder="(Required)"></div>
              </div>
              <input type="submit" :disabled='!pairEnabled' class='button' value="Pair" @click="pairCast">
            </form>
          </div>
        </div>
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
        kaptivoIds: [ '', '' ],
        adminNames: [ '', '' ],
        adminPasswords: [ '', '' ],
        pairingTokens: [ '', '' ],
        castIp: '',
        pairingInProgress: false,
      };
    },
    computed: {
      pairEnabled () {
        return (!this.pairingInProgress);
      },
    },
    methods: {
      pairKaptivo(index) {
        if (!this.pairEnabled) return;

        this.pairingInProgress = true;
        this.setMessage({ message: `Pairing with ${this.kaptivoId} in progress...`, timeout: 5000});
        this.setupRoomPairing({kaptivoId: this.kaptivoIds[index], admin_name: this.adminNames[index], admin_password: this.adminPasswords[index]})
          .then(pairingToken => {
            this.setMessage({ message: 'Pairing done', timeout: 5000});
            this.pairingTokens[index] = pairingToken;
            console.log('pairingToken = ' + pairingToken);
          }) 
          .catch(err => { this.setMessage({ message: err.toString(), timeout: 5000}); })
          .finally(() => { this.pairingInProgress = false });
      },

      pairCast () {

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
  }

  .castcolumn {
    margin: 10px;
    border: solid black 1px;
    flex: 0 0  auto;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: center;
    align-items: center;
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
