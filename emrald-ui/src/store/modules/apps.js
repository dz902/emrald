const state = {
  apps: [],
  fetchAppStatus: 'NOT_STARTED'
}

const getters = {
}

const actions = {
  async fetchApps({ commit }) {
    commit('setFetchAppStatus', 'STARTED')

    const result = await get('/yarn/ws/v1/cluster/apps?state=RUNNING&limit=100')
    const json = await result.json()
    const date = new Date()
    const apps = json['apps']['app'].map((app) => {
      app['clusterId'] = app['id'].match(/^application_([0-9]+)/)[1]
      app['shortId'] = app['id'].match(/[0-9]+$/)[0]

      const finishedTime = app['finishedTime'] > 0 ? app['finishedTime'] : date.getTime();
      app['duration_total'] = secondsToHms((finishedTime - app['startedTime']) / 1000)

      const startedTime = new Date(app['startedTime'])
      app['date_started'] = {
        year: startedTime.getFullYear(),
        month: String(startedTime.getMonth()+1).padStart(2, '0'),
        day: String(startedTime.getDate()+1).padStart(2, '0'),
        hours: String(startedTime.getHours()).padStart(2, '0'),
        minutes: String(startedTime.getMinutes()).padStart(2, '0'),
        seconds: String(startedTime.getSeconds()+1).padStart(2, '0')
      }

      return app
    })

    commit('setApps', apps)
  },
  async fetchAppAttempts({ commit }, appId) {
    let result = await get(`/yarn/ws/v1/cluster/apps/${appId}/appattempts`)
    let json = await result.json()
    const appAttempts = json['appAttempts']['appAttempt'];
    const lastAttempt = appAttempts.at(-1)

    result = await get(`/yarn/ws/v1/cluster/apps/${appId}/appattempts/${lastAttempt['appAttemptId']}/containers`)
    json = await result.json()
    let containers = json['container']

    containers = Array.isArray(containers) ? containers : [containers];

    const averageElaspedTime = containers.reduce((a, c) => {
      return a + c['elapsedTime']
    }, 0)
    lastAttempt['averageElapsedTime'] = averageElaspedTime;
    lastAttempt['averageElapsedTimeFormatted'] = secondsToHms(averageElaspedTime/1000);

    containers = containers.map(c => {
      c['id'] = c['containerId'].match(/[0-9]+$/)[0]
      c['node'] = c['nodeHttpAddress'].replace(/^.+?([0-9]+)-([0-9]+)-([0-9]+)-([0-9]+).+?$/, '$1.$2.$3.$4')

      return c
    })

    appAttempts.at(-1)['containers'] = containers

    commit('setAppAttempts', { appId, appAttempts })
  },
  async fetchTezDags({ commit }, appId) {
    let result = await get(`/yarn_timeline/ws/v1/timeline/TEZ_DAG_ID?primaryFilter=applicationId:"${appId}"`)
    let json = await result.json()
    const tezDags = json['entities']

    commit('setTezDags', { appId, tezDags })
  }
}

const mutations = {
  setApps(state, apps) {
    state.apps = apps
  },
  setAppAttempts(state, { appId, appAttempts }) {
    console.log(appId, appAttempts)
    state.apps.find(a => a['id'] == appId)['appAttempts'] = appAttempts
  },
  setFetchAppStatus(state, status) {
    state.fetchAppStatus = status
  },
  setTezDags(state, { appId, tezDags }) {
    state.apps.find(a => a['id'] == appId)['tezDags'] = tezDags
  }
}

function secondsToHms(dt) {
  dt = Number.parseFloat(dt);

  const day = (dt / (3600 * 24)).toFixed(1)
  const hours = (dt / 3600).toFixed(1)
  const minutes = (dt / 60).toFixed(1)
  const seconds = Math.round(dt)

  return { day, hours, minutes, seconds }
}

async function get(path) {
  return fetch(`http://localhost:5000${path}`, {
    cors: 'no-cors',
    headers: {
      "Content-Type": "application/json"
    }
  })
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
}