<template>
  <filter-template
    :button-disabled="isEmpty"
    @submit="$emit('search', {
      whereList: [{ condition, value }],
      description: $ut(condition) + ' ' + value
    })"
  >
    <el-input v-model="value" />
  </filter-template>
</template>

<script>
export default {
  name: 'FilterStringContains',

  components: {
    FilterTemplate: require('../../components/FilterTemplate.vue').default
  },

  data () {
    return {
      value: '',
      condition: 'contains'
    }
  },

  computed: {
    isEmpty () {
      return this.value === '' || this.value === null
    }
  }
}
</script>
