import { createStore, createLogger } from 'vuex'
import route from './modules/route'
import apps from './modules/apps'
import tezJob from './modules/tezJob'
import tezDag from './modules/tezDag'
import cluster from './modules/cluster'

const debug = process.env.NODE_ENV !== 'production'

export default createStore({
  modules: {
    route,
    apps,
    tezJob,
    tezDag,
    cluster
  },
  strict: debug,
  plugins: debug ? [createLogger()] : []
})