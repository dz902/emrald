<template lang="pug">
span(v-if="duration")
  span(v-if="duration['days'] > 1")
    | {{ duration['days'] }} 
    small.unit Days
  span(v-else-if="duration['hours'] > 1")
    | {{ duration['hours'] }}
    small.unit h
  span(v-else-if="duration['minutes'] > 1")
    | {{ duration['minutes'] }}
    small.unit m
  span(v-else-if="duration['seconds'] > 1")
    | {{ duration['seconds'] }}
    small.unit s
span(v-else)
  | -
</template>

<script>
export default {
  name: 'DurationComponent',
  data() {
    return {
      duration: null
    }
  },
  props: {
    startTime: null,
    endTime: null
  },
  mounted() {
    const date = new Date()
    const endTime = this.endTime > 0 ? this.endTime : date.getTime()
    this.duration = secondsToHms((endTime - this.startTime) / 1000)
  }
}

function secondsToHms(dt) {
  dt = Number.parseFloat(dt);

  const days = (dt / (3600 * 24)).toFixed(1)
  const hours = (dt / 3600).toFixed(1)
  const minutes = (dt / 60).toFixed(1)
  const seconds = Math.round(dt)

  return { days, hours, minutes, seconds }
}
</script>

<style lang="scss" scoped>

</style>