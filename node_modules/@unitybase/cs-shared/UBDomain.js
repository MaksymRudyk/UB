/* documentation verified by mpv on 2018-03-18 */
/* global UB, App */
const _ = require('lodash')
const iso8601ParseAsDate = require('./LocalDataStore').iso8601ParseAsDate

/**
 * @module UBDomain
 * @memberOf module:@unitybase/cs-shared
 */

/**
 * Database connection config (w/o credential)
 * @typedef {object} DBConnectionConfig
 * @property {string} name
 * @property {string} dialect
 * @property {boolean} isDefault
 * @property {Array<string>} supportLang
 * @property {string} advSettings database specific settings
 */

/**
 * @classdesc
 * Domain object model (metadata) - in-memory representation of all *.meta files included in the application config.
 *
 * Developer should never create {@link UBDomain} class directly, but instead use a:
 *
 *  - {@link module:@unitybase/ub#App.domainInfo App.domainInfo} property inside server-side methods
 *  - {@link module:@unitybase/base#SyncConnection SyncConnection.getDomainInfo} method inside CLI scripts
 *  - `UBConnection.domain` property inside a browser
 *
       // server-side example
       const UB = require('@unitybase/ub')
       const App = UB.App
       let ubaAuditPresent = App.domainInfo.has('uba_audit')

 *
 * @param {object} domainInfo getDomainInfo UB server method result
 * @param {object} domainInfo.domain raw entities collection
 * @param {object} domainInfo.entityMethods entities methods access rights for current user
 * @param {object} domainInfo.models information about domain models
 * @param {object} domainInfo.i18n entities localization to current user language
 * @class
 */
function UBDomain (domainInfo) {
  const me = this
  const entityCodes = Object.keys(domainInfo.domain)
  const isV4API = (typeof domainInfo.entityMethods === 'undefined')
  /**
   * Map with keys is entity name, value is UBEntity
   * @member {Object<string, UBEntity>}
   */
  this.entities = {}
  /**
   * Connection collection (extended domain only)
   * @member {Array<DBConnectionConfig>}
   */
  this.connections = domainInfo.connections
  /**
   * Default connection (extended domain only)
   * @member {DBConnectionConfig}
   */
  this.defaultConnection = undefined
  if (this.connections) {
    this.connections.forEach((conn) => {
      if (conn.isDefault) this.defaultConnection = conn
    })
  }
  for (let i = 0, L = entityCodes.length; i < L; i++) {
    const entityCode = entityCodes[i]
    const entity = domainInfo.domain[entityCode]
    // entity attributes locale can come either as array
    // "attributes": [{"name": "attrCode", ...}, ..]
    // or as object
    // "attributes": {"attrCode": {...}, ..]
    // to be merged correctly transformation to object required
    if (entity.i18n && entity.i18n.attributes && Array.isArray(entity.i18n.attributes)) {
      const attrs = entity.i18n.attributes
      const newAttrs = {}
      for (let k = 0, lL = attrs.length; k < lL; k++) {
        const attr = attrs[k]
        const attrName = attr.name
        if (!attrName) throw new Error('Invalid localization JSON for entity ' + entityCode)
        delete attr.name
        newAttrs[attrName] = attr
      }
      entity.i18n.attributes = newAttrs
    }
    if (isV4API) {
      me.entities[entityCode] = new UBEntity(
        entity,
        entity.entityMethods || {},
        entity.i18n,
        entityCode,
        me
      )
    } else {
      me.entities[entityCode] = new UBEntity(
        entity,
        domainInfo.entityMethods[entityCode] || {},
        domainInfo.i18n[entityCode],
        entityCode,
        me
      )
    }
  }

  /**
   * Array of models, sorted by the order of loading
   * @member {Array<UBModel>}
   */
  this.orderedModels = []

  /**
   * Models collection
   * @member {Object<string, UBModel>}
   */
  this.models = {}
  const modelCodes = Object.keys(domainInfo.models)
  modelCodes.forEach(function (modelCode) {
    const m = domainInfo.models[modelCode]
    me.models[modelCode] = new UBModel(m, modelCode)
    me.orderedModels.push(me.models[modelCode])
  })
  me.orderedModels.sort((a, b) => a.order - b.order)

  /**
   * Array of vendor models names
   * @type {Array<string>}
   */
  this.vendorModels = domainInfo.vendorModels ? domainInfo.vendorModels.split(':') : []
  /**
   * Array of customer models names
   * @type {Array<string>}
   */
  this.customerModels = domainInfo.customerModels ? domainInfo.customerModels.split(':') : []
}

/**
 * Check all provided entity methods are accessible via RLS.
 *
 * If entity does not exist in domain or at last one of provided methods is not accessible - return false
 *
 * @param {string} entityCode
 * @param {String|Array} methodNames
 */
UBDomain.prototype.isEntityMethodsAccessible = function (entityCode, methodNames) {
  const entity = this.entities[entityCode]
  if (!entity) return false
  return Array.isArray(methodNames) ? entity.haveAccessToMethods(methodNames) : entity.haveAccessToMethod(methodNames)
}
/**
 * Get entity by code
 * @param {string} entityCode
 * @param {Boolean} [raiseErrorIfNotExists=true] If `true`(default) and entity does not exists throw error
 * @returns {UBEntity}
 */
UBDomain.prototype.get = function (entityCode, raiseErrorIfNotExists) {
  const result = this.entities[entityCode]
  if ((raiseErrorIfNotExists !== false) && !result) {
    throw new Error(`Entity with code '${entityCode}' does not exist or not accessible`)
  }
  return result
}

/**
 * Check entity present in domain & user has access right for at least one entity method
 * @param {string} entityCode
 * @returns {Boolean}
 */
UBDomain.prototype.has = function (entityCode) {
  return !!this.entities[entityCode]
}

/**
* @callback domainEntitiesIteratorCallback
* @param {UBEntity} entity
* @param {string} entityCode
* @param {Object<string, UBEntity>} entities
*/

/**
 * Iterates over domain entities and invokes `callBack` for each entity.
 * The iteratee is invoked with three arguments: (UBEntity, entityName, UBDomain.entities)
 * @param {domainEntitiesIteratorCallback} cb
 */
UBDomain.prototype.eachEntity = function (cb) {
  return _.forEach(this.entities, cb)
}

/**
 * Filter entities by properties
 * @example
 *
 *      // sessionCachedEntities contains all entities with property cacheType === Session
 *      var sessionCachedEntities = domain.filterEntities({cacheType: 'Session'});
 *
 * @param {Object|Function} predicate Either a function passed to lodash filter or object
 * @returns {Array<UBEntity>}
 */
