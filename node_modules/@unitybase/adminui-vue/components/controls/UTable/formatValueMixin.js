module.exports = {
  methods: {
    formatValue ({ value, column, row }) {
      if (typeof column.format === 'function') {
        return column.format({ value, column, row })
      } else {
        return value
      }
    },

    formatHead ({ column }) {
      if (typeof column.formatHead === 'function') {
        return column.formatHead({ column })
      } else {
        return this.$ut(column.label)
      }
    }
  }
}
