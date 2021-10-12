<template>
  <filter-template
    :button-disabled="isEmpty"
    @submit="$emit('search', {
      whereList: [{ condition, value }],
      description: $ut(condition) + ' ' + value
    })"
  >
    <u-base-input
      v-model="value"
      type="number"
    />
  </filter-template>
</template>

<script>
export default {
  name: 'FilterNumberEqual',

  components: {
    FilterTemplate: require('../../components/FilterTemplate.vue').default
  },

  data () {
    return {
      value: null,
      condition: 'equal'
    }
  },

  computed: {
    isEmpty () {
      return this.value === '' || this.value === null
    }
  }
}
</script>