UBDomain.prototype.filterEntities = function (predicate) {
  if (_.isFunction(predicate)) {
    return _.filter(this.entities, predicate)
  } else {
    return _.filter(this.entities, function (item) {
      let res = true
      for (const prop in predicate) {
        if (Object.prototype.hasOwnProperty.call(predicate, prop)) {
          res = res && (item[prop] === predicate[prop])
        }
      }
      return res
    })
  }
}

/**
 * Possible types of the attributes
 * @readonly
 * @enum
 */
UBDomain.ubDataTypes = {
  /** Small string. _MSSQL: NVARCHAR, ORACLE: NVARCHAR2, POSTGRE: VARCHAR_ */
  String: 'String',
  /** 32-bite Integer. MSSQL: INT, ORACLE: INTEGER, POSTGRE: INTEGER */
  Int: 'Int',
  /** 64-bite Integer. MSSQL: BIGINT, ORACLE: NUMBER(19), POSTGRE: BIGINT */
  BigInt: 'BigInt',
  /** Double. MSSQL: FLOAT, ORACLE: NUMBER(19, 4), POSTGRE: NUMERIC(19, 4) */
  Float: 'Float',
  /** Currency. MSSQL: FLOAT, ORACLE: NUMBER(19, 2), POSTGRE: NUMERIC(19, 2) */
  Currency: 'Currency',
  /** Boolean. MSSQL: TINYINT, ORACLE: NUMBER(1), POSTGRE: SMALLINT */
  Boolean: 'Boolean',
  /** Date + Time in UTC (GMT+0) timezone. MSSQL: DATETIME, OARCLE: DATE, POSTGRE: TIMESTAMP WITH TIME ZONE */
  DateTime: 'DateTime',
  /** Long strint. MSSQL: NVARCHAR(MAX), ORACLE: CLOB, POSTGRE: TEXT */
  Text: 'Text',
  /** Alias for BigInt */
  ID: 'ID',
  /** Reference to enother entity. BigInt */
  Entity: 'Entity',
  /** Store a JSON with information about Document place in blob store */
  Document: 'Document',
  Many: 'Many',
  /**  Seconds since UNIX epoch, Int64. MSSQL: BIGINT, ORACLE: NUMBER(19), POSTGRE: BIGINT */
  TimeLog: 'TimeLog',
  /** Enumertion (see ubm_enum) */
  Enum: 'Enum',
  /** Bynary data. MSSQL: VARBINARY(MAX), ORACLE: BLOB, POSTGRE: BYTEA */
  BLOB: 'BLOB',
  /** Date (without time) in UTC (GMT+0) */
  Date: 'Date',
  /** Json stored in database. Postgres: JSONB, _MSSQL: NVARCHAR(4000), ORACLE: NVARCHAR2(2000) */
  Json: 'Json'
}

UBDomain.prototype.ubDataTypes = UBDomain.ubDataTypes
UBDomain.FLOATING_SCALE_PRECISION = UBDomain.prototype.FLOATING_SCALE_PRECISION = 6

/**
 * Types of expressions in attribute mapping
 * @readonly
 * @protected
 * @enum
 */
UBDomain.ExpressionType = {
  Field: 'Field',
  Expression: 'Expression'
}

/**
 * UnityBase base mixins
 * @readonly
 * @private
 * @enum
 */
UBDomain.ubMixins = {
  dataHistory: 'dataHistory',
  mStorage: 'mStorage',
  unity: 'unity',
  treePath: 'treePath'
}

/**
 * Service attribute names
 * @readonly
 * @enum
 */
UBDomain.ubServiceFields = {
  dateFrom: 'mi_datefrom',
  dateTo: 'mi_dateto'
}

/**
 * Entity dataSource types
 * @enum {string}
 * @readonly
 */
UBDomain.EntityDataSourceType = {
  Normal: 'Normal',
  External: 'External',
  System: 'System',
  Virtual: 'Virtual'
}

/**
 * @enum
 */
UBDomain.EntityCacheTypes = {
  None: 'None',
  Entity: 'Entity',
  Session: 'Session',
  SessionEntity: 'SessionEntity'
}

/**
 * Priority to apply a mapping of a attributes/entities to the physical tables depending of connection dialect
 * @enum
 * @protected
 */
UBDomain.dialectsPriority = {
  MSSQL2012: ['MSSQL2012', 'MSSQL', 'AnsiSQL'],
  MSSQL2008: ['MSSQL2008', 'MSSQL', 'AnsiSQL'],
  MSSQL: ['MSSQL', 'AnsiSQL'],
  Oracle11: ['Oracle11', 'Oracle', 'AnsiSQL'],
  Oracle10: ['Oracle10', 'Oracle', 'AnsiSQL'],
  Oracle9: ['Oracle9', 'Oracle', 'AnsiSQL'],
  Oracle: ['Oracle', 'AnsiSQL'],
  PostgreSQL: ['PostgreSQL', 'AnsiSQL'],
  AnsiSQL: ['AnsiSQL'],
  Firebird: ['Firebird', 'AnsiSQL'],
  SQLite3: ['SQLite3', 'AnsiSQL']
}

/**
 * Return physical type by UBDataType
 * @param {string} dataType
 * @return {string}
 */
UBDomain.getPhysicalDataType = function (dataType) {
  const ubDataTypes = UBDomain.ubDataTypes
  const typeMap = {}

  if (!this.physicalTypeMap) {
    typeMap[ubDataTypes.Int] = 'int'
    typeMap[ubDataTypes.Entity] = 'int'
    typeMap[ubDataTypes.ID] = 'int'
    typeMap[ubDataTypes.BigInt] = 'int'

    typeMap[ubDataTypes.String] = 'string'
    typeMap[ubDataTypes.Text] = 'string'
    typeMap[ubDataTypes.Enum] = 'string'

    typeMap[ubDataTypes.Float] = 'float'
    typeMap[ubDataTypes.Currency] = 'float'

    typeMap[ubDataTypes.Boolean] = 'boolean'

    typeMap[ubDataTypes.Date] = 'date'
    typeMap[ubDataTypes.DateTime] = 'date'

    this.physicalTypeMap = typeMap
  }
  return this.physicalTypeMap[dataType] || 'auto'
}

/**
 * Function used as replacer for JSON.stringify inside toJSON methods
 * @private
 * @returns {*}
 */
UBDomain.jsonReplacer = function (k, v) {
  // eslint-disable-next-line no-proto
  const jr = this.__proto__.forJSONReplacer
  if (jr) {
    // skip props marked as null inside forJSONReplacer collection
    if (Object.prototype.hasOwnProperty.call(jr, k) && jr[k] === null) return undefined
    // skip boolean props mach forJSONReplacer boolean values
    if (typeof v === 'boolean' && v === jr[k]) return undefined
  }
  // skip '', 0
  if (typeof v !== 'boolean' && !v) return undefined
  // skip empty customSettings
  if (k === 'customSettings' && !Object.keys(v).length) return undefined
  return v
}

