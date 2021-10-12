/*
 created by xmax 05.04.2013
 rewrite to ES6 & ubcli by pavel.mash 08.2016
 */
const _ = require('lodash')
const UBDomain = require('@unitybase/cs-shared').UBDomain
const { TableDefinition, strIComp } = require('./AbstractSchema')

/**
 * Return name of a table for entity (depending of a mapping)
 * @param {UBEntity} entity
 * @returns {string}
 */
function getTableDBName (entity) {
  return (entity.mapping && entity.mapping.selectName) ? entity.mapping.selectName : entity.name
}

/**
 * Creates the name of the foreign key as it should be in the database
 * @param {string} sourceTableName
 * @param {string} sourceColumnName
 * @param {string} destTableName
 * @param {string|DDLGenerator.dbDialectes} dialect
 * @return {string}
 */
function genFKName (sourceTableName, sourceColumnName, destTableName, dialect = DDLGenerator.dbDialectes.AnsiSQL) {
  const MAX_IDENTIFIER_LEN = DDLGenerator.MAX_DB_IDENTIFIER_LENGTHS[dialect]
  let prefix = 'FK_' + sourceTableName.toUpperCase() + '_'
  let colName = sourceColumnName.toUpperCase()
  let suffix = '_REF'
  let delta
  let baseLen = prefix.length + destTableName.length + 1

  if ((baseLen + colName.length + suffix.length > MAX_IDENTIFIER_LEN)) {
    delta = MAX_IDENTIFIER_LEN - baseLen - colName.length
    if (delta >= 0) {
      suffix = suffix.substring(0, delta)
    } else {
      suffix = ''
      delta = MAX_IDENTIFIER_LEN - baseLen
      if ((delta < colName.length) && (delta > 2)) {
        colName = colName.substring(0, delta)
      } else {
        colName = colName.substring(0, 3)
        baseLen = prefix.length + 1 + colName.length
        delta = MAX_IDENTIFIER_LEN - baseLen
        if ((delta > 0) && (delta < destTableName.length)) {
          destTableName = destTableName.substring(0, delta)
        } else {
          destTableName = destTableName.substring(0, 3)
          baseLen = 4 + destTableName.length + 1 + colName.length
          if (MAX_IDENTIFIER_LEN - baseLen > 4) {
            sourceTableName = sourceTableName.substring(0, MAX_IDENTIFIER_LEN - baseLen)
            prefix = 'FK_' + sourceTableName.toUpperCase() + '_'
          }
        }
      }
    }
  }
  return prefix + colName + suffix + '_' + destTableName.toUpperCase()
}

/**
 * Return the name of the attribute in the database according to mapping and dialect
 * @param {UBEntity} entity
 * @param {String} attributeCode
 */
function getAttributeDBName (entity, attributeCode) {
  const attribute = entity.attributes[attributeCode]
  if (!attribute) {
    throw new Error(`Attribute ${attributeCode} does not exist in entity ${entity.name}`)
  }
  const mappedTo = attribute.mapping
  if (mappedTo && (mappedTo.expressionType === UBDomain.ExpressionType.Field) && mappedTo.expression) {
    return mappedTo.expression
  } else {
    return attributeCode
  }
}

function createDefUniqueIndex (dialect, tableDef, sqlAlias, attrName, isHistory, storage) {
  const xDef = {
    isUnique: true,
    name: formatName('UIDX_', sqlAlias, `_${attrName.toUpperCase()}`, dialect),
    keys: [attrName]
  }
  if (isHistory) xDef.keys.push('mi_dateTo')
  // xDef.keys.push('mi_data_id');
  if (storage.safeDelete) xDef.keys.push('mi_deleteDate')
  tableDef.addIndex(xDef)
}

/**
 * Create a shorten name based on DDLGenerator.MAX_DB_IDENTIFIER_LENGTHS for a given DB dialect
 * @param prefix
 * @param root
 * @param suffix
 * @param {string|DDLGenerator.dbDialectes} dialect One of DDLGenerator.dbDialectes
 * @returns {string}
 */
