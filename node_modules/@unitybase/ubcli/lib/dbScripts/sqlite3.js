/**
 * Create SQLite3 database & database objects for a UnityBase ORM
 * @module cmd/initDB/sqlite3
 */

const fs = require('fs')
const path = require('path')

/**
 * Check database already exists
 * @param {DBConnection} dbConn
 * @param {Object} databaseConfig A database configuration
 * @return {boolean}
 */
module.exports.databaseExists = function databaseExists (dbConn, databaseConfig) {
  const dbPath = path.join(process.configPath, databaseConfig.databaseName)
  return fs.existsSync(dbPath)
}

/**
 * Drop a specified schema & role (databaseName)
 * @param {DBConnection} dbConn
 * @param {Object} targetDBConfig A database configuration
 */
module.exports.dropDatabase = function dropDatabase (dbConn, targetDBConfig) {
  const dbPath = path.join(process.configPath, targetDBConfig.databaseName)
  console.debug('Start dropping a database %s ..', dbPath)
  if (!fs.unlinkSync(dbPath)) {
    throw new Error('Can not delete SQLite3 database file ' + dbPath + ' May be database in use?')
  }
  // drop WALs if any. Can appear after unsuccessfully termination on prev. UB session
  if (fs.existsSync(dbPath + '-wal')) {
    if (!fs.unlinkSync(dbPath + '-wal')) {
      throw new Error('Can not delete SQLite3 WAL file ' + dbPath + '-wal May be database in use?')
    }
  }
  if (fs.existsSync(dbPath + '-shm')) {
    if (!fs.unlinkSync(dbPath + '-shm')) {
      throw new Error('Can not delete SQLite3 SHM file ' + dbPath + '-shm May be database in use?')
    }
  }
  console.debug('Database dropped')
}

/**
 * Drop a specified schema & role (databaseName) with a pwd
 * @param {DBConnection} dbConn
 * @param {Object} targetDBConfig A database configuration
 */
module.exports.createDatabase = function createDatabase (dbConn, targetDBConfig) {
  // SQLite3 database are created automatically during connection open
}

/**
 * Split multi-statement onto single statement and execute it
 * @param {string} stmts
 * @param {DBConnection} targetConn
 */
function splitAndExec (stmts, targetConn) {
  // git can replace \r\n by \n on windows
  const delimRe = /\r\n/.test(stmts) ? '--next\r\n' : '--next\n'
  const statements = stmts.split(delimRe)
  statements.forEach(function (statement) {
    if (statement) {
      targetConn.execParsed(statement, [])
    }
  })
}
/**
 * Create a minimally required  functions & tables for a first sign-in
 * @param {DBConnection} targetConn
 * @param {Number} clientNum A number of client we create database for
 * @param {Object} databaseConfig A database configuration
 */
module.exports.createMinSchema = function createMinSchema (targetConn, clientNum, databaseConfig) {
  let script

  script = 'create table seq_ubmain (client_num INTEGER) /* generateID = clientNum+currentTimeUnixEpoch*100 + 1...99 */'
  splitAndExec(script, targetConn)
  // set a initial ID value
  script = `insert into seq_ubmain (client_num) values(${clientNum}0000000000)`
  splitAndExec(script, targetConn)

  // TODO put clientNum to a table for a ID generator initialization
  script = fs.readFileSync(path.join(__dirname, 'sqlite3Tables.sql'), 'utf8')
  splitAndExec(script, targetConn)
}
