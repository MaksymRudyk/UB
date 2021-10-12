/**
 * Compare database structure with application domain and generate SQL script for create missing objects and alter modified objects.
 * Can optionally execute generated SQL scripts (for local server only).
 *
 * **WARNING: do not run this command on production database in automatic mode - always review SQL script manually before run**
 *
 * Usage from a command line:

    ubcli generateDDL -?

 * Usage from code:

     const DDLGenerator = require('@unitybase/ubcli/generateDDL')
     var options = {
          host: 'http://localhost:888',
          user: "admin",
          pwd:  "admin",
          out:  process.cwd(),
          autorun: true,
          optimistic: false
     }
     DDLGenerator(options)

 * @author pavel.mash
 * @module generateDDL
 * @memberOf module:@unitybase/ubcli
 */
const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const http = require('http')
const base = require('@unitybase/base')
const options = base.options
const argv = base.argv
const execSql = require('./execSql')
const CRLF = '\n'

module.exports = function generateDDL (cfg) {
  if (!cfg) {
    const opts = options.describe('generateDDL',
      'Check database structure for application domain. Generate DDL (both create and alter) if need and optionally run it\nShould be executed from application folder',
      'ubcli'
    )
      .add({ short: 'host', long: 'host', param: 'fullServerURL', defaultValue: 'auto', searchInEnv: true, help: 'Full server URL. If not passed - will try to read host from ubConfig' })
      .add({ short: 'cfg', long: 'cfg', param: 'localServerConfig', defaultValue: 'ubConfig.json', searchInEnv: true, help: 'Path to UB server config' })
      .add({ short: 'm', long: 'models', param: 'modelsList', defaultValue: '*', help: 'Comma separated model names for DDL generation. If -e specified this options is ignored' })
      .add({ short: 'e', long: 'entities', param: 'entitiesList', defaultValue: '*', help: 'Comma separated entity names list for DDL generation' })
      .add({ short: 'c', long: 'connection', param: 'connection', defaultValue: '', help: 'Optional connection name for DDL generation' })
      .add({ short: 'out', long: 'out', param: 'outputPath', defaultValue: process.cwd(), help: 'Folder to output generated DDLs (one file per connection)' })
      .add({ short: 'autorun', long: 'autorun', defaultValue: false, help: 'execute DDL statement after generation. BE CAREFUL! DO NOT USE ON PRODUCTION' })
      .add({ short: 'optimistic', long: 'optimistic', defaultValue: false, help: 'skip errors on execute DDL statement. BE CAREFUL! DO NOT USE ON PRODUCTION' })
    cfg = opts.parseVerbose({}, true)
    if (!cfg) return
    cfg.forceStartServer = true
    cfg.user = 'root'
  }
  if (!process.rootOTP) throw new Error('This version of @unitybase/ubcli require version of UB server to be >= 5.7.3')

  // increase receive timeout to 120s - in case DB server is slow we can easy reach 30s timeout
  let conn
  if (!cfg.syncConnection) {
    http.setGlobalConnectionDefaults({receiveTimeout: 120000})
    const session = argv.establishConnectionFromCmdLineAttributes(cfg)
    conn = session.connection
  } else {
    conn = cfg.syncConnection
  }
  runDDLGenerator(conn, cfg.autorun, cfg.entities, cfg.models, cfg.out, cfg.optimistic, cfg.connection)
}

/**
 *  @param {SyncConnection} conn
 *  @param {boolean} autorun Optional server config application section (used in `auto` mode to execute DDL statements)
 *  @param {String} inEntities
 *  @param {String} inModelsCSV
 *  @param {String} outputPath
 *  @param {String} [optimistic=false]
 *  @param {String} [connectionName]
 *  @private
 */
