import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

let g_messageClearTimer = null;

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

export default new Vuex.Store({
  state: {
    message: '',
  },
  getters: {
    message: state => state.message,
  },
  actions: {
    async setMessage ({state, commit}, {message, timeout}) {
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