function formatName (prefix, root, suffix, dialect = DDLGenerator.dbDialectes.AnsiSQL) {
  const MAX_IDENTIFIER_LEN = DDLGenerator.MAX_DB_IDENTIFIER_LENGTHS[dialect]
  const totalLen = prefix.length + root.length + suffix.length
  let deltaLen
  if (totalLen > MAX_IDENTIFIER_LEN) {
    deltaLen = totalLen - MAX_IDENTIFIER_LEN
    if (deltaLen < suffix.length - 1) {
      suffix = suffix.substring(0, suffix.length - deltaLen)
    } else {
      deltaLen = deltaLen - (suffix.length - 2)
      suffix = suffix.substring(0, 2)
      if (deltaLen < root.length - 1) {
        root = root.substring(0, root.length - deltaLen)
      }
    }
  }
  return prefix + root + suffix
}

class DDLGenerator {
  constructor () {
    /**
     * @type {Array<TableDefinition>}
     */
    this.referenceTableDefs = []
    // this.connections = {}
    this.relatedEntities = []
    this.isUnsafe = false
  }

  /**
   * Generate DD SQL for entity list
   * @param {Array<string>} names Entity names (may be regular expressions)
   * @param {SyncConnection} conn
   * @param {boolean} [unsafe=false]
   * @return {Object} DDL SQL
   */
  generateDDL (names, conn, unsafe = false) {
    const result = {}
    const alreadyTraversed = new WeakSet()

    this.isUnsafe = unsafe
    const domain = conn.getDomainInfo(true) // request extended domain info
    const namesRe = names.map((re) => new RegExp(re))

    const forGeneration = _.filter(domain.entities, (entity) => {
      for (const re of namesRe) {
        // ignore DDL generation for External & Virtual entities
        if (re.test(entity.name) && (entity.dsType === UBDomain.EntityDataSourceType.Normal) && !entity.isManyManyRef) {
          // many-to-many storage tables are added by addManyTable
          return true
        }
      }
      return false
    })

    for (const entity of forGeneration) {
      alreadyTraversed.add(entity)
      this.createReference(conn, entity)
    }
    // load referenced object for comparator
    this.relatedEntities.forEach((entityName) => {
      const entity = domain.get(entityName)
      if (alreadyTraversed.has(entity) || (entity.dsType !== UBDomain.EntityDataSourceType.Normal)) {
        return // continue
      }
      const tabDef = this.createReference(conn, entity)
      alreadyTraversed.add(entity)
      if (tabDef) {
        tabDef.doComparision = false
      }
    })

    const tablesByConnection = _.groupBy(
      this.referenceTableDefs,
      (tableDef) => tableDef.__entity.connectionName
    )

    for (const dbConnCfg of domain.connections) {
      if (tablesByConnection[dbConnCfg.name] && tablesByConnection[dbConnCfg.name].length) {
        /** @type DBAbstract */
        const DatabaseInfo = require(`./db/${dbConnCfg.dialect}`)
        const maker = new DatabaseInfo(conn, dbConnCfg, tablesByConnection[dbConnCfg.name])
        console.log(`Loading database metadata for connection ${maker.dbConnectionConfig.name} (${maker.dbConnectionConfig.dialect})...`)
        console.time('Loaded in')
        maker.loadDatabaseMetadata()
        console.timeEnd('Loaded in')
        maker.compare()
        result[dbConnCfg.name] = maker.generateStatements()
      }
    }
    return result
  }

