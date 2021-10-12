<template>
  <filter-template
    @submit="$emit('search', {
      whereList: [{ condition: 'isNull' }],
      description: 'isNull'
    })"
  />
</template>

<script>
export default {
  name: 'FilterDateIsNull',

  components: {
    FilterTemplate: require('../../components/FilterTemplate.vue').default
  }
}
</script>
