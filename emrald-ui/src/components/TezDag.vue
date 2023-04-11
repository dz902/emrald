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
        tbody
          tr(v-for="v in vertices")
            td 
              div
                router-link(:to="`${$route.path}/vertex/${v['shortId']}`") {{ v['name'] }} 
                small(v-if="vertexAliases[v['name']] && vertexAliases[v['name']] == '**FINAL**'")  FINAL
              div
                small
                  span(v-if="vertexInputs[v['name']]") {{ vertexInputs[v['name']].join(', ') }} 
                  span(v-if="vertexAliases[v['name']] && vertexAliases[v['name']] != '**FINAL**'") {{ vertexAliases[v['name']] }}
            td
              status-badge(:status="v['status']")
            td
              div(v-if="v['counterInputRecords'] && v['counterOutputRecords']")
                counter(:counter="v['counterInputRecords']") 
                |  → 
                counter(:counter="v['counterOutputRecords']") 
              div(v-else)
                | -
              div(v-if="v['counterInputFiles']")
                | {{ v['counterInputFiles'] }} 
                small files / 
                | {{ v['counterInputDirs'] }} 
                small dirs
            td
              div(v-if="v['counterFileReadBytes'] || v['counterFileWrittenBytes']")
                small FS 
                size(:size="v['counterFileReadBytes']")
                |  → 
                size(:size="v['counterFileWrittenBytes']")
              div(v-if="v['counterS3ReadBytes'] || v['counterS3WrittenBytes']")
                small S3 
                size(:size="v['counterS3ReadBytes']")
                |  → 
                size(:size="v['counterS3WrittenBytes']")
            td
              span {{ v['numSucceededTasks'] }}
            td
              div
                duration(:startTime="v['startTime']", :endTime="v['endTime']")
              div
                small (avg 
                duration(:startTime="0", :endTime="v['statsAvgTaskDuration']")
                small  / max 
                duration(:startTime="0", :endTime="v['statsMaxTaskDuration']")
                small )
</template>

<script>
import statusBadge from './StatusBadge'
import breadcrumbs from './Breadcrumbs'
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
    size,
    breadcrumbs
  }
}
</script>

<style lang="scss">

</style>
