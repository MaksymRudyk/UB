## Usage

See also [el-date-picker](https://element.eleme.io/#/en-US/component/date-picker) for more examples

```vue
<template>
  <div>
    <u-grid label-position="top">
      <u-form-row label="Date"> <u-date-picker v-model="vDate" /> </u-form-row>
      <u-form-row label="Date time"> <u-date-picker v-model="vDateTime" type="datetime"/> </u-form-row>
      <u-form-row label="Dates range"> <u-date-picker v-model="vDateRange" type="daterange"/> </u-form-row>
      <u-form-row label="Date time range + custom shortcuts">
        <u-date-picker v-model="vDateRange" type="datetimerange" :picker-options="getPickerOptions()"/>
      </u-form-row>
      <u-form-row label="Month range"> <u-date-picker v-model="vDateRange" type="monthrange"/> </u-form-row>
    </u-grid>
    <p>Shortcuts: </p>
    <u-grid row-gap="20px">
      
    </u-grid>
    <p> Current data is: {{ JSON.stringify($data) }}</p>
  </div>
</template>
<script>
  export default {
    data () {
      return {
        vDate: null,
        vDateTime: null,
        vDateRange: []
      }
    },
    methods: {
      getPickerOptions () {
        return {
          /**
           * Disable all dates before today
           * @param  {Date} time
           * @return {Boolean}
           */
          disabledDate: time => {
            return time.getTime() < Date.now() - (24 * 60 * 60 * 1000) // 24 hours before now
          },
          shortcuts: [{
            text: this.$ut('lastQuarter'),
            onClick (picker) {
              const end = new Date()
              const start = new Date()
              start.setMonth(start.getMonth() - 3)
              picker.$emit('pick', [start, end])
            }
          }, {
            text: this.$ut('last6Month'),
            onClick (picker) {
              const end = new Date()
              const start = new Date()
              start.setMonth(start.getMonth() - 6)
              picker.$emit('pick', [start, end])
            }
          }]
        }
      }
    }
  }
</script>
```