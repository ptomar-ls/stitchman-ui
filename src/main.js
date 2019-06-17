import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store/index.js'
const nodeKaptivo = require('@lightblue/node-kaptivo')

Vue.config.productionTip = false

nodeKaptivo.init(() => {
  new Vue({
    router,
    store,
    render: h => h(App)
  }).$mount('#app')
});

