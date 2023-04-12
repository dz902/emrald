<template lang="pug">
div.aui-page-panel
  div.aui-page-panel-inner
    main.aui-page-panel-content
      breadcrumbs 
      table.aui.aui-table-sortable.dags
        thead
          tr
            th Task
            th Status
            th Node
            th Logs
            th Duration
        tbody
          tr(v-for="t in tasks")
            td {{ t['id'] }}
            td
              status-badge(:status="t['status']")
            td
              router-link(:to="`/nodes/${t['taskAttemptNodeId']}`") {{ t['taskAttemptNodeShortId'] }}
            td
              a(:href="t['taskAttemptLogUrlRunning']") HDFS
              |  | 
              a(:href="t['taskAttemptLogUrlRunning']") S3
            td
              div
                duration(:startTime="0", :endTime="t['duration']")
</template>

<script>
import breadcrumbs from './Breadcrumbs'
import statusBadge from './StatusBadge'
import duration from './Duration'

import { createNamespacedHelpers } from 'vuex'
const { mapActions, mapState } = createNamespacedHelpers('tezApp')

export default {
  name: 'TezVertexComponent',
  computed: {
    ...mapState(['tasks'])
  },
  methods: {
    ...mapActions(['fetchTasks']),
    async setup() {
      if (!this.tasks) {
        await this.fetchTasks()
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
    breadcrumbs,
    statusBadge,
    duration
  }
}
</script>

<style lang="scss">

</style>
