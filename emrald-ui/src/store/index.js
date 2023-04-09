import { createStore, createLogger } from 'vuex'
import route from './modules/route'
import apps from './modules/apps'
import tezJob from './modules/tezJob'
import tezApp from './modules/tezApp'
import cluster from './modules/cluster'
import breadcrumbs from './modules/breadcrumbs'

const debug = process.env.NODE_ENV !== 'production'

export default createStore({
  modules: {
    route,
    apps,
    tezJob,
    tezApp,
    cluster,
    breadcrumbs
  },
  strict: debug,
  plugins: debug ? [createLogger()] : []
})