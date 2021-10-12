const _ = require('lodash')
const { strIComp } = require('../AbstractSchema')
const UBDomain = require('@unitybase/cs-shared').UBDomain
const VARCHAR_MAX_RE = /\(.+\)/
/**
 * Abstract class for database metadata
 * @author pavel.mash on 11.11.2016
 */
class DBAbstract {
  /**
   * @param {SyncConnection} conn
   * @param {DBConnectionConfig} dbConnectionConfig
   * @param {Array<TableDefinition>} referencedTables
   * @param {boolean} [isUnsafe=true] do not comment out a unsafe DB operations
   */
  constructor (conn, dbConnectionConfig, referencedTables, isUnsafe = true) {
    this.dbConnectionConfig = dbConnectionConfig
    /** @type {Array<TableDefinition>} */
    this.refTableDefs = referencedTables
    this.conn = conn
    /** @type {Array<TableDefinition>} */
    this.dbTableDefs = []
    /**
     * Array of upper-cased sequence names as is present in database
     * @type {Array<string>}
     */
    this.sequencesDefs = []
    /**
     * Array of upper-cased sequence names as is wanted by metadata
     * @type {Array<string>}
     */
    this.wantedSequences = []
    // calculate wanted sequences
    referencedTables.forEach(tableDef => {
      const entity = tableDef.__entity

      // for a primary key generators, what don't mapped to the select statement
      if (entity.mapping && entity.mapping.pkGenerator && (entity.mapping.pkGenerator.indexOf('select ') < 0)) {
        const seqUpper = entity.mapping.pkGenerator.toUpperCase()
        if (!this.wantedSequences.includes(seqUpper)) {
          this.wantedSequences.push(seqUpper)
        }
      }
      // for cached entities
      if ((entity.cacheType === UBDomain.EntityCacheTypes.Entity) ||
        (entity.cacheType === UBDomain.EntityCacheTypes.SessionEntity)
      ) {
        const seqUpper = `S_${tableDef.name.toUpperCase()}`
        if (!this.wantedSequences.includes(seqUpper)) {
          this.wantedSequences.push(seqUpper)
        }
      }
    })
    this.defaultLang = conn.getAppInfo().defaultLang
    this.isUnsafe = isUnsafe
    this.DDL = {
      sys: { order: 10, statements: [], description: 'System objects' }, // 'SET TRANSACTION ISOLATION LEVEL READ COMMITTED'
      dropFK: { order: 20, statements: [], description: 'Drop foreign keys' },
      dropIndex: { order: 30, statements: [], description: 'Drop indexes' },
      dropPK: { order: 40, statements: [], description: 'Drop primary keys' },
      dropDefault: { order: 50, statements: [], description: 'Drop default constraints' },
      dropCheckC: { order: 60, statements: [], description: 'Drop check constraints' },
      dropSequence: { order: 70, statements: [], description: 'Drop sequences' },

      createTable: { order: 80, statements: [], description: 'Create tables' },
      addColumn: { order: 90, statements: [], description: 'Add columns' },
      alterColumn: { order: 100, statements: [], description: 'Alter columns' },
      updateColumn: { order: 110, statements: [], description: '! update values for known or estimated changes' },
      rename: { order: 120, statements: [], description: 'Renamed objects' },
      setDefault: { order: 130, statements: [], description: 'Set new default' },
      alterColumnNotNull: {
        order: 140,
        statements: [],
        description: 'Alter columns set not null where was null allowed'
      },

      createPK: { order: 150, statements: [], description: 'Create primary keys' },
      createIndex: { order: 160, statements: [], description: 'Create indexes' },
      createCheckC: { order: 170, statements: [], description: 'Create check constraint' },
      createFK: { order: 180, statements: [], description: 'Create foreign keys' },
      createSequence: { order: 190, statements: [], description: 'Create sequence' },
      others: {
        order: 1200,
        statements: [],
        description: 'Create other object defined in dbExtensions section entity domain'
      },

      dropColumn: { order: 210, statements: [], description: 'drop columns' },

      caption: { order: 220, resultInSingleStatement: true, statements: [], description: 'Annotate an objects' },
      warnings: { order: 230, statements: [], description: 'Warnings' }
    }
  }

