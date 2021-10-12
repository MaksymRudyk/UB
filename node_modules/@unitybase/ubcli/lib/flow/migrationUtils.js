module.exports = {
  updateVersionsInDB,
  normalizeVersion
}

const path = require('path')
const fs = require('fs')
const base = require('@unitybase/base')
const argv = base.argv

/**
 * Update content of ub_version table
 * @param {SyncConnection} conn
 * @param {Array<object>} modelsToMigrate
 * @paran {Object} currentDBState
 * @param {Object} [currentDBState.dbVersionIDs]
 * @param {Object} [currentDBState.dbVersions]
 */
function updateVersionsInDB (conn, modelsToMigrate, currentDBState) {
  const dbVersionIDs = currentDBState.dbVersionIDs || []
  const dbVersions = currentDBState.dbVersions || {}
  const now = new Date()
  const insOrUpdateVersion = function (m) {
    const upToDateVersion = normalizeVersion(m.version)
    if (!dbVersionIDs[m.name]) {
      conn.insert({
        entity: 'ub_version',
        method: 'insert',
        execParams: {
          modelName: m.name,
          version: upToDateVersion
        }
      })
    } else if (dbVersions[m.name] !== upToDateVersion) {
      conn.update({
        entity: 'ub_version',
        method: 'update',
        execParams: {
          ID: dbVersionIDs[m.name],
          version: upToDateVersion,
          appliedAt: now
        }
      })
    }
  }
  // update ub_version
  modelsToMigrate.forEach(m => {
    insOrUpdateVersion(m)
  })
  // update app version
  const appPackagePath = path.join(path.dirname(fs.realpathSync(argv.getConfigFileName())), 'package.json')
  const appPkg = require(appPackagePath)
  insOrUpdateVersion({
    name: 'APPLICATION',
    version: appPkg.version
  })
}

/**
 * 2.13.1 = '002013001'; !v = '000000000'
 * @param v
 */
function normalizeVersion (v) {
  if (!v) return '000000000'
  const vn = v.split('.').concat(['0', '0', '0']).slice(0, 3).map(vp => parseInt(vp, 10)).reduce((acum, v) => acum * 1000 + v)
  return ('' + vn).padStart(9, '0')
}