  /**
   * Create reference table structure based on metadata
   * @param {SyncConnection} conn
   * @param {UBEntity} entity
   * @return {TableDefinition}
   */
  createReference (conn, entity) {
    const addedAttributes = new Map()
    const sqlAlias = (entity.sqlAlias || entity.name).toUpperCase()
    const isHistory = entity.mixins.dataHistory
    const storage = entity.mixins.mStorage
    const dialect = entity.connectionConfig.dialect
    const supportLang = entity.connectionConfig.supportLang
    const entityTableName = getTableDBName(entity)
    const tabNameInUpper = entityTableName.toUpperCase()
    let lang

    if (_.find(this.referenceTableDefs, (tabDef) => tabDef.name.toUpperCase() === tabNameInUpper)) {
      return null // already added
    }
    const tableDef = new TableDefinition({
      name: entityTableName,
      caption: entity.description || entity.caption,
      multitenancy: (entity.mixins.multitenancy && (entity.mixins.multitenancy.enabled !== false))
    })

    const defaultLang = conn.getAppInfo().defaultLang

    _.forEach(entity.attributes,
      /** @param {UBEntityAttribute} attribute
       * @param {string} attrCode
       */
      (attribute, attrCode) => {
        if (attribute.mapping && (attribute.mapping.expressionType === UBDomain.ExpressionType.Expression)) {
          return // calculated attribute
        }
        addedAttributes.set(attrCode.toUpperCase(), attribute)
        const m = attribute.mapping
        if (m && (m.expressionType === UBDomain.ExpressionType.Field) && m.expression) {
          if (!strIComp(attrCode, m.expression) && addedAttributes.has(m.expression.toUpperCase())) {
            return // use a original attribute
          }
          if (!strIComp(attrCode, m.expression) && entity.attributes[m.expression]) return // Entity attribute mapped to other attribute
          attrCode = m.expression // use a field name from mapping
          if (tableDef.columnByName(attrCode)) return // already added
        }
        const attrName = attrCode.toUpperCase()
        const attrNameF = attrCode.toUpperCase()
        if (!attrNameF) {
          throw new Error('attrNameF is undefined for ' + attrCode)
        }

        if (attribute.dataType === UBDomain.ubDataTypes.Many) {
          this.addManyTable(entity, attribute)
          return
        }
        DDLGenerator.addTableField(tableDef, attribute, attrCode, null /* attrCode */)
        // multi language
        if (attribute.isMultiLang && ((attribute.dataType === UBDomain.ubDataTypes.String) || (attribute.dataType === UBDomain.ubDataTypes.Text))) {
          for (lang of supportLang) {
            if (lang !== defaultLang) {
              DDLGenerator.addTableField(tableDef, attribute, attrCode + '_' + lang, attrCode)
            }
          }
        }

        if (attribute.dataType === UBDomain.ubDataTypes.Boolean) {
          const fName = formatName(`CHK_${sqlAlias}_`, attrCode, '_BOOL', entity.connectionConfig.dialect)
          tableDef.addCheckConstr({
            name: fName,
            column: attrCode,
            type: 'bool'
          })
        }

        if ((attribute.dataType === UBDomain.ubDataTypes.Entity) && (attribute.name !== 'ID')) {
          this.relatedEntities.push(attribute.associatedEntity)
          const associatedEntity = attribute.getAssociatedEntity()
          if (associatedEntity.connectionName === entity.connectionName) { // referential constraint between different connection not supported
            tableDef.addFK({
              name: genFKName(sqlAlias, attrNameF, (associatedEntity.sqlAlias || associatedEntity.name || ''), entity.connectionConfig.dialect),
              keys: [getAttributeDBName(attribute.entity, attribute.name).toUpperCase()],
              references: getTableDBName(associatedEntity),
              // in case associated entity is external - estimate a primary key column name ('ID" can be mapped)
              // for associated entities what a subject of DDL generation primary key columns retrieved from DB
              refPkDefColumn: getAttributeDBName(associatedEntity, 'ID'),
              generateFK: attribute.generateFK
            })
          }
          // indexing
          if (!attribute.isUnique) {
            tableDef.addIndex({
              name: formatName('IDX_', sqlAlias, `_${attrNameF}`, entity.connectionConfig.dialect),
              isUnique: false,
              keys: [attrName]
            })
            if (attribute.isMultiLang) {
              for (lang of supportLang) {
                if (lang !== defaultLang) {
                  tableDef.addIndex({
                    name: formatName('IDX_', sqlAlias, `_${attrNameF}_${lang}`, entity.connectionConfig.dialect),
                    isUnique: false,
                    keys: [attrName]
                  })
                }
              }
            }
          }
        }

        if (attribute.isUnique) {
          createDefUniqueIndex(dialect, tableDef, sqlAlias, attrName, isHistory, storage)
          if (attribute.isMultiLang) {
            for (lang of supportLang) {
              if (lang !== defaultLang) createDefUniqueIndex(dialect, tableDef, sqlAlias, attrName + '_' + lang, isHistory, storage)
            }
          }
        }
      }
    )

    if (entity.mixins.tree) {
      tableDef.addIndex({
        name: formatName('IDX_', sqlAlias, '_TREEPATH', entity.connectionConfig.dialect),
        isUnique: false,
        keys: ['mi_treePath']
      })
    }

    if (entity.mixins.unity) {
      const u = entity.mixins.unity
      this.relatedEntities.push(u.entity)
      const refTo = entity.domain.get(u.entity)
      tableDef.addFK({
        name: genFKName(sqlAlias, 'id', (refTo.sqlAlias || refTo.name || ''), entity.connectionConfig.dialect),
        keys: ['ID'],
        references: refTo.name,
        refPkDefColumn: getAttributeDBName(refTo, 'ID'),
        generateFK: true
      })
    }

    if (entity.mixins.dataHistory) {
      let keys = ['mi_dateTo']
      if (entity.mixins.mStorage && entity.mixins.mStorage.safeDelete) {
        keys.push('mi_deleteDate')
      }
      tableDef.addIndex({
        name: formatName('IDX_', sqlAlias, '_DTODD', entity.connectionConfig.dialect),
        isUnique: false,
        keys: keys
      })
      tableDef.addCheckConstr({
        name: 'CHK_' + sqlAlias + '_HIST',
        expression: 'mi_dateFrom <= mi_dateTo',
        type: 'custom'
      })

      keys = ['mi_dateFrom', 'mi_data_id']
      if (entity.mixins.mStorage && entity.mixins.mStorage.safeDelete) {
        keys.push('mi_deleteDate')
        tableDef.addIndex({
          name: formatName('UIDX_', sqlAlias, '_HIST', entity.connectionConfig.dialect),
          isUnique: true,
          keys
        })
      }
    }

    if (entity.attributes.ID) { // in case ID is mapped to non-uniq attribute - skip primary key generation. Example in tst_virtualID.meta
      let createPK = true
      const m = entity.attributes.ID.mapping
      if (m && m.expressionType === 'Field') {
        if (entity.attributes[m.expression]) createPK = entity.attributes[m.expression].isUnique
      }
      if (createPK) {
        tableDef.primaryKey = { name: 'PK_' + sqlAlias, keys: [getAttributeDBName(entity, 'ID')] } // [UB-1386]
      }
    }

    // reference tables for SUFFIXES index storage
    if (entity.dbExtensions) {
      _.forEach(entity.dbExtensions, (s, tblName) => {
        if (s.type === 'SUFFIXES') {
          this.addSuffixIndexTable(entity, entity.attr(s.attribute), tblName)
        }
      })
    }
    this.addCustomElements(tableDef, entity)

    tableDef.__entity = entity
    this.referenceTableDefs.push(tableDef)
    return tableDef
  }

