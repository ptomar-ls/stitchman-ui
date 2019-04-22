import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Pair from './views/Pair.vue'
import Settings from './views/Settings.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/pair',
      name: 'pair',
      component: Pair,
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings,
    },
  ]
})
