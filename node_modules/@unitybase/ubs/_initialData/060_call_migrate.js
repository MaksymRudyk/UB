const path = require('path')
const { migrateDir } = require('@unitybase/ub-migrate')
/**
 * @param {ServerSession} session
 */
module.exports = function (session) {
  migrateDir(session, path.join(__dirname, '../_data'))
}