/**
 * Model (logical group of entities).
 * Instantiated in  {@link UBDomain#models UBDomain.models} and {@link UBDomain#orderedModels UBDomain.orderedModels}
 * @class
 * @param {object} cfg
 * @param {string} cfg.path
 * @param {boolean} cfg.needInit
 * @param {boolean} cfg.needLocalize
 * @param {number} cfg.order
 * @param {string} cfg.version
 * @param {string} [cfg.moduleName]
 * @param {string} [cfg.moduleSuffix]
 * @param {string} [cfg.clientRequirePath] if passed are used instead of moduleName + moduleSuffix
 * @param {string} [cfg.realPublicPath]
 * @param {string} modelCode
 */
function UBModel (cfg, modelCode) {
  /**
   * Model name as specified in application config
   * @type {string}
   */
  this.name = modelCode
  this.path = cfg.path
  if (cfg.needInit) {
    /**
     * `initModel.js` script is available in the public folder (should be injected by client)
     * @type {boolean}
     */
    this.needInit = cfg.needInit
  }
  if (cfg.needLocalize) {
    /**
     * `locale-Lang.js` script is available in the public folder (should be injected by client)
     * @type {boolean}
     */
    this.needLocalize = cfg.needLocalize
  }
  /**
   * An order of model initialization (as it is provided in server domain config)
   * @type {number}
   */
  this.order = cfg.order
  /**
   * Module name for `require`
   * @type {string}
   */
  this.moduleName = cfg.moduleName
  // if (cfg.moduleSuffix && cfg.moduleName) {
  //   this.moduleName = this.moduleName + '/' + cfg.moduleSuffix
  // }
  /**
   * The path for retrieve a model public accessible files (using clientRequire endpoint)
   * @type {string}
   */
  this.clientRequirePath = (cfg.moduleSuffix && cfg.moduleName && cfg.moduleName.startsWith('@'))
    ? (this.moduleName + '/' + cfg.moduleSuffix)
    : (this.path)

  if (cfg.realPublicPath) {
    /**
     * Server-side domain only - full path to the model public folder (if any) including trailer `/`
     * @type {string}
     */
    this.realPublicPath = cfg.realPublicPath
  }
  if (cfg.realPath) {
    /**
     * Server-side domain only - the full path to model folder
     * @type {string}
     */
    this.realPath = cfg.realPath
  }
  /**
   * Model version as specified in `version` key of model package.json
   * If package.json not found version is empty.
   *
   * Introduced in ub server@5.4.2
   * @type {string}
   */
  this.version = cfg.version
}
UBModel.prototype.needInit = false
UBModel.prototype.needLocalize = false
UBModel.prototype.realPublicPath = ''

/**
 * Collection of attributes
 * @class
 */
function UBEntityAttributes () {}
/**
 * Return a JSON representation of all attributes
 * WITHOUT properties which have default values
 * @returns {object}
 */
UBEntityAttributes.prototype.asPlainJSON = function () {
  return JSON.parse(JSON.stringify(this, UBDomain.jsonReplacer))
}

/** @class */
function UBEntityMapping (maping) {
  /**
   * @type {string}
   */
  this.selectName = maping.selectName || ''
  /** @type {string} */
  this.execName = maping.execName || this.selectName
  /** @type {string} */
  this.pkGenerator = maping.pkGenerator
}

/**
 * Entity metadata
 * @class
 * @param {object} entityInfo
 * @param {object} entityMethods
 * @param {object} i18n
 * @param {string} entityCode
 * @param {UBDomain} domain
 */
