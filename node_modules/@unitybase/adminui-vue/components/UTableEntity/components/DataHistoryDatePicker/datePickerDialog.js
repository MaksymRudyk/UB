const Vue = require('vue')
const DataHistoryDatePicker = require('./DataHistoryDatePicker.vue').default

module.exports = function (dateFrom) {
  return new Promise(resolve => {
    new Vue({
      render: h => h(DataHistoryDatePicker, {
        props: {
          dateFrom,
          pickDate: resolve
        }
      })
    }).$mount()
  })
}
