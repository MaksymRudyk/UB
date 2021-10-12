<template>
  <filter-template
    @submit="$emit('search', {
      whereList: [{ condition: 'equal', value: false }],
      description: $ut('equal') + ' ' + $ut('No')
    })"
  />
</template>

<script>
export default {
  name: 'FilterBooleanIsFalse',

  components: {
    FilterTemplate: require('../../components/FilterTemplate.vue').default
  }
}
</script>
