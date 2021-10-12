<template>
  <filter-template
    :button-disabled="value.length === 0"
    @submit="$emit('search', {
      whereList: [{condition: 'in', value}],
      description: $ut('contains') + ' ' + manyOptions
    })"
  >
    <u-select-multiple
      ref="selectMany"
      v-model="value"
      :entity-name="column.attribute.associatedEntity"
    />
  </filter-template>
</template>

<script>
export default {
  name: 'FilterEntityContains',

  components: {
    FilterTemplate: require('../../components/FilterTemplate.vue').default
  },

  props: {
    column: {
      type: Object,
      required: true
    }
  },

  data () {
    return {
      value: []
    }
  },

  computed: {
    manyOptions () {
      const selectMany = this.$refs.selectMany
      if (selectMany) {
        return selectMany.displayedOptions
          .map(o => o.label)
          .join(', ')
      } else {
        return []
      }
    }
  }
}
</script>