  /**
   * Add dbKeys and dbExtension indexes
   * @param {TableDefinition} tableDef
   * @param {UBEntity} entity
   */
  addCustomElements (tableDef, entity) {
    let dbKeys
    let haveDeleteDateInFields = false
    const dialect = entity.connectionConfig.dialect
    const isHistory = entity.mixins.dataHistory
    function formatBrackets (stringToFormat, ...values) {
      const FORMAT_RE = /{(\d+)}/g
      return stringToFormat.replace(FORMAT_RE, function (m, i) {
        return values[i]
      })
    }
    if (entity.dbKeys) {
      dbKeys = entity.dbKeys
      _.forEach(dbKeys, (fields, dbKey) => {
        const indexDef = { name: dbKey, isUnique: true, keys: [], keyOptions: {} }
        _.forEach(fields, (options, field) => {
          let fieldKey = field
          if (options.func && (DDLGenerator.isOracle(dialect))) {
            if (options.func.indexOf('{0}') === -1) {
              fieldKey = options.func + '(' + fieldKey + ')'
            } else {
              fieldKey = formatBrackets(options.func, fieldKey)
            }
          }
          if (options.sort && (DDLGenerator.isEqualStrings(options.sort, 'DESC'))) {
            fieldKey += ' DESC'
          }
          indexDef.keys.push(fieldKey)
          if (field === 'mi_deleteDate') {
            haveDeleteDateInFields = true
          }
        })
        if (isHistory) {
          indexDef.keys.push('mi_dateFrom')
        }
        if (entity.mixins.mStorage && entity.mixins.mStorage.safeDelete && !haveDeleteDateInFields) {
          indexDef.keys.push('mi_deleteDate')
        }
        tableDef.addIndex(indexDef)
      })
    }
    if (entity.dbExtensions) {
      const IS_SQL_SERVER = DDLGenerator.isMSSQL(dialect)
      if (IS_SQL_SERVER) { // merge CATALOGUE DBExtensions for SQL server into one FTS index
        const msSqlFtsIdx = { name: '__CATALOGUE__', keys: [], indexType: 'CATALOGUE' }
        _.forEach(entity.dbExtensions, (command) => {
          if (command.type === 'CATALOGUE') {
            msSqlFtsIdx.keys.push(...Object.keys(command.definition.keys))
          }
        })
        if (msSqlFtsIdx.keys.length) {
          msSqlFtsIdx.keys.sort()
          tableDef.addIndex(msSqlFtsIdx, true)
        }
      }
      _.forEach(entity.dbExtensions, (commands, dbKey) => {
        if (!commands.type) {
          commands.type = 'OTHER'
        }
        let objDef
        if (commands.definition && (commands.type !== 'OTHER')) {
          const definition = commands.definition
          switch (commands.type) {
            case 'INDEX':
            case 'CATALOGUE':
              if (!(IS_SQL_SERVER && commands.type === 'CATALOGUE')) { // already added
                objDef = { name: dbKey, keys: [], isUnique: definition.isUnique }
                if (commands.type === 'CATALOGUE') objDef.indexType = commands.type
                _.forEach(definition.keys, (fKeyOptions, fkeyText) => {
                  if (fKeyOptions.func && DDLGenerator.isOracle(dialect)) {
                    if (fKeyOptions.func.indexOf('{0}') === -1) {
                      fkeyText = fKeyOptions.func + '(' + fkeyText + ')'
                    } else {
                      fkeyText = formatBrackets(fKeyOptions.func, fkeyText)
                    }
                  }
                  if (fKeyOptions.sort && (DDLGenerator.isEqualStrings(fKeyOptions.sort, 'DESC'))) {
                    fkeyText += ' DESC'
                  }
                  objDef.keys.push(fkeyText)
                })
                tableDef.addIndex(objDef, true)
              }
              break
            case 'CHECK':
              objDef = { name: dbKey, type: 'custom', expression: definition.check }
              tableDef.addCheckConstr(objDef, true)
              break
            case 'FK':
              objDef = { name: dbKey, keys: [definition.key], references: definition.references, generateFK: true }
              this.relatedEntities.push(objDef.references)
              tableDef.addFK(objDef, true)
              break
          }
        } else {
          objDef = { name: dbKey, expression: commands[DDLGenerator.dbDialectes[dialect]] }
          tableDef.addOther(objDef)
        }
      })
    }
  }

