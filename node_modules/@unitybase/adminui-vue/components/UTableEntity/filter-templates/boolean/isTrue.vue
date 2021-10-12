<template>
  <filter-template
    @submit="$emit('search', {
      whereList: [{ condition: 'equal', value: true }],
      description: $ut('equal') + ' ' + $ut('Yes')
    })"
  />
</template>

<script>
export default {
  name: 'FilterBooleanIsTrue',

  components: {
    FilterTemplate: require('../../components/FilterTemplate.vue').default
  }
}
</script>
