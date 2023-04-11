<template lang="pug">
ol.aui-nav.aui-nav-breadcrumbs
  li(v-for="(link, i) in navLinks")
    router-link(v-if="i != navLinks.length-1",:to="{ path: link['path'] }") {{ link['name'] }}
    span(v-else) {{ link['name'] }}
    | {{ link['extra'] }}
</template>

<script>
import { createNamespacedHelpers } from 'vuex'
const { mapGetters } = createNamespacedHelpers('breadcrumbs')

export default {
  name: 'BreadcrumbsComponent',
  computed: {
    ...mapGetters(['navLinks'])
  }
}
</script>