function UBEntity (entityInfo, entityMethods, i18n, entityCode, domain) {
  const me = this
  let mixinInfo, i18nMixin

  if (i18n && ((typeof process === 'undefined') || !process.isServer)) { // merge i18n only on client side
    _.merge(entityInfo, i18n)
    // verify entity is valid after merging i18n: at last all attributes have dataType
    _.forEach(entityInfo.attributes, (attrDef, attrKey) => {
      if (!attrDef.dataType) {
        const eMsg = `Invalid i18n for entity "${entityCode}" - attribute "${attrKey}" not exist in meta or it's dataType is empty`
        throw new Error(eMsg)
      }
    })
  }
  /**
   * Non enumerable (to prevent JSON.stringify circular ref) read only domain
   * @property {UBDomain} domain
   * @readonly
   */
  Object.defineProperty(this, 'domain', { enumerable: false, value: domain })
  /**
   * @type {string}
   * @readonly
   */
  this.code = entityCode
  /**
   * Name of model where entity is defined (in case entity is overridden - see overridesBy)
   * @type{string}
   * @readonly
   */
  this.modelName = entityInfo.modelName
  /**
   * CSV model names where entity is overridden
   * @type{string}
   * @readonly
   */
  this.overriddenBy = entityInfo.overriddenBy
  /**
   * Entity name
   * @type {string}
   * @readonly
   */
  this.name = entityInfo.name

  if (entityInfo.caption) this.caption = entityInfo.caption
  if (entityInfo.description) this.description = entityInfo.description
  if (entityInfo.documentation) this.documentation = entityInfo.documentation
  if (entityInfo.descriptionAttribute) this.descriptionAttribute = entityInfo.descriptionAttribute
  if (entityInfo.cacheType) this.cacheType = entityInfo.cacheType
  if (entityInfo.dsType) this.dsType = entityInfo.dsType
  if (entityInfo.isUnity) this.isUnity = true
  if (entityInfo.isManyManyRef) this.isManyManyRef = true
  if (entityInfo.isFTSDataTable) this.isFTSDataTable = true
  /**
   * Internal short alias
   * @type {string}
   * @readonly
   */
  this.sqlAlias = entityInfo.sqlAlias
  /**
   * Data source connection name
   * @type {string}
   * @readonly
   */
  this.connectionName = entityInfo.connectionName

  /**
   * Reference to connection definition (for extended domain only)
   * @type {DBConnectionConfig}
   * @readonly
   */
  this.connectionConfig = (this.connectionName && this.domain && this.domain.connections) ? _.find(this.domain.connections, { name: this.connectionName }) : undefined
  /**
   * Optional mapping of entity to physical data (for extended domain info only).
   * Calculated from a entity mapping collection in accordance with application connection configuration
   * @type {UBEntityMapping}
   * @readonly
   */
  this.mapping = undefined
  if (entityInfo.mapping) {
    const mappingKeys = Object.keys(entityInfo.mapping)
    mappingKeys.forEach(key => {
      if (!UBDomain.dialectsPriority[key]) throw new Error(`Invalid dialect ${key} in ${this.code} mapping`)
    })
    if (mappingKeys.length) {
      const me = this
      const dialectPriority = UBDomain.dialectsPriority[this.connectionConfig.dialect]
      _.forEach(dialectPriority, function (dialect) {
        if (entityInfo.mapping[dialect]) {
          me.mapping = new UBEntityMapping(entityInfo.mapping[dialect])
          return false
        }
      })
    }
  }

  /**
   * Optional dbKeys (for extended domain info)
   * @type {object}
   */
  this.dbKeys = entityInfo.dbKeys && Object.keys(entityInfo.dbKeys).length ? entityInfo.dbKeys : undefined
  /**
   * Optional dbExtensions (for extended domain info)
   * @type {object}
   */
  this.dbExtensions = entityInfo.dbExtensions && Object.keys(entityInfo.dbExtensions).length ? entityInfo.dbExtensions : undefined

  /**
   * Entity attributes collection
   * @type {Object<string, UBEntityAttribute>}
   */
  this.attributes = new UBEntityAttributes()
  /**
   * Slice of attributes with type `Document`
   * @type {Array<UBEntityAttribute>}
   */
  this.blobAttributes = []

  const attributesIsArray = Array.isArray(entityInfo.attributes)
  _.forEach(entityInfo.attributes, (attributeInfo, attributeCode) => {
    if (attributesIsArray) attributeCode = attributeInfo.code || attributeInfo.name
    const attr = new UBEntityAttribute(attributeInfo, attributeCode, me)
    // record history mixin set a dateTo automatically, so let's allow blank mi_dateTo on UI
    // but for DDL generator mi_dateTo must be not null, so change only for browser side
    if ((attr.code === 'mi_dateTo') && (typeof window !== 'undefined')) {
      attr.allowNull = true
    }
    me.attributes[attributeCode] = attr
    if (attr.dataType === UBDomain.ubDataTypes.Document) {
      this.blobAttributes.push(attr)
    }
  })

  const mixinNames = Object.keys(entityInfo.mixins || {})
  /**
   * Collection of entity mixins
   * @type {Object<string, UBEntityMixin>}
   */
  this.mixins = {}
  mixinNames.forEach(function (mixinCode) {
    mixinInfo = entityInfo.mixins[mixinCode]
    i18nMixin = (i18n && i18n.mixins ? i18n.mixins[mixinCode] : null)
    switch (mixinCode) {
      case 'mStorage':
        me.mixins[mixinCode] = new UBEntityStoreMixin(mixinInfo, i18nMixin, mixinCode)
        break
      case 'dataHistory':
        me.mixins[mixinCode] = new UBEntityHistoryMixin(mixinInfo, i18nMixin, mixinCode)
        break
      case 'aclRls':
        me.mixins[mixinCode] = new UBEntityAclRlsMixin(mixinInfo, i18nMixin, mixinCode)
        break
      case 'fts':
        me.mixins[mixinCode] = new UBEntityFtsMixin(mixinInfo, i18nMixin, mixinCode)
        break
      case 'als':
        me.mixins[mixinCode] = new UBEntityAlsMixin(mixinInfo, i18nMixin, mixinCode)
        break
      default:
        me.mixins[mixinCode] = new UBEntityMixin(mixinInfo, i18nMixin, mixinCode)
    }
  })
  /**
   * Entity methods, allowed for current logged-in user in format {method1: 1, method2: 1}. 1 mean method is allowed
   * Empty for server-side domain - use `entity.haveAccessToMethod` to check method is accessible for user.
   * @type {Object<string, Number>}
   * @readOnly
   */
  this.entityMethods = entityMethods || {}

  /**
   * Private settings (for extended domain info)
   * @property {object} privateSettings
   */
  if (entityInfo.privateSettings) this.privateSettings = entityInfo.privateSettings
}

// default UBEntity props - used by JSON.stringify replacer to produce entity JSON representation
UBEntity.prototype.forJSONReplacer = {
  code: null,
  modelName: null,
  cacheType: 'None',
  isFTSDataTable: null,
  isManyManyRef: null,
  blobAttributes: null,
  entityMethods: null
}

/**
 * Entity caption
 * @type {string}
 */
UBEntity.prototype.caption = ''
/**
 * Entity description
 * @type {string}
 */
UBEntity.prototype.description = ''
/**
 * Documentation
 * @type {string}
 */
UBEntity.prototype.documentation = ''
/**
 * Name of attribute witch used as a display value in lookup
 * @type {string}
 */
UBEntity.prototype.descriptionAttribute = ''

/**
 * Indicate how entity content is cached on the client side.
 *
 * @type {UBDomain.EntityCacheTypes}
 * @readonly
 */
UBEntity.prototype.cacheType = 'None'

/**
 *
 * @type {UBDomain.EntityDataSourceType}
 */
UBEntity.prototype.dsType = 'Normal'

/**
 * Indicate this entity is a UNITY for someone
 * @type {boolean}
 */
UBEntity.prototype.isUnity = false
/**
 * Indicate this entity is a many-to-many storage for attributes of type "Many"
 * @type {boolean}
 */
UBEntity.prototype.isManyManyRef = false
/**
 * This is a Full Text Search entity
 * @type {boolean}
 */
UBEntity.prototype.isFTSDataTable = false
/**
 * Return an entity caption to display on UI
 * @returns {string}
 */
UBEntity.prototype.getEntityCaption = function () {
  return this.caption || this.description
}

/**
 * Get entity attribute by code. Return `undefined` if attribute is not found
 * @param {string} attributeCode
 * @param {Boolean} [simpleOnly=false] If `false`(default) - parse complex attributes like `attr1.attr2.attr3`
 * @returns {UBEntityAttribute}
 */
UBEntity.prototype.attr = function (attributeCode, simpleOnly) {
  let res = this.attributes[attributeCode]
  if (!res && !simpleOnly) {
    res = this.getEntityAttribute(attributeCode)
  }
  return res
}

/**
 * Get entity attribute by code. Throw error if attribute is not found.
 * @param {string} attributeCode
 * @returns {UBEntityAttribute}
 */
UBEntity.prototype.getAttribute = function (attributeCode) {
  const attr = this.attributes[attributeCode]
  if (!attr) {
    throw new Error(`Attribute ${this.code}.${attributeCode} doesn't exist`)
  }
  return attr
}

/**
 * @callback entityAttributesIteratorCallback
 * @param {UBEntityAttribute} attribute
 * @param {string} [attributeName]
 * @param {UBEntityAttributes} [attributes]
 */

/**
 * Iterates over entity attributes.
 * The iteratee is invoked with three arguments: (UBEntityAttribute, attributeName, UBEntityAttributes)
 * @param {entityAttributesIteratorCallback} callBack
 */
