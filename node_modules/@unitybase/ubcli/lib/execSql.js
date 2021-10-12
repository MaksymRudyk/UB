/**
 * Execute an SQL script in specified connection.
 * Statements in script can be delimited using a line what contains only one of:
 *   - `--`
 *   - `/`
 *   - `GO`
 * Each statement is executed in own transaction.
 *
 * If --optimistic (-o) option is passed each statement are wrapped in try/finally block and script execution will continue even after error in individual statement
 *
 * Exceptions in statements what contains `--@optimistic` string is forced to be optimistic.
 *
 * SQL script can be a [lodash template](https://lodash.com/docs/4.17.15#template). In this case it preparsed using
 * `options = {conn: connectionConfig, cfg: execSqlOptionsObject}`
 *
 * Template example:

  <% if (conn.dialect.startsWith('MSSQL')) { %>
  SQL server specific statement
  <% } else { %>
  non SQL server statement
  <% } %>
  --
  one more statement for any DBMS;
  --

 * Usage from a command line:

 ubcli execSsq -?
 ubcli execSql -c connectionName -f path/to/script.sql -o
 // run a statement and output colored beautified result
 ubcli execSql -sql 'select * from uba_user' -withResult -noLogo | sed -n "/--BEGIN/,/--END/p" | tail -n +2 | head -n -2 | jq -r .

 * Usage from a code
 * @example

 const execSql = require('@unitybase/ubcli/lib/execSql')
 let options = {
      connection: 'main',
      file: './myScript.sql',
      optimistic: true,
      progress: false
  }
 execSql(options)

 // exec SQL script in default connection
 options = {
      sql: `BEGIN
      import_users.do_import;
      END;
      /
      delete from myTable where code = 'oldCode';`
  }
 execSql(options)

 * @module execSql
 * @memberOf module:@unitybase/ubcli
 */

const options = require('@unitybase/base').options
const argv = require('@unitybase/base').argv
const fs = require('fs')
const _ = require('lodash')
const createDBConnectionPool = require('@unitybase/base').createDBConnectionPool

module.exports = execSql

/**
 * @param {Object} cfg
 * @param {string} [cfg.connection]        Connection name. If empty - uses default connection
 * @param {string} [cfg.file]              Path to a script for execution. Either file or sql should be specified
 * @param {string} [cfg.sql]               Text of SQL script for execution. Either file or sql should be specified
 * @param {Boolean} [cfg.optimistic=false] Wrap each statement in try/catch block. Continue execution on exceptions
 * @param {Boolean} [cfg.progress=false]   Output execution time for each command into console
 * @param {Boolean} [cfg.withResult=false] If `true` execSql expect last statement in batch to be a statement what
 *                                         returns a result, exec it using runSQL and returns a result as JSON
 * @param {Boolean} [cfg.outputRes=false] If `withResult` is true - output last statement result to stdout
 */
