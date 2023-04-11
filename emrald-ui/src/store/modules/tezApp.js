import { get, findKv }  from '../../utils'

const state = {
  dagExtraInfo: {},
  dags: [],
  vertices: [],
  vertexAliases: {},
  vertexInputs: {}
}

const getters = {
  activeDag(state, getters, rootState) {
    const { appId, dagId } = rootState.route.params
    const dagFullId = `dag_${appId}_${dagId}`
    return state.dags.find(d => d['entity'] == dagFullId)
  },
  activeVertex(state, getters, rootState) {
    const routeParams = rootState.route.params
    const vertexFullId = `vertex_${routeParams['appId']}_${routeParams['dagId']}_${routeParams['vertexId']}`
    return state.vertices.find(v => v['entity'] == vertexFullId)
  }
}

const actions = {
  async fetchDags({ commit, rootState }) {
    const { appId } = rootState.route.params;

    const appFullId = `application_${appId}`

    let result = await get(`/yarn_timeline/ws/v1/timeline/TEZ_DAG_ID?primaryFilter=applicationId:"${appFullId}"`)
    let json = await result.json()
    let dags = json['entities']

    dags = dags.map(d => {
      const result = d['primaryfilters']['dagName'][0].match(/^(.+?)\((Stage-[0-9])\)/sm)
      const otherinfo = d['otherinfo']

      d['dagId'] = d['entity'].match(/([0-9]+)$/)[1]
      d['dagType'] = 'File Merge' in otherinfo['vertexNameIdMapping'] ? 'File Merge' : 'Map / Reduce'
      d['dagShortName'] = result ? result[1] : d['dagType']
      d['dagStage'] = result ? result[2] : d['dagType']
      d['dagCallerId'] = otherinfo['callerId']

      const endTime = otherinfo['endTime'] ? otherinfo['endTime'] : (new Date()).getTime()
      d['dagDuration'] = Math.round((endTime-otherinfo['startTime'])/1000)

      return d
    })

    commit('setDags', dags)
  },
  async fetchVertices({ commit, getters, dispatch, rootState }) {
    if (!getters.activeDag) {
      await dispatch('fetchDags')
    }

    const appId = rootState.route.params['appId']
    const dagShortId = rootState.route.params['dagId']
    const dagId = `dag_${appId}_${dagShortId}`

    let result = await get(`/yarn_timeline/ws/v1/timeline/TEZ_VERTEX_ID?primaryFilter=TEZ_DAG_ID:"${dagId}"`)
    let json = await result.json()
    let vertices = json['entities']

    vertices = vertices.map(v => {
      const v2 = v

      v2['vertexId'] = v2['entity'].match(/([0-9]+)$/)[1]

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
        v2['vertexCounterInputFiles'] = hiveInputCounters.find(c => c['counterName'].match(/^INPUT_FILES_/))?.counterValue
        v2['vertexCounterInputDirs'] = hiveInputCounters.find(c => c['counterName'].match(/^INPUT_DIRECTORIES_/))?.counterValue
      }

      v2['vertexCounterInputRecords'] = hiveCounters ? hiveCounters.find(c => c['counterName'].match(/^RECORDS_IN/)) : null
      v2['vertexCounterInputRecords'] = v2['vertexCounterInputRecords']?.counterValue || tezCounters.find(c => c['counterName'].match(/^(REDUCE_INPUT_RECORDS|INPUT_RECORDS_PROCESSED)/))?.counterValue

      v2['vertexCounterOutputRecords'] = findKv('counterName', 'OUTPUT_RECORDS', 'counterValue', tezCounters)

      if (hiveCounters) {
        v2['vertexCounterOutputRecords'] = v2['vertexCounterOutputRecords']?.counterValue || hiveCounters.find(c => c['counterName'].match(/^(RECORDS_OUT_1|RECORDS_OUT_OPERATOR_RS)/))['counterValue']
      } else {
        v2['vertexCounterOutputRecords'] = null
      }

      v2['vertexCounterFileReadBytes'] = findKv('counterName', 'FILE_BYTES_READ', 'counterValue', fsCounters)
      v2['vertexCounterFileWrittenBytes'] = findKv('counterName', 'FILE_BYTES_WRITTEN', 'counterValue', fsCounters)
      v2['vertexCounterS3ReadBytes'] = findKv('counterName', 'S3_BYTES_READ', 'counterValue', fsCounters)
      v2['vertexCounterS3WrittenBytes'] = findKv('counterName', 'S3_BYTES_WRITTEN', 'counterValue', fsCounters)

      return v2
    })

    commit('setVertices', vertices)

    dispatch('fetchDagExtraInfo')
  },
  async fetchTasks({ commit, getters, dispatch, rootState }) {
    if (!getters.activeVertex) {
      await dispatch('fetchVertices')
    }

    const vertexFullId = getters.activeVertex['entity']

    let result = await get(`/yarn_timeline/ws/v1/timeline/TEZ_TASK_ID?primaryFilter=TEZ_VERTEX_ID:"${vertexFullId}"`)
    let json = await result.json()
    let tasks = json['entities']

    result = await get(`/yarn_timeline/ws/v1/timeline/TEZ_TASK_ATTEMPT_ID?primaryFilter=TEZ_VERTEX_ID:"${vertexFullId}"`)
    json = await result.json()
    let taskAttempts = json['entities']

    taskAttempts = taskAttempts.reduce((p, c) => {
      const k = 'task_' + c['entity'].match(/^attempt_(.+?)_[0-9]+$/)[1]
      p[k] = p[k] || []
      p[k].push(c)

      return p
    }, {})

    console.log(taskAttempts)

    tasks = tasks.map(t => {
      const t2 = {}
      t2['id'] = t['entity'].match(/([0-9]+)$/)[1]
      t2['status'] = t['otherinfo']['status']
      t2['attempts'] = taskAttempts[t['entity']]
      t2['duration'] = t['otherinfo']['timeTaken']

      const lastAttempt = t2['attempts'].slice(-1)[0]

      t2['taskAttemptNodeId'] = lastAttempt['otherinfo']['nodeId']
      t2['taskAttemptNodeShortId'] = t2['taskAttemptNodeId'].match(/^ip-((?:[0-9]+-){3}[0-9]+).+$/)?.[1] || t2['taskAttemptNodeId']
      t2['taskAttemptLogUrlRunning'] = lastAttempt['otherinfo']['inProgressLogsURL']

      return t2
    })
    tasks.sort((a, b) => Number.parseInt(a['id']) > Number.parseInt(b['id']))

    commit('setTasks', tasks)
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
  setDags(state, dags) {
    state['dags'] = dags
  },
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
  },
  setTasks(state, tasks) {
    state['tasks'] = tasks
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}