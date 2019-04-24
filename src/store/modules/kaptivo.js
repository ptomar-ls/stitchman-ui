
/* eslint-disable no-unused-vars */

const nodeKaptivo = require('../../@lightblue/node-kaptivo/index.js');

const KAPTIVO_ID_KEY = '__KAPTIVO_ID__';
const PAIRING_TOKEN_KEY = '__PAIRING_TOKEN__';
const SYSTEMID_KEY = '__SYSTEM_ID__';

const debug = process.env.NODE_ENV !== 'production'

//! Dev mode client token
const DEV_CLIENT_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJjbGllbnQiOnsibmFtZSI6IkthcHRpdm8gTWFuYWdlciBEZXYgbW9kZSIsInJlZGlyZWN0X3VyaSI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODA4Mi9pbmRleC5odG1sIiwic2NvcGUiOlsiY2FwdHVyZSIsImxvY2FsX2NhcHR1cmUiLCJwYWlyIiwiZGlzY292ZXIiLCJyZW1vdGVfY29uZmlnIiwidmlldyIsImxvY2FsX3ZpZXciLCJtb25pdG9yIiwiY29udHJvbHBhZCJdfSwiaWF0IjoxNTIwODUyMzE1LCJpc3MiOiJrYXBwXzEifQ.cGBpxUCLnIQVnRo3EN0TQH_MhcSIsPoRdSYMDzmFZZJMYSVWEH-4dSsit581n-wDLPKi4uIU-Mhx6ssKuXaDhkJNfGOBf3KeHHsaxvHdV6LFY1R_tbyaz98Qg1cQwr1zKq6wTiqklXxqxX5zPhW9vUNPVCXfUbCjyNGAlxEGba5qPx8uWdhkf4_4w8JVnPPzEq9NJYgLFHObx0SJcyZRSoaV1A3RxHd9_ce2GxhTrdCANceSjx0q4ilUqp4DHwlfSuE5bo6KYivxmMzwanTrIRZ8U2f3AHBdjkOnhG1yQytaBgEXX4py6hsltRoTlelMEAGqnuTu7g-ufG_5HPgfVA';

//! S3/CloudFront (zoomkaptivopoc/d3bbk8m2i8fdew.cloudfront.net) client token
const PROD_CLIENT_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJjbGllbnQiOnsibmFtZSI6Ilpvb21Sb29tcyBLYXB0aXZvIFBPQyIsInJlZGlyZWN0X3VyaSI6Imh0dHBzOi8vZDNiYms4bTJpOGZkZXcuY2xvdWRmcm9udC5uZXQvaW5kZXguaHRtbCIsInNjb3BlIjpbInBhaXIiLCJkaXNjb3ZlciIsInJlbW90ZV9jb25maWciLCJ2aWV3IiwibG9jYWxfdmlldyIsImNvbnRyb2xwYWQiXX0sImlhdCI6MTUyMDg1MjMxNSwiaXNzIjoia2FwcF8xIn0.NKphpVl90dyF5G28hmPk87wl9UITIEwIMZlj9NN3o1trXqRhm_Tg1_ktQauEcS23-9zv2gQ1CifgpvVuYPzM3y1L5J2yhIK8gyP7SFkv4-5uHjl8LAMy3c8tW5o2VAv8Nyh1A_5dQuqW65jJQh61Gyr10Nbw6TzJgvS1atFI-WOs65BnYXLs7wDEDb72J--UK7TdWxr3W4gJTvHDKx0k1XVDwNN7Cj_d3ghDfB0Tpn3UQMnDceElWGXWbwBQEIAOZX--CuUemNEbSvxbq452uvzoXTMpx4UTIkl4NVVUW-GOFgs776hwqSod5b2f5_HZcxmOruvIbmDjrRqk_dxISw'

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

nodeKaptivo.setGlobalClientToken(debug ? DEV_CLIENT_TOKEN : PROD_CLIENT_TOKEN);
nodeKaptivo.setVerbose(false);

