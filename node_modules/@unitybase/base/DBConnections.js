/**
 * Direct access to database connection pool defined in ubConfig
 * @module DBConnections
 * @memberOf module:@unitybase/base
 * @author pavel.mash
 */
/*
 * Created by v.orel on 22.12.2016.
 */
const binding = process.binding('ub_dbConnection')

const DB_INDEX = Symbol('dbIndex')
const chDblQuote = 34
const chQuote = 39
const chColon = 58
const chLRoundBrac = 40
const chRRoundBrac = 41
const chLBrac = 91
const chZero = 48
const chNine = 57
const chPlus = 43
const chMinus = 45
const chQuestionMark = 63
const chPoint = 46
const chN = 110
const chU = 117
const chL = 108
const chEGr = 69
const chELw = 101
const chSpace = 32
const chLF = 10
const chCR = 13

const PG_SAVEPOINT_START = 'SAVEPOINT ubapp_tmp_batch_sp'
const PG_SAVEPOINT_RELEASE = 'RELEASE ubapp_tmp_batch_sp'
const PG_SAVEPOINT_ROLLBACK = 'ROLLBACK TO ubapp_tmp_batch_sp'

/**
 * @typedef {Object} parsedSQLResult
 * @property {string} parsedSql
 * @property {Array} parsedParams
 */

/**
 * @classdesc
 * Direct database access to databases defined in the config file.
 * Inside a server thread class instances are available using {@link App.dbConnections App.dbConnections}
 * @example

 const mainConn = App.dbConnections['main']
 mainConn.exec('insert into table1(a, b) values(:a:, :b:)', {a: 1, b: 2})
 mainConn.commit()

 * @class DBConnection
 */
class DBConnection {
  /**
   * @private
   * @param {number} index
   * @param {DBConnectionConfig} cfg
   */
  constructor (index, cfg) {
    /**
     * @private
     * @property dbIndexSymbol
     */
    Object.defineProperty(this, DB_INDEX, { value: index })
    /**
     * Database connection config as defined in Domain
     * @property {DBConnectionConfig} config
     */
    Object.defineProperty(this, 'config', { enumerable: true, value: cfg })
    this.isPostgreSQL = (this.config.dialect === 'PostgreSQL')
  }

  /**
   * Is database in transaction
   * @returns {boolean}
   */
  get inTransaction () {
    return binding.inTransaction(this[DB_INDEX])
  }

  /**
   * Start transaction. If transaction is already started return false
   * @returns {boolean}
   */
  startTransaction () {
    return binding.startTransaction(this[DB_INDEX])
  }

  /**
   * Commit transaction. If transaction is not started return false
   * @returns {boolean}
   */
  commit () {
    return binding.commit(this[DB_INDEX])
  }

  /**
   * Rollback transaction. If transaction is not started return false
   * @returns {boolean}
   */
  rollback () {
    return binding.rollback(this[DB_INDEX])
  }

  /**
   * Run SQL what expect a result and contains named `:paramName:` and/or inline `:(inlineValue):` parameters
   * @param {string} sql
   * @param {Object} params
   * @returns {string}
   */
  run (sql, params) {
    const { parsedSql, parsedParams } = this.parseSQL(sql, params)
    return binding.run(this[DB_INDEX], parsedSql, parsedParams)
  }

  /**
   * Run parsed (all parameters are ?) SQL what expects result (select statement for example). Returns result as parsed JSON
   *
   * **WARNING** Oracle return all field name in UPPER case if `AS "normalName"` is not specified, Postgres - in lower case
   *   so better to write a query as such
   *  `select ID as "ID", modelName AS "modelName" from ..`
   *  instead of `select ID, modelName from ..`
   *
   * @param {string} parsedSql
   * @param {Array} paramsValues
   * @returns {Array<Object>}
   */
  selectParsedAsObject (parsedSql, paramsValues = []) {
    return binding.runAsObject(this[DB_INDEX], parsedSql, paramsValues)
  }

  /**
   * Run parsed (all parameters are ?) SQL what expects result (select statement for example)
   * @param {string} sql
   * @param {Array} [params]
   * @returns {string}
   */
  runParsed (sql, params = []) {
    return binding.run(this[DB_INDEX], sql, params)
  }

  /**
   * Execute SQL what do not expect a result and contains named `:paramName:` and/or inline `:(inlineValue):` parameters
   * @param {string} sql
   * @param {Array} params
   * @returns {boolean}
   */
  exec (sql, params = []) {
    const { parsedSql, parsedParams } = this.parseSQL(sql, params)
    return this.execParsed(parsedSql, parsedParams)
  }

