<template lang="pug">
div.aui-page-panel
  div.aui-page-panel-inner
    main.aui-page-panel-content
      breadcrumbs 
      table.aui.aui-table-sortable.dags
        thead
          tr
            th Vertex
            th Status
            th Records
            th I/O
            th Tasks
            th Duration
</template>

<script>
import breadcrumbs from './Breadcrumbs'

import { createNamespacedHelpers } from 'vuex'
const { mapActions, mapState, mapGetters } = createNamespacedHelpers('tezApp')

export default {
  name: 'TezVertexComponent',
  computed: {
    ...mapState(['vertices', 'vertexAliases', 'vertexInputs']),
    ...mapGetters(['activeVertex']),
    links() {
      return [
        { path: '/apps', name: 'Apps' },
        { path: '/apps', name: 'Job'},
        { path: '/apps', name: 'Job'},
        { path: '/apps', name: 'Map 4'}
      ]
    }
  },
  methods: {
    ...mapActions(['fetchVertices']),
    async setup() {
      if (!this.activeVertex) {
        await this.fetchVertices()
      }
    }
  },
  mounted() {
    this.setup()
  },
  beforeRouteUpdate() {
    this.setup()
  },
  components: {
    breadcrumbs
  }
}
</script>

<style lang="scss">

</style>