  /**
   *
   * @param {TableDefinition} tableDef
   * @param {UBEntityAttribute} attribute
   * @param {String} fieldName
   * @param {String} [baseName=null]
   */
  static addTableField (tableDef, attribute, fieldName, baseName = null) {
    let dataType, size, prec, enumGroup
    let allowNull = attribute.allowNull
    let refTable
    // convert UB type to physical type
    switch (attribute.dataType) {
      case UBDomain.ubDataTypes.String:
        dataType = 'NVARCHAR'
        if (attribute.hasCatalogueIndex && DDLGenerator.isOracle(attribute.entity.connectionConfig.dialect)) {
          dataType = 'VARCHAR' // Oracle can't create CTXCAT index for NVARCHAR
        }
        size = attribute.size
        if (attribute.size > DDLGenerator.MAX_NVARCHAR[attribute.entity.connectionConfig.dialect]) {
          throw new Error(`Specified length of attribute "${attribute.entity.name}.${attribute.name}" too long for ${attribute.entity.connectionConfig.dialect}. Max value is ${DDLGenerator.MAX_NVARCHAR[attribute.entity.connectionConfig.dialect]}`)
        }
        break
      case UBDomain.ubDataTypes.Enum:
        dataType = 'NVARCHAR'
        size = 32
        enumGroup = attribute.enumGroup
        break
      case UBDomain.ubDataTypes.Int:
        dataType = 'INTEGER'
        break
      case UBDomain.ubDataTypes.BigInt:
        dataType = 'BIGINT'
        break
      case UBDomain.ubDataTypes.Float:
        dataType = 'FLOAT'
        size = 19
        prec = UBDomain.FLOATING_SCALE_PRECISION
        break
      case UBDomain.ubDataTypes.Currency:
        dataType = 'CURRENCY'
        size = 19
        prec = 2
        break
      case UBDomain.ubDataTypes.Boolean:
        dataType = 'BOOLEAN'
        allowNull = false
        break
      case UBDomain.ubDataTypes.DateTime:
        dataType = 'DATETIME'
        break
      case UBDomain.ubDataTypes.Date:
        dataType = 'DATETIME'
        break
      case UBDomain.ubDataTypes.Text:
        dataType = 'TEXT'
        break
      case UBDomain.ubDataTypes.ID:
        dataType = 'BIGINT'
        allowNull = false
        break
      case UBDomain.ubDataTypes.Entity:
        dataType = 'BIGINT'
        refTable = getTableDBName(attribute.entity.domain.get(attribute.associatedEntity))
        break
      case UBDomain.ubDataTypes.Document:
        dataType = 'NVARCHAR'
        size = DDLGenerator.MAX_NVARCHAR[attribute.entity.connectionConfig.dialect]
        break
      case UBDomain.ubDataTypes.TimeLog:
        dataType = 'BIGINT'
        break
      case UBDomain.ubDataTypes.BLOB:
        dataType = 'BLOB'
        break
      case UBDomain.ubDataTypes.Json:
        dataType = 'JSON'
        size = DDLGenerator.MAX_NVARCHAR[attribute.entity.connectionConfig.dialect]
        break
      default:
        throw new Error(`Unknown data type "${attribute.dataType}" for "${attribute.entity.name}.${attribute.name}"`)
    }
    tableDef.addColumn({
      name: fieldName,
      dataType,
      description: attribute.description || attribute.caption,
      allowNull,
      defaultValue: (attribute.defaultValue ? attribute.defaultValue : null),
      defaultConstraintName: attribute.defaultValue
        ? formatName(attribute.entity.sqlAlias || attribute.entity.name, `_${fieldName.toUpperCase()}`, '_DEF', attribute.entity.connectionConfig.dialect)
        : '',
      size,
      prec,
      enumGroup,
      refTable,
      baseName
    })
  }