  /**
   * Execute parsed (without inline parameters) sql statement
   * @param {string} sqlStatement Statement with parameters as `?`
   * @param {Array} params Parameters values
   * @returns {boolean}
   */
  execParsed (sqlStatement, params = []) {
    return binding.exec(this[DB_INDEX], sqlStatement, params)
  }

  /**
   * For Postgres wrap a func call into temporary savepoint.
   * In case func throws savepoint is rollback'ed and error is re-trowed, otherwise checkpoint is released.
   * For other RDBMS execute func as is.
   * Return a func result
   *
   * @example

function insertionWhatMayFail () {
  let eStore = UB.DataStore('ubm_enum')
  eStore.run('insert', { execParams: { eGroup: 'tst', code: '1', name: 'test1' } })
}

let db = App.dbConnections[App.domainInfo.entities.ubm_enum.connectionName]
try {
  db.savepointWrap(insertionWhatMayFail)
} catch (e) {
  console.log('insertion failure inside savepoint')
}

   * @param {function} func
   * @return {*}
   */
  savepointWrap (func) {
    if (this.isPostgreSQL) {
      let res
      try {
        this.execParsed(PG_SAVEPOINT_START, [])
        res = func()
        this.execParsed(PG_SAVEPOINT_RELEASE, [])
        return res
      } catch (e) {
        this.execParsed(PG_SAVEPOINT_ROLLBACK, [])
        throw e
      }
    } else {
      return func()
    }
  }

  /**
   * Generate ID. If entity is specified - generate for specified entity (it cah have hos own sequence generator)
   *   if entity not specified (UB 5.18.17+) - generate ID for this connection
   * @param {string|undefined} entity code or nothing to get connection level ID
   * @returns {number}
   */
  genID (entity) {
    return entity ? binding.genID(entity) : binding.genID(this[DB_INDEX])
  }

