import { get }  from '../../utils'

const state = {
  openDag: null,
  dags: []
}

const getters = {
}

const actions = {
  async fetchDags({ commit, dispatch, rootState }, appId) {
    if (!rootState.cluster.cluster['id']) {
      await dispatch('cluster/fetchCluster', null, { root: true })
    }

    appId = `application_${appId}`

    let result = await get(`/yarn_timeline/ws/v1/timeline/TEZ_DAG_ID?primaryFilter=applicationId:"${appId}"`)
    let json = await result.json()
    let dags = json['entities']

    dags = dags.map(d => {
      const result = d['primaryfilters']['dagName'][0].match(/^(.+?)\((Stage-[0-9])\)/sm)
      const otherinfo = d['otherinfo']

      d['dagId'] = d['entity']
      d['dagShortId'] = d['entity'].match(/([0-9]+)$/)[1]
      d['dagType'] = 'File Merge' in otherinfo['vertexNameIdMapping'] ? 'File Merge' : 'Map / Reduce'
      d['dagShortName'] = result ? result[1] : d['dagType']
      d['dagStage'] = result ? result[2] : d['dagType']
      d['dagCallerId'] = otherinfo['callerId']
      d['dagTaskSucceeded'] = otherinfo['numSucceededTasks']
      d['dagTaskKilled'] = otherinfo['numKilledTasks']
      d['dagTaskFailed'] = otherinfo['numFailedTasks']
      d['dagStatus'] = otherinfo['status']
      d['dagStartTime'] = otherinfo['startTime']
      d['dagEndTime'] = otherinfo['endTime']

      const endTime = otherinfo['endTime'] ? otherinfo['endTime'] : (new Date()).getTime()
      d['dagDuration'] = Math.round((endTime-otherinfo['startTime'])/1000)

      return d
    })

    commit('setDags', dags)
  },
  async fetchDagSql({ commit }, dagId) {
    const openDag = state['dags'].find((d) => d['dagId'] == dagId)
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
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}