  /**
   * Add references definition for "Many" attribute storage table
   * @param {UBEntity} entity
   * @param {UBEntityAttribute} attribute
   */
  addManyTable (entity, attribute) {
    const associatedEntity = entity.domain.get(attribute.associatedEntity)
    this.relatedEntities.push(attribute.associatedEntity)
    const tableDef = new TableDefinition({
      name: attribute.associationManyData,
      caption: ''
    })
    tableDef.__entity = entity.domain.get(attribute.associationManyData)
    tableDef.addColumn({
      name: 'sourceID',
      dataType: 'BIGINT',
      allowNull: false
    })
    tableDef.addColumn({
      name: 'destID',
      dataType: 'BIGINT',
      allowNull: false
    })
    tableDef.primaryKey = { name: 'PK_' + attribute.associationManyData, keys: ['sourceID', 'destID'] }
    tableDef.addFK({
      name: genFKName(attribute.associationManyData, 'SOURCEID', entity.sqlAlias, entity.connectionConfig.dialect),
      keys: ['sourceID'.toUpperCase()],
      references: getTableDBName(entity),
      refPkDefColumn: getAttributeDBName(entity, 'ID'),
      generateFK: true
    })
    tableDef.addFK({
      name: genFKName(attribute.associationManyData, 'DESTID', associatedEntity.sqlAlias, entity.connectionConfig.dialect),
      keys: ['destID'.toUpperCase()],
      references: getTableDBName(associatedEntity),
      refPkDefColumn: getAttributeDBName(associatedEntity, 'ID'),
      generateFK: true
    })
    tableDef.addIndex({
      name: formatName('IDX_', attribute.associationManyData, '_DESTID', entity.connectionConfig.dialect),
      keys: ['destID'.toUpperCase()]
    })
    tableDef.isIndexOrganized = true
    this.referenceTableDefs.push(tableDef)
  }

