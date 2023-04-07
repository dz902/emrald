import { get }  from '../../utils'

const state = {
  cluster: {}
}

const getters = {
}

const actions = {
  async fetchCluster({ commit }) {
    let result = await get(`/yarn/ws/v1/cluster`)
    let json = await result.json()
    const cluster = json['clusterInfo']

    commit('setCluster', cluster)
  }
}

const mutations = {
  setCluster(state, cluster) {
    state['cluster'] = cluster
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}