import { createRouter, createWebHashHistory } from 'vue-router'
import store from '../store'
import Nodes from '../components/Nodes'
import Apps from '../components/Apps'
import TezJob from '../components/TezJob'
import TezDag from '../components/TezDag'
import TezVertex from '../components/TezVertex'

const routes = [
  {
    path: "/apps",
    name: "apps",
    component: Apps
  },
  { path: "/apps/:appId", component: TezJob },
  { path: "/apps/:appId/dags/:dagId", component: TezDag },
  { path: "/apps/:appId/dags/:dagId/vertex/:vertexId", component: TezVertex },
  { path: "/nodes", component: Nodes }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.afterEach((to) => {
  store.commit('route/setRoute', to)
})

export default router