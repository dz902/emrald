<template lang="pug">
div#content
  div.aui-sidebar.sidebar
    div.aui-sidebar-wrapper
      div.aui-sidebar-body
        div.aui-navgroup.aui-navgroup-vertical
          div.aui-navgroup-inner
            div.aui-sidebar-group
              ul.aui-nav
                li: router-link.aui-nav-item(:to="{ path:'/cluster' }") Cluster
                li: router-link.aui-nav-item(:to="{ path:'/nodes' }") Nodes
                li: router-link.aui-nav-item(:to="{ path:'/apps' }") Apps
  router-view.page-content
</template>

<script>
export default {
  name: 'MainComponent'
}
</script>

<style lang="scss">
.page-content {
  overflow: scroll;
  height: 100%;
}
</style>
