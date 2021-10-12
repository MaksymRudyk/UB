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
  name: 'FilterManyIsNull',

  components: {
    FilterTemplate: require('../../components/FilterTemplate.vue').default
  }
}
</script>
