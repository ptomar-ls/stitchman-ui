

// initial state
const state = {
  zoomSessionRunning: false,
  zoomSharingPc: false,
}

// getters
const getters = {
  zoomSessionRunning: state => state.zoomSessionRunning,
  zoomSharingPc: state => state.zoomSharingPc,
}

// actions
const actions = {
  async startZoomMeeting ({getters, commit, dispatch}) {
    if (getters.sessionId) {
      dispatch('setMessage', {message: 'Stop Kaptivo session when starting a Zoom session.', timeout: 3000});
      dispatch('endKaptivoSession');
    }
    commit('setZoomStateImpl', {zoomSessionRunning: true, zoomSharingPc: false});
  },
  async endZoomMeeting ({getters, commit, dispatch}) {
    if (getters.sessionId) {
      dispatch('setMessage', {message: 'Stop Kaptivo session when ending a Zoom session.', timeout: 3000});
      dispatch('endKaptivoSession');
    }
    commit('setZoomStateImpl', {zoomSessionRunning: false, zoomSharingPc: false});
  },
  async sharePcOnZoom ({state, getters, commit, dispatch}) {
    if (state.zoomSessionRunning) {
      if (getters.sessionId) {
        dispatch('setMessage', {message: 'Stop Kaptivo session when sharing another content.', timeout: 3000});
        dispatch('endKaptivoSession');
      }
      commit('setZoomStateImpl', {zoomSessionRunning: true, zoomSharingPc: true});
    }
  },
  async stopSharingPcOnZoom ({state, commit}) {
    commit('setZoomStateImpl', {zoomSessionRunning: state.zoomSessionRunning, zoomSharingPc: false});
  },
  async toggleSharePc ({state, dispatch}) {
    if (state.zoomSharingPc) {
      dispatch('stopSharingPcOnZoom');
    } else {
      dispatch('sharePcOnZoom');
    }
  },
}

// mutations
const mutations = {
  setZoomStateImpl(state, {zoomSessionRunning, zoomSharingPc}) {
    state.zoomSessionRunning = zoomSessionRunning;
    state.zoomSharingPc = zoomSharingPc;
  },
}


export default {
  state,
  getters,
  actions,
  mutations
}
