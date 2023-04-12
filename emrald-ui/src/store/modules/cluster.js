import { get, extractIpFromHostName }  from '../../utils'

const state = {
  cluster: {},
  nodes: null
}

const getters = {
}

const actions = {
  async fetchCluster({ commit }) {
    let result = await get(`/yarn/ws/v1/cluster`)
    let json = await result.json()
    const cluster = json['clusterInfo']

    commit('setCluster', cluster)
  },
  async fetchNodes({ commit }) {
    const result = await get(`/yarn/ws/v1/cluster/nodes`)
    const json = await result.json()

    const nodes = json['nodes']['node'].map(n => {
      const n2 = {}

      n2['id'] = n['id']
      n2['shortId'] = extractIpFromHostName(n['id'])
      n2['state'] = n['state']
      n2['resourceMemoryUsed'] = n['usedMemoryMB']
      n2['resourceCoresUsed'] = n['usedVirtualCores']
      n2['resourceMemory'] = n['availMemoryMB']+n['usedMemoryMB']
      n2['resourceCores'] = n['availableVirtualCores']+n['usedVirtualCores']
      n2['lastHealthUpdate'] = n['lastHealthUpdate']
      n2['numContainers'] = n['numContainers']

      return n2
    })

    commit('setNodes', nodes)
  }
}

const mutations = {
  setCluster(state, cluster) {
    state['cluster'] = cluster
  },
  setNodes(state, nodes) {
    state['nodes'] = nodes
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}