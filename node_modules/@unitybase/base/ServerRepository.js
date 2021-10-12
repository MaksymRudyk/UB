/*
 * Repository for server-side data retrieve
 *
 * @author pavel.mash
 */

const csShared = require('@unitybase/cs-shared')
const CustomRepository = csShared.CustomRepository
const LocalDataStore = csShared.LocalDataStore

const v = process.version.split('.')
const LOCAL_SERVER_UBQL_V2 = ((v[0] >= 'v5') && (v[1] >= 10))
/* global TubDataStore */
/**
 * @classdesc
 * Server side repository.
 * Override {@link ServerRepository#select} method return initialized {@link TubDataStore}
 *
 * Usually is created by using one of the fabric functions:
 *
 *   - {@link module:@unitybase/ub#Repository UB.Repository} for entities from this server instance
 *   - {@link class:SyncConnection#Repository conn.Repository} for access remote UB server
 *
 * @example

let store = UB.Repository('my_entity')
 .attrs('id')
 .where('code', 'in', ['1', '2', '3'])  // code in ('1', '2', '3')
 .where('name', 'contains', 'Homer') // name like '%homer%'
 .where('birtday', 'geq', new Date()) //(birtday >= '2012-01-01')
 .where('birtday', 'leq', new Date() + 10) // AND (birtday <= '2012-01-02')
 .where('[age] -10', '>=', {age: 15}, 'byAge') // (age + 10 >= 15)
 .where('', 'match', 'myvalue') // perform full text search for entity (require fts mixin)
 .logic('(byStrfType OR bySrfKindID)AND(dasdsa)')
 .select()

 * @class ServerRepository
 * @extends CustomRepository
 */
class ServerRepository extends CustomRepository {
  /**
   * @private
   * @param {SyncConnection|null} connection The remote server connection or `null` for internal server thread
   * @param {String} entityName name of Entity we create for
   */
  constructor (connection, entityName) {
    super(entityName)
    /**
     * @property {SyncConnection} connection
     * @private
     */
    Object.defineProperty(this, 'connection', { enumerable: false, writable: false, value: connection })
    this.UBQLv2 = connection ? connection.UBQLv2 : LOCAL_SERVER_UBQL_V2
  }

  /**
   * @param {Object<string, string>} [fieldAliases] Optional object to change attribute
   *  names during transform array to object
   * @param {Boolean} [resultInPlainText=false] If true - result is {String}
   * @return {Array.<Object>|String}
   */
  selectAsObject (fieldAliases, resultInPlainText) {
    if (process.isServer) { // inside server thread
      // check UB < 5.2 selectAsObject signature
      if ((typeof fieldAliases === 'boolean') || (fieldAliases && resultInPlainText)) {
        throw new Error('first parameter of ServerRepository should not be boolean. fieldAliases can not be combined with plain text result')
      }
      const inst = new TubDataStore(this.entityName)
      inst.run(this.method, this.ubql())
      let res
      if (fieldAliases) {
        res = { resultData: inst.getAsJsArray() }
        res = LocalDataStore.selectResultToArrayOfObjects(res, fieldAliases)
      } else {
        res = resultInPlainText
          ? inst.getAsTextInObjectNotation()
          : inst.getAsJsObject()
      }
      inst.freeNative() // release memory ASAP
      return res
    } else {
      const conn = this.connection
      if (resultInPlainText) throw new Error('plainTextResult parameter not applicable in this context')
      return LocalDataStore.selectResultToArrayOfObjects(conn.query(this.ubql()), fieldAliases)
    }
  }

  /**
   * @param {Boolean} [resultInPlainText=false] If true - result is {String}
   * @return {TubCachedData|String} // todo this is TubCachedData structure!!!
   */
  selectAsArray (resultInPlainText) {
    if (process.isServer) { // inside server thread
      const inst = new TubDataStore(this.entityName)
      inst.run(this.method, this.ubql())
      const res = resultInPlainText
        ? inst.getAsTextInArrayNotation()
        : { resultData: inst.getAsJsArray() }
      if ((!resultInPlainText) && (this.options && this.options.totalRequired)) {
        res.__totalRecCount = inst.totalRowCount
      }
      inst.freeNative() // release memory ASAP
      return res
    } else {
      if (resultInPlainText) {
        throw new Error('plainTextResult parameter not applicable in this context')
      }
      return this.connection.query(this.ubql())
    }
  }

