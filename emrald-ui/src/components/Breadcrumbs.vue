<template lang="pug">
ol.aui-nav.aui-nav-breadcrumbs
  li(v-for="link in navLinks")
    router-link(:to="{ path: link['path'] }") {{ link['name'] }}
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