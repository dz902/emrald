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
            th resources
            th started
            th duration
            th link
        tbody
          template(v-for="app in apps")
            tr
              td
                div.info
                  small.id
                    a(data-aui-trigger,aria-controls="full-id",href="javascript:void(0)",@click="setAppFullId(app)") \#{{ app['shortId'] }}
                  span.aui-lozenge.aui-lozenge-subtle.type.tez {{ app['applicationType'] }}
                div.info2
                  router-link(:to="{ path: `/apps/${app['clusterId']}_${app['shortId']}/tez_job` }"): span.name {{ app['name'] }}
              td
                span.aui-lozenge.aui-lozenge-subtle(
                  :class="{ \
                    'aui-lozenge-inprogress': app['state'] == 'RUNNING', \
                    'aui-lozenge-success': app['state'] == 'FINISHED' \
                  }"
                )
                  | {{ app['finalStatus'].toLowerCase() == 'undefined' ? app['state'] : app['finalStatus'] }}
              td
                div
                  small No Pending
                div
                  | {{ app['runningContainers'] }} 
                  small Running / 
                  span
                    span(v-if="app['duration_total']['days'] > 1")
                      | {{ app['duration_total']['days'] }} 
                      small.unit Days
                    span(v-else-if="app['duration_total']['hours'] > 1")
                      | {{ app['duration_total']['hours'] }}
                      small.unit h
                    span(v-else-if="app['duration_total']['minutes'] > 1")
                      | {{ app['duration_total']['minutes'] }}
                      small.unit m
                    span(v-else-if="app['duration_total']['seconds'] > 1")
                      | {{ app['duration_total']['seconds'] }}
                      small.unit s
              td
                div
                  div
                    small {{ app['queueUsagePercentage'].toFixed(1) }}% Queue / {{ app['clusterUsagePercentage'].toFixed(1) }}% Cluster
                  div
                    | {{ app['allocatedVCores'] }} 
                    small.unit Cores / 
                    | {{ Number.parseFloat(app['allocatedMB'] / 1024).toFixed(1) }} 
                    small.unit GB
              td
                div
                  small {{ `${app['date_started']['year']}-${app['date_started']['month']}-${app['date_started']['day']}` }}
                div
                  | {{ `${app['date_started']['hours']}:${app['date_started']['minutes']}:${app['date_started']['seconds']}` }}
              td
                div
                  small Tasks updated 5 mins ago
                div
                  span(v-if="app['duration_total']['days'] > 1")
                    | {{ app['duration_total']['days'] }} 
                    small.unit Days
                  span(v-else-if="app['duration_total']['hours'] > 1")
                    | {{ app['duration_total']['hours'] }}
                    small.unit h
                  span(v-else-if="app['duration_total']['minutes'] > 1")
                    | {{ app['duration_total']['minutes'] }}
                    small.unit m
                  span(v-else-if="app['duration_total']['seconds'] > 1")
                    | {{ app['duration_total']['seconds'] }}
                    small.unit s
              td
                | drpo
            tr(v-if="app['tezDags']")
              td(colspan=7)
                table.aui.aui-table-sortable.dags
                  tbody
                    tr(v-for="dag in app['tezDags']")
                      td {{ dag['primaryfilters']['dagName'][0].match(/(Stage-[0-9])\)/)[1] }}
                      td
                        span.aui-lozenge.aui-lozenge-subtle(
                          :class="{ \
                            'aui-lozenge-inprogress': dag['otherinfo']['status'] == 'RUNNING', \
                            'aui-lozenge-success': dag['otherinfo']['status'] == 'SUCCEEDED' \
                          }"
                        )
                          | {{ dag['otherinfo']['status'] }}
            tr(v-if="app['appAttempts']")
              td(colspan=7)
                table.aui.aui-table-sortable.containers
                  thead
                    tr
                      th id
                      th node
                      th files
                      th logs
                  tbody
                    tr(v-for="container in app['appAttempts'].at(-1)['containers']")
                      td \#{{ container['id'] }}
                      td {{ container['node'] }}
                      td -
                      td: a(:href="container['logUrl']") View
      aui-inline-dialog(id="full-id",aria-label="full id")
        span {{ currentAppFullId }}
</template>

<script>
import { createNamespacedHelpers } from 'vuex'

const { mapActions, mapState } = createNamespacedHelpers('apps')

export default {
  name: 'AppsComponent',
  data() {
    return {
      currentAppFullId: null
    }
  },
  computed: {
    ...mapState(['apps'])
  },
  methods: {
    ...mapActions(['fetchApps', 'fetchAppAttempts', 'fetchTezDags']),
    setAppFullId(app) {
      this.currentAppFullId = `application_${app['clusterId']}_${app['shortId']}`
    }
  },
  async mounted() {
    await this.fetchApps()
    const appId = this.apps[0]['id']
    await this.fetchAppAttempts(appId)
    await this.fetchTezDags(appId)
  }
}
</script>

<style lang="scss">
.type.tez {
  vertical-align: middle;
  background-color: var(--aui-lozenge-moved-subtle-bg-color);
  color: var(--aui-lozenge-moved-subtle-text-color);
}

.app-cluster-id {

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