  /**
   * @private
   * @param {string} sql
   * @param {Object} params
   * @returns {parsedSQLResult}
   */
  parseSQL (sql, params) {
    const parsedParams = []
    const paramPositions = []
    let unnamedParamsCount = 0
    params = params || {}
    for (let i = 0, ch = sql.charCodeAt(0), L = sql.length; i < L; ch = sql.charCodeAt(++i)) {
      if (ch === chDblQuote) {
        while ((i < L) && (sql.charCodeAt(++i) !== chDblQuote)) {}
      } else if (ch === chQuote) {
        while ((i < L) && (sql.charCodeAt(++i) !== chQuote)) {}
      } else if (ch === chColon) {
        // while ((i< L) && (sql.charCodeAt(++i) !== chQuote)) {}
        if ((ch = sql.charCodeAt(++i)) === chColon) {
        // MSSQL ALTER AUTHORIZATION ON database::testdb
        } else if (ch === chLRoundBrac) {
          // syn inline :(value):
          let inlineParamValue, paramEnd
          ch = sql.charCodeAt(++i)
          const paramStart = i
          if ((ch === chQuote) || (ch === chDblQuote)) {
            const quote = ch
            let curPosition = i + 1
            inlineParamValue = []
            while (i < L) {
              ch = sql.charCodeAt(++i)
              if (ch === quote) {
                inlineParamValue.push(sql.slice(curPosition, i))
                if ((ch = sql.charCodeAt(++i)) === quote) {
                  // allow double quotes inside string
                  curPosition = i
                } else {
                  break
                }
              }
            }
            inlineParamValue = inlineParamValue.join('')
          } else if ((ch === chPlus) || (ch === chMinus) || ((ch >= chZero) && (ch <= chNine))) {
            while (((ch = sql.charCodeAt(++i)) >= chZero) && (ch <= chNine)) {}
            if (ch === chPoint) {
              while (((ch = sql.charCodeAt(++i)) >= chZero) && (ch <= chNine)) {}
            }
            if ((ch === chEGr) || (ch === chELw)) {
              ch = sql.charCodeAt(++i)
              if ((ch === chPlus) || (ch === chMinus)) {
                ch = sql.charCodeAt(++i)
              }
              while (((ch = sql.charCodeAt(++i)) >= chZero) && (ch <= chNine)) {}
            }
            inlineParamValue = Number.parseFloat(sql.slice(paramStart, paramEnd))
          } else if (ch === chLBrac) {
            let arraySearchPosition = paramStart
            while (i < L) {
              i = sql.indexOf(']):', arraySearchPosition)
              i++
              try {
                inlineParamValue = JSON.parse(sql.slice(paramStart, i))
              } catch (e) {
                arraySearchPosition = i
              }
              if (inlineParamValue !== undefined) {
                if (inlineParamValue.length === 0) {
                  throw new Error('Empty array binding')
                }
                const requiredType = typeof inlineParamValue[0]
                if ((requiredType !== 'number') && (requiredType !== 'string')) {
                  throw new Error('Only String or Int64 array binding allowed')
                }
                for (let element of inlineParamValue) {
                  if (typeof element !== requiredType) {
                    throw new Error(`Array binding ${requiredType} type required`)
                  }
                }
                break
              }
            }
          } else if (ch === chN) {
            if (((ch = sql.charCodeAt(++i)) === chU) && ((ch = sql.charCodeAt(++i)) === chL) && ((ch = sql.charCodeAt(++i)) === chL)) {
              ch = sql.charCodeAt(++i)
              inlineParamValue = null
            }
          }
          paramEnd = i
          while ((ch = sql.charCodeAt(i)) <= chSpace) {
            i++
          }

          if ((ch !== chRRoundBrac) || ((ch = sql.charCodeAt(++i)) !== chColon)) {
            throw new Error('Error parsing SQL')
          }
          if (inlineParamValue === undefined) {
            throw new Error('Error parsing inline parameter')
          }
          parsedParams.push(inlineParamValue)
          paramPositions.push({ paramStart: paramStart - 2, paramEnd: paramEnd + 2 })
        } else {
          // UB :paramName: - replace by ? and add a named param to AOutParams
          const paramStart = i
          ch = sql.charCodeAt(++i)
          if (
            ((ch >= 'a'.charCodeAt(0)) && (ch <= 'z'.charCodeAt(0))) ||
            ((ch >= 'A'.charCodeAt(0)) && (ch <= 'Z'.charCodeAt(0)))
          ) {
            while ((i < L) && ((ch = sql.charCodeAt(++i)) !== chColon)) {}
            const paramEnd = i
            const paramName = sql.slice(paramStart, paramEnd)
            const paramValue = params[paramName]
            if (paramValue === undefined) {
              throw new Error(`Param ${paramName} not found`)
            } else {
              parsedParams.push(paramValue)
            }
            paramPositions.push({ paramStart: paramStart - 1, paramEnd: paramEnd + 1 })
          }
        }
      } else if (ch === chQuestionMark) {
        const unnamedParamValue = params[unnamedParamsCount++]
        if (unnamedParamValue === undefined) {
          throw new Error(`Param ${unnamedParamsCount - 1} not found`)
        } else {
          parsedParams.push(unnamedParamValue)
        }
      } else if (ch === chMinus) {
        if ((ch = sql.charCodeAt(++i)) === chMinus) {
        // comments
          while ((i < L) && ((ch = sql.charCodeAt(++i)) !== chLF) && (ch !== chCR)) {}
        }
      }
    }
    let startPos = 0
    let sqlParts = []
    for (let curParam = 0, L = paramPositions.length; curParam < L; curParam++) {
      sqlParts.push(sql.slice(startPos, paramPositions[curParam].paramStart))
      sqlParts.push('?')
      startPos = paramPositions[curParam].paramEnd
    }
    if (sqlParts.length === 0) {
      return { parsedSql: sql, parsedParams: parsedParams }
    } else {
      sqlParts.push(sql.slice(startPos, sql.length))
      return { parsedSql: sqlParts.join(''), parsedParams: parsedParams }
    }
  }
}

let __cachedPool
/**
 * Create a DBConnection for each connection config item
 * @protected
 * @param {Array<DBConnectionConfig>} connectionsConfig
 * @param {boolean} [useCached=true] Return already created pool if any
 * @return {Object<string, DBConnection>}
 */
function createDBConnectionPool (connectionsConfig, useCached = true) {
  if (__cachedPool && useCached) {
    return __cachedPool
  }
  const connections = {}
  const connBinding = binding.connections
  connectionsConfig.forEach((cfg, idx) => {
    if (connBinding[idx] !== cfg.name) {
      throw new Error(`internal error: domain config database connection name "${cfg.name}" with index ${idx} does not match database binding name "${connBinding[idx]}"`)
    }
    Object.defineProperty(connections, cfg.name, { value: new DBConnection(idx, cfg), enumerable: true })
    if (cfg.isDefault && !connections.DEFAULT) {
      Object.defineProperty(connections, 'DEFAULT', { value: connections[cfg.name], enumerable: true })
    }
  })
  if (!connections.DEFAULT && connectionsConfig.length) {
    Object.defineProperty(connections, 'DEFAULT', { value: connections[connectionsConfig[0].name], enumerable: true })
  }
  if (useCached) {
    __cachedPool = connections
  }
  return connections
}

/**
 * Release previously created connection pool
 * @protected
 */
function releaseDBConnectionPool () {
  binding.releaseConnections()
  __cachedPool = undefined
}

module.exports = {
  createDBConnectionPool,
  releaseDBConnectionPool
}
