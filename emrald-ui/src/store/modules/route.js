const state = () => ({
  name: null,
  params: {}
})

const getters = {}

const actions = {}

const mutations = {
  setRoute(state, currentRoute) {
    state.name = currentRoute.name
    state.params = currentRoute.params
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}