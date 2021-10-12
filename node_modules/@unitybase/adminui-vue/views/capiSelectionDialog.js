const Vue = require('vue')
const CapiSelection = require('./CapiSelection.vue').default
const CapiSelectionClass = Vue.extend(CapiSelection)

module.exports = capiSelectionDialog

/**
 *
 * @param {AsyncConnection} conn
 * @return {Promise<string>}
 */
function capiSelectionDialog (conn) {
  return new Promise((resolve, reject) => {
    const instance = new CapiSelectionClass({ // options
      availableCAPI: conn.appConfig.availableEncryptions,
      resolver: { resolve, reject }
    })
    instance.$mount().visible = true
  })
}