  /**
   * Load information from a database schema definition into this.dbTableDefs
   * @abstract
   */
  loadDatabaseMetadata () {
    throw new Error('Abstract loadDatabaseMetadata')
  }

  addWarning (text) {
    this.DDL.warnings.statements.push(text)
  }

  /**
   * @abstract
   * @param {TableDefinition} table
   * @param {string} oldName
   * @param {string} newName
   * @param {string} typeObj
   */
  genCodeRename (table, oldName, newName, typeObj) {
    throw new Error('Abstract genCodeRename')
  }

  /**
   * @param {TableDefinition} table
   * @param {FieldDefinition} column
   * @param {String} updateType
   * @param {Object} [value] optional for updateType updConst
   */
  genCodeUpdate (table, column, updateType, value) {
    function quoteIfNeed (v) {
      if (column.enumGroup) return v // do not quoter enums
      return column.isString
        ? (!column.defaultValue && (column.refTable || column.enumGroup)
            ? v.replace(/'/g, "''")
            : v === 'ID'
              ? 'ID' // do not quoter ID
              : "'" + v.replace(/'/g, '') + "'")
        : v
    }
    let possibleDefault
    switch (updateType) {
      case 'updConstComment':
        this.DDL.updateColumn.statements.push(
          `-- update ${table.name} set ${column.name} = ${quoteIfNeed(value)} where ${column.name} is null`
        )
        break
      case 'updConst':
        this.DDL.updateColumn.statements.push(
          `update ${table.name} set ${column.name} = ${quoteIfNeed(value)} where ${column.name} is null`
        )
        break
      case 'updNull':
        possibleDefault = column.defaultValue ? quoteIfNeed(column.defaultValue) : '[Please_set_value_for_notnull_field]'
        this.DDL.updateColumn.statements.push(
          `-- update ${table.name} set ${column.name} = ${possibleDefault} where ${column.name} is null`
        )
        break
    }
  }

  /**
   * TODO rename to Annotate
   * Implemenation must generate a annotation for a table / column
   * @abstract
   */
  genCodeSetCaption (tableName, column, value, oldValue) {
    throw new Error('Abstract genCodeSetCaption')
  }

  /**
   * @abstract
   */
  genCodeCreateCheckC (table, checkConstr) {
    throw new Error('Abstract genCodeCreateCheckC')
  }

  /**
   * @abstract
   */
  genCodeDropColumn (tableDB, columnDB) {
    throw new Error('Abstract genCodeDropColumn')
  }

  /**
   * @abstract
   */
  genCodeSetDefault (table, column) {
    throw new Error('Abstract genCodeSetDefault')
  }

  /**
   * @abstract
   * @param {TableDefinition} table
   * @param {FieldDefinition} column
   */
  genCodeDropDefault (table, column) {
    throw new Error('Abstract genCodeDropDefault')
  }

  /**
   * @abstract
   */
  genCodeAlterColumn (table, tableDB, column, columnDB, typeChanged, sizeChanged, allowNullChanged) {
    throw new Error('Abstract genCodeAlterColumn')
  }

  /**
   * @abstract
   * @param {TableDefinition} table
   * @param {FieldDefinition} column
   * @param {boolean} [delayedNotNull] optional true to set not null in alter
   */
  genCodeAddColumn (table, column, delayedNotNull) {
    throw new Error('Abstract genCodeAddColumn')
  }

  /**
   * Generate code for add language column
   * TODO rename to addLanguageColumn
   * @abstract
   * @param {TableDefinition} table
   * @param {FieldDefinition} column
   * @param baseColumn
   */
  genCodeAddColumnBase (table, column, baseColumn) {
    throw new Error('Abstract genCodeAddColumnBase')
  }

  /**
   * @abstract
   * @param {TableDefinition} table
   */
  genCodeCreateTable (table) {
    throw new Error('Abstract genCodeCreateTable')
  }

  /**
   * Generate code for enabling a multitenancy for table
   * @abstract
   * @param {TableDefinition} table
   */
  genCodeEnableMultitenancy (table) {
    throw new Error('Multitenancy is not supported by this DB')
  }

  /**
   * Generate code for disabling a multitenancy for table
   * @abstract
   * @param {TableDefinition} table
   */
  genCodeDisableMultitenancy (table) {
    throw new Error('Multitenancy is not supported by this DB')
  }

  /**
   * @abstract
   * @param {TableDefinition} table
   */
  genCodeCreatePK (table) {
    throw new Error('Abstract genCodeCreatePK')
  }

  /**
   * @abstract
   * @param {TableDefinition} table
   * @param {Object} constraintFK
   */
  genCodeCreateFK (table, constraintFK) {
    throw new Error('Abstract genCodeCreateFK')
  }

  /**
   * @abstract
   * @param {TableDefinition} tableDB
   * @param {TableDefinition} table
   * @param {IndexAttributes} indexDB
   * @param {String} [comment]
   * @param {Array} [objCollect]
   */
  genCodeDropIndex (tableDB, table, indexDB, comment, objCollect) {
    throw new Error('Abstract genCodeDropIndex')
  }

  /**
   * @abstract
   */
  genCodeDropPK (tableName, constraintName) {
    throw new Error(`Abstract genCodeDropPK ${constraintName} for table ${tableName}`)
  }

  /**
   * @abstract
   * @param {string} tableName
   * @param {string} constraintName
   */
  genCodeDropConstraint (tableName, constraintName) {
    throw new Error('Abstract genCodeDropConstraint')
  }

  /**
   * @abstract
   */
  genCodeAddSequence (sequenceObj) {
    throw new Error('Abstract genCodeAddSequence')
  }

  /**
   * @abstract
   */
  genCodeDropSequence (sequenceName) {
    throw new Error('Abstract genCodeDropSequence')
  }

  /**
   * @abstract
   * @param {TableDefinition} table
   * @param {IndexAttributes} indexSH
   * @param {string} [comment]
   */
  genCodeCreateIndex (table, indexSH, comment) {
    throw new Error('Abstract genCodeCreateIndex')
  }

  /**
   * Return a database-specific value for default expression.
   * Can parse UB macros (maxDate, currentDate etc)
   * @abstract
   * @param {string} macro
   * @param {FieldDefinition} [column]
   * @param {TableDefinition} [table]
   * @return {string}
   */
  getExpression (macro, column, table) {
    throw new Error('Abstract getExpression')
  }

  /**
   * Convert universal types to database type
   * @abstract
   * @param {string} dataType
   * @return {string}
   */
  uniTypeToDataBase (dataType) {
    throw new Error('Abstract uniTypeToDataBase')
  }

  /**
   * Convert database types to universal.
   * @abstract
   * @param dataType
   * @param {number} len
   * @param {number}  prec
   * @param {number}  scale
   * @return {String}
   */
  dataBaseTypeToUni (dataType, len, prec, scale) {
    throw new Error('Abstract dataBaseTypeToUni')
  }

  /**
   * Decode a default values for a attributes to a database-specific values
   * "maxDate", "currentDate", quoter strings
   * @param {TableDefinition} table
   */
  normalizeDefaults (table) {
    for (const column of table.columns) {
      if (column.defaultValue) {
        column.defaultValue = this.getExpression(column.defaultValue, column, table)
      }
    }
  }

  /** compare referenced tables with database metadata */
  compare () {
    for (const mustBe of this.refTableDefs) {
      if (!mustBe.doComparision) continue
      this.normalizeDefaults(mustBe)
      const asIs = _.find(this.dbTableDefs, { _upperName: mustBe._upperName })
      this.compareTableDefinitions(mustBe, asIs)
    }
    this.wantedSequences.forEach(seq => {
      if (this.sequencesDefs.indexOf(seq) === -1) {
        this.genCodeAddSequence(seq)
      }
    })
  }

  /**
   * Compare the "Must Be" (as defined by entity metadata) table definition with database table definition
   * @param {TableDefinition} mustBe
   * @param {TableDefinition} asIs
   */
  compareTableDefinitions (mustBe, asIs) {
    const notEqualPK = false
    if (!asIs) { // table in database does not exists
      this.genCodeCreateTable(mustBe)

      // todo rename genCodeSetCaption -> addDBObjectDescription
      this.genCodeSetCaption(mustBe.name, null, mustBe.caption, null)
      for (const col of mustBe.columns) {
        this.genCodeSetCaption(mustBe.name, col.name, col.caption, null)
      }
    } else {
      if (asIs.caption !== mustBe.caption && mustBe.caption) {
        this.genCodeSetCaption(mustBe.name, null, mustBe.caption, asIs.caption)
      }

      this.compareColumns(mustBe, asIs)

      // drop PK if not equals or not exist in schema
      if (asIs.primaryKey && !mustBe.existOther(asIs.primaryKey.name) &&
         (!mustBe.primaryKey ||
           !_.isEqual(asIs.primaryKey.keys.map((v) => v.toUpperCase()), mustBe.primaryKey.keys.map((v) => v.toUpperCase()))
         )
      ) {
        this.genCodeDropPK(asIs.name, asIs.primaryKey.name)
      } else {
        if (asIs.primaryKey && mustBe.primaryKey && !strIComp(asIs.primaryKey.name, mustBe.primaryKey.name)) {
          this.genCodeRename(mustBe, asIs.primaryKey.name, mustBe.primaryKey.name, 'PK')
        }
      }

      // drop FK if not found in schema by name or not equal by columnus
      for (const asIsFK of asIs.foreignKeys) {
        if (mustBe.existOther(asIsFK.name)) continue
        const mustBeFK = mustBe.getFKByName(asIsFK.name)
        if (mustBeFK && mustBeFK.isDeleted) continue
        if (!mustBeFK || !_.isEqual(asIsFK.keys, mustBeFK.keys) || !strIComp(mustBeFK.references, asIsFK.references) ||
            asIsFK.updateAction !== 'NO_ACTION' || asIsFK.deleteAction !== 'NO_ACTION') {
          this.genCodeDropConstraint(asIs.name, asIsFK.name)
          if (mustBeFK) mustBeFK.isDeleted = true
        }
      }

      // drop indexes
      for (const asIsIndex of asIs.indexes) {
        if (mustBe.existOther(asIsIndex.name)) continue
        const mustBeIndex = mustBe.indexByName(asIsIndex.name)
        if (!mustBeIndex || asIsIndex.isForDelete ||
          !_.isEqual(mustBeIndex.keys, asIsIndex.keys) ||
          (mustBeIndex.isUnique !== asIsIndex.isUnique) ||
          asIsIndex.isDisabled
        ) {
          if (!asIsIndex.isDeleted) {
            this.genCodeDropIndex(asIs, mustBe, asIsIndex,
              asIsIndex.isForDelete && !asIsIndex.isForDeleteMsg ? asIsIndex.isForDeleteMsg : null)
          }
          if (mustBeIndex) mustBeIndex.isDeleted = true
        }
      }

      // drop check constraint
      for (const asIsChk of asIs.checkConstraints) {
        if (mustBe.existOther(asIsChk.name)) continue
        const mustBeChk = mustBe.getCheckConstrByName(asIsChk.name)
        if (!mustBeChk) {
          this.genCodeDropConstraint(asIs.name, asIsChk.name)
        }
      }

      // sequence
      // TODO - increase sequence value to indicate physical structure is changed
      // if (me.schema.sequences['S_' + asIs.name.toUpperCase()]){
      //    me.genCodeDropSequence('S_' + asIs.name.toUpperCase());
      // }
    }

    // multitenancy
    if (!asIs || (asIs.multitenancy !== mustBe.multitenancy)) {
      if (mustBe.multitenancy) {
        this.genCodeEnableMultitenancy(mustBe)
      } else if (asIs) { // table exists with multitenancy
        this.genCodeDisableMultitenancy(mustBe)
      }
    }

    // create PK
    if (mustBe.primaryKey && ((asIs && !asIs.primaryKey) || notEqualPK || !asIs)) {
      this.genCodeCreatePK(mustBe)
    }

    // create fk
    for (const mustBeFK of mustBe.foreignKeys) {
      const asIsFK = asIs && asIs.getFKByName(mustBeFK.name)
      // && !constrFK.isRenamed
      if ((mustBeFK.isDeleted || !asIsFK) && !mustBeFK.isRenamed) {
        this.genCodeCreateFK(mustBe, mustBeFK)
      }
    }

    // create index
    for (const mustBeIndex of mustBe.indexes) {
      const asIsIndex = asIs && asIs.indexByName(mustBeIndex.name)
      if ((mustBeIndex.isDeleted || !asIsIndex) && !mustBeIndex.isRenamed) {
        this.genCodeCreateIndex(mustBe, mustBeIndex)
      }
    }

    // create check constraint
    for (const mustBeChk of mustBe.checkConstraints) {
      const asIsChk = asIs && asIs.getCheckConstrByName(mustBeChk.name)
      if (!asIsChk) {
        this.genCodeCreateCheckC(mustBe, mustBeChk)
      }
    }

    // others
    _.forEach(mustBe.othersNames, (otherObj) => {
      if (!otherObj.expression && _.isString(otherObj.expression)) {
        if (!otherObj.existInDB) {
          this.DDL.others.statements.push(otherObj.expression)
        }
      }
    })
  }

  /**
   * Compare columns of Must Be - as in metadata and asIs - as in database TableDefinition definition adn generate a DDL statements
   * @param {TableDefinition} mustBe
   * @param {TableDefinition} asIs
   */
  compareColumns (mustBe, asIs) {
    let delayedNotNull
    // compare columns
    for (const asIsC of asIs.columns) {
      let sizeChanged = false
      let sizeIsSmaller = false
      const mustBeC = mustBe.columnByName(asIsC.name)

      if (mustBeC) { // alter
        // caption
        if (mustBeC.caption !== asIsC.caption && mustBeC.caption) {
          this.genCodeSetCaption(mustBe.name, mustBeC.name, mustBeC.caption, asIsC.caption)
        }
        const asIsType = this.createTypeDefine(asIsC)
        const mustBeType = this.createTypeDefine(mustBeC)
        let typeChanged = (asIsType !== mustBeType)

        // let typeChanged = !strIComp(mustBeC.dataType, asIsC.dataType)
        if (typeChanged && (asIsC.dataType === 'UVARCHAR' &&
          (mustBeC.dataType === 'NVARCHAR' || mustBeC.dataType === 'VARCHAR'))) {
          typeChanged = false
        }
        // noinspection FallthroughInSwitchStatementJS
        switch (asIsC.dataType) {
          case 'NVARCHAR':
          case 'UVARCHAR':
          case 'VARCHAR':
            sizeChanged = mustBeC.size !== asIsC.size
            sizeIsSmaller = (mustBeC.size < asIsC.size)
            break
          case 'NUMERIC':
            sizeChanged = mustBeC.size !== asIsC.size || mustBeC.prec !== asIsC.prec
            sizeIsSmaller = (mustBeC.size < asIsC.size) || (mustBeC.prec < asIsC.prec)
            break
        }

        const allowNullChanged = mustBeC.allowNull !== asIsC.allowNull

        const mustBeColumn = `${mustBe.name}.${mustBeC.name}`
        if (typeChanged &&
          (mustBeC.dataType === 'INTEGER' || mustBeC.dataType === 'BIGINT' || mustBeC.dataType === 'NUMBER') &&
          (asIsC.dataType === 'NVARCHAR' || asIsC.dataType === 'VARCHAR' || asIsC.dataType === 'UVARCHAR' ||
          asIsC.dataType === 'NTEXT' || asIsC.dataType === 'NCHAR' || mustBeC.dataType === 'CHAR')) {
          this.addWarning(`Altering type for ${mustBeColumn} from ${asIsType} to ${mustBeType} may be wrong`)
        }
        if (typeChanged && (
          (asIsC.dataType === 'NTEXT') || (mustBeC.dataType === 'NTEXT') ||
          (asIsC.dataType === 'DATETIME') || (mustBeC.dataType === 'DATETIME') ||
          ((asIsC.dataType === 'BIGINT') && (mustBeC.dataType === 'INTEGER')) ||
          ((asIsC.dataType === 'NUMERIC') && (mustBeC.size > 10) && (mustBeC.dataType === 'INTEGER')) ||
          ((asIsC.dataType === 'NUMERIC') && (mustBeC.size > 19) && (mustBeC.dataType === 'BIGINT')) ||
          ((asIsC.dataType === 'NUMERIC') && (mustBeC.prec !== 0) && (mustBeC.dataType === 'BIGINT' || mustBeC.dataType === 'INTEGER'))
        )) {
          this.addWarning(`Altering type for ${mustBeColumn} from ${asIsType} to ${mustBeType} may be wrong`)
        }
        if (sizeChanged && sizeIsSmaller) {
          this.addWarning(`The size or precision for field ${mustBeColumn} was reduced potential loss of data: ${asIsType} -> ${mustBeType}`)
        }
        const defChanged = this.compareDefault(mustBeC.dataType, mustBeC.defaultValue, asIsC.defaultValue, mustBeC.defaultConstraintName, asIsC.defaultConstraintName)
        // TEMP
        if (defChanged) {
          if (asIsC.defaultValue !== null) { // prevent unnecessary warning for SQLite3
            console.log(`CONSTRAINT changed for ${mustBe.name}.${mustBeC.name} Must be "${mustBeC.defaultValue}" but in database "${asIsC.defaultValue}"`)
          }
        }
        if (defChanged && (asIsC.defaultValue != null)) {
          this.genCodeDropDefault(mustBe, asIsC)
        }
        if (defChanged && mustBeC.defaultValue) {
          this.genCodeSetDefault(mustBe, mustBeC)
        }
        if (!defChanged && (allowNullChanged || typeChanged)) {
          if (asIsC.defaultValue && this.dbConnectionConfig.dialect.startsWith('MSSQL')) {
            this.genCodeDropDefault(mustBe, asIsC)
          }
          if (mustBeC.defaultValue) {
            this.genCodeSetDefault(mustBe, mustBeC)
          }
        }
        if (typeChanged || sizeChanged || allowNullChanged) {
          this.genCodeAlterColumn(mustBe, asIs, mustBeC, asIsC, typeChanged, sizeChanged, allowNullChanged)
        }

        if (allowNullChanged && !mustBeC.allowNull) {
          delayedNotNull = false
          if (!mustBeC.allowNull) {
            delayedNotNull = true
            this.genCodeUpdate(mustBe, mustBeC, this.isUnsafe || mustBeC.defaultValue ? 'updConst' : 'updConstComment',
              mustBeC.defaultValue ? mustBeC.defaultValue : this.getColumnValueForUpdate(mustBe, mustBeC))
          }
          if (!delayedNotNull) {
            this.genCodeUpdate(mustBe, mustBeC, 'updNull')
          }
        }
        mustBeC.existInDB = true
      } else { // drop column
        if (asIsC.defaultValue) {
          this.genCodeDropDefault(asIs, asIsC)
        }
        this.addWarning(`Will drop field ${asIs.name}.${asIsC.name} ${this.createTypeDefine(asIsC.dataType)}. Check may be there is useful data!!!`)
        this.genCodeDropColumn(asIs, asIsC)
        asIsC.isDeleted = true
      }
    }

    // new columns
    for (const mustBeCol of mustBe.columns) {
      if (mustBeCol.existInDB || mustBeCol.name === 'rowid') continue // special case for sqlite3
      delayedNotNull = false
      // update by base mustBeCol
      if (mustBeCol.baseName) { // multi language column
        const lang = this.dbConnectionConfig.supportLang[0]
        let columnBase = ''
        if (lang === this.defaultLang) {
          columnBase = mustBeCol.baseName
        } else {
          columnBase = mustBeCol.baseName + '_' + lang
        }
        if (asIs.columnByName(columnBase)) {
          this.genCodeAddColumnBase(mustBe, mustBeCol, columnBase)
        } else {
          this.addWarning(`--  mustBeCol ${mustBe.name}.${columnBase} for base language not exists. Data for column ${mustBeCol.name} may not be initialized`)
          this.genCodeAddColumn(mustBe, mustBeCol)
        }
      } else {
        delayedNotNull = false
        if (!mustBeCol.defaultValue && !mustBeCol.allowNull) {
          delayedNotNull = true
          this.genCodeUpdate(mustBe, mustBeCol, this.isUnsafe ? 'updConst' : 'updConstComment', this.getColumnValueForUpdate(mustBe, mustBeCol))
        }

        this.genCodeAddColumn(mustBe, mustBeCol, delayedNotNull)
      }
      // caption
      this.genCodeSetCaption(mustBe.name, mustBeCol.name, mustBeCol.caption, null)
    }
  }

  /**
   * Generate a column type DDL part
   * @param {FieldDefinition} column
   * @return {string}
   */
  createTypeDefine (column) {
    let res = this.uniTypeToDataBase(column.dataType)
    switch (column.dataType) {
      case 'NVARCHAR':
      case 'UVARCHAR':
      case 'VARCHAR':
        res += `(${column.size.toString()})`
        break
      case 'NUMERIC':
      case 'FLOAT':
      case 'CURRENCY':
        res += `(${column.size.toString()}, ${column.prec.toString()})`
        break
      case 'BOOLEAN':
        res += '(1)'
        break
      case 'JSON':
        if (column.size && !VARCHAR_MAX_RE.test(res)) res += `(${column.size.toString()})`
        break
    }
    return res
  }

  compareDefault (dataType, mustBeDefault, asIsDefault) {
    if (!mustBeDefault && !asIsDefault) return false
    return (mustBeDefault !== asIsDefault) && (mustBeDefault !== `'${asIsDefault}'`) &&
      (`${mustBeDefault}` !== asIsDefault) && (`(${mustBeDefault})` !== asIsDefault)
  }

  /**
   * Return columns value used to update column with allowNull === false and no default set
   * @param {TableDefinition} table
   * @param {FieldDefinition} column
   * @return {*}
   */
  getColumnValueForUpdate (table, column) {
    let res
    let constraint = table.getFKByColumnName(column.name)
    if (constraint.length > 0) {
      constraint = constraint[0]
      // The default value for a column that references itself. For example mi_data_id in history mixin
      if (table.name === constraint.references) {
        return 'ID'
      }
      return `(select min(id) from ${constraint.references})`
    }
    if (column.enumGroup) {
      return `(select min(code) from ubm_enum where egroup = '${column.enumGroup}')`
    }
    switch (column.dataType) {
      case 'NVARCHAR':
      case 'VARCHAR':
      case 'UVARCHAR':
      case 'INTEGER':
      case 'BIGINT':
      case 'FLOAT':
      case 'CURRENCY':
      case 'TEXT': res = 'ID'; break
      case 'BOOLEAN': res = '0'; break
      case 'DATETIME': res = this.getExpression('currentDate'); break
      case 'JSON': res = '\'{}\''
    }
    return res
  }

  generateStatements () {
    return this.DDL
  }
}

module.exports = DBAbstract
