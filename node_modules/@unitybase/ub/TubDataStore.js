/* global TubDataStore */
const App = require('./modules/App')
const blobStores = require('@unitybase/blob-stores')
const csShared = require('@unitybase/cs-shared')
const LocalDataStore = csShared.LocalDataStore

/**
 * @classdesc
 * Class for execution of an ORM/SQL queries on the server side.
 * Contains several data collection stored in the heap of ub application (i.e not use a JS engine memory and since not a subject of GC)
 *
 * Use it to:
 *  - execute any entity method using {@link class:TubDataStore#run TubDataStore.run}
 *  - execute any SQL statement using {@link class:TubDataStore#runSQL TubDataStore.runSQL} or {@link class:TubDataStore#execSQL TubDataStore.execSQL} (we strongly recommend usage of ORM instead SQL)
 *  - store several named data collection using {@link class:TubDataStore#currentDataName TubDataStore.currentDataName} (data stored inside server memory, not in JS, this is very good for GC)
 *  - iterate other collection rows using {@link class:TubDataStore#next TubDataStore.next}, eof, e.t.c and retrieve row data using {@link class:TubDataStore#get TubDataStore.get}
 *  - serialize data to XML {@link class:TubDataStore#asXMLPersistent TubDataStore.asXMLPersistent} or JSON string in array-of-array {@link class:TubDataStore#asJSONArray TubDataStore.asJSONArray} or array-of-object {@link class:TubDataStore#asJSONObject TubDataStore.asJSONObject} format
 *  - serialize data to JavaScript object in array-of-array {@link class:TubDataStore#getAsJsArray TubDataStore.getAsJsArray()} or array-of-object {@link class:TubDataStore#getAsJsObject TubDataStore.getAsJsObject()} format
 *
 *  To retrieve data from database using build-in ORM (execute entity `select` method) preferred way is
 *  to use {@link module:@unitybase/ub#Repository UB.Repository} fabric function.
 *
 * @class TubDataStore
 */

/**
 *  Initialize DataStore from one of supported source formats:
 *
 *   - Flatten(fastest): `{fieldCount: K, rowCount: Z, values: [field1Name, ..., fieldKName, row1field1Value, ..., row1fieldKValue, row2field1Value,..]}`
 *   - Array-of-array  : '[[row1field1Value,  ..., row1fieldKValue], ..., [rowZfield1Value, ... rowZfieldKValue]'
 *   - Array-of-object : '[{field1Name: row1field1Value, ..., fieldKName: row1fieldKValue}, ....]'
 *
 *  Can (optionally) convert source field names to new names using keyMap array.
 *  @example
 const UB = require('@unitybase/ub')
 var ds = UB.DataStore('my_entity')

 // init empty (rowCount=0) dataStore with provided fields.
 // In case keyMap is omitted we consider it contain one attribute 'ID'
 ds.initialize([]) // the same as ds.initialize([], ['ID'])
 ds.initialize([], ['ID', 'name', {from: 'AGE', to: 'age'}])

 // Initialize dataStore from array-of-object representation
 // Resulting datstore will contain 3 field: ID, nam, age (in order, they listen in keyMap array).
 // During initialization we convert fiend name 'AGE' -> age;
 ds.initialize([
     {ID: 10, name: 'Jon', AGE: 10},
     {ID: 20, name: 'Smith', AGE: 63}
   ],
   ['ID', 'name', {from: 'AGE', to: 'age'}]
 )

 //the same, but do not convert AGE->age. Result dataset field order is unknown
 ds.initialize([
   {ID: 10, name: 'Jon', AGE: 10},
   {ID: 20, name: 'Smith', AGE: 63}
 ])

 //result dataset will contain only two field 'ID' & 'age'
 ds.initialize([
     {ID: 10, name: 'Jon', AGE: 10},
     {ID: 20, name: 'Smith', AGE: 63}
   ],
   ['ID', {from: 'AGE', to: 'age'}]
 )

 // Initialize dataStore from Array-of-array data
 // in this case keyMap is mandatory.
 // In case of mapping from is zero-based index of source element in row array
 ds.initialize(
   [[10, 'Jon', 10], [20, 'Smith', 63]],
   ['ID', 'name', 'age']
 )
 // or use mapping
 ds.initialize([[10, 'Jon', 10], [20, 'Smith', 63]],
    ['ID', {from: 2, to: 'age'}, {from: 1, to: 'name'}])

 * @method initialize
 * @memberOf TubDataStore
 * @param {Object|Array} source
 * @param {Array.<String|Object>} [keyMap] Optional mapping of source field names to new field names
 * @returns {TubDataStore}
 */
