<template>
  <filter-template
    :button-disabled="value === null"
    @submit="$emit('search', {
      whereList: [{ condition, value }],
      description: $ut(condition) + ' ' + formattedValue
    })"
  >
    <u-select-enum
      v-model="value"
      :e-group="eGroup"
    />
  </filter-template>
</template>

<script>
export default {
  name: 'FilterEnumNotEqual',

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
      condition: 'notEqual'
    }
  },

  computed: {
    eGroup () {
      return this.column.attribute.enumGroup
    },

    formattedValue () {
      return this.$lookups.get('ubm_enum', {
        eGroup: this.eGroup,
        code: this.value
      })
    }
  }
}
</script>
