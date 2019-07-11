import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Settings from './views/Settings.vue'
import Configure from './views/configure'

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/configure',
      name: 'configure',
      component: Configure,
    },
    {
      path: '/settings',
      name: 'settings',
      component: Settings,
    },
  ]
})
