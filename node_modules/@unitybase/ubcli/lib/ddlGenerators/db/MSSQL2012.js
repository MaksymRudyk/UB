
const _ = require('lodash')
const { TableDefinition } = require('../AbstractSchema')
const DBAbstract = require('./DBAbstract')

// MPV: prior to UB 4 we use a `Caption` extended property - this is mistake
const DB_DESCRIPTION_PROPERTY = 'MS_Description'

/**
 * Created by pavel.mash on 10.12.2016.
 */
class DBSQL2012 extends DBAbstract {
  /**
   * Load information from a database schema definition into this.dbTableDefs
   * @override
   */
  loadDatabaseMetadata () {
    const mTables = this.refTableDefs
    if (!mTables.length) return // all entities in this connection are external or no entities at all - skip loading DB metadata

    const tablesSQL = `select o.name, cast( eprop.value as nvarchar(2000) ) as caption 
      from  sys.tables o
       left outer join sys.extended_properties eprop 
         on eprop.major_id = o.object_id and eprop.minor_id = 0 and eprop.class = 1 and eprop.name = '${DB_DESCRIPTION_PROPERTY}'
      where o.type = 'U'
      order by o.name`
    /** @type {Array<Object>} */
    let dbTables = this.conn.xhr({
      endpoint: 'runSQL',
      data: tablesSQL,
      URLParams: { CONNECTION: this.dbConnectionConfig.name }
    })

    // filter tables from a metadata if any
    if (mTables.length) {
      dbTables = _.filter(dbTables, (dbTab) => _.findIndex(mTables, { name: dbTab.name }) !== -1)
    }
    for (const tabDef of dbTables) {
      const asIsTable = new TableDefinition({
        name: tabDef.name,
        caption: tabDef.caption
      })

      // Table Columns
      // TODO - rewrite using parameters in query (after rewriting runSQL using JS)
      const columnSQL = `SELECT c.name, c.column_id AS colid, c.is_ansi_padded, c.is_nullable,
        c.is_identity, c.is_xml_document, c.is_computed, t.name AS typename, st.name AS systpname,
        c.max_length AS len, c.precision AS prec, c.scale, d.name AS defname, du.name AS defowner, 
        cast( ep.value as nvarchar(2000) ) as description, cm.definition  AS defvalue
      FROM sys.all_columns c INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
        INNER JOIN sys.schemas tu ON tu.schema_id = t.schema_id
        LEFT OUTER JOIN sys.types st ON c.system_type_id = st.user_type_id
        INNER JOIN sys.all_objects tb ON tb.object_id = c.object_id
        INNER JOIN sys.schemas u ON u.schema_id = tb.schema_id
        LEFT OUTER JOIN sys.objects d ON d.object_id = c.default_object_id
        LEFT OUTER JOIN sys.schemas du ON du.schema_id = d.schema_id
        LEFT OUTER JOIN sys.default_constraints cm ON cm.object_id = d.object_id
        left outer join sys.extended_properties ep on ep.major_id = tb.object_id and ep.minor_id = c.column_id and ep.class = 1 and ep.name = '${DB_DESCRIPTION_PROPERTY}'
      where tb.object_id = object_id( :("${asIsTable._upperName}"):, N'U')`
      const columnsFromDb = this.conn.xhr({
        endpoint: 'runSQL',
        data: columnSQL,
        URLParams: { CONNECTION: this.dbConnectionConfig.name }
      })
      // console.log('columnsFromDb', columnsFromDb)
      for (const colDef of columnsFromDb) {
        const physicalTypeLower = colDef.typename.toLowerCase()
        let def = colDef.defvalue
        // SQL server return default value wrapped in 'A' -> ('A')
        // numeric & int types wrapped twice 0 -> ((0))
        if (def) {
          def = def.replace(/^\((.*)\)$/, '$1')
          if (['numeric', 'int'].indexOf(physicalTypeLower) !== -1) def = def.replace(/^\((.*)\)$/, '$1')
        }
        const nObj = {
          name: colDef.name,
          description: colDef.description,
          allowNull: (colDef.is_nullable !== 0),
          dataType: this.dataBaseTypeToUni(colDef.typename, colDef.len, colDef.prec, colDef.scale),
          size: (['nvarchar', 'varchar', 'char', 'nchar', 'text', 'ntext'].indexOf(physicalTypeLower) !== -1)
            ? colDef.len
            : colDef.prec,
          prec: colDef.scale,
          // defaultValue: this.parseDefValue( colDef.defvalue ),
          defaultValue: def,
          defaultConstraintName: colDef.defname
        }
        if (physicalTypeLower === 'nvarchar' || physicalTypeLower === 'nchar' || physicalTypeLower === 'ntext') {
          nObj.size = Math.floor(nObj.size / 2)
        }
        asIsTable.addColumn(nObj)
      }

      // foreign key
      const foreignKeysSQL = `SELECT f.name AS foreign_key_name
        ,OBJECT_NAME(f.parent_object_id) AS table_name
        ,COL_NAME(fc.parent_object_id, fc.parent_column_id) AS constraint_column_name
        ,OBJECT_NAME (f.referenced_object_id) AS referenced_object
        ,COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS referenced_column_name
        ,is_disabled
        ,delete_referential_action_desc
        ,update_referential_action_desc
        FROM sys.foreign_keys AS f
        INNER JOIN sys.foreign_key_columns AS fc
        ON f.object_id = fc.constraint_object_id
        WHERE f.parent_object_id = OBJECT_ID( :("${asIsTable._upperName}"):, N'U')`
      const fkFromDb = this.conn.xhr({
        endpoint: 'runSQL',
        data: foreignKeysSQL,
        URLParams: { CONNECTION: this.dbConnectionConfig.name }
      })
      for (const fkDef of fkFromDb) {
        asIsTable.addFK({
          name: fkDef.foreign_key_name,
          keys: [fkDef.constraint_column_name.toUpperCase()],
          references: fkDef.referenced_object,
          isDisabled: fkDef.is_disabled !== 0,
          deleteAction: fkDef.delete_referential_action_desc, // NO_ACTION, CASCADE, SET_NULL,  SET_DEFAULT
          updateAction: fkDef.update_referential_action_desc
        })
      }

      // primary keys
      const primaryKeySQL = `SELECT i.name AS constraint_name, c.name AS column_name, c.is_identity as auto_increment
        FROM sys.indexes AS i
          INNER JOIN sys.index_columns AS ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
          INNER JOIN sys.columns AS c ON ic.object_id = c.object_id AND c.column_id = ic.column_id
        WHERE i.is_primary_key = 1
          AND i.object_id = OBJECT_ID(:("${asIsTable._upperName}"):, N'U')
        ORDER BY ic.key_ordinal`
      const pkFromDb = this.conn.xhr({
        endpoint: 'runSQL',
        data: primaryKeySQL,
        URLParams: { CONNECTION: this.dbConnectionConfig.name }
      })
      if (pkFromDb.length) {
        asIsTable.primaryKey = {
          name: pkFromDb[0].constraint_name,
          keys: _.map(pkFromDb, 'column_name'),
          autoIncrement: pkFromDb[0].auto_increment === 1
        }
      }

      // indexes
      const indexesSQL = `SELECT ic.index_id, i.name AS index_name, c.name AS column_name, i.type_desc,
            i.is_unique, i.is_primary_key, i.is_unique_constraint, i.is_disabled, ic.is_descending_key
        FROM sys.indexes AS i
            INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
            INNER JOIN sys.columns c  ON ic.object_id = c.object_id AND c.column_id = ic.column_id
        WHERE is_hypothetical = 0 AND i.index_id <> 0
            and i.is_primary_key <> 1
            AND i.object_id = OBJECT_ID(:("${asIsTable._upperName}"):, N'U')
        order by ic.index_id, ic.key_ordinal, c.name`
      const indexesFromDb = this.conn.xhr({
        endpoint: 'runSQL',
        data: indexesSQL,
        URLParams: { CONNECTION: this.dbConnectionConfig.name }
      })
      const ftsIndexesSQL = `select
 i.object_id as index_id, '__CATALOGUE__' AS index_name, c.name as column_name, '' as type_desc,
 0 as is_unique, 0 as is_primary_key, 0 as is_unique_constraint, case when i.is_enabled = 1 then 0 else 1 end as is_disabled, 0 as is_descending_key
FROM 
  sys.fulltext_indexes as i 
    INNER JOIN sys.fulltext_index_columns ic ON i.object_id = ic.object_id
    INNER JOIN sys.columns c  ON ic.object_id = c.object_id AND c.column_id = ic.column_id
WHERE 
  i.object_id = OBJECT_ID(:("${asIsTable._upperName}"):, N'U')
ORDER BY i.object_id, c.name`
      const ftsIndexesFromDb = this.conn.xhr({
        endpoint: 'runSQL',
        data: ftsIndexesSQL,
        URLParams: { CONNECTION: this.dbConnectionConfig.name }
      })
      if (ftsIndexesFromDb.length) {
        indexesFromDb.push(...ftsIndexesFromDb)
      }
      let i = 0
      const idxCnt = indexesFromDb.length
      while (i < idxCnt) {
        const indexObj = {
          name: indexesFromDb[i].index_name,
          isUnique: indexesFromDb[i].is_unique !== 0,
          isDisabled: indexesFromDb[i].is_disabled !== 0,
          isConstraint: indexesFromDb[i].is_unique_constraint !== 0,
          indexType: i.name === '__CATALOGUE__' ? 'CATALOGUE' : null,
          keys: []
        }
        // index may consist of several keys (one roe for each key)
        const buildKeysFor = indexesFromDb[i].index_id
        while ((i < idxCnt) && (indexesFromDb[i].index_id === buildKeysFor)) {
          indexObj.keys.push(indexesFromDb[i].column_name + (indexesFromDb[i].is_descending_key !== 0 ? ' DESC' : ''))
          i++
        }
        asIsTable.addIndex(indexObj)
      }

      // check constraints
      const checkConstraintsSQL = `SELECT ck.name, ck.definition FROM sys.check_constraints ck
        where ck.parent_object_id = OBJECT_ID(:("${asIsTable._upperName}"):, N'U')`
      const constraintsFromDb = this.conn.xhr({
        endpoint: 'runSQL',
        data: checkConstraintsSQL,
        URLParams: { CONNECTION: this.dbConnectionConfig.name }
      })
      // console.log('constraintsFromDb', constraintsFromDb)
      for (const constraintDef of constraintsFromDb) {
        asIsTable.addCheckConstr({
          name: constraintDef.name,
          definition: constraintDef.definition
        })
      }

      // triggers - UB do not add a triggers, so skip it

      this.dbTableDefs.push(asIsTable)
    }

    const sequencesSQL = 'SELECT name AS sequence_name FROM sys.sequences WHERE SCHEMA_NAME(schema_id) = \'dbo\''
    const dbSequences = this.conn.xhr({
      endpoint: 'runSQL',
      data: sequencesSQL,
      URLParams: { CONNECTION: this.dbConnectionConfig.name }
    })
    for (const seqDef of dbSequences) {
      this.sequencesDefs.push(seqDef.sequence_name.toUpperCase())
    }
  }

