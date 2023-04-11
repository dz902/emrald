<template lang="pug">
span
  span(v-if="size")
    | {{ scaledSize }}
    small.unit {{ unit }}
  span(v-else)
    | -
</template>

<script>
export default {
  name: 'SizeComponent',
  computed: {
    scaledSize() {
      if (this.size == null) {
        return null
      }

      let size = Number.parseFloat(this.size)
      let scaledSize = size;
      if (size > 1024**3) {
        scaledSize /= 1024**3
      } else if (size > 1024**2) {
        scaledSize /= 1024**2
      } else if (size > 1024) {
        scaledSize /= 1024
      }

      return scaledSize == size ? Number.parseInt(scaledSize) : scaledSize.toFixed(1)
    },
    unit() {
      let size = Number.parseFloat(this.size)
      if (size > 1024**3) {
        return 'g'
      } else if (size > 1024**2) {
        return 'm'
      } else if (size > 1024) {
        return 'k'
      }

      return ''
    }
  },
  props: {
    size: null
  }
}
</script>