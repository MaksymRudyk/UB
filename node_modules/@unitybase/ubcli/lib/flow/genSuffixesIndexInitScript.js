/**
 * Create a SUFFIXES index initialization script
 *
 * Usage from a command line:

 ub ./node_modules/@unitybase/ubcli/lib/flow/genSuffixesIndexInitScript.js -?

 * @author pavel.mash 2020-10-19
 */
const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const mustache = require('mustache')
const options = require('@unitybase/base').options
const argv = require('@unitybase/base').argv

module.exports = function generateDDL (cfg) {
  if (!cfg) {
    const opts = options.describe('genSuffixesIndexInitScript',
      'Create a SUFFIXES index initialization script (to be executed manually)',
      'ubcli'
    )
      .add({ short: 'host', long: 'host', param: 'fullServerURL', defaultValue: 'auto', searchInEnv: true, help: 'Full server URL. If not passed - will try to read host from ubConfig' })
      .add({ short: 'cfg', long: 'cfg', param: 'localServerConfig', defaultValue: 'ubConfig.json', searchInEnv: true, help: 'Path to UB server config' })
      .add({ short: 'm', long: 'models', param: 'modelsList', defaultValue: '*', help: 'Comma separated model names for DDL generation. If -e specified this options is ignored' })
      .add({ short: 'e', long: 'entities', param: 'entitiesList', defaultValue: '*', help: 'Comma separated entity names list for DDL generation' })

    cfg = opts.parseVerbose({}, true)
    if (!cfg) return
  }
  if (!process.rootOTP) throw new Error('This version of @unitybase/ubcli require version of UB server to be >= 5.7.3')

  cfg.forceStartServer = true
  cfg.user = 'root'
  const session = argv.establishConnectionFromCmdLineAttributes(cfg)
  const conn = session.connection
  try {
    runSuffixIndexGeneration(conn, cfg.entities, cfg.models)
  } finally {
    session.logout()
  }
}

/**
 *  @param {SyncConnection} conn
 *  @param {String} inEntities
 *  @param {String} inModelsCSV
 *  @private
 */
function runSuffixIndexGeneration (conn, inEntities, inModelsCSV) {
  let entityNames = []
  let inModels = []

  const domain = conn.getDomainInfo(true)
  if (!inEntities && !inModelsCSV) {
    entityNames = Object.keys(domain.entities)
  } else {
    if (inEntities) { // add passed entityNames
      entityNames = inEntities.split(',')
    }
    if (inModelsCSV) { // add all entityNames from passed inModels
      inModels = inModelsCSV.split(',')
      domain.eachEntity((entity, entityName) => {
        if (inModels.indexOf(entity.modelName) !== -1) {
          entityNames.push(entityName)
        }
      })
    }
  }
  entityNames = _.uniq(entityNames)
  const toBe = []
  let dialect = ''
  entityNames.forEach((eName) => {
    const e = domain.get(eName)
    dialect = e.connectionConfig.dialect
    _.forEach(e.dbExtensions, (def, idxTblName) => {
      if (def.type === 'SUFFIXES') {
        toBe.push({
          CAPTION: `${e.name}.${def.attribute} -> ${idxTblName}`,
          ATTR_SIZE: e.attr(def.attribute).size,
          SPLIT_CHARS: def.splitChars,
          SUFFIXES_TABLE: idxTblName,
          MAIN_TABLE: e.mapping && e.mapping.selectName ? e.mapping.selectName : e.name,
          MAIN_TABLE_ATTR: def.attribute
        })
      }
    })
  })
  if (!toBe.length) {
    console.log('SUFFIXES indexes not fund in domain')
    return
  }
  if (dialect.startsWith('MSSQL')) dialect = 'MSSQL'
  const tpl = fs.readFileSync(path.join(__dirname, '..', 'templates', `${dialect}_SUFFIXES_init.mustache`), 'utf8')
  toBe.forEach(item => {
    const res = mustache.render(tpl, item)
    console.log(res)
  })
}