  /** @override */
  genCodeRename (table, oldName, newName, typeObj) {
    let fType = 'OBJECT'
    let oldNameR = oldName
    if (typeObj === 'INDEX') {
      fType = 'INDEX'
      oldNameR = table.name + '.' + oldName
    }
    this.DDL.rename.statements.push(
      `EXEC sp_rename '${oldNameR}', '${newName}', '${fType}'`
    )
  }

  /** @override */
  genCodeSetCaption (tableName, column, value, oldValue) {
    if (value) value = value.replace(/'/g, "''")
    const proc = oldValue === null ? 'sp_addextendedproperty' : 'sp_updateextendedproperty'
    let result = `EXEC ${proc} @name = N'${DB_DESCRIPTION_PROPERTY}', @value = N'${value === null ? (column || tableName) : value}',@level0type = N'SCHEMA',  @level0name= N'dbo', @level1type = N'TABLE',  @level1name = N'${tableName}'`
    if (column) result += `, @level2type = N'Column', @level2name = '${column}'`
    this.DDL.caption.statements.push(result)
  }

  /** @override */
  genCodeCreateCheckC (table, checkConstr) {
    switch (checkConstr.type) {
      case 'bool':
        this.DDL.createCheckC.statements.push(
          `alter table dbo.${table.name} add constraint ${checkConstr.name} check (${checkConstr.column} in (0,1))`
        )
        break
      case 'custom':
        this.DDL.createCheckC.statements.push(
          `alter table dbo.${table.name} add constraint ${checkConstr.name} check (${checkConstr.expression})`
        )
        break
    }
  }

  /** @override */
  genCodeDropColumn (tableDB, columnDB) {
    this.DDL.dropColumn.statements.push(
      `alter table dbo.${tableDB.name} drop column ${columnDB.name}`
    )
  }

  /** @override */
  genCodeSetDefault (table, column) {
    this.DDL.setDefault.statements.push(
      `alter table dbo.${table.name} ADD CONSTRAINT ${column.defaultConstraintName} default ${column.defaultValue} for ${column.name}`
    )
  }

  /** @override */
  genCodeDropDefault (table, column) {
    this.DDL.dropDefault.statements.push(
      `EXECUTE dbo.ub_dropColumnConstraints '${table.name}','${column.name}'`
    )
  }

  /** @override */
  genCodeAlterColumn (table, tableDB, column, columnDB, typeChanged, sizeChanged, allowNullChanged) {
    if (typeChanged && column.dataType === 'NTEXT') {
      // TODO should be implemented by create new column
      this.addWarning(`Converting to NTEXT type is not supported. Create a new field manually and copy the data into it
      \tField ${table.name}.${column.name}`)
    }

    // in case of not null added - recreate index
    // if (allowNullChanged && !column.allowNull ){
    const objects = tableDB.getIndexesByColumn(column)
    for (const colIndex of objects) {
      colIndex.isForDelete = true
      colIndex.isForDeleteMsg = `Delete for altering column ${table.name}.${column.name}`
      console.log(colIndex.isForDeleteMsg)
    }

    if (allowNullChanged && !column.allowNull) {
      if (typeChanged || sizeChanged) {
        this.DDL.alterColumn.statements.push(
          `alter table dbo.${table.name} alter column ${column.name} ${this.createTypeDefine(column)}`
        )
      }
      this.DDL.alterColumnNotNull.statements.push(
        `alter table dbo.${table.name} alter column ${column.name} ${this.createTypeDefine(column)} ${column.allowNull ? ' null' : ' not null'}`
      )
    } else {
      this.DDL.alterColumn.statements.push(
        `alter table dbo.${table.name} alter column ${column.name} ${this.createTypeDefine(column)} ${column.allowNull ? ' null' : ''}`
      )
    }
  }

  /**
   * @override
   */
  genCodeAddColumn (table, column, delayedNotNull) {
    const typeDef = this.createTypeDefine(column)
    const nullable = column.allowNull || delayedNotNull ? ' null' : ' not null'
    const def = column.defaultValue ? ' default ' + column.defaultValue : ''
    this.DDL.addColumn.statements.push(
      `alter table dbo.${table.name} add ${column.name} ${typeDef}${nullable}${def}`
    )
    if (delayedNotNull && !column.allowNull) {
      this.DDL.alterColumnNotNull.statements.push(
        `alter table dbo.${table.name} alter column ${column.name} ${typeDef} not null`
      )
    }
  }

  /**
   * @override
   */
  genCodeAddColumnBase (table, column, baseColumn) {
    const def = column.defaultValue ? ' default ' + column.defaultValue : ''
    this.DDL.addColumn.statements.push(
      `alter table dbo.${table.name} add ${column.name} ${this.createTypeDefine(column)}${def}`
    )

    this.DDL.updateColumn.statements.push(
      `EXEC('update dbo.${table.name} set ${column.name} = ${baseColumn} where 1 = 1')`
    )

    if (!column.allowNull) {
      const nullable = column.allowNull ? ' null' : ' not null'
      this.DDL.alterColumnNotNull.statements.push(
        `alter table dbo.${table.name} alter column ${column.name} ${this.createTypeDefine(column)}${nullable}`
      )
    }
  }

  /** @override */
  genCodeCreateTable (table) {
    const res = [`create table dbo.${table.name}(\r\n`]
    const colLen = table.columns.length

    table.columns.forEach((column, index) => {
      res.push('\t', column.name, ' ', this.createTypeDefine(column), column.allowNull ? ' null' : ' not null',
        column.defaultValue
          ? (column.defaultConstraintName ? ` CONSTRAINT ${column.defaultConstraintName} ` : '') +
            ' default ' + column.defaultValue
          : '',
        index < colLen - 1 ? ',\r\n' : '\r\n')
    })
    res.push(')')
    this.DDL.createTable.statements.push(res.join(''))
  }

  /** @override */
  genCodeEnableMultitenancy (table) {
    throw new Error('multitenancy is not implemented for MSSQL')
  }

  /** @override */
  genCodeDisableMultitenancy (table) {
    throw new Error('multitenancy is not implemented for MSSQL')
  }

  /** @override */
  genCodeCreatePK (table) {
    this.DDL.createPK.statements.push(
      `alter table dbo.${table.name} add constraint ${table.primaryKey.name} PRIMARY KEY CLUSTERED(${table.primaryKey.keys.join(',')})`
    )
  }

  /** @override */
  genCodeCreateFK (table, constraintFK) {
    if (!constraintFK.generateFK) return

    const refTo = _.find(this.refTableDefs, { _nameUpper: constraintFK.references.toUpperCase() })
    const refKeys = refTo ? refTo.primaryKey.keys.join(',') : constraintFK.refPkDefColumn

    this.DDL.createFK.statements.push(
      `alter table dbo.${table.name} add constraint ${constraintFK.name} foreign key (${constraintFK.keys.join(',')}) references dbo.${constraintFK.references}(${refKeys})`
    )
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
    const cObj = objCollect || this.DDL.dropIndex.statements
    if (comment) cObj.push(`-- ${comment}\r\n`)
    if (indexDB.indexType === 'CATALOGUE') {
      cObj.push(`DROP FULLTEXT INDEX ON dbo.${tableDB.name}`)
    } else if (indexDB.isConstraint) {
      cObj.push(`ALTER TABLE ${tableDB.name} DROP CONSTRAINT ${indexDB.name}`)
    } else {
      cObj.push(`drop index ${indexDB.name} on dbo.${tableDB.name}`)
    }
  }

  /**
   * @abstract
   */
  genCodeDropPK (tableName, constraintName) {
    this.DDL.dropPK.statements.push(
      `alter table dbo.${tableName} drop constraint ${constraintName}`
    )
  }

  /**
   * @override
   */
  genCodeDropConstraint (tableName, constraintName) {
    this.DDL.dropFK.statements.push(
      `alter table dbo.${tableName} drop constraint ${constraintName}`
    )
  }

  /**
   * @override
   */
  genCodeAddSequence (sequenceObj) {
    this.DDL.createSequence.statements.push(
      `create sequence dbo.${sequenceObj}  as bigint start with 1 increment by 1 minvalue 1 maxvalue 999999999999999 cycle no cache`,
      `SELECT next value FOR ${sequenceObj}` // UB-1311
    )
  }

  /**
   * @abstract
   */
  genCodeDropSequence (sequenceName) {
    throw new Error('Abstract genCodeDropSequence')
  }

  /** @override */
  genCodeCreateIndex (table, indexSH, comment) {
    const commentText = comment ? `-- ${comment} \n` : ''
    if (indexSH.indexType === 'CATALOGUE') {
      // we adds commit / begin transaction because FTS index can not be created inside user transaction,
      // but RUN SQL endpoint starts it
      this.DDL.createIndex.statements.push(`COMMIT; CREATE FULLTEXT INDEX ON dbo.${table.name}(${indexSH.keys.join(',')})
      KEY INDEX ${table.primaryKey.name} WITH STOPLIST = SYSTEM;
      BEGIN TRANSACTION`)
    } else {
      this.DDL.createIndex.statements.push(
        `${commentText}create ${indexSH.isUnique ? 'unique' : ''} index ${indexSH.name} on dbo.${table.name}(${indexSH.keys.join(',')})`
      )
    }
  }

  /**
   * Return a database-specific value for default expression.
   * Can parse UB macros (maxDate, currentDate etc)
   * @override
   * @param {string} macro
   * @param {FieldDefinition} [column]
   * @param {TableDefinition} [table]
   */
  getExpression (macro, column, table) {
    function dateTimeExpression (val) {
      if (!val) return val
      switch (val) {
        // getutcdate() MUST be in lowercase but CONVERT in UPPER as in MSSQL metadata
        case 'currentDate':
          return 'getutcdate()'
        case 'maxDate':
          return "CONVERT(datetime,'31.12.9999',(104))"
        default:
          throw new Error(`Unknown expression "${val}" for default value of ${table ? table.name : '?'}.${column ? column.name : '?'}`)
      }
    }
    if (!column) return dateTimeExpression(macro)

    if (column.isBoolean) return ((macro === 'TRUE') || (macro === '1')) ? '1' : '0'
    if (column.isString) return "'" + macro + "'"
    if (column.dataType === 'DATETIME') return dateTimeExpression(macro)
    return macro
  }

  /**
   * Convert universal types to database type
   * @override
   * @param {string} dataType
   * @return {string}
   */
  uniTypeToDataBase (dataType) {
    switch (dataType) {
      case 'NVARCHAR': return 'NVARCHAR'
      case 'VARCHAR': return 'VARCHAR'
      case 'INTEGER': return 'INT'
      case 'BIGINT': return 'BIGINT'
      case 'FLOAT': return 'NUMERIC'
      case 'CURRENCY': return 'NUMERIC'
      case 'BOOLEAN': return 'NUMERIC'
      case 'DATETIME': return 'DATETIME'
      case 'TEXT': return 'NVARCHAR(MAX)'
      // Reasons to not use NTEXT:
      // 1. http://stackoverflow.com/questions/2133946/nvarcharmax-vs-ntext
      // 2. OLEDB provider raise 'Operand type clash: int is incompatible with ntext' for empty strings
      case 'BLOB': return 'VARBINARY(MAX)'
      case 'JSON': return 'NVARCHAR(MAX)'
      default: return dataType
    }
  }

  /**
   * Convert database types to universal
   * @override
   * @param dataType
   * @param {number} len
   * @param {number}  prec
   * @param {number}  scale
   * @return {String}
   */
  dataBaseTypeToUni (dataType, len, prec, scale) {
    dataType = dataType.toUpperCase()
    switch (dataType) {
      case 'BIGINT': return 'BIGINT'
      case 'DECIMAL':
      case 'NUMERIC':
        if (prec === 19 && scale > 2) {
          return 'FLOAT'
        }
        if (prec === 19 && scale === 2) {
          return 'CURRENCY'
        }
        if (prec === 1) {
          return 'BOOLEAN'
        }
        return 'NUMERIC'
      case 'INT': return 'INTEGER'
      case 'VARBINARY': return 'BLOB'
      case 'NVARCHAR': return (len === -1) ? 'TEXT' : 'NVARCHAR'
      case 'VARCHAR': return 'VARCHAR'
      case 'DATETIME': return 'DATETIME'
      case 'NTEXT': return 'TEXT'
      default: return dataType
    }
  }

  /** @override */
  compareDefault (dataType, newValue, oldValue) {
    if (typeof oldValue === 'string') {
      // special case for MS SQL datetime function: CONVERT(datetime,''31.12.9999'',(104)) but DB return CONVERT([datetime],''31.12.9999'',(104))
      oldValue = oldValue.toString().trim().replace('[datetime]', 'datetime')
    }
    return super.compareDefault(dataType, newValue, oldValue)
  }
}

module.exports = DBSQL2012