UBEntity.prototype.eachAttribute = function (callBack) {
  return _.forEach(this.attributes, callBack)
}

/**
 * Get entity mixin by code. Returns `undefined` if mixin is not found
 * @param {string} mixinCode
 * @returns {UBEntityMixin}
 */
UBEntity.prototype.mixin = function (mixinCode) {
  return this.mixins[mixinCode]
}

/**
 * Checks if entity has enabled mixin with specified code.
 * @param {string} mixinCode
 * @returns {Boolean}
 */
UBEntity.prototype.hasMixin = function (mixinCode) {
  const mixin = this.mixins[mixinCode]
  if (mixinCode === 'audit') {
    return !mixin || (!!mixin && mixin.enabled)
  }
  return (!!mixin && mixin.enabled)
}

/**
 * Checks if entity has mixin. Throw if mixin dose not exist or not enabled
 * @param {string} mixinCode
 */
UBEntity.prototype.checkMixin = function (mixinCode) {
  if (!this.hasMixin(mixinCode)) {
    throw new Error('Entity ' + this.code + ' does not have mixin ' + mixinCode)
  }
}

const STD_MIXINS_ATTRIBUTES = [
  'mi_owner', 'mi_createDate', 'mi_createUser', 'mi_modifyDate', 'mi_modifyUser',
  'mi_deleteDate', 'mi_deleteUser',
  'mi_data_id', 'mi_dateFrom', 'mi_dateTo',
  'mi_unityEntity', 'mi_treePath'
]
/**
 * Return a JSON representation entity WITHOUT properties which have default values
 * Result is very close to meta file.
 *
 * **WARNING** use carefully inside server thread - method is slow
 *
 * @param {boolean} [attributesAsArray=true]
 * @param {boolean} [removeAttrsAddedByMixin=true]
 * @returns {any}
 */
UBEntity.prototype.asPlainJSON = function (attributesAsArray = true, removeAttrsAddedByMixin = true) {
  const entityJSON = JSON.parse(JSON.stringify(this, UBDomain.jsonReplacer))
  if (removeAttrsAddedByMixin && entityJSON.dsType !== 'Virtual') {
    _.forEach(entityJSON.attributes, (attrVal, attrCode) => {
      if (attrCode.startsWith('mi_') && STD_MIXINS_ATTRIBUTES.includes(attrCode)) {
        delete entityJSON.attributes[attrCode]
      }
    })
  }
  if (!attributesAsArray) return entityJSON
  // transform {ID: {}, } -> [{name: 'ID',..},..]
  const newAttributes = []
  for (const attrName in entityJSON.attributes) {
    const attr = Object.assign({ name: attrName }, entityJSON.attributes[attrName]) // move name to the first position in JSON
    if (attr.mapping) {
      if (!Array.isArray(attr.mapping)) {
        const newMappings = []
        for (const dialectName in attr.mapping) {
          // noinspection JSUnfilteredForInLoop
          const oldDialect = attr.mapping[dialectName]
          const newDialect = Object.assign({ name: dialectName }, oldDialect)
          newMappings.push(newDialect)
        }
        attr.mapping = newMappings
      }
    }
    newAttributes.push(attr)
  }
  entityJSON.attributes = newAttributes
  return entityJSON
}

// noinspection JSDeprecatedSymbols
/**
 * Checks if current user has access to a specified entity method
 * @param {string} methodCode
 * @returns {Boolean}
 */
UBEntity.prototype.haveAccessToMethod = function (methodCode) {
  return ((typeof App !== 'undefined') && App.els) // server side
    ? App.els(this.code, methodCode)
    : this.entityMethods[methodCode] === 1
}

/**
 * Filters attributes by properties
 * @param {Object|Function} predicate
 * @returns {Array<UBEntityAttribute>}
 * @example
 *
 *   // return all attributes where property dataType equal Document
 *   domain.get('uba_user').filterAttribute({dataType: 'Document'});
 *
 */
UBEntity.prototype.filterAttribute = function (predicate) {
  if (_.isFunction(predicate)) {
    return _.filter(this.attributes, predicate)
  } else {
    return _.filter(this.attributes, function (item) {
      let res = true
      for (const prop in predicate) {
        if (Object.prototype.hasOwnProperty.call(predicate, prop)) {
          res = res && (item[prop] === predicate[prop])
        }
      }
      return res
    })
  }
}

/**
 * Checks if current user has access to at last one of specified methods
 * @param {Array<string>} methodsCodes
 * @returns {boolean}
 */
UBEntity.prototype.haveAccessToAnyMethods = function (methodsCodes) {
  const me = this
  const fMethods = methodsCodes || []
  let result = false

  fMethods.forEach(function (methodCode) {
    if (UB.isServer && process.isServer) {
      result = result || App.els(me.code, methodCode)
    } else {
      result = result || me.entityMethods[methodCode] === 1
    }
  })
  return result
}

/**
 * Checks if current user has access to ALL of the specified methods
 * @param {Array<string>} methods Method names
 * @returns {Boolean}
 */
UBEntity.prototype.haveAccessToMethods = function (methods) {
  const me = this
  let result = true
  const fMethods = methods || []

  fMethods.forEach(function (methodCode) {
    if (UB.isServer && process.isServer) {
      result = result && App.els(me.code, methodCode)
    } else {
      result = result && (me.entityMethods[methodCode] === 1)
    }
  })
  return result
}

// noinspection JSUnusedLocalSymbols
/**
 * Add entity level method. Client can call such methods remotely. Also such methods are the subjects of ELS.
 *
 * Property named `methodName` with a type `function` should be added to the entity namespace.
 * Such functions accept single parameter of type {@link ubMethodParams}
 *
 * Don't add methods what do not called from client using {@UBEntity#addMethod}!
 *
 * **Warning:** do not call UBEntity.addMethod from inside function or conditions.
 * This code evaluated during thread initialization and each thread must add method in the same manner.
 *
 * @example
 *
  //consider entity with code `my_entity` exists. Inside my_entity.js file):
  var me = my_entity;
  me.entity.addMethod('externalMethod');
  // @param {ubMethodParams} ctx <- here must be JSDoc comment format
  me.externalMethod = function (ctx) {
    let params = ctx.mParams
    let a = params.a || 1
    let b = params.b || 1
    params.multiplyResult = a*b
  }

  // now from client side you can call
  $App.connection.query({entity: 'my_entity', method: 'externalMethod', a: 10, b:20}).then(function(result){
    console.log(' 10 * 20 = ', result.multiplyResult); // will put to log "10 * 20 = 200"
  })

 * @param {string} methodName
 */
UBEntity.prototype.addMethod = function (methodName) {
  throw new Error('UBEntity.addMethod implemented only in HTTP worker thread')
}