let g_kapCache = {};
let g_systemId = localStorage.getItem(SYSTEMID_KEY);
if (!g_systemId) {
  g_systemId = require('uuid/v4')();
  localStorage.setItem(SYSTEMID_KEY, g_systemId);
}
let g_watchingKaptivo = false;
let g_watchBoostCount = 0;


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
  sessionId: 0,
  sessionToken: '',
  liveUrl: '',
  frameWidth: 0,
  frameHeight: 0,
}

// getters
const getters = {
  kaptivoId: state => state.kaptivoId,
  isPaired: state => !!(state.kaptivoId && state.pairingToken),
  controlPadStatus: state => state.controlPadStatus,
  sessionId: state => state.sessionId,
  liveUrl: state => state.liveUrl,
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
  async startWatchingKaptivo ({state, commit}) {
    try {
      if (!g_watchingKaptivo && state.pairingToken) {
        g_watchingKaptivo = true;
        let kap = await getKaptivo();
        let accessToken = await kap.authorize({scope: 'controlpad', pairing_token: state.pairingToken});
        while (g_watchingKaptivo) {
          let path = '/api/v2/peripheral/controlpad';
          let controlPadStatus = (await kap.apiGet({path, accessToken})).result;
          if (JSON.stringify(state.controlPadStatus) !== JSON.stringify(controlPadStatus)) {
            commit('setControlPadStatus', controlPadStatus);
          }

          path = '/api/v2/observe';
          let observedStatus = (await kap.apiGet({path})).result;
          if (state.sessionId !== observedStatus.session_id) {
            try {
            let sessionId = observedStatus.session_id;
              let sessionToken = '';
            let liveUrl = '';
            let frameWidth = 0;
            let frameHeight = 0;
            if (sessionId) {
                sessionToken = observedStatus.token;
              path = `/api/v2/sessions/${sessionId}/content/liveview`;
              let sessionInfo = (await kap.apiGet({path, accessToken: sessionToken})).result;
              liveUrl = sessionInfo.websocket_rle_uri;
              path = `/api/v2/sessions/${sessionId}/content`;
              let contentInfo = (await kap.apiGet({path, accessToken: sessionToken})).result;
              frameWidth = contentInfo.pixel_width;
              frameHeight = contentInfo.pixel_height;
            }
              commit('setSessionStatus', {sessionId, sessionToken, liveUrl, frameWidth, frameHeight});
            } catch (e) {
              console.log('Session has been ended');
              commit('setSessionStatus', {sessionId: 0, sessionToken: '', liveUrl: '', frameWidth: 0, frameHeight: 0});
            }
          }
          if (0 < g_watchBoostCount) {
            await sleep(200);
            --g_watchBoostCount;
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
      g_watchingKaptivo = false;
    }
  },
  async stopWatchingKaptivo ({state, commit}) {
    g_watchingKaptivo = false;
  },
  async pushControlPadButton ({state, commit}) {
    try {
      let kap = await getKaptivo();
      let accessToken = await kap.authorize({scope: 'controlpad', pairing_token: state.pairingToken});
      let path = '/api/v2/peripheral/controlpad/input';
      let body = { trigger: 'toggle_camera_enable' };
      g_watchBoostCount = 10;
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
  async endKaptivoSession ({state, commit}) {
    if (state.sessionId && state.sessionToken) {
      try {
        let kap = await getKaptivo();
        let accessToken = state.sessionToken;
        let path = `/api/v2/sessions/${state.sessionId}`;
        await kap.apiDelete({path, accessToken});
        commit('setSessionStatus', {sessionId: 0, sessionToken: '', liveUrl: '', frameWidth: 0, frameHeight: 0});
      } catch (err) {
        console.log(err.user_message || err.toString());
        if (err.user_message) {
          throw new Error(err.user_message);
        } else {
          throw err;
        }
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
  setSessionStatus(state, {sessionId, sessionToken, liveUrl, frameWidth, frameHeight}) {
    state.sessionId = sessionId;
    state.sessionToken = sessionToken;
    state.liveUrl = liveUrl;
    state.frameWidth = frameWidth;
    state.frameHeight = frameHeight;
  },
}

export default {
  state,
  getters,
  actions,
  mutations
}

