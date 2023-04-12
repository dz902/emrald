import { get, extractIpFromHostName }  from '../../utils'

const state = {
  cluster: {},
  nodes: null,
  nodesById: null
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
  async fetchNodes({ commit, dispatch }) {
    const result = await get(`/yarn/ws/v1/cluster/nodes`)
    const json = await result.json()

    const nodesById = {}
    const nodes = json['nodes']['node'].map(n => {
      const n2 = {}

      n2['id'] = n['id']
      n2['shortId'] = extractIpFromHostName(n['id'])
      n2['state'] = n['state']
      n2['httpAddress'] = n['nodeHTTPAddress']
      n2['resourceMemoryUsed'] = n['usedMemoryMB']
      n2['resourceCoresUsed'] = n['usedVirtualCores']
      n2['resourceMemory'] = n['availMemoryMB']+n['usedMemoryMB']
      n2['resourceCores'] = n['availableVirtualCores']+n['usedVirtualCores']
      n2['lastHealthUpdate'] = n['lastHealthUpdate']
      n2['numContainers'] = n['numContainers']

      nodesById[n2['id']] = n2

      return n2
    })

    commit('setNodes', { nodes, nodesById })

    nodes.forEach(n => dispatch('fetchNodeInfo', n['id']))
  },
  async fetchNodeInfo({ state, commit }, nodeId) {
    const nodeHttpAddress = state['nodesById']?.[nodeId]?.['httpAddress']

    if (!nodeHttpAddress) return

    const result = await get(`/yarn_nm/${nodeHttpAddress}/ws/v1/node/info`)
    const json = await result.json()
    const nodeInfo = json['nodeInfo']

    const ni2 = {
      'startupTime': nodeInfo['nmStartupTime']
    }

    commit('setNodeInfo', { nodeId, nodeInfo: ni2 })
  }
}

const mutations = {
  setCluster(state, cluster) {
    state['cluster'] = cluster
  },
  setNodes(state, { nodes, nodesById }) {
    state['nodes'] = nodes
    state['nodesById'] = nodesById
  },
  setNodeInfo(state, { nodeId, nodeInfo }) {
    state['nodesById'][nodeId]['nodeInfo'] = nodeInfo
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}