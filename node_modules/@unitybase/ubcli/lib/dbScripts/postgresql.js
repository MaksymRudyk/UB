/**
 * Create PostgreSQl database & database objects for a UnityBase ORM
 * @module cmd/initDB/postgreSQL
 */

const path = require('path')
const fs = require('fs')

/**
 * Check database (schema) already exists
 * @param {DBConnection} dbConn
 * @param {Object} databaseConfig A database configuration
 * @return {boolean}
 */
module.exports.databaseExists = function databaseExists (dbConn, databaseConfig) {
  const schemaExist = dbConn.selectParsedAsObject('SELECT schema_name FROM information_schema.schemata WHERE schema_name = ?', [databaseConfig.userID])
  return (schemaExist.length > 0)
}

/**
 * Drop a specified schema & role (databaseName)
 * @param {DBConnection} dbConn
 * @param {Object} databaseConfig A database configuration
 */
module.exports.dropDatabase = function dropDatabase (dbConn, databaseConfig) {
  dbConn.execParsed(
    `DROP SCHEMA IF EXISTS ${databaseConfig.userID} CASCADE; DROP USER IF EXISTS ${databaseConfig.userID};`,
    [])
}

/**
 * Drop a specified schema & role (databaseName) with a pwd
 * @param {DBConnection} dbConn
 * @param {Object} databaseConfig A database configuration
 */
module.exports.createDatabase = function createDatabase (dbConn, databaseConfig) {
  dbConn.execParsed(
    `CREATE ROLE ${databaseConfig.userID} LOGIN PASSWORD '${databaseConfig.password}' VALID UNTIL 'infinity';
    CREATE SCHEMA ${databaseConfig.userID} AUTHORIZATION ${databaseConfig.userID};`,
    [])
}

/**
 * Create a minimally required  functions & tables for a first sign-in
 * @param {DBConnection} targetConn
 * @param {Number} clientNum A number of client we create database for
 * @param {Object} databaseConfig A database configuration
 */
module.exports.createMinSchema = function createMinSchema (targetConn, clientNum, databaseConfig) {
  const sequences = `CREATE SEQUENCE SEQ_UBMAIN INCREMENT 1 MAXVALUE   ${clientNum}4999999999 START   ${clientNum}0000000000 CYCLE CACHE 1;
   CREATE SEQUENCE SEQ_UBMAIN_BY1 INCREMENT 1 MAXVALUE ${clientNum}999999999999 START ${clientNum}500000000000 CYCLE CACHE 1;`
  targetConn.execParsed(sequences, [])
  targetConn.commit()

  let script = fs.readFileSync(path.join(__dirname, 'postgresqlObjects.sql'), 'utf8')
  targetConn.execParsed(script, []);
  targetConn.commit()
  script = fs.readFileSync(path.join(__dirname, 'postgresqlTables.sql'), 'utf8')
  targetConn.execParsed(script, []);
  targetConn.commit()
}
