/**
 * Create a database (schema/user) and a minimal set of DB object for a UnityBase ORM.
 * Depending of then RDBMS `-create` switch force to execute a folowing SQL statements with DBA user permissions:
 *   - Oracle: `CREATE USER ${databaseConfig.userID}` and give a permissions;
 *   - Postgres: `CREATE ROLE ${databaseConfig.userID} LOGIN PASSWORD '${databaseConfig.password}' VALID UNTIL 'infinity'; CREATE SCHEMA ${databaseConfig.userID} AUTHORIZATION ${databaseConfig.userID};`
 *   - MS SQL: `CREATE DATABASE ${databaseConfig.databaseName}; CREATE LOGIN ${databaseConfig.userID} WITH PASSWORD = N'${databaseConfig.password}`
 *
 * DBA can create a user/role/database manually, in this case `-create` parameter must be omitted.
 *
 * Usage from a command line:

     ubcli initDB -?
     ubcli initDB -u admin -p admin -dba postgres -dbaPwd postgreDBAPassword

 * Usage from a code:
 *
     const initDB = require('@unitybase/ubcli/initDB')
     let options = {
        host: 'http://localhost:888',
        user: 'admin',
        pwd: 'admin',
        clientIdentifier: 3,
        dropDatabase: true,
        createDatabase: true,
        dba: 'postgres',
        dbaPwd: 'postgreDBAPassword'
    }
    initDB(options)

 * @module initDB
 * @memberOf module:@unitybase/ubcli
 */

const options = require('@unitybase/base').options
const argv = require('@unitybase/base').argv
const UBA_COMMON = require('@unitybase/base').uba_common
const _ = require('lodash')

module.exports = initDB
/**
 * @param {Object} cfg
 * @param {Number} [cfg.clientIdentifier=3] Identifier of the client.
 *    Must be between 2 and 8999. Number 1 is for UnityBase developer, 3 for test.
 *    Numbers > 100 is for real installations
 * @param {Boolean} [cfg.dropDatabase=false] Drop a database/schema first
 * @param {Boolean} [cfg.createDatabase=false] Create a new database/schema.
 * @param {String} [cfg.dba] A DBA name. Used in case `createDatabase=true`
 * @param {String} [cfg.dbaPwd] A DBA password. Used in case `createDatabase=true`
 */
function initDB (cfg) {
  if (!cfg) {
    const opts = options.describe('initDB',
      `Prepare a new database for a UB ORM.\nCreates a UB user "${UBA_COMMON.USERS.ADMIN.NAME}" with password specified in -p parameter.\nDB create tips: https://unitybase.info/api/server-v5/module-initDB.html`, 'ubcli')
      .add([
        { short: 'p', long: 'pwd', param: 'password', searchInEnv: true, help: `Password for "${UBA_COMMON.USERS.ADMIN.NAME}"` },
        { short: 'cfg', long: 'cfg', param: 'localServerConfig', defaultValue: 'ubConfig.json', searchInEnv: true, help: 'Path to UB server config' }
      ])
      .add({
        short: 'c',
        long: 'clientIdentifier',
        param: 'clientIdentifier',
        defaultValue: 3,
        searchInEnv: false,
        help: 'Identifier of the client. Must be between 2 and 8999. \n\t\t1 is for UnityBase developer, 3 for test. \n\t\tNumbers > 100 is for real installations'
      })
      .add({
        short: 'drop',
        long: 'dropDatabase',
        param: '',
        defaultValue: false,
        searchInEnv: false,
        help: 'Drop a database/schema first'
      })
      .add({
        short: 'create',
        long: 'createDatabase',
        param: '',
        defaultValue: false,
        searchInEnv: false,
        help: 'Create a new database/schema'
      })
      .add({
        short: 'dba',
        long: 'dba',
        param: 'DBA_user_name',
        defaultValue: '',
        searchInEnv: true,
        help: 'A DBA name. Used in case `createDatabase=true`'
      })
      .add({
        short: 'dbaPwd',
        long: 'dbaPwd',
        param: 'DBA_password',
        defaultValue: '',
        searchInEnv: true,
        help: 'A DBA password. Used in case `createDatabase=true`'
      })
      .add({
        short: 'conn',
        long: 'connectionName',
        param: 'additional_connection_name',
        defaultValue: '',
        searchInEnv: false,
        help: 'Create a empty database for secondary connection with specified name'
      })
    cfg = opts.parseVerbose({}, true)
  }
  if (!cfg) return
  if (cfg.clientIdentifier > 8999) {
    throw new Error('clientIdentifier (-c parameter) must be between 1 and 8999')
  }
  const config = argv.getServerConfiguration(true)

  let mainConnCfg
  if (cfg.connectionName) {
    mainConnCfg = _.find(config.application.connections, { name: cfg.connectionName })
    if (!mainConnCfg) throw new Error(`Database connection @${cfg.connectionName} not found in application.connections`)
  } else {
    mainConnCfg = _.find(config.application.connections, { isDefault: true }) || config.application.connections[0]
  }
  const dbaConnCfg = Object.assign({}, mainConnCfg)
  // set DBA user/pwd
  dbaConnCfg.name = 'FAKE_DBA_CONN'
  dbaConnCfg.userID = cfg.dba
  dbaConnCfg.password = cfg.dbaPwd

  let dbDriverName = dbaConnCfg.driver.toLowerCase()
  if (dbDriverName.startsWith('mssql')) {
    dbDriverName = 'mssql'
    dbaConnCfg.databaseName = 'master'
  }
  config.application.connections.push(dbaConnCfg)

  // add FAKE_DBA_CONN for native
  argv.setServerConfiguration(config)
  const createDBConnectionPool = require('@unitybase/base').createDBConnectionPool
  const dbConnections = createDBConnectionPool(config.application.connections)
  const dbaConn = dbConnections.FAKE_DBA_CONN

  const generator = require(`./dbScripts/${dbDriverName}`)
  if (cfg.dropDatabase || cfg.createDatabase) { // read a databases / roles only for create/drop DB (can be allowed for DBA only)
    let dbExists = generator.databaseExists(dbaConn, mainConnCfg)
    if (cfg.dropDatabase) {
      if (!dbExists) {
        console.warn(`Database for connection ${mainConnCfg.name} not exists. Drop skipped`)
      } else {
        console.info(`Dropping a database for connection ${mainConnCfg.name}...`)
        generator.dropDatabase(dbaConn, mainConnCfg)
        dbExists = false
      }
    }
    if (cfg.createDatabase) {
      if (!dbExists) {
        console.info(`Creating a database ${mainConnCfg.name}...`)
        generator.createDatabase(dbaConn, mainConnCfg)
        dbaConn.commit()
      } else {
        console.warn(`Database for connection ${mainConnCfg.name} already exists. Creation skipped`)
      }
    }
  }

  const targetConn = dbConnections[mainConnCfg.name]
  if (cfg.connectionName) {
    console.info('Skip creating additional objects for non-default connection...')
  } else {
    console.info('Creating a minimal set of database objects...')
    generator.createMinSchema(targetConn, cfg.clientIdentifier, mainConnCfg)
    targetConn.commit()
    console.info('Creating a superuser..')
    fillBuildInRoles(targetConn, dbDriverName, cfg.pwd)
    targetConn.commit()
  }
  console.info('Database is ready. Run a `ubcli generateDDL` command to create a database tables for a domain')
}

