<template>
  <filter-template
    :button-disabled="value === null"
    @submit="$emit('search', {
      whereList: [{ condition, value }],
      description: $ut(condition) + ' ' + formattedValue
    })"
  >
    <u-select-entity
      v-model="value"
      remove-default-actions
      :entity-name="column.attribute.associatedEntity"
      @input="onChange"
    />
  </filter-template>
</template>

<script>
export default {
  name: 'FilterEntityNotEqual',

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
      value: null,
      condition: 'notEqual',
      formattedValue: ''
    }
  },

  methods: {
    onChange (ID, row) {
      let value = row.ID
      const entity = this.column.attribute.associatedEntity
      const entitySchema = entity ? this.$UB.connection.domain.get(entity) : {}
      const descriptionAttr = entitySchema.descriptionAttribute
      if (descriptionAttr && descriptionAttr in row) {
        value = row[descriptionAttr]
      } else if ('caption' in row) {
        value = row.caption
      } else if ('name' in row) {
        this.formattedValue = row.name
      }

      this.formattedValue = value
    }
  }
}
</script>