/**
 * Convert UnityBase server dateTime response to Date object
 * @private
 * @param value
 * @returns {Date|null}
 */
function iso8601Parse (value) {
  return value ? new Date(value) : null
}

/**
 * Convert UnityBase server Boolean response to Boolean (0 = false & 1 = true)
 * @private
 * @param v Value to convert
 * @returns {Boolean|null}
 */
function booleanParse (v) {
  if (typeof v === 'boolean') {
    return v
  }
  if ((v === undefined || v === null || v === '')) {
    return null
  }
  return (v === 1) || (v === '1')
}

/**
 * Convert UnityBase server Json response to Object, Return null in case of empty string
 * @private
 * @param v Value to convert
 * @returns {*|null}
 */
function jsonParse (v) {
  return v ? JSON.parse(v) : null
}

/**
 * Convert UnityBase server Enum response to String, Return null in case of empty string
 * @private
 * @param v Value to convert
 * @returns {String|null}
 */
function enumParse (v) {
  return (typeof v === 'number')
    ? String(v)
    : v || null
}

/**
 * Return array of conversion rules for raw server response data
 * @param {Array<string>} fieldList
 * @returns {Array<{index: number, convertFn: function}>}
 */
UBEntity.prototype.getConvertRules = function (fieldList) {
  const me = this
  const rules = []
  const types = UBDomain.ubDataTypes

  fieldList.forEach(function (fieldName, index) {
    const attribute = me.attr(fieldName)
    if (attribute) {
      if (attribute.dataType === types.DateTime) {
        rules.push({
          index: index,
          convertFn: iso8601Parse
        })
      } else if (attribute.dataType === types.Date) {
        rules.push({
          index: index,
          convertFn: iso8601ParseAsDate
        })
      } else if (attribute.dataType === types.Boolean) {
        rules.push({
          index: index,
          convertFn: booleanParse
        })
      } else if (attribute.dataType === types.Json) {
        rules.push({
          index: index,
          convertFn: jsonParse
        })
      } else if (attribute.dataType === types.Enum) {
        rules.push({
          index: index,
          convertFn: enumParse
        })
      }
    }
  })
  return rules
}

/**
 * Returns description attribute name (`descriptionAttribute` metadata property)
 * If `descriptionAttribute` is empty - fallback to attribute with code `caption`
 * @param {Boolean} [raiseErrorIfNotExists=true] If `true`(default) and description attribute does not exists throw error,
 *   if `false` - return `undefined`
 * @return {string|undefined}
 */
UBEntity.prototype.getDescriptionAttribute = function (raiseErrorIfNotExists) {
  let result = this.descriptionAttribute || 'caption'
  if (!this.attr(result)) {
    if ((raiseErrorIfNotExists !== false)) {
      throw new Error(`Missing description attribute for entity '${this.code}'`)
    } else {
      result = undefined
    }
  }
  return result
}

/**
 * Returns information about attribute and attribute entity. Understand complex attributes like `firmID.firmType.code`
 * @example

 UB.connection.domain.get('cdn_country').getEntityAttributeInfo('mi_modifyUser.name')
 // {entity: 'uba_user', attribute: 'name', parentAttribute: {code: mi_modifyUser, dataType: 'Entity', ....}}

 * @param {string} attributeName
 * @param {number} [depth=0] If 0 - last, -1 - before last, > 0 - first. Default 0.
 *  - `0` means last attribute in chain (code from above)
 *  - `-1` - before last (firmType from above)
 *  - `>0` - first (firmID from above)
 * @return {{ entity: String, attribute: UBEntityAttribute, parentAttribute: UBEntityAttribute, attributeCode: String }|undefined}
 *   Either attribute information or undefined if chain not points to attribute
 */
UBEntity.prototype.getEntityAttributeInfo = function (attributeName, depth) {
  let currentEntity = this
  let currentEntityCode = this.code
  /** @type UBEntityAttribute */
  let parentAttribute = null
  /** @type UBEntityAttribute */
  let attribute = null

  let attributeNameParts = []
  let partsCount
  let currentPart
  if (attributeName.indexOf('.') === -1) {
    currentPart = attributeName
    partsCount = 1
  } else {
    attributeNameParts = attributeName.split('.')
    partsCount = attributeNameParts.length
    currentPart = attributeNameParts[0]
  }
  if (depth && depth > 0) {
    return {
      entity: currentEntityCode,
      attribute: currentEntity.attr(currentPart),
      parentAttribute: null,
      attributeCode: currentPart
    }
  }
  if (depth === -1) partsCount -= 1 // request for before tail attribute

  let currentLevel = 0
  while (currentEntity && currentLevel < partsCount) {
    if (currentPart.indexOf('@') > -1) {
      const complexAttr = currentPart.split('@')
      currentEntityCode = complexAttr[1]
      currentEntity = this.domain.get(currentEntityCode) // real entity is text after @ parentID.code@org_department
      currentPart = complexAttr[0]
    }
    parentAttribute = attribute
    attribute = currentEntity.attributes[currentPart]
    if (!attribute) return undefined // attribute not exists in currentEntity

    if (attribute.dataType === 'Enum') { // stop on enums. Prev code will check for name also:  && attributeName === 'name'
      break
    } else if ((attribute.dataType === UBDomain.ubDataTypes.Json) &&
      (currentLevel + 1 < partsCount)) { // request to the JSON key `attrOfTypeJson.foo`
      parentAttribute = attribute
      attribute = undefined
      break
    } else {
      currentLevel += 1
      if (currentLevel < partsCount) {
        currentPart = attributeNameParts[currentLevel]
        currentEntityCode = attribute.associatedEntity
        currentEntity = attribute.getAssociatedEntity()
      }
    }
  }
  return { entity: currentEntityCode, attribute: attribute, parentAttribute: parentAttribute, attributeCode: currentPart }
}

/**
 * Returns entity attribute. Understand complex attributes like `firmID.firmType.code`
 * @param {string} attributeName
 * @param {number} [depth=0] Current recursion depth
 *  - `0` means last attribute in chain (code from above)
 *  - `-1` - before last (firmType from above)
 *  - `>0` - first (firmID from above)
 * @return {UBEntityAttribute}
 */
UBEntity.prototype.getEntityAttribute = function (attributeName, depth) {
  const info = this.getEntityAttributeInfo(attributeName, depth)
  return info ? info.attribute : undefined
}

/**
 * Returns array of entity attribute`s names
 * @param {Object|Function} [predicate] See {@link UBEntity.filterAttribute}. If empty - will return all names
 * @returns {Array<string>}
 */
UBEntity.prototype.getAttributeNames = function (predicate) {
  const attributes = []
  if (predicate) {
    _.forEach(this.filterAttribute(predicate), function (attr) {
      attributes.push(attr.code)
    })
    return attributes
  } else {
    return Object.keys(this.attributes)
  }
}