  /**
   * For repository with ONE attribute returns a flat array of attribute values
   * @example

   const usersIDs = UB.Repository('uba_user'),attrs('ID').limit(100).selectAsArrayOfValues()
   // usersIDs is array of IDs [1, 2, 3, 4]

   * @return {Array<string|number>}
   */
  selectAsArrayOfValues () {
    if (process.isServer) { // inside server thread
      const res = []
      const inst = new TubDataStore(this.entityName)
      inst.run(this.method, this.ubql())
      while (!inst.eof) {
        res.push(inst.get(0))
        inst.next()
      }
      inst.freeNative() // release memory ASAP
      return res
    } else {
      const resp = this.connection.query(this.ubql())
      return resp.resultData.data.map(r => r[0])
    }

  }

  /**
   * Create new, or use passed as parameter {@link TubDataStore} and run {@link class:TubDataStore#select TubDataStore.select} method passing result of {@link class:CustomRepository#ubql CustomRepository.ubql()} as config.
   * Do not work for remote connection.
   *
   * @param {TubDataStore} [instance] Optional instance for in-thread execution context. If passed - run select for it (not create new instance) and return instance as a result.
   *   Be careful - method do not check instance is created for entity you pass to Repository constructor.
   * @return {TubDataStore|Array.<Object>}
   */
  selectAsStore (instance) {
    let inst
    if (this.connection) {
      if (instance) { throw new Error('parameter instance applicable only for in-server execution context') }
      inst = this.selectAsObject()
    } else {
      inst = instance || new TubDataStore(this.entityName)
      inst.run(this.method, this.ubql())
    }
    return inst
  }

  /**
   * @param {TubDataStore} [instance] Optional instance for in-thread execution context. If passed - run select for it (not create new instance) and return instance as a result.
   * @return {TubDataStore}
   */
  select (instance) {
    return this.selectAsStore(instance)
  }

  /**
   * Select a single row. If ubql result is empty - return {undefined}.
   *
   * **WARNING** method do not check repository contains the single row and always return a first row from result
   *
   * @param {Object<string, string>} [fieldAliases] Optional object to change attribute
   *  names during transform array to object
   * @return {Object|undefined}
   */
  selectSingle (fieldAliases) {
    const r = this.selectAsObject(fieldAliases)
    if (r.length > 1) {
      if (process.isDebug) { // get a callstack
        const e = new Error('cs')
        console.error(this.CONSTANTS.selectSingleMoreThanOneRow +
          '. Stack: ' + e.stack.split('\n').slice(0, 3).join('\n'))
      } else {
        console.error(this.CONSTANTS.selectSingleMoreThanOneRow)
      }
    }
    return r[0]
  }

  /**
   * Perform select and return a value of the first attribute from the first row
   *
   * **WARNING** method do not check repository contains the single row
   *
   * @return {Number|String|undefined}
   */
  selectScalar () {
    if (process.isServer) { // inside server thread
      const inst = new TubDataStore(this.entityName)
      inst.run(this.method, this.ubql())
      const res = inst.eof ? undefined : inst.get(0)
      if (inst.rowCount > 1) {
        if (process.isDebug) { // get a callstack
          const e = new Error('cs')
          console.error(this.CONSTANTS.selectScalarMoreThanOneRow +
            '. Stack: ' + e.stack.split('\n').slice(0, 3).join('\n'))
        } else {
          console.error(this.CONSTANTS.selectScalarMoreThanOneRow)
        }
      }
      inst.freeNative() // release memory ASAP
      return res
    } else {
      const result = this.selectAsArray()
      if (Array.isArray(result.resultData.data[0])) {
        if (result.resultData.data.length > 1) {
          if (process.isDebug) { // get a callstack
            const e = new Error('cs')
            console.error(this.CONSTANTS.selectScalarMoreThanOneRow +
              '. Stack: ' + e.stack.split('\n').slice(0, 3).join('\n'))
          } else {
            console.error(this.CONSTANTS.selectScalarMoreThanOneRow)
          }
        }
        return result.resultData.data[0][0]
      } else {
        return undefined
      }
    }
  }

  /**
   * Select a single row by ID. If ubql result is empty - return {undefined}.
   *
   * @param {Number} ID Row identifier
   * @param {Object<string, string>} [fieldAliases] Optional object to change attribute
   *  names during transform array to object
   * @return {Object|undefined}
   */
  selectById (ID, fieldAliases) {
    return this.where('[ID]', '=', ID).selectSingle(fieldAliases)
  }
}
/**
 * Create new instance of ServerRepository
 * @example

 const Repository = require('@unitybase.base').ServerRepository.fabric
 const req = Repository('uba_user').attrs('*').ubql()

 * @param {String} entityName name of Entity for which we create repository
 * @param {SyncConnection} [connection] The remote server connection. For internal server thread can be empty
 * @return {ServerRepository}
 * @private
 */
function fabric (entityName, connection = null) {
  return new ServerRepository(connection, entityName)
}

module.exports = {
  ServerRepository,
  fabric
}