function runDDLGenerator (conn, autorun, inEntities, inModelsCSV, outputPath, optimistic, connectionName) {
  let txtRes
  let entityNames = []
  let inModels = []

  const domain = conn.getDomainInfo(true)
  if (!inEntities && !inModelsCSV && !connectionName) {
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
    if (connectionName) {
      domain.eachEntity((entity, entityName) => {
        if (entity.connectionConfig.name === connectionName) {
          entityNames.push(entityName)
        }
      })
    }
  }
  entityNames = _.uniq(entityNames)
  entityNames = entityNames.filter((eName) => {
    return domain.get(eName).mixin('mStorage') !== undefined
  })
  console.log(`Checking congruence of domain metadata and database structure for ${entityNames.length} entities...`)

  const Generator = require('./ddlGenerators/DDLGenerator')
  const ddlResult = new Generator().generateDDL(entityNames, conn, true)
  const dbConnNames = Object.keys(ddlResult)

  for (const connectionName of dbConnNames) {
    const fileName = path.join(outputPath, connectionName + '.sql')
    let outWarnings = ''
    if (ddlResult[connectionName].warnings.statements.length) {
      outWarnings = ddlResult[connectionName].warnings.statements.join(CRLF)
      delete ddlResult[connectionName].warnings
    }
    const nonEmptySorted = _(ddlResult[connectionName]).values().filter(res => res.statements.length > 0).sortBy('order').value()

    if (Object.keys(nonEmptySorted).length) {
      txtRes = formatAsText(connectionName, nonEmptySorted, outWarnings, domain)
    } else {
      txtRes = '' // warnings only - ignore such DDL results
    }
    if (txtRes) {
      if (outWarnings) {
        console.warn('There are warnings. Please, review script ' + fileName)
      }
      if (fs.existsSync(fileName)) {
        const bakFn = fileName + '.bak'
        if (fs.existsSync(bakFn)) fs.unlinkSync(bakFn)
        fs.renameSync(fileName, fileName + '.bak')
      }
      fs.writeFileSync(fileName, txtRes)
      console.log('DDL script is saved to ' + fileName)
      if (autorun) {
        if (base.ubVersionNum > 501815) { // execute from file
          execSql({
            connection: connectionName,
            optimistic: optimistic,
            file: fileName
          })
        } else { // for UB < 5.18.16 execute using runSQL endpoint (excSql can fail in case server is started by script)
          // TODO - remove this code in the middle of 2021
          let withErrors = false
          console.log('Run a script ' + fileName)
          // Many databases (Oracle for example) do not allow to execute several DDL statement in one call
          for (const part of nonEmptySorted) {
            for (const stmt of part.statements) {
              try {
                if (stmt) {
                  conn.xhr({ endpoint: 'runSQL', data: stmt, URLParams: { CONNECTION: connectionName } })
                }
              } catch (e) {
                if (!optimistic) {
                  throw e
                } else {
                  console.error(e)
                  withErrors = true
                }
              }
            }
          }
          console.info('Database script', fileName, 'executed', withErrors ? 'with errors!' : 'successfully')
        }
      }
    } else {
      console.log('Specified entity metadata is congruence with the database for connection ' + connectionName)
      fs.unlinkSync(fileName)
    }
  }
}

/**
 *  Format a result of runDDLGenerator as a single SQL file
 *  @param {String} connectionName
 *  @param {Object<string, object>} connDDLs See DBAbstract.DDL for content
 *  @param {string} warnings
 *  @param {UBDomain} domain
 *  @private
 */
function formatAsText (connectionName, connDDLs, warnings, domain) {
  const txtRes = []

  if (warnings) {
    txtRes.push(
      `/*${CRLF} $$$$$$$$$$$ Attantion! Achtung! Vnimanie!`,
      `${CRLF}`, warnings,
      `${CRLF} $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ ${CRLF}*/${CRLF}`
    )
  }

  for (const res of connDDLs) {
    txtRes.push(' ') // for last delimiter
    txtRes.push(
      '-- ' + res.description,
      '--######################################'
    )
    if (res.resultInSingleStatement) {
      const isOracle = domain.connections.find(c => c.name === connectionName).dialect.startsWith('Oracle')
      if (isOracle) {
        if (!res.statements[res.statements.length - 1].endsWith(';')) {
          res.statements[res.statements.length - 1] += ';'
        }
        txtRes.push('DECLARE V NUMBER(19);\nBEGIN\n' + res.statements.join(`;${CRLF}`) + '\nEND;')
      } else {
        txtRes.push(res.statements.join(`;${CRLF}`))
      }
      txtRes.push('--')
    } else {
      txtRes.push(res.statements.join(`;${CRLF}--${CRLF}`) + ';')
      txtRes.push('--')
    }
  }

  return txtRes.length
    ? `--############## start script for connection "${connectionName}" #######${CRLF}` + txtRes.join(CRLF)
    : ''
}

module.exports.shortDoc = `Compare database structure with application domain and
\t\t\tgenerate SQL script for altering DB. Can be executed
\t\t\tlocally and when the server is stopped`
