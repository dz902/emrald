<template lang="pug">
div.aui-page-panel
  div.aui-page-panel-inner
    main.aui-page-panel-content
      table.aui.aui-table-sortable.apps
        thead
          tr
            th id
            th status
            th containers
            th resource
            th last update
            th uptime
        tbody
          tr(v-for="n in nodes")
            td {{ n['shortId'] }}
            td
              status-badge(:status="n['state']")
            td 
              template(v-if="n['state'] == 'RUNNING'") {{ n['numContainers'] }}
              template(v-else) -
            td
              template(v-if="n['state'] == 'RUNNING' && n['resourceCores']")
                div(v-if="n['resourceCoresUsed'] > 0")
                  small USED 
                  | {{ n['resourceCoresUsed'] }}
                  small c
                  |  / 
                  size(:size="n['resourceMemoryUsed']*(1024**2)")
                div(v-else) -
                div
                  small TOTAL 
                  | {{ n['resourceCores'] }}
                  small c
                  |  / 
                  size(:size="n['resourceMemory']*(1024**2)")
              template(v-else)
                | -
            td
              div
                duration(:startTime="n['lastHealthUpdate']")
                small  ago
              div
                small {{ dateFormat(n['lastHealthUpdate'], 'yyyy-MM-dd HH:mm:ss') }}
            td
              template(v-if="n['nodeInfo']")
                div
                  duration(:startTime="n['nodeInfo']['startupTime']")
                div
                  small {{ dateFormat(n['nodeInfo']['startupTime'], 'yyyy-MM-dd HH:mm:ss') }} 
              div(v-else) -
</template>

<script>
import statusBadge from './StatusBadge'
import size from './Size'
import duration from './Duration'
import { createNamespacedHelpers } from 'vuex'
import { format } from 'date-fns'

const { mapActions, mapState } = createNamespacedHelpers('cluster')

export default {
  name: 'NodesComponent',
  computed: {
    ...mapState(['nodes'])
  },
  methods: {
    ...mapActions(['fetchNodes']),
    async setup() {
      if (!this.nodes) {
        await this.fetchNodes()
      }
    },
    dateFormat: format
  },
  mounted() {
    this.setup()
  },
  beforeRouteUpdate() {
    this.setup()
  },
  components: {
    statusBadge, size, duration
  }
}
</script>

<style lang="scss">
.type.tez {
  vertical-align: middle;
  background-color: var(--aui-lozenge-moved-subtle-bg-color);
  color: var(--aui-lozenge-moved-subtle-text-color);
}

.app-short-id {
  color: var(--aui-body-text);
}

table.apps {
  & > tbody > tr {
    // border: 1px solid var(--aui-body-text);
    // border-radius: 0.25rem;
    // padding: 0.75rem;

    & > td {
      vertical-align: middle;

      & > div.info {
        & > small {
          margin-right: 0.5rem;
        }
      }

      & > div.info2 {
        span {
          vertical-align: middle;
          margin: 1px 0.25rem 0 0;
        }
      }


      dl div {
        display: flex;

        dt {
          width: 3.5rem;
        }

        dd {
          margin: 0;
        }
      }
    }

    .basic {
      display: flex;
      justify-content: space-between;
      align-items: center;


      .id {
        vertical-align: middle;
      }

      .extra {
        span {
          margin-left: 0.5rem;
        }
      }
    }

    // .info {
    //   display: flex;
    //   justify-content: space-between;
    //   align-items: center;
    // }
  }
}
</style>