TubDataStore.initialize = function (source, keyMap) {
  const flatArray = []
  const resultFields = []
  const sourceFields = []

  function keyMap2Mapping (keyMap, isIndexBased) {
    for (let i = 0, l = keyMap.length; i < l; i++) {
      const elm = keyMap[i]
      if (typeof elm === 'object') {
        sourceFields.push(isIndexBased ? parseInt(elm.from, 10) : elm.from)
        resultFields.push(elm.to)
      } else {
        sourceFields.push(isIndexBased ? i : elm)
        resultFields.push(elm)
      }
    }
  }

  if (Array.isArray(source)) {
    const rowCount = source.length
    if (rowCount === 0) {
      // 1) empty store
      keyMap2Mapping((keyMap && keyMap.length) ? keyMap : ['ID'])
      // noinspection JSDeprecatedSymbols
      this.initFromJSON({ fieldCount: resultFields.length, rowCount: 0, values: resultFields }) // empty dataStore initialization
    } else if (Array.isArray(source[0])) {
      //  2) Array-of-array
      if ((!keyMap) || (!keyMap.length)) {
        throw new Error('TubDataStore.initialize: for array-of-array keyMap is required')
      }
      keyMap2Mapping(keyMap, true)
      const fieldCount = resultFields.length
      for (let i = 0; i < fieldCount; i++) { // field names
        flatArray.push(resultFields[i])
      }

      for (let i = 0; i < rowCount; i++) { // data
        const row = source[i]
        for (let j = 0; j < fieldCount; j++) {
          flatArray.push(row[sourceFields[j]]) // add source field using it index in keyMap
        }
      }
      // noinspection JSDeprecatedSymbols
      this.initFromJSON({ fieldCount: fieldCount, rowCount: rowCount, values: flatArray })
    } else if (typeof source[0] === 'object') {
      // 3) Array-of-object
      keyMap2Mapping((keyMap && keyMap.length) ? keyMap : Object.keys(source[0]))
      const fieldCount = resultFields.length
      for (let i = 0; i < fieldCount; i++) { // field names
        flatArray.push(resultFields[i])
      }
      for (let i = 0; i < rowCount; i++) { // data
        const row = source[i]
        for (let j = 0; j < fieldCount; j++) {
          flatArray.push(row[sourceFields[j]]) // add source field using it name from keyMap
        }
      }
      // noinspection JSDeprecatedSymbols
      this.initFromJSON({ fieldCount: fieldCount, rowCount: rowCount, values: flatArray })
    } else {
      throw new Error('TubDataStore.initialize: invalid source format for TubDataStore.initialize')
    }
  } else if ((typeof source === 'object') && (source.fieldCount > 0) && (source.rowCount >= 0)) { // flatten
    if (keyMap) {
      if (keyMap.length !== source.fieldCount) {
        throw new Error('TubDataStore.initialize: for flatten data keyMap length must be equal to fieldCount')
      }
      for (let i = 0, l = source.fieldCount; i < l; i++) {
        if (typeof keyMap[i] !== 'string') {
          throw new Error('TubDataStore.initialize: for flatten data keyMap must contain only field names')
        }
        source.values[i] = keyMap[i]
      }
    }
    // noinspection JSDeprecatedSymbols
    this.initFromJSON({ fieldCount: source.fieldCount, rowCount: source.rowCount, values: source.values }) // order of properties is important for native reader realization
  } else {
    throw new Error('TubDataStore.initialize: invalid source format')
  }
  return this
}

if (TubDataStore.hasOwnProperty('entity')) {
  throw new Error(`Package folder require deduplication.
@unitybase/ub must present only once - inside ./node_modules/@unitybase/ub folder.
All other appearances must be either a symbolic links created by lerna or not exists at all
Detected duplicate path is ${__dirname}
To solve this problem:
 - in case this app is not managed by lerna - run 'npm ddp'
 - in case of lerna: remove package-lock.json and run 'lerna clear && lerna bootstrap'  
`)
}

/**
 * Entity metadata
 * @member {UBEntity} entity
 * @memberOf TubDataStore.prototype
 */
Object.defineProperty(TubDataStore, 'entity', {
  enumerable: true,
  get: function () {
    return App.domainInfo.get(this.entityCode)
  }
})

/**
 * Active dataset name we work with
 * @example
 let store = ctx.dataStore
 let prevData = store.currentDataName
 try {
   store.currentDataName = TubDataStore.DATA_NAMES.BEFORE_UPDATE
   let valueBeforeUpdate = store.get('code')
 } finally {
   store.currentDataName = prevData
 }

 * @member DATA_NAMES
 * @memberOf TubDataStore
 */