/**
 * For each attribute of type `Entity` from `fieldList` add entity code to result (duplicates are removed)
 * @param {Array<string>} [fieldList] If empty - all entity attributes will be used
 * @return {Array<string>}
 */
UBEntity.prototype.getEntityRequirements = function (fieldList) {
  const result = []
  fieldList = fieldList || this.getAttributeNames()
  for (let i = 0, L = fieldList.length; i < L; ++i) {
    const attr = this.getEntityAttribute(fieldList[i])
    if (attr && (attr.dataType === UBDomain.ubDataTypes.Entity) &&
      (result.indexOf(attr.associatedEntity) === -1)) {
      result.push(attr.associatedEntity)
    }
  }
  return result
}

/**
 * Checks entity has attribute(s) and throw error if not
 * @param {String|Array<string>} attributeNames
 * @param {string} contextMessage
 */
UBEntity.prototype.checkAttributeExist = function (attributeNames, contextMessage) {
  const me = this
  attributeNames = !Array.isArray(attributeNames) ? [attributeNames] : attributeNames
  attributeNames.forEach(function (fieldName) {
    if (!me.getEntityAttributeInfo(fieldName)) {
      throw new Error(contextMessage + (contextMessage ? ' ' : '') +
        'The entity "' + me.code + '" does not have attribute "' + fieldName + '"')
    }
  })
}

/**
 * Return entity description
 * @returns {string}
 */
UBEntity.prototype.getEntityDescription = function () {
  return this.description || this.caption
}

/**
 * Returns an array of UBEntityAttribute what points to this entity (associatedEntity === this entity)
 *   and such relation should be visible in the UI "Details" menu.
 *
 * Excluded attributes are:
 *  - `mi_*` attributes
 *  - attributes with customSetting.hiddenInDetails === true
 *  - all attributes for entities user do not have access to the `select` method
 *
 * @returns {Array<UBEntityAttribute>}
 */
UBEntity.prototype.getDetailsForUI = function () {
  const IS_ATTR_FROM_MIXIN = /^ID|mi_/
  const myName = this.name
  const result = []
  this.domain.eachEntity(function (e) {
    // [unitybase/ubjs#2] - do not display refs to attributes of "many" type
    if ((e.name !== myName) && e.haveAccessToMethod('select')) {
      e.eachAttribute(function (attr) {
        if ((attr.associatedEntity === myName) &&
            (!attr.customSettings || !attr.customSettings.hiddenInDetails) &&
            !IS_ATTR_FROM_MIXIN.test(attr.name)) {
          result.push(attr)
        }
      })
    }
  })
  return result
}

/**
 * @class
 */
function UBEntityAttributeMapping (maping) {
  /**
   * @type {UBDomain.ExpressionType}
   */
  this.expressionType = maping.expressionType
  /** @type {string} */
  this.expression = maping.expression
}

/**
 * Entity attribute
 * @param {object} attributeInfo
 * @param {string} attributeCode
 * @param {UBEntity} entity
 * @class
 */
function UBEntityAttribute (attributeInfo, attributeCode, entity) {
  // i18n already merged by entity constructor
  /**
   * @type {string}
   * @readonly
   */
  this.code = attributeCode
  /** @type {string}
  * @readonly
  */
  this.name = attributeInfo.name
  /**
   * Non enumerable (to prevent JSON.stringify circular ref) read only entity reference
   * @property {UBEntity} entity
   * @readonly
   */
  Object.defineProperty(this, 'entity', { enumerable: false, value: entity })
  /**
   * Data type
   * @type {UBDomain.ubDataTypes}
   * @readonly
   */
  this.dataType = attributeInfo.dataType || 'String'
  /**
   * Name of entity referenced by the attribute (for attributes of type `Many` - entity name from the AssociationManyData)
   * @type {string}
   * @readonly
   */
  this.associatedEntity = attributeInfo.associatedEntity
  /**
   * @type {string}
   * @readonly
   */
  this.associationAttr = attributeInfo.associationAttr
  /**
   * @type {string}
   * @readonly
   */
  this.caption = attributeInfo.caption || ''
  /**
   * @type {string}
   * @readonly
   */
  this.description = attributeInfo.description || ''
  /**
   * @type {string}
   * @readonly
   */
  this.documentation = attributeInfo.documentation || ''
  /**
   * @type {number}
   * @readonly
   */
  this.size = attributeInfo.size || 0
  /**
   * Attribute value can be empty or null
   * @type {boolean}
   * @readonly
   */
  this.allowNull = (attributeInfo.allowNull !== false)
  /**
   * Allow order by clause by this attribute
   * @type {boolean}
   * @readonly
   */
  this.allowSort = (attributeInfo.allowSort !== false)
  /**
   * @type {boolean}
   * @readonly
   */
  this.isUnique = (attributeInfo.isUnique === true)
  /**
   * @type {string}
   * @readonly
   */
  this.defaultValue = attributeInfo.defaultValue
  /**
   * Edition allowed (not verified by server side)
   * @type {Boolean}
   * @readonly
   */
  this.readOnly = (attributeInfo.readOnly === true)
  /**
   * @property {Boolean}
   * @readonly
   */
  this.isMultiLang = (attributeInfo.isMultiLang === true)
  /**
   * For attributes of type Entity enable cascade deletion on application server level (not on database level)
   * @type {Boolean}
   * @readonly
   */
  this.cascadeDelete = (attributeInfo.cascadeDelete === true)
  /**
   * For attributes of type Enum - code of enumeration group from `ubm_enum.eGroup`
   * @property {string} enumGroup
   * @readonly
   */
  this.enumGroup = attributeInfo.enumGroup
  /**
   * @type {object}
   * @readonly
   */
  this.customSettings = attributeInfo.customSettings || {}
  /**
   * For attributes of type Many - name of the many-to-many table. UB create system entity with this name and generate table during DDL generation
   * @property {string}
   * @readonly
   */
  this.associationManyData = attributeInfo.associationManyData
  /**
   * For attributes of type Document - name of BLOB store from application `storeConfig`. If empty - default store will be used
   * @type {string}
   * @readonly
   */
  this.storeName = attributeInfo.storeName
  /**
   * For attributes of type Entity. If `false` - bypass foreign key generation by DDL generator
   * @type {boolean}
   */
  this.generateFK = attributeInfo.generateFK !== false
  /**
   * If `true` - client should shows this attribute in auto-build forms and in '*' select fields
   * @type {boolean}
   */
  this.defaultView = attributeInfo.defaultView !== false
  /**
   * Optional mapping of attribute to physical data (for extended domain info only).
   * Calculated from a entity mapping collection in accordance with application connection configuration
   * @type {UBEntityAttributeMapping}
   * @readonly
   */
  this.mapping = undefined

  if (attributeInfo.mapping) {
    const me = this
    const mappingKeys = Object.keys(attributeInfo.mapping)
    mappingKeys.forEach(function (key) {
      if (!UBDomain.dialectsPriority[key]) throw new Error(`Invalid dialect ${key} in ${entity.code}.${me.code} mapping`)
    })
    if (mappingKeys.length) {
      const dialectsPriority = UBDomain.dialectsPriority[this.entity.connectionConfig.dialect]
      _.forEach(dialectsPriority, function (dialect) {
        if (attributeInfo.mapping[dialect]) {
          me.mapping = new UBEntityAttributeMapping(attributeInfo.mapping[dialect])
          return false // break loop
        }
      })
    }
  }

  /**
   * @property {string} physicalDataType
   * @readonly
   */
  this.physicalDataType = UBDomain.getPhysicalDataType(this.dataType || 'String')
  /**
   * Index of type CATALOGUE exists for attribute
   * @property {boolean} hasCatalogueIndex
   * @readonly
   */
  this.hasCatalogueIndex = attributeInfo.hasCatalogueIndex === true

  /**
   * Private settings (for extended domain info)
   * @property {object} privateSettings
   * @readonly
   */
  if (attributeInfo.privateSettings) this.privateSettings = attributeInfo.privateSettings
}

