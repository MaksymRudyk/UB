/**
 * Create Oracle database & database objects for a UnityBase ORM
 * @module cmd/initDB/oracle
 */

const path = require('path')
const fs = require('fs')

/**
 * Check database (user name) already exists
 * @param {DBConnection} dbConn
 * @param {Object} databaseConfig A database configuration
 * @return {boolean}
 */
module.exports.databaseExists = function databaseExists (dbConn, databaseConfig) {
  const userExist = dbConn.selectParsedAsObject('SELECT COUNT(1) as CNT FROM dba_users WHERE username = ?', [databaseConfig.userID.toUpperCase()])
  return (userExist.length > 0) && (userExist[0].CNT !== 0)
}

/**
 * Drop a specified schema & role (databaseName)
 * @param {DBConnection} dbConn
 * @param {Object} databaseConfig A database configuration
 */
module.exports.dropDatabase = function dropDatabase (dbConn, databaseConfig) {
  const upperUser = databaseConfig.userID.toUpperCase()
  const activeConnections = dbConn.selectParsedAsObject('SELECT sid, serial# AS sn FROM v$session WHERE username = ?', [upperUser])
  for (let i = 0, L = activeConnections.length; i < L; i++) {
    dbConn.execParsed(`alter system kill session '${activeConnections[i].SID}, ${activeConnections[i].SN}'`)
  }
  dbConn.execParsed('DROP USER ' + upperUser + ' CASCADE')
}

/**
 * Drop a specified schema & role (databaseName) with a pwd
 * @param {DBConnection} dbConn
 * @param {Object} databaseConfig A database configuration
 * @returns {boolean} if database already exists - returns false
 */
module.exports.createDatabase = function createDatabase (dbConn, databaseConfig) {
  dbConn.execParsed(`CREATE USER ${databaseConfig.userID} IDENTIFIED BY ${databaseConfig.password} DEFAULT TABLESPACE USERS TEMPORARY TABLESPACE TEMP PROFILE DEFAULT ACCOUNT UNLOCK;`)

  const grants = [
    'GRANT RESOURCE, CONNECT, CTXAPP TO {0}',
    'ALTER USER {0} DEFAULT ROLE ALL',
    'GRANT ALTER ANY INDEX TO {0}',
    'GRANT ALTER ANY PROCEDURE TO {0}',
    'GRANT ALTER ANY SEQUENCE TO {0}',
    'GRANT ALTER ANY TABLE TO {0}',
    'GRANT ALTER ANY TRIGGER TO {0}',
    'GRANT CREATE ANY INDEX TO {0}',
    'GRANT CREATE ANY PROCEDURE TO {0}',
    'GRANT CREATE ANY SEQUENCE TO {0}',
    'GRANT CREATE ANY SYNONYM TO {0}',
    'GRANT CREATE ANY TABLE TO {0}',
    'GRANT CREATE ANY TRIGGER TO {0}',
    'GRANT CREATE DATABASE LINK TO {0}',
    'GRANT CREATE PROCEDURE TO {0}',
    'GRANT CREATE PUBLIC SYNONYM TO {0}',
    'GRANT CREATE SESSION TO {0}',
    'GRANT CREATE SYNONYM TO {0}',
    'GRANT CREATE TABLE TO {0}',
    'GRANT CREATE TRIGGER TO {0}',
    'GRANT CREATE VIEW TO {0}',
    'GRANT DEBUG ANY PROCEDURE TO {0}',
    'GRANT DEBUG CONNECT SESSION TO {0}',
    'GRANT QUERY REWRITE TO {0}',
    'GRANT SELECT ANY SEQUENCE TO {0}',
    'GRANT UNLIMITED TABLESPACE TO {0}'
  ]
  for (let i = 0, l = grants.length; i < l; i++) {
    dbConn.execParsed(grants[i].replace('{0}', databaseConfig.userID))
  }
  return true
}

/**
 * Create a minimally required  functions & tables for a first sign-in
 * @param {DBConnection} targetConn
 * @param {Number} clientNum A number of client we create database for
 * @param {Object} databaseConfig A database configuration
 */
module.exports.createMinSchema = function createMinSchema (targetConn, clientNum, databaseConfig) {
  targetConn.execParsed(`CREATE SEQUENCE SEQ_UBMAIN
    START WITH ${clientNum}0000000000 MAXVALUE ${clientNum}4999999999 MINVALUE ${clientNum}0000000000 NOCYCLE CACHE 10 ORDER`)

  targetConn.execParsed(`CREATE SEQUENCE SEQ_UBMAIN_BY1 START WITH ${clientNum}500000000000
    MAXVALUE ${clientNum}999999999999 MINVALUE ${clientNum}500000000000 NOCYCLE ORDER`)

  const createObjectSQL = fs.readFileSync(path.join(__dirname, 'oracleObjects.sql'), 'utf8')
  const delimRe = /\r\n/.test(createObjectSQL) ? '/\r\n--' : '/\n--' // git can remove \r\n
  let statements = createObjectSQL.split(delimRe)
  statements.forEach(function (statement) {
    if (statement) targetConn.execParsed(statement)
  })
  targetConn.commit()

  const initialData = fs.readFileSync(path.join(__dirname, 'oracleTables.sql'), 'utf8')
  statements = initialData.split(delimRe)
  statements.forEach(function (statement) {
    if (statement) targetConn.execParsed(statement)
  })
}