TubDataStore.DATA_NAMES = {
  BEFORE_UPDATE: 'selectBeforeUpdate',
  AFTER_UPDATE: 'selectAfterUpdate',
  AFTER_INSERT: 'selectAfterInsert',
  BEFORE_DELETE: 'selectBeforeDelete',
  // TOTAL: '__totalRecCount', removed in UB5.18.1 inst.totalWorCount should be used insteard
  SOFTLOCK: 'softLock',
  RECORDSIGN: 'recordSign',
  TEMP: '_temp'
}

// do additional operation with adtDocument attributes
//  move adtDocument content from temporary store to permanent
// return true if some document attribute actually changed
/**
 * For modified attributes of type `Document`:
 *  - call a BLOB store implementation method `moveToPermanent`
 *  - sets a BLOB attribute value in execParams to permanent blob info
 *
 * @param {ubMethodParams} ctx
 * @param {Boolean} isUpdate
 * @return {Boolean} True in case some of document type attributes actually changed
 * @method commitBLOBStores
 * @memberOf TubDataStore
 */
TubDataStore.commitBLOBStores = function (ctx, isUpdate) {
  const entity = this.entity
  if (!entity.blobAttributes.length) return false

  if (entity.isUnity) {
    console.debug('skip processing blobStores for UNITY update call', entity.name)
    return false
  }
  console.debug('Start processing documents for entity', entity.name)

  const execParams = ctx.mParams.execParams
  const modifiedBlobs = []
  for (let i = 0, L = entity.blobAttributes.length; i < L; i++) {
    const blobAttr = entity.blobAttributes[i]
    const newVal = execParams[blobAttr.name]
    if (newVal) {
      modifiedBlobs.push({
        attr: blobAttr,
        newVal: JSON.parse(newVal),
        oldVal: null
      })
    }
  }
  if (!modifiedBlobs.length) return false

  if (isUpdate) { // for update operations retrieve a prev. values
    const store = ctx.dataStore
    if (store && store.initialized) { // virtual entity can bypass store initialization
      const prevDataName = store.currentDataName
      try {
        store.currentDataName = this.DATA_NAMES.BEFORE_UPDATE
        if (!store.eof) {
          for (let i = 0, L = modifiedBlobs.length; i < L; i++) {
            const modifiedBlob = modifiedBlobs[i]
            if (!(modifiedBlob.newVal.isDirty || modifiedBlob.newVal.deleting)) { // [UB-858]
              throw new Error(`Invalid ${entity.name}.${modifiedBlob.attr.name} Document type attribute content. Update possible either for dirty or for deleting content`)
            }
            const oldVal = store.get(modifiedBlob.attr.name)
            if (oldVal) modifiedBlob.oldVal = JSON.parse(oldVal)
          }
        }
      } finally {
        store.currentDataName = prevDataName
      }
    }
  }

  // for each modified BLOB call a BLOB store implementation for actually
  // move BLOB data from temporary to permanent store
  const ID = execParams.ID
  for (let i = 0, L = modifiedBlobs.length; i < L; i++) {
    const modifiedBlob = modifiedBlobs[i]
    const newMeta = blobStores.doCommit(modifiedBlob.attr, ID, modifiedBlob.newVal, modifiedBlob.oldVal)
    execParams[modifiedBlob.attr.name] = newMeta ? JSON.stringify(newMeta) : null
  }
  return true
}

/**
 * Execute insert method by add method: 'insert' to `ubq` query (if ubq.method not already set).
 * The same semantic as in `SyncConnection.insert` and `AsyncConnection.insert`
 *
 * If `ubq.fieldList` contain only `ID` return inserted ID, else return array of attribute values passed to `fieldList`.
 * If no field list passed at all - return null.
 *
 * @example
 const STORE = UB.DataStore('uba_role')
 // return array of values in order specified ib fieldList
 // result is [3000000000200,"2014-10-21T11:56:37Z"].
 // Below we use destructuring assignment to get array values into variables,
 // so ID === 3000000000200 and  modifyDate === "2014-10-21T11:56:37Z"
 const [ID, modifyDate] = STORE.insert({
   fieldList: ['ID', 'mi_modifyDate'],
   execParams: {
      name: 'testRole1',
      allowedAppMethods: 'runList'
   }
 })

 // return ID (if ID not passed in execParamms it will be generated)
 // 3000000000201
 const testRoleID = STORE.insert({
   fieldList: ['ID'],
   execParams: {
     name: 'testRole1',
    allowedAppMethods: 'runList'
   }
 })

 // no fieldList - null is returned.
 // This is faster compared to inserts with fieldList because selectAfterInsert is skipped
 STORE.insert({
   execParams: {
     name: 'testRole1',
     allowedAppMethods: 'runList'
   }
 })

 * @method insert
 * @memberOf TubDataStore
 * @param {ubRequest} ubq
 * @return {null|number|Array}
 */
