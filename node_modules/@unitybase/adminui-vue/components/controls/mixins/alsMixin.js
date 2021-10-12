/**
 * Mixin provides the following functionality:
 * methods:
 *   $_isReadOnlyByALS - check that exist rule for disable field update
 *   $_isRequiredByALS - check that exist rule to make field mandatory/required
 * To make this mixin work use it on form as:
 * const alsMixin = require('@adminui-vue/components/controls/mixins/alsMixin')
 * mixins: [alsMixin]
 */
module.exports = {
  methods: {
    $_isReadOnlyByALS (attributeName) {
      if (this.$store.state.alsInfo) {
        if (this.$store.state.alsInfo[attributeName]) {
          return this.$store.state.alsInfo[attributeName].indexOf('U') === -1 // if exist als rule check for possible update
        } else return !!Object.keys(this.$store.state.alsInfo).length // if exist any als rule
      } else return false // if not exist als mixin
    },

    $_isRequiredByALS (attributeName) {
      if (this.$store.state.alsInfo && this.$store.state.alsInfo[attributeName]) {
        return this.$store.state.alsInfo[attributeName].indexOf('M') > -1
      } else return false
    }
  }
}
