<template lang="pug">
div.aui-page-panel
  div.aui-page-panel-inner
    main.aui-page-panel-content
      ol.aui-nav.aui-nav-breadcrumbs
        li: router-link(:to="{ path: `/apps` }") Apps
        li 
          router-link(:to="{ path: `/apps/${$route.params['appId']}/tez_job` }") 
            span.app-id \#{{ $route.params['appId'] }}  
          span.aui-lozenge.aui-lozenge-subtle.type.tez Tez
        li
          span DAG \#{{ $route.params['dagId'] }}
      table.aui.aui-table-sortable.dags
        thead
          tr
            th Vertex
            th Status
            th Records
            th Tasks
            th Duration
        tbody
          tr(v-for="v in vertices")
            td {{ v['otherinfo']['vertexName'] }}
            td
              status-badge(:status="v['otherinfo']['status']")
            td
              span in {{ v['dagCounterInputRecords'] }} / out {{ v['dagCounterOutputRecords'] }}
            td
              span {{ v['otherinfo']['numSucceededTasks'] }}
            td
              duration(:startTime="v['otherinfo']['startTime']",:endTime="v['otherinfo']['endTime']")
</template>

<script>
import statusBadge from './StatusBadge'
import duration from './Duration'
import { createNamespacedHelpers } from 'vuex'

const { mapActions, mapState } = createNamespacedHelpers('tezDag')

export default {
  name: 'TezDagComponent',
  data () {
    return {
      appId: null
    }
  },
  computed: {
    ...mapState(['vertices'])
  },
  methods: {
    ...mapActions(['fetchVertices']),
    async setup() {
      console.log(123)
      await this.fetchVertices()
    }
  },
  mounted() {
    this.setup()
  },
  beforeRouteUpdate() {
    this.setup()
  },
  components: {
    statusBadge,
    duration
  }
}
</script>

<style lang="scss">

</style>
