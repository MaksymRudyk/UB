const App = require('../modules/App')

/**
 * Multitenancy mixin. Allows separate entity data by value from mi_tenantID field value on the DB level.
 *   `ubConfig.security.tenants.enabled` should be `true` to enable multitenancy.
 *
 *  - if `security.tenants.enabled` then multitenancy mixin is pushed into `ubConfig.application.domain.implicitlyAddedMixins`,
 *    and so, added for all entities where it not implicitly disabled. To disable it for specific entity add a
 *        {"multitenancy": {"enabled": false}
 *    section into entity meta file
 *  - 'mi_tenantID' attribute is added for entities with multitenancy by UB model _hookMetadataTransformation.js
 *  - uses `Session.tenantID` as a tenant identifier, this property is calculated for each request based on
 *    `ubConfig.security.tenants` configuration
 *  - For Postgres sets a `ub.tenantID` session variable for every HTTP request, DDL generator adds a Postgres row level security
 *    based on this variable
 *
 *
 * Configuration
 * "mixins": {
 *   "multitenancy": {}
 * }
 *
 * @implements MixinModule
 */
module.exports = {
  initDomain: initDomainForMultitenancy,
  initEntity: initEntityForMultitenancy
}

/**
 * Subscribe on `enterConnectionContext` event and sets a `ub_tenantID` DB session variable value to Session.tenantID.
 *
 * `enterConnectionContext` event is emitted by server just after HTTP request context tries to got a DB connection for the first time
 */
function initDomainForMultitenancy () {
  App.on('enterConnectionContext', (connName) => {
    const TID = Session.tenantID
    if (TID === undefined) {
      console.debug('Session without tenant') // TODO - is it possible?
      return
    }
    const dbConn = App.dbConnections[connName]
    const dialect = dbConn.config.dialect
    if (dialect === 'PostgreSQL') {
      dbConn.runParsed('SELECT set_config(\'ub.tenantID\', ?, false)', ['' + TID]) //should be string for Postgres
      // dbConn.execParsed('SET ub.tenantID=?', [TID]) // SET not support parameters
    } else if (dialect === 'MSSQL2012') {
      dbConn.execParsed(`EXEC sp_set_session_context 'ub.tenantID', ${TID}`)
    } else if (dialect === 'SQLite3') { //TODO - fts multitenancy

    } else {
      // Oracle  http://khaidoan.wikidot.com/oracle-session-variables
      throw new Error(`multitenancy is not supported for ${dialect} database dialect`)
    }
  })
}

/**
 * Nothing to do here - we uses a table-level defaults instead of ORM to allow direct SQL insertion
 *
 * @param {UBEntity} entity Entity for initialization
 * @param {UBEntityMixin} mixinCfg Mixin configuration from entity metafile
 */
function initEntityForMultitenancy(entity, mixinCfg) {
  // const entityModule = global[entity.name]
  // entityModule.on('insert:before', function multitenancyInsertBefore(ctx) {
  //   if (!ctx.mParams.execParams) {
  //     ctx.mParams.execParams = {}
  //   }
  //   ctx.mParams.execParams.mi_tenantID = Session.tenantID
  // })
}