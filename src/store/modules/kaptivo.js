import axios from 'axios';
/* eslint-disable no-unused-vars */

const nodeKaptivo = require('@lightblue/node-kaptivo');

const debug = process.env.NODE_ENV !== 'production';
const SYSTEMID_KEY = '__SYSTEM_ID__';

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


async function getKaptivo(kaptivoId) {
  kaptivoId = kaptivoId || state.kaptivoId;
  let kap = g_kapCache[kaptivoId];

  if (!kap) {
    try {
      kap = new nodeKaptivo.NodeKaptivo({kaptivoId, ssl: true});
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
  kaptivos:[
    {
      id:"",
      pairingToken:"",
    },
    {
      id:"",
      pairingToken:"",
    },
  ],
  castIp:'',
  castProven:false,
  uiState:null,
  castIpValid:false,
  setupLive:[],
  setupImages:[],
  setupCorners:[],
  setupStitched:[],
  adminNames:["",""],
  adminPasswords:["",""],
  pairInProgress:false,
  stitchmanState:'',
  busy:0,
  liveId:'',
};

// getters
const getters = {
  kaptivos: state => state.kaptivos,
  castIp: state => state.castIp,
  adminNames: state => state.adminNames,
  adminPasswords: state => state.adminPasswords,
  allPaired: state => state.castIpValid && state.kaptivos.every(k=>k.pairingToken),
  pairInProgress: state => state.pairInProgress,
  castProven: state=>state.castProven,
  castIpValid: state=>state.castIpValid,
  uiState: state=>state.uiState,
  setupLive: state=>state.setupLive,
  setupCorners: state=>state.setupCorners,
  setupImages: state=>state.setupImages,
  setupStitched: state=>state.setupStitched,
  stitchmanState: state=>state.stitchmanState,
  busy: state=>state.busy,
  castLiveView: state=>!state.liveId?null:'ws://localhost/liveview/'+state.liveId,
};

function wrapActions(actions){
  for (let key of Object.keys(actions)){
    if (/^refresh/.test(key)) continue;
    const fn=actions[key];
    actions[key] = async (store, params)=>{
      try{
        store.commit('incBusy');
        return await fn(store,params);
      } finally {
        store.commit('decBusy');
      }
    }
  }
  return actions;
}

// actions
const actions = wrapActions({
  async init({commit,dispatch}){
    const rslt = await axios.get('http://localhost/settings');
    if (rslt && rslt.data){
      commit('setCastIp',rslt.data.castIp || "");
      if (rslt.data.kaptivos && rslt.data.kaptivos.length===2) commit('setKaptivos',rslt.data.kaptivos);
      if (rslt.data.castIp){
        await dispatch('testCast').catch(()=>{});
      }
    }
    await dispatch('refreshUiState');
  },
  async getCorners({commit}){
    const corners = (await axios('http://localhost/settings/corners')).data;
    commit('setSetupCorners',corners);
  },
  async getImages({commit}){
    const images = (await axios('http://localhost/settings/images')).data;
    commit('setSetupImages',images);
  },
  async getStitched({commit}){
    const stitched = (await axios('http://localhost/settings/stitchimages')).data;
    commit('setSetupStitched',stitched);
  },
  async refreshStitchmanState({commit,state}){
    const newState = (await axios('http://localhost/state')).data;
    if (!newState || !newState.state) throw new Error('invalid state');
    if (newState.state !== state.stitchmanState){
      commit('setStitchmanState',newState.state);
      if (newState.state === 'live'){
        commit('setLiveId',(await axios('http://localhost/liveId')).data)
      } else {
        commit('setLiveId',null);
      }
    }
  },
  async startCasting(){
    await axios.put('http://localhost/state',{state:'up'});
  },
  async stopCasting(){
    await axios.put('http://localhost/state',{state:'down'});
  },
  async refreshUiState({commit,state,dispatch}, newState){
    const uiState = newState || (await axios.get('http://localhost/settings/uiState')).data;
    if (!uiState) throw new Error('invalid UI state');
    if (uiState !== state.uiState){
      switch(uiState){
        case "pair":
          // nothing need be done here
          break;
        case "corner":
          //on entry get the websocket URLs
          commit('setSetupLive',(await axios('http://localhost/settings/liveview')).data);
          await dispatch('getCorners');
          break;
        case "stitch":
          commit('setSetupLive',(await axios('http://localhost/settings/liveview')).data);
          await dispatch('getImages');
          break;
        case "check":
          commit('setSetupLive',(await axios('http://localhost/settings/liveview')).data);
          await dispatch('getStitched');
          break;
        case "running":
          break;
        case "busy":
          break;
        default:
          console.log('uistate',uiState);
          throw new Error('Unknown UI state!');
      }
      commit('setUiState',uiState);
    }
  },
  async pairKaptivo({state, commit, dispatch}, {i, el}) {
    try {
      const pairingToken = await doPair(state.kaptivos[i].id, state.adminNames[i], state.adminPasswords[i], el);
      commit('setKaptivo', {i, obj: {pairingToken}});
    } catch(e){
      console.log(e);
      dispatch('setMessage',{message: e.message || e.user_message || e, timeout:5000});
    }
  },
  async testCast({state, commit, dispatch}){
    let err=null;
    try {
      let castPingUrl = 'http://' + state.castIp + '/api/discovery/ping';
      const ret = await axios.get(castPingUrl, {timeout: 5000});
      if (ret.data && ret.data.result) {
        if (ret.data.result.model === 'KC100') {
          commit('setCastProven', true);
        } else err=`Device at ${state.castIp} is not a KaptivoCast`;
      } else err='No response from ' + state.castIp;
    } catch(e){
      err= e.message || e.user_message || e;
    }
    if (err) dispatch('setMessage',{message: err, timeout:5000});
  },
  async submitSettings({state,dispatch}){
    await axios.put('http://localhost/settings', {
      kaptivos: state.kaptivos,
      castIp: state.castIp
    });
    await dispatch('refreshUiState');
  },
  async setupBack({dispatch}){
    const newState = (await (axios.post('http://localhost/settings/uistate',{action:'back'}))).data;
    await dispatch('refreshUiState',newState);
  },
  async setupRefresh({dispatch}){
    const newState = (await (axios.post('http://localhost/settings/uistate',{action:'refresh'}))).data;
    switch(newState){
      case "corner":
        await dispatch('getCorners');
        break;
      case "stitch":
        await dispatch('getImages');
        break;
    }
    await dispatch('refreshUiState',newState);
  },
  async setupNext({dispatch}){
    const newState = (await (axios.post('http://localhost/settings/uistate',{action:'next'}))).data;
    await dispatch('refreshUiState',newState);
  },
  async clearSettings({dispatch}){
    await (axios.delete('http://localhost/settings'));
    await dispatch('refreshUiState');
  }
});

// mutations
const mutations = {
  setID(state, {i, kaptivoId}) {
    if (i>=0 && i<state.kaptivos.length){
      state.kaptivos[i].id=kaptivoId;
    }
  },
  setKaptivo(state, {i, obj}){
    console.log('set kaptivo',i,obj);
    if (i>=0 && i<state.kaptivos.length){
      state.kaptivos[i]=Object.assign({},state.kaptivos[i], obj);
      //this is to force a refresh
      state.kaptivos = state.kaptivos.slice();
    }
  },
  setKaptivos(state,kaptivos){
    state.kaptivos=kaptivos;
  },
  setCastIp(state, castIp){
    state.castIp=castIp;
    state.castIpValid = typeof castIp ==="string" || /^[0-9]+(\.[0-9]+)$/.test(castIp);
  },
  setCastProven(state, proven){
    state.castProven=proven;
  },
  setAdminName(state, {i,name}){
    state.adminNames[i]=name;
  },
  setAdminPassword(state, {i,password}){
    state.adminPasswords[i]=password;
  },
  setPairInProgress(state,val){
    state.pairInProgress=val;
  },
  setUiState(state, val){
    state.uiState = val;
  },
  setSetupLive(state, urls){
    state.setupLive=urls;
  },
  setSetupCorners(state,corners){
    state.setupCorners=corners;
  },
  setSetupImages(state,images){
    state.setupImages = images;
  },
  setSetupStitched(state, stitched){
    state.setupStitched=stitched;
  },
  setStitchmanState(state, stitchmanState){
    state.stitchmanState=stitchmanState;
  },
  incBusy(state){
    state.busy++;
  },
  decBusy(state){
    state.busy--;
    if (state.busy<0) state.busy=0;
  },
  setLiveId(state, id){
    state.liveId=id;
  }
};

export default {
  state,
  getters,
  actions,
  mutations
}


async function doPair(kaptivoId, admin_name, admin_password, el){
  const kap = await getKaptivo(kaptivoId);
  const accessToken = admin_name && admin_password ?
    await kap.authorize({scope: 'remote_config', admin_name, admin_password, iframe_parent: el}) :
    await kap.authorize({scope: 'pair', iframe_parent: el});
  const pairing_description = 'Stitching Manager';
  const paired_identity = g_systemId;
  const path = '/api/v2/admin/pairing/instances';
  const body = {
    pairing_type: 'room',
    enabled: true,
    paired_identity,
    pairing_description,
    button_action: 'start_view_session',
  };
  let pairingToken;
  try {
    pairingToken = (await kap.apiPost({path, accessToken, body})).result.pairing_token;
  } catch (err) {
    if (err.response && err.response.data && err.response.data.code === 'pair_instance_limit_reached') {
      //! Delete existing 'room' pairing
      let pairings = (await kap.apiGet({path, accessToken})).result;
      for (let p of pairings) {
        if (p.pairing_type === 'room') {
          await kap.apiDelete({accessToken, path: path + '/' + p.id});
        }
      }
      //! ...and retry
      pairingToken = (await kap.apiPost({path, accessToken, body})).result.pairing_token;
    } else {
      throw err;
    }
  }
  return pairingToken;
}

