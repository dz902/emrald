import { get, findKv }  from '../../utils'

const state = {
  dagExtraInfo: {},
  vertices: [],
  vertexAliases: {},
  vertexInputs: {}
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
      hiveCounters = hiveCounters ? hiveCounters['counters'] : null
      const hiveInputCounters = findKv(
        'counterGroupName',
        'org.apache.hadoop.hive.ql.exec.tez.HiveInputCounters',
        'counters',
        v['otherinfo']['counters']['counterGroups']
      )
      let tezCounters = findKv(
        'counterGroupName', 
        'org.apache.tez.common.counters.TaskCounter', 
        'counters', 
        v['otherinfo']['counters']['counterGroups']
      )
      const fsCounters = findKv(
        'counterGroupName', 
        'org.apache.tez.common.counters.FileSystemCounter', 
        'counters', 
        v['otherinfo']['counters']['counterGroups']
      )

      if (hiveInputCounters) {
        v2['dagCounterInputFiles'] = hiveInputCounters.find(c => c['counterName'].match(/^INPUT_FILES_/))?.counterValue
        v2['dagCounterInputDirs'] = hiveInputCounters.find(c => c['counterName'].match(/^INPUT_DIRECTORIES_/))?.counterValue
      }

      v2['dagCounterInputRecords'] = hiveCounters ? hiveCounters.find(c => c['counterName'].match(/^RECORDS_IN/)) : null
      v2['dagCounterInputRecords'] = v2['dagCounterInputRecords']?.counterValue || tezCounters.find(c => c['counterName'].match(/^(REDUCE_INPUT_RECORDS|INPUT_RECORDS_PROCESSED)/))?.counterValue

      v2['dagCounterOutputRecords'] = findKv('counterName', 'OUTPUT_RECORDS', 'counterValue', tezCounters)

      if (hiveCounters) {
        v2['dagCounterOutputRecords'] = v2['dagCounterOutputRecords']?.counterValue || hiveCounters.find(c => c['counterName'].match(/^(RECORDS_OUT_1|RECORDS_OUT_OPERATOR_RS)/))['counterValue']
      } else {
        v2['dagCounterOutputRecords'] = null
      }

      v2['dagCounterFileReadBytes'] = findKv('counterName', 'FILE_BYTES_READ', 'counterValue', fsCounters)
      v2['dagCounterFileWrittenBytes'] = findKv('counterName', 'FILE_BYTES_WRITTEN', 'counterValue', fsCounters)
      v2['dagCounterS3ReadBytes'] = findKv('counterName', 'S3_BYTES_READ', 'counterValue', fsCounters)
      v2['dagCounterS3WrittenBytes'] = findKv('counterName', 'S3_BYTES_WRITTEN', 'counterValue', fsCounters)

      return v2
    })

    commit('setVertices', vertices)

    dispatch('fetchDagExtraInfo')
  },
  async fetchDagExtraInfo({ commit, rootState }) {
    const appId = rootState.route.params['appId']
    const dagShortId = rootState.route.params['dagId']
    const dagId = `dag_${appId}_${dagShortId}`

    let result = await get(
      `/yarn_timeline/ws/v1/timeline/TEZ_DAG_EXTRA_INFO/${dagId}`
    )
    let json = await result.json()

    if (json?.otherinfo?.dagPlan?.vertices) {
      const vertexAliases = {}
      json['otherinfo']['dagPlan']['vertices'].forEach(v => {
        if (v['additionalInputs'] && v['additionalInputs'][0] && v['additionalInputs'][0]['name']) {
          vertexAliases[v['vertexName']] = v['additionalInputs'][0]['name']
        } else if (v['additionalOutputs']) {
          vertexAliases[v['vertexName']] = '**FINAL**'
        }
      })
  
      commit('setVertexAliases', vertexAliases)
    }

    if (json?.otherinfo?.dagPlan?.edges) {
      const vertexInputs = {}
      json['otherinfo']['dagPlan']['edges'].forEach(e => {
        if (!vertexInputs[e['outputVertexName']]) {
          vertexInputs[e['outputVertexName']] = []
        }
  
        vertexInputs[e['outputVertexName']].push(e['inputVertexName'])
      })

      commit('setVertexInputs', vertexInputs)
    }
  }
}

const mutations = {
  setDagExtraInfo(state, dagExtraInfo) {
    state['dagExtraInfo'] = dagExtraInfo 
  },
  setVertexInputs(state, vertexInputs) {
    state['vertexInputs'] = vertexInputs
  },
  setVertexAliases(state, vertexAliases) {
    state['vertexAliases'] = vertexAliases
  },
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