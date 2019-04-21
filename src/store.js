import Vue from 'vue'
import Vuex from 'vuex'

const nodeKaptivo = require('./@lightblue/node-kaptivo/index.js');

Vue.use(Vuex)

let g_messageClearTimer = null;

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }


const CLIENT_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJjbGllbnQiOnsiYWNjZXNzX21ldGhvZHMiOlsicHVibGljIiwicHJpdmF0ZSIsImxvIl0sImJyb3dzZXIiOnRydWUsIm5hbWUiOiJDbGllbnQgU0RLIFRlc3QiLCJyZWRpcmVjdF91cmkiOiJodHRwOi8vbG9jYWxob3N0OjgwODIvaW5kZXguaHRtbCIsInNjb3BlIjpbImNhcHR1cmUiLCJkaXNjb3ZlciIsInZpZXciXX0sImlhdCI6MTU1MTUzNTcyNCwiaXNzIjoia2FwcF8xIn0.dKB7QbGhRyMEYQx7v34dxp09fZdVRgWvmdzWzAUWQfUg1wcVNPi65XcXair9FQBwxtRDAfa32_Frm6jAbNemd3HFz28OepCNUI35-pLPQEDen8iOTGEiKOBa0Dj-24orH5x4VOfa3J8sflZSBgs5U4ejbhRhaxAXKPTs90Bc8UvCqs1W0WJvPetmsq3hBTu6d0hLdRl4Lz4cnv7sfadBO9hitraYlOHxwLVAFiZmrLxkQelvDbea6dBci09-xZ4qGrUEOAsCA3960SdMaPKTg2X0IZedyrb7EvVhwo5_cN1hzm04mvLpxsccxgB5uWqIr_2OVcQq-bZhyu5OCBs1VA';

nodeKaptivo.setGlobalClientToken(CLIENT_TOKEN);
// nodeKaptivo.setVerbose(true);

async function testTest()
{
  //! -----------------------------------------------------
  let kap = new nodeKaptivo.NodeKaptivo({kaptivoId: 'HQKZRP'});

  let info = (await kap.apiGet({path: '/api/discovery/info'})).result;

  console.log('IP = ' + kap.getKaptivoIp());
  console.log('FriendlyName = ' + info.friendly_name);

  //! -----------------------------------------------------
  await kap.destroy();
}

export default new Vuex.Store({
  state: {
    message: '',
  },
  getters: {
    message: state => state.message,
  },
  actions: {
    async setMessage ({state, commit}, {message, timeout}) {
      await testTest();

      if (g_messageClearTimer) {
        clearTimeout(g_messageClearTimer);
        g_messageClearTimer = null;
      }
      if (state.message && message) {
        commit('setMessageImpl', '');  //! Hide the previous message and wait for a short period of time to get attention
        await sleep(300);
      }
      commit('setMessageImpl', message);
      if (timeout) {
        g_messageClearTimer = setTimeout(() => {
          commit('setMessageImpl', '');
        }, timeout);
      }
    },
  },
  mutations: {
    setMessageImpl(state, message) {
      state.message = message;
    },
  },
})
