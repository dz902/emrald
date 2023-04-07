import { get, findKv }  from '../../utils'

const state = {
  vertices: []
}

const getters = {
}

const actions = {
  async fetchVertices({ commit, dispatch, rootState }) {
    if (!rootState.cluster.cluster['id']) {
      await dispatch('cluster/fetchCluster', null, { root: true })
    }

    const appId = rootState.route.params['appId']
    const dagShortId = rootState.route.params['dagId']
    const dagId = `dag_${appId}_${dagShortId}`

    let result = await get(`/yarn_timeline/ws/v1/timeline/TEZ_VERTEX_ID?primaryFilter=TEZ_DAG_ID:"${dagId}"`)
    let json = await result.json()
    let vertices = json['entities']

    vertices = vertices.map(v => {
      const v2 = v
      let hiveCounters = v['otherinfo']['counters']['counterGroups'].find(
        cg => cg['counterGroupName'] == 'HIVE'
      )
      hiveCounters = hiveCounters['counters']
      let tezCounters = findKv(
        'counterGroupName', 
        'org.apache.tez.common.counters.TaskCounter', 
        'counters', 
        v['otherinfo']['counters']['counterGroups']
      )
      console.log(hiveCounters)
      console.log(hiveCounters.find)

      v2['dagCounterInputRecords'] = hiveCounters.find(c => c['counterName'].match(/^RECORDS_IN/))
      v2['dagCounterInputRecords'] = v2['dagCounterInputRecords'] 
        ? v2['dagCounterInputRecords']
        : tezCounters.find(c => c['counterName'].match(/^(REDUCE_INPUT_RECORDS|INPUT_RECORDS_PROCESSED)/))
      v2['dagCounterInputRecords'] = v2['dagCounterInputRecords']['counterValue']
      
      v2['dagCounterOutputRecords'] = hiveCounters.find(c => c['counterName'].match(/^(RECORDS_OUT_1|RECORDS_OUT_OPERATOR_RS)/))
      v2['dagCounterOutputRecords'] = v2['dagCounterOutputRecords'] 
        ? v2['dagCounterOutputRecords']['counterValue']
        : findKv('counterName', 'OUTPUT_RECORDS', 'counterValue', tezCounters)

      return v2
    })

    commit('setVertices', vertices)
  }
}

const mutations = {
  setVertices(state, vertices) {
    state['vertices'] = vertices
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}