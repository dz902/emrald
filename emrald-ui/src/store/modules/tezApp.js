import { get, findKv }  from '../../utils'

const state = {
  dagExtraInfo: {},
  openDag: null,
  dags: [],
  vertices: [],
  vertexAliases: {},
  vertexInputs: {}
}

const getters = {
  activeDag(state, getters, rootState) {
    const { appId, dagId } = rootState.route.params
    const dagFullId = `dag_${appId}_${dagId}`
    return state.dags.find(d => d['id'] == dagFullId)
  },
  activeVertex(state, getters, rootState) {
    const routeParams = rootState.route.params
    const vertexFullId = `vertex_${routeParams['appId']}_${routeParams['dagId']}_${routeParams['vertexId']}`
    return state.vertices.find(v => v['id'] == vertexFullId)
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
      const d2 = {}
      const result = d['primaryfilters']['dagName'][0].match(/^(.+?)\((Stage-[0-9]+)\)/sm)
      const otherinfo = d['otherinfo']

      d2['id'] = d['entity']
      d2['shortId'] = d['entity'].match(/([0-9]+)$/)[1]
      d2['type'] = 'File Merge' in otherinfo['vertexNameIdMapping'] ? 'File Merge' : 'Map / Reduce'
      d2['shortName'] = result ? result[1] : d2['type']
      d2['stage'] = result ? result[2] : d2['type']
      d2['callerId'] = otherinfo['callerId']
      d2['numSucceededTasks'] = otherinfo['numSucceededTasks']
      d2['numKilledTasks'] = otherinfo['numKilledTasks']
      d2['numFailedTasks'] = otherinfo['numFailedTasks']
      d2['status'] = otherinfo['status']
      d2['startTime'] = otherinfo['startTime']
      d2['endTime'] = otherinfo['endTime']

      return d2
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
      const v2 = {}

      const otherinfo = v['otherinfo']

      v2['id'] = v['entity']
      v2['shortId'] = v['entity'].match(/([0-9]+)$/)[1]
      v2['name'] = otherinfo['vertexName']
      v2['status'] = otherinfo['status']

      if (otherinfo['counters']) {
        const counters = otherinfo['counters']

        let hiveCounters = counters['counterGroups'].find(
          cg => cg['counterGroupName'] == 'HIVE'
        )
        hiveCounters = hiveCounters ? hiveCounters['counters'] : null
        const hiveInputCounters = findKv(
          'counterGroupName',
          'org.apache.hadoop.hive.ql.exec.tez.HiveInputCounters',
          'counters',
          counters['counterGroups']
        )
        let tezCounters = findKv(
          'counterGroupName', 
          'org.apache.tez.common.counters.TaskCounter', 
          'counters', 
          counters['counterGroups']
        )
        const fsCounters = findKv(
          'counterGroupName', 
          'org.apache.tez.common.counters.FileSystemCounter', 
          'counters', 
          counters['counterGroups']
        )
  
        if (hiveInputCounters) {
          v2['counterInputFiles'] = hiveInputCounters.find(c => c['counterName'].match(/^INPUT_FILES_/))?.counterValue
          v2['counterInputDirs'] = hiveInputCounters.find(c => c['counterName'].match(/^INPUT_DIRECTORIES_/))?.counterValue
        }
  
        v2['counterInputRecords'] = hiveCounters ? hiveCounters.find(c => c['counterName'].match(/^RECORDS_IN/)) : null
        v2['counterInputRecords'] = v2['counterInputRecords']?.counterValue || tezCounters.find(c => c['counterName'].match(/^(REDUCE_INPUT_RECORDS|INPUT_RECORDS_PROCESSED)/))?.counterValue
  
        v2['counterOutputRecords'] = findKv('counterName', 'OUTPUT_RECORDS', 'counterValue', tezCounters)
  
        if (hiveCounters) {
          v2['counterOutputRecords'] = v2['counterOutputRecords']?.counterValue || hiveCounters.find(c => c?.counterName?.match(/^(RECORDS_OUT_[0-9]+|RECORDS_OUT_OPERATOR_RS)/))?.counterValue
        } else {
          v2['counterOutputRecords'] = null
        }

        if (hiveCounters) {
          v2['counterCreatedFiles'] = findKv('counterName', 'CREATED_FILES', 'counterValue', hiveCounters)
          v2['outputTable'] = hiveCounters
            .reduce((p, c ) => p.concat([c['counterName']]), [])
            .find(k => k.match(/^RECORDS_OUT_[0-9]+/))
            ?.match(/^RECORDS_OUT_[0-9]+_(.+)$/)?.[1]
        }

        v2['counterFileReadBytes'] = findKv('counterName', 'FILE_BYTES_READ', 'counterValue', fsCounters)
        v2['counterFileWrittenBytes'] = findKv('counterName', 'FILE_BYTES_WRITTEN', 'counterValue', fsCounters)
        v2['counterS3ReadBytes'] = findKv('counterName', 'S3_BYTES_READ', 'counterValue', fsCounters)
        v2['counterS3WrittenBytes'] = findKv('counterName', 'S3_BYTES_WRITTEN', 'counterValue', fsCounters)
      }

      v2['numSucceededTasks'] = otherinfo['numSucceededTasks']
      v2['startTime'] = otherinfo['startTime']
      v2['endTime'] = otherinfo['endTime']

      v2['statsAvgTaskDuration'] = otherinfo['stats']['avgTaskDuration']
      v2['statsMaxTaskDuration'] = otherinfo['stats']['maxTaskDuration']

      return v2
    })

    commit('setVertices', vertices)

    dispatch('fetchDagExtraInfo')
  },
  async fetchTasks({ commit, getters, dispatch, rootState }) {
    if (!getters.activeVertex) {
      await dispatch('fetchVertices')
    }

    const vertexFullId = getters.activeVertex['id']

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
  },
  async fetchDagSql({ commit }, dagId) {
    const openDag = state['dags'].find((d) => d['id'] == dagId)
    commit('setOpenDag', openDag)

    let result = await get(
      `/yarn_timeline/ws/v1/timeline/TEZ_DAG_EXTRA_INFO/${dagId}`
    )
    let json = await result.json()
    let dagInfo = JSON.parse(json['otherinfo']['dagPlan']['dagInfo'])

    commit('setOpenDagSql', dagInfo['description'])
  }
}

const mutations = {
  setDags(state, dags) {
    state['dags'] = dags
  },
  setOpenDagSql(state, dagSql) {
    state['openDag']['dagSql'] = dagSql
  },
  setOpenDag(state, openDag) {
    state['openDag'] = openDag
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