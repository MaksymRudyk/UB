module.exports = {
  beforeGenerateDDL
}

/**
 * before generate DDL hook example
 * @param {SyncConnection} conn
 * @param {Object<string, DBConnection>} dbConnections
 * @param {Object} dbVersions
 * @param {{hooks: Array<{model: string, hook: Object<string, function>}>, files: Array<{model: string, name: string, fullPath: string, sha: string}>}} migrations
 */
function beforeGenerateDDL ({ conn, dbConnections, dbVersions, migrations }) {

}
