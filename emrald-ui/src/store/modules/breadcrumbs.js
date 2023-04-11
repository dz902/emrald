const state = {
}

const getters = {
  navLinks(state, getters, rootState, rootGetters) {
    const navLinks = []
    navLinks.push({ name: 'Apps', path: '/apps' })
   
    const appId = rootState.route.params['appId']

    navLinks.push({ name: `App #${appId}`, path: `/apps/${appId}`})

    const activeDag = rootGetters['tezApp/activeDag'] 
    const activeVertex = rootGetters['tezApp/activeVertex']

    if (activeDag) {
      navLinks.push({ name: `${activeDag['stage']} #${activeDag['shortId']}`, path: `/apps/${appId}/dags/${activeDag['shortId']}` })
    }

    if (activeVertex) {
      navLinks.push({ name: `${activeVertex['name']} #${activeVertex['shortId']}`, path: `/apps/${appId}/dags/${activeDag['shortId']}/vertex/${activeVertex['shortId']}` })
    }

    return navLinks
  }
}

const actions = {
}

const mutations = {
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}