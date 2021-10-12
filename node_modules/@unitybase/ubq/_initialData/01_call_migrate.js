const path = require('path')
const ubMigrate = require('@unitybase/ub-migrate')

/**
 * @param {ServerSession} session
 */
module.exports = function (session) {
  ubMigrate.migrateDir(session, path.join(__dirname, '..', '_data'))
}