function execSql (cfg) {
  if (!cfg) {
    const opts = options.describe('execSql',
      'Execute an SQL script in specified connection.\nEach statement executed in its own transaction', 'ubcli')
      .add([
        { short: 'c', long: 'connection', param: 'connectionName', defaultValue: '', searchInEnv: true, help: 'Connection name. If empty - uses default connection' },
        { short: 'f', long: 'file', param: '/path/to/script.sql', defaultValue: '', searchInEnv: false, help: 'Path to a script for execution. Either -f or -sql should be specified' },
        { short: 'sql', long: 'sql', param: 'sql text for execution', defaultValue: '', searchInEnv: false, help: 'text of SQL script for execution. Either -f or -sql should be specified' }
      ])
      .add({
        short: 'o',
        long: 'optimistic',
        defaultValue: false,
        searchInEnv: false,
        help: 'Wrap each statement in try/catch block\n\t\tContinue execution on exceptions'
      })
      .add({
        short: 'p',
        long: 'progress',
        defaultValue: false,
        searchInEnv: true,
        help: 'Output execution time for each command into console'
      })
      .add({
        short: 'withResult',
        long: 'withResult',
        defaultValue: false,
        searchInEnv: false,
        help: 'If `true` execSql expect last statement in batch to be a statement what returns a result, exec it using runSQL and returns a result as JSON'
      })
      .add({
        short: 'outputRes',
        long: 'outputRes',
        defaultValue: true,
        searchInEnv: false,
        help: ' If `withResult` is true - output last statement result to stdout'
      })
      .add({ short: 'v', long: 'verbose', defaultValue: false, help: 'Verbose mode' })
    cfg = opts.parseVerbose({}, true)
  }
  if (!cfg) return
  const config = argv.getServerConfiguration(true)

  let connCfg
  if (cfg.connection) {
    connCfg = config.application.connections.find(c => c.name === cfg.connection)
    if (!connCfg) throw new Error(`Database connection with name '@${cfg.connection}' not found in application.connections`)
  } else {
    connCfg = config.application.connections.find(c => c.isDefault === true)
    if (!connCfg) throw new Error('Connection with isDefault=true not found in application.connections')
  }

  const dbConnections = createDBConnectionPool(config.application.connections)

  let scriptTpl
  if (cfg.file) {
    scriptTpl = fs.readFileSync(cfg.file, { encoding: 'utf8' })
  } else if (cfg.sql) {
    scriptTpl = cfg.sql
  } else {
    throw new Error('Either file or sql MUST be specified')
  }

  scriptTpl = scriptTpl.replace(/\r\n/g, '\n')
  let script
  if (scriptTpl.indexOf('<%') >= 0) { // contains a template
    const compiledTpl = _.template(scriptTpl)
    script = compiledTpl({
      conn: connCfg,
      cfg
    })
  } else {
    script = scriptTpl
  }

  const dbConn = dbConnections[connCfg.name]
  const stmts = script.split(/^[ \t]*--[ \t]*$|^[ \t]*GO[ \t]*$|^[ \t]*\/[ \t]*$/gm).filter(s => s.trim() !== '')
  const execLogIdent = cfg.file ? cfg.file : script.slice(0, 30) + '...'
  console.log(`Executing '${execLogIdent}' script of ${stmts.length} statements in connection '${connCfg.name}'...`)
  const totalT = Date.now()
  let invalidStmtCnt = 0
  let successStmtCnt = 0
  let ignoreErr = false
  const lastIdx = stmts.length - 1
  let lastStatementResult = ''
  stmts.forEach((stmt, n) => {
    try {
      const d = Date.now()
      ignoreErr = stmt.indexOf('--@optimistic') > -1
      if (cfg.verbose) {
        console.log(stmt)
      }
      if (cfg.withResult && (n === lastIdx)) {
        lastStatementResult = dbConn.runParsed(stmt)
      } else {
        dbConn.execParsed(stmt)
        dbConn.commit()
      }
      if (cfg.progress) {
        console.log(`#${n + 1}: ${Date.now() - d}ms`)
      }
      successStmtCnt++
    } catch (e) {
      invalidStmtCnt++
      // explicitly rollback to prevent `current transaction is aborted` errors for subsequent queries on Postgres
      dbConn.rollback()
      if (!cfg.optimistic && !ignoreErr) {
        throw e
      } else {
        console.log("Exception in statement is mutes because of 'optimistic' mode")
      }
    }
  })
  if (invalidStmtCnt > 0) {
    console.warn(`Script completed in ${Date.now() - totalT}ms. ${successStmtCnt} statement success and ${invalidStmtCnt} statements with exceptions (ignored in optimistic mode)`)
  } else {
    console.info(`Successfully completed in ${Date.now() - totalT}ms`)
  }
  if (cfg.withResult && cfg.outputRes) {
    console.log('--BEGIN STATEMENT RESULT--')
    console.log(lastStatementResult)
    console.log('--END STATEMENT RESULT--')
  }
  return lastStatementResult
}


module.exports.shortDoc = 'Execute an SQL script in specified connection'
