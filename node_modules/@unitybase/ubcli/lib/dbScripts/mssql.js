/**
 * Create SQl Server database & objects for a UnityBase ORM
 * @module cmd/initDB/mssql
 */

const path = require('path')
const fs = require('fs')
const format = require('@unitybase/base').format

/**
 * Check database already exists
 * @param {DBConnection} dbConn
 * @param {Object} databaseConfig A database configuration
 * @return {boolean}
 */
module.exports.databaseExists = function databaseExists (dbConn, databaseConfig) {
  const checkDB = dbConn.selectParsedAsObject(`select DB_ID (N'${databaseConfig.databaseName}') as DBID`)
  return (checkDB.length > 0) && (!!checkDB[0].DBID)
}

/**
 * Drop a specified schema & role (databaseName)
 * @param {DBConnection} dbConn
 * @param {Object} databaseConfig A database configuration
 */
module.exports.dropDatabase = function dropDatabase (dbConn, databaseConfig) {
  dbConn.execParsed('USE master') // This required for ODBC connection - it does not use 'database' attribute in configuration file
  dbConn.commit() // DROP DATABASE statement cannot be used inside a user transaction
  dbConn.execParsed(`DROP DATABASE ${databaseConfig.databaseName}`)
}

/**
 * Split multi-statement onto single statement and execute it
 * @param {string} stmts
 * @param {DBConnection} targetConn
 */
function splitAndExec (stmts, targetConn) {
  const delimRe = /\r\n/.test(stmts) ? 'GO\r\n' : 'GO\n' // git can remove \r\n
  const statements = stmts.split(delimRe)
  statements.forEach(function (statement) {
    if (statement && (statement !== 'GO')) {
      targetConn.execParsed(statement)
      targetConn.commit()
    }
  })
}
/**
 * Drop a specified schema & role (databaseName) with a pwd
 * @param {DBConnection} dbConn
 * @param {Object} databaseConfig A database configuration
 */
module.exports.createDatabase = function createDatabase (dbConn, databaseConfig) {
  let script = fs.readFileSync(path.join(__dirname, 'mssqlCreateDatabase.sql'), 'utf8')
  script = format(script, databaseConfig.databaseName, databaseConfig.userID, databaseConfig.password)
  splitAndExec(script, dbConn)

  script = fs.readFileSync(path.join(__dirname, 'mssqlCreateLogin.sql'), 'utf8')
  script = format(script, databaseConfig.databaseName, databaseConfig.userID, databaseConfig.password)
  splitAndExec(script, dbConn)
}

/**
 * Create a minimally required  functions & tables for a first sign-in
 * @param {DBConnection} targetConn
 * @param {Number} clientNum A number of client we create database for
 * @param {Object} databaseConfig A database configuration
 */
module.exports.createMinSchema = function createMinSchema (targetConn, clientNum, databaseConfig) {
  const sequences = [
    `CREATE SEQUENCE dbo.SEQ_UBMAIN AS bigint START WITH ${clientNum}0000000000 INCREMENT BY 1 MINVALUE ${clientNum}0000000000 MAXVALUE ${clientNum}4999999999 NO CACHE`,
    'GO',
    `CREATE SEQUENCE dbo.SEQ_UBMAIN_BY1 AS bigint START WITH ${clientNum}500000000000 INCREMENT BY 1 MINVALUE ${clientNum}500000000000 MAXVALUE ${clientNum}999999999999 NO CACHE`
  ].join('\r\n')

  splitAndExec(sequences, targetConn)

  let script = fs.readFileSync(path.join(__dirname, 'mssqlObjects.sql'), 'utf8')
  splitAndExec(script, targetConn)

  script = fs.readFileSync(path.join(__dirname, 'mssqlTables.sql'), 'utf8')
  splitAndExec(script, targetConn)
}