/**
 * Create a Everyone & admin roles and a SuperUser named admin with password `admin`
 * @param {DBConnection} targetConn
 * @param {String} dbDriverName
 * @param {string} adminPwd Password for "admin" user
 * @private
 */
function fillBuildInRoles (targetConn, dbDriverName, adminPwd) {
  const initSecurity = []
  let isoDate, auditTailColumns, auditTailValues

  if (dbDriverName === 'sqlite3') {
    isoDate = "'" + new Date().toISOString().slice(0, -5) + "Z'"
    auditTailColumns = ',mi_owner,mi_createdate,mi_createuser,mi_modifydate,mi_modifyuser'
    auditTailValues = `,${UBA_COMMON.USERS.ADMIN.ID},${isoDate},${UBA_COMMON.USERS.ADMIN.ID},${isoDate},${UBA_COMMON.USERS.ADMIN.ID}`
    initSecurity.push('PRAGMA foreign_keys = OFF')
  } else {
    auditTailColumns = ''
    auditTailValues = ''
  }
  // build-in roles
  for (const roleName in UBA_COMMON.ROLES) {
    const aRole = UBA_COMMON.ROLES[roleName]
    initSecurity.push(
      `insert into uba_subject (ID,code,name,sType,mi_unityentity) values(${aRole.ID}, '${aRole.NAME}', '${aRole.DESCR}', 'R', 'UBA_SUBJECT')`,
      `insert into uba_role (ID,name,description,sessionTimeout,allowedAppMethods${auditTailColumns}) 
       values(${aRole.ID},'${aRole.NAME}','${aRole.DESCR}',${aRole.TIMEOUT},'${aRole.ENDPOINTS}'${auditTailValues})`
    )
  }
  // build-in users
  for (const userName in UBA_COMMON.USERS) {
    const aUser = UBA_COMMON.USERS[userName]
    const uPwdHash = (aUser.NAME === UBA_COMMON.USERS.ADMIN.NAME)
      ? UBA_COMMON.ubAuthHash('', UBA_COMMON.USERS.ADMIN.NAME, adminPwd)
      : '-'
    initSecurity.push(
      `insert into uba_subject (ID,code,name,sType,mi_unityentity) values(${aUser.ID}, '${aUser.NAME}', '${aUser.NAME}', 'U', 'UBA_USER')`,
      `insert into uba_user (ID, name, description, upasswordhashhexa, disabled, udata${auditTailColumns}) 
       values (${aUser.ID}, '${aUser.NAME}', '${aUser.NAME}', '${uPwdHash}', 0, ''${auditTailValues})`
    )
  }
  // grant roles to users and add admin ELS
  initSecurity.push(
    /* grant all ELS methods for "Admin" role */
    `insert into uba_els (ID,code,description,disabled,entityMask,methodMask,ruleType,ruleRole${auditTailColumns}) 
     VALUES (200, 'UBA_ADMIN_ALL', 'Admins - enable all',0,'*','*','A',${UBA_COMMON.ROLES.ADMIN.ID}${auditTailValues})`,
    /* grant role "Admin" to user "admin" */
    `insert into uba_userrole (ID,userID, roleID${auditTailColumns}) values(800,${UBA_COMMON.USERS.ADMIN.ID},${UBA_COMMON.ROLES.ADMIN.ID}${auditTailValues})`,
    /* grant role "Anonymous" to user "anonymous" */
    `insert into uba_userrole (ID,userID, roleID${auditTailColumns}) values(900,${UBA_COMMON.USERS.ANONYMOUS.ID},${UBA_COMMON.ROLES.ANONYMOUS.ID}${auditTailValues})`
  )
  if (dbDriverName === 'sqlite3') {
    initSecurity.push('PRAGMA foreign_keys = ON')
  }

  initSecurity.forEach(function (stmt) {
    targetConn.execParsed(stmt, [])
  })
}

module.exports.shortDoc =
`Create a database (schema) and a minimal set of DB
\t\t\tobject for a UnityBase ORM. For detais see
\t\t\thttps://unitybase.info/api/server-v5/module-initDB.html`
