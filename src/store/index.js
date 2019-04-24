
//! Facade of all Vuex store modules

import Vue from 'vue'
import Vuex from 'vuex'
import kaptivo from './modules/kaptivo.js'
import userinterface from './modules/userinterface.js'
import zoom from './modules/zoom.js'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  modules: {
    kaptivo,
    userinterface,
    zoom,
  },
  strict: debug,
})
