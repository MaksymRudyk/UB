<template>
  <filter-template
    :button-disabled="value === null"
    @submit="$emit('search', {
      whereList: [
        { condition: 'moreEqual', value },
        { condition: 'less', value: addDay(value) }
      ],
      description: $ut('date') + ' ' + $moment(value).format('ll')
    })"
  >
    <u-date-picker
      v-model="value"
      :placeholder="$ut('table.filter.date.valuePlaceholder')"
      type="date"
    />
  </filter-template>
</template>

<script>
export default {
  name: 'FilterDateOnDate',

  components: {
    FilterTemplate: require('../../components/FilterTemplate.vue').default
  },

  data () {
    return {
      value: null
    }
  },

  methods: {
    addDay (date) {
      const moment = this.$moment(date)
      moment.add(1, 'day')
      return moment.toDate()
    }
  }
}
</script>
