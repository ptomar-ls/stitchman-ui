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
              <input type="submit" :disabled='pairingInProgress || kaptivoIds[0].length < 6' class='button' value="Pair" @click="pairKaptivo(0)">
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
              <input type="submit" :disabled='pairingInProgress || kaptivoIds[1].length < 6' class='button' value="Pair" @click="pairKaptivo(1)">
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
              <input type="submit" :disabled='pairingInProgress || castIp.length < 7' class='button' value="Pair" @click="pairCast">
            </form>
          </div>
        </div>
      </div>

      <div class="next_button">
        <input type="button" :disabled='pairingInProgress || !readyToSetup' class='button' value="Setup" @click="setup()">
      </div>

      <div id="kaptivo_auth">
      </div>
    </div>
  </div>
</template>

<script>
  import { mapActions } from 'vuex'
  const axios = require('axios');

  export default {
    mounted() {
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
        kaptivoIds: [ '', '' ],
        adminNames: [ '', '' ],
        adminPasswords: [ '', '' ],
        pairingTokens: [ '', '' ],
        castIp: '',
        provenCastIp: '',
        pairingInProgress: false,
        readyToSetup: false,
      };
    },
    methods: {
      syncReadyToSetup () {
        this.readyToSetup = !!(this.pairingTokens[0] && this.pairingTokens[1] && this.provenCastIp);
      },

      pairKaptivo(index) {
        if (this.pairingInProgress) return;

        this.pairingInProgress = true;
        this.setMessage({ message: `Pairing with ${this.kaptivoIds[index]} in progress...`, timeout: 5000});
        this.setupRoomPairing({kaptivoId: this.kaptivoIds[index], admin_name: this.adminNames[index], admin_password: this.adminPasswords[index]})
          .then(pairingToken => {
            this.setMessage({ message: 'Pairing done', timeout: 5000});
            this.pairingTokens[index] = pairingToken;
          })
          .catch(err => { this.setMessage({ message: err.toString(), timeout: 5000}); })
          .finally(() => {
            this.pairingInProgress = false;
            this.syncReadyToSetup();
          });
      },

      pairCast () {
        if (this.pairingInProgress) return;
        this.pairingInProgress = true;

        this.provenCastIp = '';
        let castPingUrl = 'http://' + this.castIp + '/api/discovery/ping';
        axios.get(castPingUrl, {timeout: 5000})
          .then(ret => {
            if (ret.data && ret.data.result) {
              if (ret.data.result.model === 'KC100') {
                //! Cast found on the given IP address
                this.provenCastIp = this.castIp;
                this.setMessage({ message: 'Pairing done', timeout: 5000});
              } else {
                this.setMessage({ message: `The device at ${this.castIp} is not a KaptivoCast.`, timeout: 5000});
              }
            }
          })
          .catch(err => {
            this.setMessage({ message: `No response from ${this.castIp}.`, timeout: 5000});
          })
          .finally(() => {
            this.pairingInProgress = false;
            this.syncReadyToSetup();
          });
      },

      setup () {
        console.log('SETUP is called!');
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