TubDataStore.insert = function(ubq) {
  const method = ubq.method || 'insert'
  this.run(method, ubq)
  if (!ubq.fieldList || !ubq.fieldList.length) {
    return null // no field list or it is empty
  } else if ((ubq.fieldList.length === 1) && (ubq.fieldList[0] === 'ID')) {
    return this.get(0) //return ID
  } else {
    const storeData = this.getAsJsArray()
    return storeData.data[0]
  }
}

/**
 * Run UBQL command with `insert` method. **WARNING** better to use insert method - it is faster because values is not parsed.
 *
 * In case `fieldList` is passed - result will contains new values for attributes specified in `fieldList` as Object, otherwise - null
 *
 * In opposite to `insert` method values in result are PARSED based on Domain (as in AsyncConnection) - so values
 * for boolean attributes is true/false, date is typeof Date etc.
 *
 * @method insertAsObject
 * @memberOf TubDataStore
 * @param {ubRequest} ubq
 * @param {Object<string, string>} [fieldAliases] Optional object to change attribute names during transform array to object. Keys are original names, values - new names
 * @returns {Object|null}
 *
 * @example

 const STORE = UB.DataStore('uba_role')
 const newRole = conn.insertAsObject({
  entity: 'uba_role', // can be omitted - we already define entity in STORE constructor
  fieldList: ['ID', 'name', 'allowedAppMethods', 'mi_modifyDate'],
  execParams: {
      name: 'testRole61',
      allowedAppMethods: 'runList'
  }
}, {mi_modifyDate: 'modifiedAt'})
 console.log(newRole) // {ID: 332462911062017, name: 'testRole1', allowedAppMethods: 'runList', mi_modifyDate: 2020-12-21T15:45:01.000Z}
 console.log(newRole.modifiedAt instanceof Date) //true

 */
TubDataStore.insertAsObject = function (ubq, fieldAliases) {
  const method = ubq.method || 'insert'
  this.run(method, ubq)
  if (!ubq.fieldList || !ubq.fieldList.length) {
    return null // no field list or it is empty
  } else {
    const storeData = this.getAsJsArray()
    const res = LocalDataStore.convertResponseDataToJsTypes(App.domainInfo, {entity: this.entityCode, resultData: storeData})
    return (res.resultData && res.resultData.data && res.resultData.data.length)
      ? LocalDataStore.selectResultToArrayOfObjects(res, fieldAliases)[0]
      : null
  }
}

/**
 * Execute `update` method. The same semantic as in `SyncConnection.update` and `AsyncConnection.update`
 *
 * If no field list passed - return null (this is faster), else return array of attribute values passed to `fieldList`.
 *
 * @method update
 * @memberOf TubDataStore
 * @param {ubRequest} ubq
 * @return {*}
 */
TubDataStore.update = function(ubq) {
  const method = ubq.method || 'update'
  this.run(method, ubq)
  if (!ubq.fieldList || !ubq.fieldList.length) {
    return null // no field list or it is empty
  } else {
    const storeData = this.getAsJsArray()
    return storeData.data[0]
  }
}

/**
 * Execute `update` method. The same semantic as in `SyncConnection.updateAsObject` and `AsyncConnection.updateAsObject`
 *  - If fieldList in the ubq not passed or is an empty array - returns null
 *  - If fieldList passed in the ubq, values in result are PARSED based on Domain (as in AsyncConnection) - so values
 * for boolean attributes is true/false, date is typeof Date etc.
 *
 * @method updateAsObject
 * @memberOf TubDataStore
 * @param {ubRequest} ubq
 * @param {Object<string, string>} [fieldAliases] Optional object to change attribute names during transform array to object. Keys are original names, values - new names
 * @returns {Object|null}
*/
TubDataStore.updateAsObject = function(ubq, fieldAliases) {
  if (!ubq.method) {
    ubq.method = 'update'
  }
  return this.insertAsObject(ubq, fieldAliases)
}


if (typeof TubDataStore.getAsJsArray !== 'function') { // fallback to JSON.parse for UB server < 5.18.0
  TubDataStore.getAsJsArray = function () {
    return JSON.parse(this.asJSONArray)
  }

  TubDataStore.getAsJsObject = function () {
    return JSON.parse(this.asJSONObject)
  }
}

TubDataStore.getAsTextInObjectNotation = function () {
  // noinspection JSDeprecatedSymbols
  return this.asJSONObject
}

TubDataStore.getAsTextInArrayNotation = function () {
  // noinspection JSDeprecatedSymbols
  return this.asJSONArray
}

module.exports = TubDataStore
