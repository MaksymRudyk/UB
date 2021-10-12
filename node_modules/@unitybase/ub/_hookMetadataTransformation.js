module.exports = ubMixinTransformation

/**
 * This hook is called by server in the single thread initialization mode. In this stage
 *  - native Domain is not created yet
 *  - js files form models is not evaluated
 * Hook can mutate a Domain JSON, for example - adds additional attributes to the entities and lang files, etc
 *
 * @param {object<string, {modelName: string, meta: object, lang: object<string, object>}>} domainJson
 * @param {object} serverConfig
 */
function ubMixinTransformation (domainJson, serverConfig) {
  addImplicitlyAddedMixins(domainJson, serverConfig)
  const mt = serverConfig.security.multitenancy
  if (mt && (mt.enabled === true)) {
    addMultitenancyMixinAttributes(domainJson, serverConfig)
  }
  validateAttributesBlobStore(domainJson, serverConfig)
}

/**
 * Add implicitlyAddedMixins for each entity where such mixin not disabled
 * @param {object<string, {modelName: string, meta: object, lang: object<string, object>}>} domainJson
 * @param {object} serverConfig
 */
function addImplicitlyAddedMixins (domainJson, serverConfig) {
  const impl = serverConfig.application.domain.implicitlyAddedMixins
  if (!impl.length) return
  console.debug('Adding implicitlyAddedMixins:', serverConfig.application.domain.implicitlyAddedMixins)
  for (const entityName in domainJson) {
    const entityMeta = domainJson[entityName].meta
    if (!entityMeta.mixins) continue
    impl.forEach(mixin4add => {
      if (!entityMeta.mixins[mixin4add]) {
        entityMeta.mixins[mixin4add] = {}
      }
    })
  }
}

/**
 * Add mi_tenantID for each entity with mnltitenancy
 * @param {object<string, {modelName: string, meta: object, lang: object<string, object>}>} domainJson
 * @param {object} serverConfig
 */
function addMultitenancyMixinAttributes (domainJson, serverConfig) {
  const dbCfg = serverConfig.application.connections
  const connCfgMap = {}
  let defaultConn
  dbCfg.forEach(c => {
    connCfgMap[c.name] = c
    if (c.isDefault) defaultConn = c
  })
  if (!defaultConn) defaultConn = dbCfg[0]
  for (const entityName in domainJson) {
    const entityMeta = domainJson[entityName].meta
    if (entityMeta.mixins && entityMeta.mixins.multitenancy && entityMeta.mixins.multitenancy.enabled !== false) {
      if (entityMeta.attributes.indexOf(a => a.name === 'mi_tenantID') !== -1) continue
      const conn = connCfgMap[entityMeta.connectionName] || defaultConn
      if (!conn) throw new Error(`Connection definition not found for entity ${entityName}`)
      let dbDefault
      if (conn.dialect === 'PostgreSQL') {
        dbDefault = "(COALESCE(current_setting('ub.tenantID'::text, true), '0'::text))::bigint"
      } else if (conn.dialect === 'MSSQL2012') {
        dbDefault = "CAST(COALESCE(SESSION_CONTEXT(N'ub.tenantID'), '0') as BigInt)"
      } else if (conn.dialect === 'SQLite3') { // TODO - fts multitenancy

      } else {
        throw new Error(`DB dialect '${conn.dialect}' is not supported by multitenancy mixin for entity ${entityName}`)
      }
      entityMeta.attributes.push({
        name: 'mi_tenantID',
        caption: 'tenantID',
        dataType: 'BigInt',
        allowNull: false,
        readOnly: true,
        defaultView: false,
        restriction: {
          I: 'Admin',
          S: 'Admin',
          replaceBy: '-1',
          U: 'Admin'
        },
        defaultValue: dbDefault
      })
    }
  }
}

/**
 * check blobStore exists in server config for each Document type attribute
 * @param {object<string, {modelName: string, meta: object, lang: object<string, object>}>} domainJson
 * @param {object} serverConfig
 */
function validateAttributesBlobStore (domainJson, serverConfig) {
  const bsConfig = serverConfig.application.blobStores || []
  const bsSet = new Set(bsConfig.map(c => c.name))
  for (const entityName in domainJson) {
    const entityMeta = domainJson[entityName].meta
    entityMeta.attributes.forEach(attr => {
      if ((attr.dataType === 'Document') && attr.storeName && !bsSet.has(attr.storeName)) {
        throw new Error(`Entity '${entityName}'. Blob store '${attr.storeName}' used by attribute '${attr.name}' ('storeName' property), but such store is not defined in ubConfig`)
      }
    })
  }
}
