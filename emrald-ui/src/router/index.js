import { createRouter, createWebHashHistory } from 'vue-router'
import store from '../store'
import Apps from '../components/Apps'
import TezJob from '../components/TezJob'
import TezDag from '../components/TezDag'

const routes = [
  {
    path: "/apps",
    name: "apps",
    component: Apps
  },
  { path: "/apps/:appId/tez_job", component: TezJob },
  { path: "/apps/:appId/tez_dags/:dagId", component: TezDag }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.afterEach((to) => {
  store.commit('route/setRoute', to)
})

export default router