<template>
  <el-date-picker
    class="u-date-picker"
    :type="type"
    :class="pickerClass"
    :value="value"
    :format="dateFormat"
    :picker-options="mergedPickerOptions"
    :start-placeholder="$ut('el').datepicker.startDate"
    :end-placeholder="$ut('el').datepicker.endDate"
    unlink-panels
    v-bind="$attrs"
    v-on="$listeners"
  />
</template>

<script>
const UB = require('@unitybase/ub-pub')
/**
 * Date, DateTime, Date range or DateTime range picker.
 *
 * Localized to current user locale, including date format and first day of week.
 *
 */
export default {
  name: 'UDatePicker',

  props: {
    value: {},

    format: String,

    /**
     * Picker type
     * @values date, datetime, daterange, datetimerange, monthrange
     */
    type: {
      type: String,
      default: 'date'
    },

    pickerOptions: {
      type: Object,
      default: () => ({})
    }
  },

  computed: {
    mergedPickerOptions () {
      const defPickerOptions = {}
      if (!this.pickerOptions.shortcuts) {
        if (this.type === 'daterange') {
          defPickerOptions.shortcuts = [{
            text: this.$ut('today'),
            onClick (picker) {
              const d = UB.truncTimeToUtcNull(new Date())
              const d1 = new Date(d.getTime() + 24 * 60 * 60 * 1000)
              picker.$emit('pick', [d, d1])
            }
          }, {
            text: this.$ut('yesterday'),
            onClick (picker) {
              const y = UB.truncTimeToUtcNull(new Date())
              y.setDate(y.getDate() - 1)
              const y1 = new Date(y.getTime() + 24 * 60 * 60 * 1000) // time is already truncated
              picker.$emit('pick', [y, y1])
            }
          }, {
            text: this.$ut('this_month'),
            onClick (picker) {
              const start = new Date()
              start.setDate(1)
              const end = new Date()
              picker.$emit('pick', [UB.truncTimeToUtcNull(start), UB.truncTimeToUtcNull(end)])
            }
          }]
        } else if (this.type === 'date') {
          defPickerOptions.shortcuts = [{
            text: this.$ut('el.datepicker.today'),
            onClick (picker) {
              picker.$emit('pick', UB.truncTimeToUtcNull(new Date()))
            }
          }, {
            text: this.$ut('yesterday'),
            onClick (picker) {
              const y = new Date()
              y.setDate(y.getDate() - 1)
              picker.$emit('pick', UB.truncTimeToUtcNull(y))
            }
          }]
        }
      }

      return {
        firstDayOfWeek: this.$ut('el.datepicker.format.firstDayOfWeek'),
        ...defPickerOptions,
        ...this.pickerOptions
      }
    },

    dateFormat () {
      if (this.format) {
        return this.format
      }

      return this.$ut('el').datepicker.format[this.type] || ''
    },

    pickerClass () {
      return 'u-date-picker__' + this.type
    }
  }
}
</script>

<style>

.u-date-picker__date {
  width: 150px !important;
}

.u-date-picker.el-date-editor.el-input {
  width: unset;
  max-width: 220px;
  min-width: 140px;
}

</style>
