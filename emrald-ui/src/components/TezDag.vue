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
            th I/O
            th Tasks
            th Duration
        tbody
          tr(v-for="v in vertices")
            td 
              div
                router-link(:to="`${$route.path}/vertex/${v['vertexId']}`") {{ v['otherinfo']['vertexName'] }} 
                small(v-if="vertexAliases[v['otherinfo']['vertexName']] && vertexAliases[v['otherinfo']['vertexName']] == '**FINAL**'")  FINAL
              div
                small
                  span(v-if="vertexInputs[v['otherinfo']['vertexName']]") {{ vertexInputs[v['otherinfo']['vertexName']].join(', ') }} 
                  span(v-if="vertexAliases[v['otherinfo']['vertexName']] && vertexAliases[v['otherinfo']['vertexName']] != '**FINAL**'") {{ vertexAliases[v['otherinfo']['vertexName']] }}
            td
              status-badge(:status="v['otherinfo']['status']")
            td
              div(v-if="v['vertexCounterInputRecords'] && v['vertexCounterOutputRecords']")
                counter(:counter="v['vertexCounterInputRecords']") 
                |  → 
                counter(:counter="v['vertexCounterOutputRecords']") 
              div(v-else)
                | -
              div(v-if="v['vertexCounterInputFiles']")
                | {{ v['vertexCounterInputFiles'] }} 
                small files / 
                | {{ v['vertexCounterInputDirs'] }} 
                small dirs
            td
              div(v-if="v['vertexCounterFileReadBytes'] || v['vertexCounterFileWrittenBytes']")
                small FS 
                size(:size="v['vertexCounterFileReadBytes']")
                |  → 
                size(:size="v['vertexCounterFileWrittenBytes']")
              div(v-if="v['vertexCounterS3ReadBytes'] || v['vertexCounterS3WrittenBytes']")
                small S3 
                size(:size="v['vertexCounterS3ReadBytes']")
                |  → 
                size(:size="v['vertexCounterS3WrittenBytes']")
            td
              span {{ v['otherinfo']['numSucceededTasks'] }}
            td
              div
                duration(:startTime="v['otherinfo']['startTime']", :endTime="v['otherinfo']['endTime']")
              div
                small (avg 
                duration(:startTime="0", :endTime="v['otherinfo']['stats']['avgTaskDuration']")
                small  / max 
                duration(:startTime="0", :endTime="v['otherinfo']['stats']['maxTaskDuration']")
                small )
</template>

<script>
import statusBadge from './StatusBadge'
import counter from './Counter'
import duration from './Duration'
import size from './Size'
import { createNamespacedHelpers } from 'vuex'

const { mapActions, mapState } = createNamespacedHelpers('tezApp')

export default {
  name: 'TezDagComponent',
  data () {
    return {
      appId: null
    }
  },
  computed: {
    ...mapState(['vertices', 'vertexAliases', 'vertexInputs'])
  },
  methods: {
    ...mapActions(['fetchVertices']),
    async setup() {
      console.log(333)
      console.log(this.$route.path)
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
    duration,
    counter,
    size
  }
}
</script>

<style lang="scss">

</style>