// default UBEntityAttribute props - used by JSON.stringify replacer to produce entity JSON representation
UBEntityAttribute.prototype.forJSONReplacer = {
  code: null,
  name: null,
  allowNull: true,
  allowSort: true,
  isUnique: false,
  readOnly: false,
  isMultiLang: false,
  cascadeDelete: false,
  generateFK: true,
  defaultView: true,
  physicalDataType: null,
  hasCatalogueIndex: null
}

/**
 * Return associated entity or `null` if type of attribute !==`Entity`.
 * @returns {UBEntity}
 */
UBEntityAttribute.prototype.getAssociatedEntity = function () {
  return this.associatedEntity ? this.entity.domain.get(this.associatedEntity) : null
}

/**
 * Return a JSON representation of attribute
 * WITHOUT properties which have default values
 * @returns {object}
 */
UBEntityAttribute.prototype.asPlainJSON = function () {
  return JSON.parse(JSON.stringify(this, UBDomain.jsonReplacer))
}

/**
 * Contains all properties defined in mixin section of a entity meta file
 * @class
 * @protected
 * @param {object} mixinInfo
 * @param {object} i18n
 * @param {string} mixinCode
 */
function UBEntityMixin (mixinInfo, i18n, mixinCode) {
  /**
   * Mixin code
   * @type {string}
   */
  this.code = mixinCode
  _.assign(this, mixinInfo)
  if (i18n) {
    _.assign(this, i18n)
  }
}

UBEntityMixin.prototype.forJSONReplacer = {
  enabled: true,
  code: null
}

/**
 * Is mixin enabled
 * @type {boolean}
 */
UBEntityMixin.prototype.enabled = true

/**
 * Mixin for persisting entity to a database
 * @class
 * @extends UBEntityMixin
 * @param {object} mixinInfo
 * @param {object} i18n
 * @param {string} mixinCode
 */
function UBEntityStoreMixin (mixinInfo, i18n, mixinCode) {
  UBEntityMixin.apply(this, arguments)
}
UBEntityStoreMixin.prototype = Object.create(UBEntityMixin.prototype)
UBEntityStoreMixin.prototype.constructor = UBEntityStoreMixin
// defaults
/**
 * Is `simpleAudit` enabled
 * @type {boolean}
 */
UBEntityStoreMixin.prototype.simpleAudit = false
/**
 * Use a soft delete
 * @type {boolean}
 */
UBEntityStoreMixin.prototype.safeDelete = false

/**
 * Historical data storage mixin
 * @class
 * @extends UBEntityMixin
 * @param {object} mixinInfo
 * @param {object} i18n
 * @param {string} mixinCode
 * @constructor
 */
function UBEntityHistoryMixin (mixinInfo, i18n, mixinCode) {
  UBEntityMixin.apply(this, arguments)
}
UBEntityHistoryMixin.prototype = Object.create(UBEntityMixin.prototype)
UBEntityHistoryMixin.prototype.constructor = UBEntityHistoryMixin
/**
 * A history storage strategy
 * @type {string}
 */
UBEntityHistoryMixin.prototype.historyType = 'common'
/**
 * Access control list mixin
 * @class
 * @extends UBEntityMixin
 * @param {object} mixinInfo
 * @param {object} i18n
 * @param {string} mixinCode
 */
function UBEntityAclRlsMixin (mixinInfo, i18n, mixinCode) {
  UBEntityMixin.apply(this, arguments)
}
UBEntityAclRlsMixin.prototype = Object.create(UBEntityMixin.prototype)
UBEntityAclRlsMixin.prototype.constructor = UBEntityAclRlsMixin
// defaults
UBEntityAclRlsMixin.prototype.aclRlsUseUnityName = false
UBEntityAclRlsMixin.prototype.aclRlsSelectionRule = 'exists'

/**
 * Full text search mixin
 * @class
 * @extends UBEntityMixin
 * @param {object} mixinInfo
 * @param {object} i18n
 * @param {string} mixinCode
 */
function UBEntityFtsMixin (mixinInfo, i18n, mixinCode) {
  UBEntityMixin.apply(this, arguments)
}
UBEntityFtsMixin.prototype = Object.create(UBEntityMixin.prototype)
UBEntityFtsMixin.prototype.constructor = UBEntityFtsMixin
/**
 * scope
 * @type {string}
 */
UBEntityFtsMixin.prototype.scope = 'connection' // sConnection
/**
 * Data provider type
 * @type {string}
 */
UBEntityFtsMixin.prototype.dataProvider = 'mixin'// dcMixin
/**
 * Attribute level security mixin
 * @param {object} mixinInfo
 * @param {object} i18n
 * @param {string} mixinCode
 * @constructor
 * @extends UBEntityMixin
 */
function UBEntityAlsMixin (mixinInfo, i18n, mixinCode) {
  UBEntityMixin.apply(this, arguments)
}
UBEntityAlsMixin.prototype = Object.create(UBEntityMixin.prototype)
UBEntityAlsMixin.prototype.constructor = UBEntityAlsMixin
/**
 * Is optimistic
 * @type {boolean}
 */
UBEntityAlsMixin.prototype.alsOptimistic = true

UBDomain.UBEntity = UBEntity
UBDomain.UBModel = UBModel
UBDomain.UBEntity.UBEntityAttribute = UBEntityAttribute

module.exports = UBDomain
