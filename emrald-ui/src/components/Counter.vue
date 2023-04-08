<template lang="pug">
span
  span(v-if="counter")
    | {{ scaledCounter }}
    small.unit {{ unit }}
  span(v-else)
    | -
</template>

<script>
export default {
  name: 'DurationComponent',
  computed: {
    scaledCounter() {
      if (this.counter == null) {
        return null
      }

      let counter = Number.parseFloat(this.counter)
      let scaledCounter = counter;
      if (counter > 10**9) {
        scaledCounter /= 10**9
      } else if (counter > 10**6) {
        scaledCounter /= 10**6
      } else if (counter > 10**3) {
        scaledCounter /= 10**3
      }

      return scaledCounter.toFixed(1)
    },
    unit() {
      let counter = Number.parseFloat(this.counter)
      if (counter > 10**9) {
        return 'b'
      } else if (counter > 10**6) {
        return 'm'
      } else if (counter > 10**3) {
        return 'k'
      }

      return ''
    }
  },
  props: {
    counter: null
  }
}
</script>