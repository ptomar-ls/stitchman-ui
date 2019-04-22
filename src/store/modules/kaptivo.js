
/* eslint-disable no-unused-vars */

const nodeKaptivo = require('../../@lightblue/node-kaptivo/index.js');

const KAPTIVO_ID_KEY = '__KAPTIVO_ID__';
const PAIRING_TOKEN_KEY = '__PAIRING_TOKEN__';
const SYSTEMID_KEY = '__SYSTEM_ID__';
const CLIENT_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJjbGllbnQiOnsibmFtZSI6IkthcHRpdm8gTWFuYWdlciBEZXYgbW9kZSIsInJlZGlyZWN0X3VyaSI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4Mi9pbmRleC5odG1sIiwic2NvcGUiOlsiY2FwdHVyZSIsImxvY2FsX2NhcHR1cmUiLCJwYWlyIiwiZGlzY292ZXIiLCJyZW1vdGVfY29uZmlnIiwidmlldyIsImxvY2FsX3ZpZXciLCJtb25pdG9yIiwiY29udHJvbHBhZCJdfSwiaWF0IjoxNTIwODUyMzE1LCJpc3MiOiJrYXBwXzEifQ.cGBpxUCLnIQVnRo3EN0TQH_MhcSIsPoRdSYMDzmFZZJMYSVWEH-4dSsit581n-wDLPKi4uIU-Mhx6ssKuXaDhkJNfGOBf3KeHHsaxvHdV6LFY1R_tbyaz98Qg1cQwr1zKq6wTiqklXxqxX5zPhW9vUNPVCXfUbCjyNGAlxEGba5qPx8uWdhkf4_4w8JVnPPzEq9NJYgLFHObx0SJcyZRSoaV1A3RxHd9_ce2GxhTrdCANceSjx0q4ilUqp4DHwlfSuE5bo6KYivxmMzwanTrIRZ8U2f3AHBdjkOnhG1yQytaBgEXX4py6hsltRoTlelMEAGqnuTu7g-ufG_5HPgfVA';



function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

nodeKaptivo.setGlobalClientToken(CLIENT_TOKEN);
nodeKaptivo.setVerbose(false);

let g_kapCache = {};
let g_systemId = localStorage.getItem(SYSTEMID_KEY);
if (!g_systemId) {
  g_systemId = require('uuid/v4')();
  localStorage.setItem(SYSTEMID_KEY, g_systemId);
}
let g_mirroringControlPad = false;
let g_mirroringBoostCount = 0;


async function getKaptivo(kaptivoId) {
  kaptivoId = kaptivoId || state.kaptivoId;
  let kap = g_kapCache[kaptivoId];

  if (!kap) {
    try {
      kap = new nodeKaptivo.NodeKaptivo({kaptivoId});
      await kap.ping();
    } catch (e) {
      throw new Error('Kaptivo not accessible')
    }
    g_kapCache[kaptivoId] = kap;
  }

  return kap;
}

// initial state
const state = {
  kaptivoId: localStorage.getItem(KAPTIVO_ID_KEY) || '',
  pairingToken: localStorage.getItem(PAIRING_TOKEN_KEY) || '',
  controlPadStatus: {},
}

// getters
const getters = {
  kaptivoId: state => state.kaptivoId,
  isPaired: state => !!(state.kaptivoId && state.pairingToken),
  controlPadStatus: state => state.controlPadStatus,
}

// actions
const actions = {

  /**
   *  Setup/Clear Pairing relationship to a Kaptivo
   */
  async clearRoomPairing ({state, commit}) {
    console.log('clearRoomPairing is called');
    commit('setPairing', {kaptivoId: state.kaptivoId, pairingToken: ''});
  },
  async setupRoomPairing ({state, commit}, {kaptivoId, admin_name, admin_password}) {
    try {
      let kap = await getKaptivo(kaptivoId);

      let accessToken = null;
      if (admin_name && admin_password) {
        accessToken = await kap.authorize({scope: 'remote_config', admin_name, admin_password});
      }

      let pairing_description = 'Kaptivo Manager';
      let pairingToken = await kap.postRoomPairing({accessToken, paired_identity: g_systemId, pairing_description, override:true});

      commit('setPairing', {kaptivoId, pairingToken});
      return pairingToken;
    } catch (err) {
      // console.log(JSON.stringify(err));
      if (err.user_message) {
        throw new Error(err.user_message);
      } else {
        throw err;
      }
    }
  },

  /**
   *  Control Pad Mirroring
   */
  async startControlPadMirroring ({state, commit}) {
    try {
      if (!g_mirroringControlPad && state.pairingToken) {
        g_mirroringControlPad = true;
        let kap = await getKaptivo();
        let accessToken = await kap.authorize({scope: 'controlpad', pairing_token: state.pairingToken});
        while (g_mirroringControlPad) {
          let path = '/api/v2/peripheral/controlpad';
          let controlPadStatus = (await kap.apiGet({path, accessToken})).result;
          commit('setControlPadStatus', controlPadStatus);
          if (0 < g_mirroringBoostCount) {
            await sleep(200);
            --g_mirroringBoostCount;
          } else {
            await sleep(1000);
          }
        }
      }
    } catch (err) {
      console.log(err.user_message || err.toString());
      if (err.user_message) {
        throw new Error(err.user_message);
      } else {
        throw err;
      }
    } finally {
      g_mirroringControlPad = false;
    }
  },
  async stopControlPadMirroring ({state, commit}) {
    g_mirroringControlPad = false;
  },
  async pushControlPadButton ({state, commit}) {
    try {
      let kap = await getKaptivo();
      let accessToken = await kap.authorize({scope: 'controlpad', pairing_token: state.pairingToken});
      let path = '/api/v2/peripheral/controlpad/input';
      let body = { trigger: 'toggle_camera_enable' };
      g_mirroringBoostCount = 10;
      await kap.apiPut({path, accessToken, body});
    } catch (err) {
      console.log(err.user_message || err.toString());
      if (err.user_message) {
        throw new Error(err.user_message);
      } else {
        throw err;
      }
    }
  },
}

// mutations
const mutations = {
  setPairing(state, {kaptivoId, pairingToken}) {
    console.log('setPairing is called');
    state.kaptivoId = kaptivoId;
    state.pairingToken = pairingToken;
    localStorage.setItem(KAPTIVO_ID_KEY, kaptivoId);
    localStorage.setItem(PAIRING_TOKEN_KEY, pairingToken);
  },
  setMirroringCp(state, mirroringCp) {
    state.mirroringCp = !!mirroringCp;
  },
  setControlPadStatus(state, controlPadStatus) {
    state.controlPadStatus = controlPadStatus;
  },

}

export default {
  state,
  getters,
  actions,
  mutations
}

