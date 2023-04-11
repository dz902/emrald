<template lang="pug">
div.aui-page-panel
  div.aui-page-panel-inner
    main.aui-page-panel-content
      ol.aui-nav.aui-nav-breadcrumbs
        li: router-link(:to="{ path: `/apps` }") Apps
        li 
          span.app-id \#{{ $route.params['appId'] }}  
          span.aui-lozenge.aui-lozenge-subtle.type.tez Tez
      table.aui.aui-table-sortable.dags
        thead
          tr
            th DAG
            th Stage
            th Type
            th Tasks
            th Status
            th Duration
        tbody
          template(v-for="dagGroup in dagsGroupByCallerId")
            tr(v-for="(dag, i) in dagGroup")
              td
                | {{ i == 0 ? dagGroup.slice(-1)[0]['shortName'] : '' }} 
                small(v-if="i == 0")
                  a(
                    href='javascript:void(0)'
                    @click="fetchDagSql(dagGroup.find(d => d['type'] == 'Map / Reduce')['id'])"
                    aria-controls="sql"
                    data-aui-trigger
                    v-if="i == 0 && dagGroup.find(d => d['type'] == 'Map / Reduce')"
                  ) view sql
              td
                router-link(:to="{ path: `/apps/${appId}/dags/${dag['shortId']}` }") {{ dag['stage'] }}
              td {{ dag['type'] }}
              td
                | {{ dag['numSucceededTasks'] }} 
                span(v-if="dag['numKilledTasks'] + dag['numFailedTasks'] > 0")
                  | (-{{ dag['numKilledTasks'] + dag['numFailedTasks'] }})
              td
                status-badge(:status="dag['status']")
              td
                duration(:startTime="dag['startTime']",:endTime="dag['endTime']")
      aui-inline-dialog.aui-help.aui-help-text.sql-modal#sql
        div.sql(v-if="!openDag || !openDag['dagSql']")
          | Loading...
        div.sql(v-else)
          pre {{ openDag['dagSql'] }}
</template>

<script>
import statusBadge from './StatusBadge'
import duration from './Duration'
import { createNamespacedHelpers } from 'vuex'

const { mapActions, mapState } = createNamespacedHelpers('tezApp')

export default {
  name: 'TezJobComponent',
  data () {
    return {
      appId: null
    }
  },
  computed: {
    ...mapState(['openDag', 'dags']),
    dagsGroupByCallerId() {
      return this.dags.reduce((p, c) => {
        p[c['callerId']] = p[c['callerId']] ? p[c['callerId']] : []
        p[c['callerId']].push(c)

        return p
      }, {})
    }
  },
  methods: {
    ...mapActions(['fetchDags', 'fetchDagSql']),
    async setup() {
      console.log(321)
      this.appId = this.$route.params['appId']
      return this.fetchDags(this.appId)
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
ol.aui-nav.aui-nav-breadcrumbs li {
  & > * {
    vertical-align: middle;
  }

  span.app-id {
    margin-right: 0.5rem;
  }
}

.sql-modal  {
  height: 100%;

  & > .aui-inline-dialog-contents {
    overflow: scroll;
    max-height: 80%;

    pre {
      font-size: 1rem;
    }
  }
}
</style>