  /**
   * Add references table definition for storing data of "SUFFIX" index
   * @param {UBEntity} entity
   * @param {UBEntityAttribute} attribute
   * @param {string} tblName
   */
  addSuffixIndexTable (entity, attribute, tblName) {
    const tableDef = new TableDefinition({
      name: tblName,
      caption: `SUFFIX index storage for ${entity.name}.${attribute.name}`
    })
    tableDef.__entity = entity
    tableDef.addColumn({
      name: 'tail',
      dataType: 'NVARCHAR',
      size: attribute.size,
      allowNull: false
    })
    tableDef.addColumn({
      name: 'sourceID',
      dataType: 'BIGINT',
      allowNull: false
    })
    // primary key with tail+sourceID cause deadlocks on SQL Server
    // tableDef.primaryKey = { name: 'PK_' + tblName, keys: ['tail', 'sourceID'] }
    // tableDef.addFK({
    //   name: genFKName(tblName, 'SOURCEID', entity.sqlAlias, entity.connectionConfig.dialect),
    //   keys: ['sourceID'.toUpperCase()],
    //   references: getTableDBName(entity),
    //   generateFK: true
    // })
    // tableDef.isIndexOrganized = true
    tableDef.addIndex({
      name: formatName('IDX_', tblName, '_SOURCEID', entity.connectionConfig.dialect),
      keys: ['sourceID'.toUpperCase()]
    })
    tableDef.addIndex({
      name: formatName('IDX_', tblName, '_TAIL', entity.connectionConfig.dialect),
      keys: ['tail'.toUpperCase()]
    })
    this.referenceTableDefs.push(tableDef)
  }

  /**
   * @param {String} dialect
   * @returns {boolean}
   */
  static isOracle (dialect) {
    return dialect.startsWith('Oracle')
  }

  /**
   * @param {String} dialect
   * @returns {boolean}
   */
  static isMSSQL (dialect) {
    return dialect.startsWith('MSSQL')
  }

  static isPostgre (dialect) {
    return (dialect === DDLGenerator.dbDialectes.PostgreSQL)
  }

  static isEqualStrings (a, b) {
    return _.isString(a) && _.isString(b) && (a.toUpperCase() === b.toUpperCase())
  }
}

DDLGenerator.specialColumns = {
  mi_owner: { default: 10 },
  mi_createUser: { default: 10 },
  mi_createDate: { defaultExpr: 'currentDate' },
  mi_modifyUser: { default: 10 },
  mi_modifyDate: { defaultExpr: 'currentDate' }
}

DDLGenerator.dialectsPriority = {
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
 * @enum
 */
DDLGenerator.dbDialectes = {
  AnsiSQL: 'AnsiSQL',
  Oracle: 'Oracle',
  MSSQL: 'MSSQL',
  MSSQL2008: 'MSSQL2008',
  MSSQL2012: 'MSSQL2012',
  Oracle9: 'Oracle9',
  Oracle10: 'Oracle10',
  Oracle11: 'Oracle11',
  SQLite3: 'SQLite3',
  PostgreSQL: 'PostgreSQL',
  Firebird: 'Firebird'
}

DDLGenerator.MAX_DB_IDENTIFIER_LENGTHS = {
  AnsiSQL: 30,
  Oracle: 30,
  MSSQL: 116,
  MSSQL2008: 116,
  MSSQL2012: 116,
  Oracle9: 30,
  Oracle10: 30,
  Oracle11: 30,
  Oracle12: 116,
  SQLite3: 128,
  PostgreSQL: 63,
  Firebird: 30
}

DDLGenerator.MAX_NVARCHAR = {
  AnsiSQL: 4000,
  Oracle: 2000,
  MSSQL: 4000,
  MSSQL2008: 4000,
  MSSQL2012: 4000,
  Oracle9: 2000,
  Oracle10: 2000,
  Oracle11: 2000,
  Oracle12: 2000,
  SQLite3: 4000,
  PostgreSQL: 4000,
  Firebird: 4000
}

DDLGenerator.SEQUENCES_SUPPORTED = {
  AnsiSQL: false,
  Oracle: true,
  MSSQL: true,
  MSSQL2008: true,
  MSSQL2012: true,
  Oracle9: true,
  Oracle10: true,
  Oracle11: true,
  Oracle12: true,
  SQLite3: false,
  PostgreSQL: true,
  Firebird: true
}

module.exports = DDLGenerator
