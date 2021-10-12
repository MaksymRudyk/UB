<template>
  <filter-template
    :button-disabled="value.length === 0"
    @submit="$emit('search', {
      whereList: [{condition: 'notIn', value}],
      description: $ut('notContains') + ' ' + manyOptions
    })"
  >
    <u-select-multiple
      ref="selectMany"
      v-model="value"
      value-attribute="code"
      :repository="repository"
    />
  </filter-template>
</template>

<script>
export default {
  name: 'FilterEnumNotContains',

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
  },

  methods: {
    repository () {
      return this.$UB.Repository('ubm_enum')
        .attrs('code', 'name', 'eGroup')
        .where('eGroup', '=', this.column.attribute.enumGroup)
    }
  }
}
</script>
