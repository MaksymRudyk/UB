/*
 * PostgreSQL system tables notes
 *  - [Postgre catalog documentation](https://www.postgresql.org/docs/9.5/static/catalogs-overview.html)
 *  - all names inside system tables are in lower case
 *  - object oid can be retrieved by 'objectName'::regclass expression
 *  - default value appended by type: 'A'::character varying
 *
 */

const _ = require('lodash')
const { TableDefinition } = require('../AbstractSchema')
const DBAbstract = require('./DBAbstract')

/**
 * Created by pavel.mash on 10.12.2016.
 */
class DBPostgreSQL extends DBAbstract {
  /**
   * Load information from a database schema definition into this.dbTableDefs
   * @override
   */
  loadDatabaseMetadata () {
    const mTables = this.refTableDefs
    if (!mTables.length) return // all entities in this connection are external or no entities at all - skip loading DB metadata

    // old code  // UPPER(t.table_name)
    const tablesSQL = `select 
  tablename as name,
  (select description from pg_description
        where objoid = (select typrelid from pg_type where typname = t.tablename
        and typowner = (select oid from pg_roles where rolname = current_schema)) and objsubid = 0
      ) as caption,
  rowsecurity::int 
from pg_catalog.pg_tables t where t.schemaname = current_schema`

    /** @type {Array<Object>} */
    let dbTables = this.conn.xhr({
      endpoint: 'runSQL',
      data: tablesSQL,
      URLParams: { CONNECTION: this.dbConnectionConfig.name }
    })

    // filter tables from a metadata if any
    if (mTables.length) {
      dbTables = _.filter(dbTables, (dbTab) => _.findIndex(mTables, { _upperName: dbTab.name.toUpperCase() }) !== -1)
    }
    for (const tabDef of dbTables) {
      const asIsTable = new TableDefinition({
        name: tabDef.name,
        caption: tabDef.caption,
        multitenancy: tabDef.rowsecurity === 1
      })

      // Table Columns
      // TODO - rewrite using parameters in query (after rewriting runSQL using JS)
      const columnSQL = `select c.column_name as name, c.data_type as typename,
        c.character_maximum_length as len,
        COALESCE(c.numeric_precision, 0) as prec, COALESCE(c.numeric_scale, 0) as scale, substr(c.is_nullable, 1, 1) as is_nullable,
        'NO' as is_computed, c.column_default as defvalue,
          (select description from pg_description
          where objoid =
            (select typrelid from pg_type where typname = LOWER(c.table_name) and typowner = (select oid from pg_roles where rolname = current_schema))
            and objsubid = c.ordinal_position) as description
        from information_schema.columns c
        where c.table_schema = current_schema
        and c.table_name = LOWER(:('${asIsTable._upperName}'):)
        order by c.ordinal_position`

      const columnsFromDb = this.conn.xhr({
        endpoint: 'runSQL',
        data: columnSQL,
        URLParams: { CONNECTION: this.dbConnectionConfig.name }
      })
      // console.log('columnsFromDb', columnsFromDb)
      for (const colDef of columnsFromDb) {
        const physicalTypeLower = colDef.typename.toLowerCase()
        let def = colDef.defvalue
        // Postgre prepend default by data type: `'A'::character varying` or `'{}':jsonb`
        if (def) {
          def = def.replace(/::(character varying|jsonb)/, '')
        }
        const nObj = {
          name: colDef.name,
          description: colDef.description,
          allowNull: (colDef.is_nullable === 'Y'),
          dataType: this.dataBaseTypeToUni(colDef.typename, colDef.len, colDef.prec, colDef.scale),
          size: (['character varying', 'nvarchar', 'varchar', 'char', 'nchar', 'text', 'ntext'].indexOf(physicalTypeLower) !== -1)
            ? colDef.len
            : colDef.prec,
          prec: colDef.scale,
          // defaultValue: this.parseDefValue( colDef.defvalue ),
          defaultValue: def,
          defaultConstraintName: null // no name for default constraint in Postgre
        }
        if (physicalTypeLower === 'nvarchar' || physicalTypeLower === 'nchar' || physicalTypeLower === 'ntext') {
          nObj.size = Math.floor(nObj.size / 2)
        }
        asIsTable.addColumn(nObj)
      }

      // foreign key
      // Zeos 7.2 serialize BOOL to false/true instead of 0/1, so transform it manually
      const foreignKeysSQL =
`SELECT 
  ct.conname as foreign_key_name,
  case when ct.condeferred then 1 else 0 end AS is_disabled,
  (SELECT a.attname FROM pg_attribute a WHERE a.attnum = ct.conkey[1] AND a.attrelid = ct.conrelid) as constraint_column_name,
  (SELECT tc.relname from pg_class tc where tc.oid = ct.confrelid) as referenced_object,
  ct.confdeltype as delete_referential_action_desc, -- a = no action, r = restrict, c = cascade, n = set null, d = set default
  ct.confupdtype as update_referential_action_desc -- a = no action, r = restrict, c = cascade, n = set null, d = set default
FROM 
  pg_constraint ct
WHERE 
  conrelid = '${asIsTable.name}'::regclass 
  AND contype = 'f'`

      const fkFromDb = this.conn.xhr({
        endpoint: 'runSQL',
        data: foreignKeysSQL,
        URLParams: { CONNECTION: this.dbConnectionConfig.name }
      })
      const C_ACTIONS = {
        a: 'NO_ACTION',
        r: 'RESTRICT',
        c: 'CASCADE',
        n: 'SET_NULL',
        d: 'SET_DEFAULT'
      }

      for (const fkDef of fkFromDb) {
        asIsTable.addFK({
          name: fkDef.foreign_key_name,
          keys: [fkDef.constraint_column_name.toUpperCase()],
          references: fkDef.referenced_object,
          isDisabled: fkDef.is_disabled !== 0,
          deleteAction: C_ACTIONS[fkDef.delete_referential_action_desc], // NO_ACTION, CASCADE, SET_NULL,  SET_DEFAULT
          updateAction: C_ACTIONS[fkDef.update_referential_action_desc]
        })
      }

      // primary keys
      const primaryKeySQL =
        `SELECT UPPER(c.relname) constraint_name, UPPER(a.attname) AS column_name
        FROM   pg_index i
        JOIN pg_class c on i.indexrelid = c.oid
        JOIN pg_attribute a ON a.attrelid = i.indrelid
                           AND a.attnum = ANY(i.indkey)
        WHERE  i.indrelid = '${asIsTable.name}'::regclass
        AND    i.indisprimary`

      // `select UPPER(tc.constraint_name) as constraint_name,
      //   substr(constraint_type, 1, 1) as constraint_type,
      //   '' as search_condition, 'ENABLED' as status, 'USER NAME' as generated
      //   from information_schema.table_constraints tc
      //   where tc.constraint_schema = current_schema
      //   and tc.table_schema = current_schema
      //   and tc.table_name = LOWER(:('${asIsTable._upperName}'):)
      //   and tc.constraint_type in ('PRIMARY KEY')`

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
      const indexesSQL =
`SELECT 
  i.indexrelid as index_id,
  UPPER(c.relname) as index_name,
  CASE WHEN i.indisunique THEN 1 ELSE 0 END as is_unique, 
  UPPER(a.attname) AS column_name,
  array_position(i.indkey, a.attnum) as column_position,
  CASE WHEN position(a.attname || ' DESC' in pg_get_indexdef(i.indexrelid)) > 0 THEN 1 ELSE 0 END as is_descending_key
FROM pg_index i
  JOIN pg_class c ON c.oid = i.indexrelid 
  JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
WHERE 
  i.indrelid = '${asIsTable.name}'::regclass AND 
  NOT i.indisprimary
ORDER BY index_id, column_position`

      const indexesFromDb = this.conn.xhr({
        endpoint: 'runSQL',
        data: indexesSQL,
        URLParams: { CONNECTION: this.dbConnectionConfig.name }
      })
      let i = 0
      const idxCnt = indexesFromDb.length
      while (i < idxCnt) {
        const indexObj = {
          name: indexesFromDb[i].index_name,
          isUnique: indexesFromDb[i].is_unique !== 0,
          isDisabled: false, // indexesFromDb[i][ 'is_disabled' ] !== 0,
          isConstraint: false, // indexesFromDb[i][ 'is_unique_constraint' ] !== 0,
          keys: []
        }
        // index may consist of several keys (one row for each key)
        const buildKeysFor = indexesFromDb[i].index_id
        while ((i < idxCnt) && (indexesFromDb[i].index_id === buildKeysFor)) {
          indexObj.keys.push(indexesFromDb[i].column_name + (indexesFromDb[i].is_descending_key !== 0 ? ' DESC' : ''))
          i++
        }
        asIsTable.addIndex(indexObj)
      }

      // check constraints
      const checkConstraintsSQL = `SELECT c.conname AS name, 
         pg_get_constraintdef(c.oid) as definition 
         FROM pg_constraint c 
         LEFT JOIN pg_class t ON c.conrelid  = t.oid 
         WHERE t.relname = LOWER(:('${asIsTable._upperName}'):) 
         and t.relowner = (select oid from pg_roles where rolname = current_schema) 
         AND c.contype = 'c'`

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

    const sequencesSQL = 'select sequence_name from information_schema.sequences where sequence_schema = current_schema'
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
    if (typeObj === 'INDEX') {
      this.DDL.rename.statements.push(`ALTER INDEX ${oldName} RENAME TO ${newName}`)
    } else {
      this.DDL.rename.statements.push(`ALTER TABLE ${table.name} RENAME CONSTRAINT ${oldName} TO ${newName}`)
    }
  }

  /** @override */
  genCodeSetCaption (tableName, column, value, oldValue) {
    if (value) value = value.replace(/'/g, "''")
    if (!value && !oldValue) return // prevent create empty comments
    const result = `comment on ${column ? 'column' : 'table'} ${tableName}${column ? '.' : ''}${column || ''} is '${value}'`
    this.DDL.caption.statements.push(result)
  }

  /** @override */
  genCodeCreateCheckC (table, checkConstr) {
    switch (checkConstr.type) {
      case 'bool':
        this.DDL.createCheckC.statements.push(
          `alter table ${table.name} add constraint ${checkConstr.name} check (${checkConstr.column} in (0,1))`
        )
        break
      case 'custom':
        this.DDL.createCheckC.statements.push(
          `alter table ${table.name} add constraint ${checkConstr.name} check (${checkConstr.expression})`
        )
        break
    }
  }

  /** @override */
  genCodeDropColumn (tableDB, columnDB) {
    this.DDL.dropColumn.statements.push(
      `alter table ${tableDB.name} drop column ${columnDB.name}`
    )
  }

  /** @override */
  genCodeSetDefault (table, column) {
    this.DDL.setDefault.statements.push(
      `alter table ${table.name} alter column ${column.name} set default ${column.defaultValue}`
    )
  }

  /** @override */
  genCodeDropDefault (table, column) {
    this.DDL.dropDefault.statements.push(
      `alter table ${table.name} alter column ${column.name} drop default`
    )
  }

  /** @override */
  genCodeAlterColumn (table, tableDB, column, columnDB, typeChanged, sizeChanged, allowNullChanged) {
    if (typeChanged && column.dataType === 'NTEXT') {
      // todo сделать автоматом
      this.addWarning(`Converting to NTEXT type is not supported. Create a new field manually and copy the data into it
      \tField ${table.name}.${column.name}`)
    }

    // in case of not null added - recreate index
    // if (allowNullChanged && !column.allowNull ){

    const objects = tableDB.getIndexesByColumn(column)
    for (const colIndex of objects) {
      colIndex.isForDelete = true
      colIndex.isForDeleteMsg = `Delete for altering column ${table.name}.${column.name}`
    }

    if (typeChanged || sizeChanged) {
      this.DDL.alterColumn.statements.push(
        `alter table ${table.name} alter column ${column.name} type ${this.createTypeDefine(column)}`
      )
    }
    if (allowNullChanged) {
      if (column.allowNull) {
        this.DDL.alterColumn.statements.push(
          `alter table ${table.name} alter column ${column.name} ${column.allowNull ? ' drop not null' : ' set not null'}`
        )
      } else {
        this.DDL.alterColumnNotNull.statements.push(
          `alter table ${table.name} alter column ${column.name} ${column.allowNull ? ' drop not null' : ' set not null'}`
        )
      }
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
      `alter table ${table.name} add ${column.name} ${typeDef}${def}${nullable}`
    )
    if (delayedNotNull && !column.allowNull) {
      this.DDL.alterColumnNotNull.statements.push(
        `alter table ${table.name} alter column ${column.name} set not null`
      )
    }
  }

  /**
   * @override
   */
  genCodeAddColumnBase (table, column, baseColumn) {
    const def = column.defaultValue ? ' default ' + column.defaultValue : ''
    this.DDL.addColumn.statements.push(
      `alter table ${table.name} add ${column.name} ${this.createTypeDefine(column)}${def}`
    )

    this.DDL.updateColumn.statements.push(
      `update ${table.name} set ${column.name} = ${baseColumn} where 1 = 1`
    )

    if (!column.allowNull) {
      const nullable = column.allowNull ? ' null' : ' not null'
      this.DDL.alterColumnNotNull.statements.push(
        `alter table ${table.name} alter column ${column.name} set ${nullable}`
      )
    }
  }

  /** @override */
  genCodeCreateTable (table) {
    const res = [`create table ${table.name}(\r\n`]
    const colLen = table.columns.length

    table.columns.forEach((column, index) => {
      res.push('\t', column.name, ' ', this.createTypeDefine(column),
        column.defaultValue
          ? ' default ' + column.defaultValue // do not need def name in postgre (column.defaultConstraintName ? ` CONSTRAINT ${column.defaultConstraintName} ` : '') +
          : '',
        column.allowNull ? ' null' : ' not null',
        index < colLen - 1 ? ',\r\n' : '\r\n')
    })
    res.push(')')
    this.DDL.createTable.statements.push(res.join(''))
  }

  /** @override */
  genCodeEnableMultitenancy (table) {
    this.DDL.others.statements.push(
      `ALTER TABLE ${table.name} ENABLE ROW LEVEL SECURITY`
    )
    this.DDL.others.statements.push(
      `CREATE POLICY ${table.name}_policy ON ${table.name} USING (mi_tenantID = current_setting('ub.tenantID')::bigint)`
    )
  }

  /** @override */
  genCodeDisableMultitenancy (table) {
    this.DDL.others.statements.push(
      `ALTER TABLE ${table.name} DISABLE ROW LEVEL SECURITY`
    )
    this.DDL.others.statements.push(
      `DROP POLICY IF EXISTS ${table.name}_policy ON ${table.name}`
    )
  }

  /** @override */
  genCodeCreatePK (table) {
    // TODO - then Postgres will support index organized table - uncomment it
    // if (!table.isIndexOrganized){
    this.DDL.createPK.statements.push(
      `alter table ${table.name} add constraint ${table.primaryKey.name} PRIMARY KEY (${table.primaryKey.keys.join(',')})`
    )
    // }
  }

  /** @override */
  genCodeCreateFK (table, constraintFK) {
    if (!constraintFK.generateFK) return

    const refTo = _.find(this.refTableDefs, { _nameUpper: constraintFK.references.toUpperCase() })
    const refKeys = refTo ? refTo.primaryKey.keys.join(',') : constraintFK.refPkDefColumn

    this.DDL.createFK.statements.push(
      `alter table ${table.name} add constraint ${constraintFK.name} foreign key (${constraintFK.keys.join(',')}) references ${constraintFK.references}(${refKeys})`
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
    // todo - by felix: for Postgres no need rename primary key index
    const cObj = objCollect || this.DDL.dropIndex.statements
    if (comment) cObj.push(`-- ${comment}\r\n`)
    if (indexDB.isConstraint) {
      cObj.push(`ALTER TABLE ${tableDB.name} DROP CONSTRAINT ${indexDB.name}`)
    } else {
      cObj.push(`drop index ${indexDB.name}`)
    }
  }

  /**
   * @abstract
   */
  genCodeDropPK (tableName, constraintName) {
    this.DDL.dropPK.statements.push(
      `alter table ${tableName} drop constraint ${constraintName}`
    )
    // throw new Error(`Abstract genCodeDropPK for ${tableName}.${constraintName}`)
  }

  /**
   * @override
   */
  genCodeDropConstraint (tableName, constraintName) {
    this.DDL.dropFK.statements.push(
      `alter table ${tableName} drop constraint ${constraintName}`
    )
  }

  /**
   * @override
   */
  genCodeAddSequence (sequenceObj) {
    // "cache" = 1 is important to prevent getting the same value X times for nextval('myseq')
    // http://www.postgresql.org/docs/9.3/static/functions-sequence.html
    this.DDL.createSequence.statements.push(
      `create sequence ${sequenceObj} increment 1 maxvalue 999999999999999 start 1 cycle cache 1`,
      `SELECT nextval('${sequenceObj}')` // UB-1311
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
    this.DDL.createIndex.statements.push(
      `${commentText}create ${indexSH.isUnique ? 'unique' : ''} index ${indexSH.name} on ${table.name}(${indexSH.keys.join(',')})`
    )
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
        case 'currentDate':
          return 'timezone(\'utc\'::text, now())'
        case 'maxDate':
          return "'9999-12-31 00:00:00'::timestamp without time zone"
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
      case 'NVARCHAR': return 'VARCHAR'
      case 'VARCHAR': return 'VARCHAR'
      case 'INTEGER': return 'INTEGER'
      case 'BIGINT': return 'BIGINT'
      case 'FLOAT': return 'NUMERIC'
      case 'CURRENCY': return 'NUMERIC'
      case 'BOOLEAN': return 'SMALLINT'
      case 'DATETIME': return 'TIMESTAMP' // 'TIMESTAMP WITH TIME ZONE'
      case 'TEXT': return 'TEXT'
      case 'DOCUMENT': return 'VARCHAR'
      case 'BLOB': return 'BYTEA'
      case 'JSON': return 'JSONB'
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
      case 'NUMERIC':
        if (prec === 19 && scale === 2) {
          return 'CURRENCY'
        } else if (prec === 19 && scale > 2) {
          return 'FLOAT'
        } else {
          return 'BIGINT'
        }
      case 'INT8': return 'BIGINT'
      case 'INT4': return 'INTEGER'
      case 'SMALLINT': return 'BOOLEAN'
      case 'TIMESTAMP': return 'DATETIME' // OLD - TIMESTAMP and this unknown comment Не будет совпадать с типом DATETIME и сгенерится ALTER
      case 'TIMESTAMP WITH TIME ZONE': return 'TIMESTAMP WITH TIME ZONE'
      case 'TIMESTAMP WITHOUT TIME ZONE': return 'DATETIME' // OLD - TIMESTAMP WITHOUT TIME ZONE and this unknown comment: Не будет совпадать с типом DATETIME и сгенерится ALTER
      case 'DATE': return 'DATE' // Не будет совпадать с типом DATETIME и сгенерится ALTER
      case 'CHARACTER VARYING': return 'NVARCHAR'
      case 'VARCHAR': return 'NVARCHAR'
      case 'TEXT': return 'TEXT'
      case 'BYTEA': return 'BLOB'
      case 'JSONB': return 'JSON'
      default: return dataType
    }
  }

  /**
   * Generate a column type DDL part
   * @override
   * @param {FieldDefinition} column
   * @return {string}
   */
  createTypeDefine (column) {
    if ((column.dataType === 'BOOLEAN') || (column.dataType === 'JSON')) { // prevent SMALLINT(1) && JSONB(4000)
      return this.uniTypeToDataBase(column.dataType)
    } else {
      return super.createTypeDefine(column)
    }
  }
}

module.exports = DBPostgreSQL
