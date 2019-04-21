import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
const nodeKaptivo = require('./@lightblue/node-kaptivo/index.js')

Vue.config.productionTip = false

nodeKaptivo.init(() => {
  new Vue({
    router,
    store,
    render: h => h(App)
  }).$mount('#app')
});

