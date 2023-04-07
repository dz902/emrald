<template lang="pug">
span.aui-lozenge.aui-lozenge-subtle(
  :class="{ \
    'aui-lozenge-inprogress': status == 'RUNNING', \
    'aui-lozenge-success': status == 'SUCCEEDED' \
  }"
)
  | {{ status ? status : 'UNKNOWN' }}
</template>

<script>
export default {
  name: 'StatusBadgeComponent',
  props: {
    status: null
  }
}
</script>

<style lang="scss" scoped>

</style>