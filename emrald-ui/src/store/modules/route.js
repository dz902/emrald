const state = () => ({
  params: {}
})

const getters = {}

const actions = {}

const mutations = {
  setRoute(state, currentRoute) {
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