/**
 * `fsStorage` mixin implements a CRUID operation for entity, whose data is stored in the file system.
 * See [File system storage tutorial](https://unitybase.info/api/server-v5/tutorial-mixins_fsstorage.html) for details.
 *
 * Configuration
 * "mixins": {
 *   "fsStorage": {
 *     "dataPath": "reports",
 *     "modelBased": true,
 *     "filePerRow": true,
 *     "naturalKey": "code",
 *     "allowOverride": false
 *   }
 * }
 *
 * @implements MixinModule
 */

module.exports = {
  initDomain: null,
  initEntity: initEntityForFsStorage
}

const MIXIN_NAME = 'fsStorage'

const fs = require('fs')
const path = require('path')
const mime = require('mime-types')
const csShared = require('@unitybase/cs-shared')
const UBDomain = csShared.UBDomain
const LocalDataStore = csShared.LocalDataStore
const App = require('../modules/App')
const BlobStoreCustom = require('@unitybase/blob-stores').classes.BlobStoreCustom

const FSSTORAGE_CS = App.registerCriticalSection('FSSTORAGE')

/**
 * Blob store request (parameters passed to get|setDocument)
 * @typedef {UBEntityMixin} UBfsStoreMixin
 * @property {String} dataPath
 * @property {Boolean} modelBased
 * @property {boolean} filePerRow
 * @property {string} naturalKey
 * @property {boolean} [allowOverride=false] allow natural key duplicates in different models (last model win)
 *  Can be used for example to override a report templates in ubs_report
 */

/**
 * Adds select/insert/update/delete methods
 *
 * @param {UBEntity} entity Entity for initialization
 * @param {UBfsStoreMixin} mixinCfg Mixin configuration from entity metafile
 */
function initEntityForFsStorage (entity, mixinCfg) {
  /** @type {EntityNamespace} */
  const entityModule = global[entity.name]
  // fill defaults
  if (mixinCfg.modelBased === undefined) mixinCfg.modelBased = true
  if (mixinCfg.filePerRow === undefined) mixinCfg.filePerRow = true
  if (!mixinCfg.naturalKey) mixinCfg.naturalKey = 'code'

  // verify mixin configuration
  if (!entity.attributes[mixinCfg.naturalKey]) {
    throw new Error(`fsStorage for ${entity.name}: naturalKey attribute '${mixinCfg.naturalKey}' not exist`)
  }
  if (!entity.attributes[mixinCfg.naturalKey].isUnique) {
    throw new Error(`fsStorage for ${entity.name}: naturalKey attribute '${mixinCfg.naturalKey}' must be unique (isUnique: true)`)
  }
  if (!mixinCfg.dataPath) {
    throw new Error(`fsStorage for ${entity.name}: dataPath mixin configuration parameter is mandatory`)
  }
  if (mixinCfg.modelBased) {
    if (!entity.attributes.model) {
      throw new Error(`fsStorage for ${entity.name}: 'model' attribute must exist for modelBased=true`)
    }
    if (entity.attributes.model.allowNull !== false) {
      throw new Error(`fsStorage for ${entity.name}: 'model' attribute must be 'allowNull: false'`)
    }
  }
  entity.eachAttribute(a => {
    if ((a.dataType === UBDomain.ubDataTypes.Document) && (a.storeName !== 'mdb')) {
      throw new Error(`fsStorage for ${entity.name}: attribute ${a.name} must use 'mdb' store name`)
    }
  })

  // add methods wrapped by logEnter / logLeave (to avoid a long try/finally inside method implementation)
  entityModule.select = wrapEnterLeave(`method(${MIXIN_NAME}) ${entity.name}.select`, fsStorageSelect)
  entityModule.entity.addMethod('select')
  entityModule.insert = wrapEnterLeave(`method(${MIXIN_NAME}) ${entity.name}.insert`, fsStorageInsert)
  entityModule.entity.addMethod('insert')
  entityModule.update = wrapEnterLeave(`method(${MIXIN_NAME}) ${entity.name}.update`, fsStorageUpdate)
  entityModule.entity.addMethod('update')
  entityModule.delete = wrapEnterLeave(`method(${MIXIN_NAME}) ${entity.name}.delete`, fsStorageDelete)
  entityModule.entity.addMethod('delete')
  entityModule.addnew = wrapEnterLeave(`method(${MIXIN_NAME}) ${entity.name}.addnew`, fsStorageAddNew)
  entityModule.entity.addMethod('addnew')

  const CACHABLE = (entity.cacheType === UBDomain.EntityCacheTypes.Entity) ||
    (entity.cacheType === UBDomain.EntityCacheTypes.SessionEntity)

  function getID (row) {
    const naturalKeyVal = row[mixinCfg.naturalKey]
    if (!naturalKeyVal) throw new UB.UBAbort(`${mixinCfg.naturalKey}: null is not allowed`)
    return ncrc32(0, naturalKeyVal)
  }

  /**
   * @private
   * @param {ubMethodParams} ctx
   */
  function fsStorageSelect (ctx) {
    ctx.dataStore.currentDataName = 'select'

    const mP = ctx.mParams
    const aID = mP.ID

    const cachedData = loadAll()

    if (!(aID && (aID > -1)) && CACHABLE && (!mP.skipCache)) {
      const reqVersion = mP.version
      mP.version = cachedData.version
      if (reqVersion === cachedData.version) {
        mP.resultData = {}
        mP.resultData.notModified = true
        return
      }
    }
    const filteredData = LocalDataStore.doFilterAndSort(cachedData, mP)
    // return as asked in fieldList using compact format  {fieldCount: 2, rowCount: 2, values: ["ID", "name", 1, "ss", 2, "dfd"]}
    const resp = LocalDataStore.flatten(mP.fieldList, filteredData.resultData)
    ctx.dataStore.initialize(resp)
    return true
  }

  /**
   * @private
   * @param {ubMethodParams} ctxt
   */
  function fsStorageInsert (ctxt) {
    const row = Object.assign({}, ctxt.mParams.execParams)
    const cachedData = loadAll()

    row.ID = getID(row)
    validateOverMetadata(row, cachedData, false)
    persistBlobs(ctxt, row, false)
    // initialize response before persisting data (persis can mutate row object before saving to file)
    // TODO - return only attributes from fieldList
    ctxt.dataStore.initialize([row])
    persistRow(ctxt, row, false)
    return true
  }

  /**
   * @private
   * @param {ubMethodParams} ctxt
   */
  function fsStorageUpdate (ctxt) {
    const newValues = Object.assign({}, ctxt.mParams.execParams)
    const cachedData = loadAll()
    const ID = newValues.ID || ctxt.mParams.ID
    if (!ID) throw new UB.UBAbort('ID required for updating')

    const currentRow = LocalDataStore.selectResultToArrayOfObjects(LocalDataStore.byID(cachedData, ID))[0]
    if (!currentRow) throw new UB.UBAbort(`Record with ID=${ID} not found`)
    ctxt.dataStore.currentDataName = ctxt.dataStore.DATA_NAMES.BEFORE_UPDATE
    ctxt.dataStore.initialize([currentRow])

    // override current row values by new one
    const newRow = Object.assign({}, currentRow, newValues)
    if (mixinCfg.modelBased && (newRow.model !== currentRow.model)) {
      throw new UB.UBAbort('<<<Model can not be changed>>>')
    }
    const newID = getID(newRow)
    if (newID !== ID) {
      newRow.ID = newID
    }
    validateOverMetadata(newRow, cachedData, true)
    persistBlobs(ctxt, newRow, true)
    // initialize response
    // TODO - return only attributes from fieldList
    ctxt.dataStore.currentDataName = ctxt.dataStore.DATA_NAMES.AFTER_UPDATE
    ctxt.dataStore.initialize([newRow])

    persistRow(ctxt, newRow, true)
    return true
  }

  /**
   * Validate all restrictions defined for entity attributes are applicable to the current row:
   *   - allowNull
   *   - isUnique
   *   - if mixinCfg.modelBased - model is exist
   *
   * @param {Object} row
   * @param {TubCachedData} allRows
   * @param {boolean} isUpdate
   * @throws throw UB.UBAbort in case of validation errors
   */
  function validateOverMetadata (row, allRows, isUpdate) {
    // check ID is unique
    const uniqIDs = LocalDataStore.doFilterAndSort(allRows, {
      whereList: { byID: { expression: 'ID', condition: 'equal', value: row.ID } }
    })
    if ((isUpdate && uniqIDs.total !== 1) || (!isUpdate && uniqIDs.total !== 0)) {
      throw new UB.UBAbort(`<<<VALUE_MUST_BE_UNIQUE>>> for attribute 'ID', non-unique value is ${row.ID}. Most likely row with the same natural key value already exists`)
    }
    const uniqueWhere = {
      _uniq: { expression: null, condition: 'equal', value: null }
    }
    if (isUpdate) { // exclude current record
      uniqueWhere._notCurr = { expression: '[ID]', condition: 'notEqual', value: row.ID }
    }
    entity.eachAttribute(a => {
      // allowNull
      const val = row[a.name]
      if ((a.allowNull === false) && (val == null)) { // == is important here
        throw new UB.UBAbort(`${a.name}: null is not allowed`)
      }
      // isUnique
      if (a.name !== 'ID' && a.isUnique && val) {
        uniqueWhere._uniq.expression = `[${a.name}]`
        uniqueWhere._uniq.value = row[a.name]
        const uniq = LocalDataStore.doFilterAndSort(allRows, { whereList: uniqueWhere })
        if (uniq.total !== 0) {
          throw new UB.UBAbort(`<<<VALUE_MUST_BE_UNIQUE>>> for attribute '${a.name}', non-unique value is '${val}'`)
        }
      }
    })
    // check model exists
    if (mixinCfg.modelBased) {
      if (!App.domainInfo.models[row.model]) { // row.model allow null is verified above
        throw new UB.UBAbort(`<<<Model '${row.model}' is not in domain>>>`)
      }
    }
  }

  /**
   * Persists BLOBS (for dirty attributes move blob content from temp to permanent storage).
   * Mutate row by new BLOB infos
   *
   * @param {ubMethodParams} ctxt
   * @param {Object} row
   * @param {boolean} isUpdate
   */
  function persistBlobs (ctxt, row, isUpdate) {
    if (!entity.blobAttributes.length) return
    const rowForBs = Object.assign({}, row)
    // remove all non-dirty blobs
    let blobsModified = false
    for (const attr of entity.blobAttributes) {
      if (!rowForBs[attr.name]) continue
      const blobInfo = JSON.parse(rowForBs[attr.name])
      if (blobInfo.isDirty) {
        blobsModified = true
        if (mixinCfg.modelBased) { // add relPath as expected by mdb BLOB store
          blobInfo.relPath = row.model + '|' + mixinCfg.dataPath
          rowForBs[attr.name] = JSON.stringify(blobInfo)
        }
        if (!blobInfo.origName || !blobInfo.origName.startsWith(row[mixinCfg.naturalKey])) {
          throw new Error(`fsStorage for ${entity.name}: invalid '${attr.name}' attribute value - origName value '${blobInfo.origName}' must starts with '${row[mixinCfg.naturalKey]}'`)
        }
      } else {
        delete rowForBs[attr.name]
      }
    }
    if (blobsModified) {
      const fakeCtx = {
        dataStore: null,
        mParams: {
          execParams: rowForBs
        }
      }
      ctxt.dataStore.commitBLOBStores(fakeCtx, isUpdate)
      // move modified BLOB info into original row
      for (const attr of entity.blobAttributes) {
        if (rowForBs[attr.name]) {
          row[attr.name] = rowForBs[attr.name]
        }
      }
    }
  }

  /**
   * Store rpw data to the file system. Reset cache
   * @param {ubMethodParams} ctxt
   * @param {Object} row
   * @param {boolean} isUpdate
   */
  function persistRow (ctxt, row, isUpdate) {
    if (!mixinCfg.filePerRow) { // TODO - implement
      throw new Error(`fsStorage for ${entity.name}: persisting of data for filePerRow=false is not implemented yet`)
    }
    App.enterCriticalSection(FSSTORAGE_CS)
    try {
      // persist
      if (mixinCfg.filePerRow) {
        let fn
        if (mixinCfg.modelBased) {
          BlobStoreCustom.validateFileName(row[mixinCfg.naturalKey])
          fn = `${App.domainInfo.models[row.model].realPublicPath}${mixinCfg.dataPath}/${row[mixinCfg.naturalKey]}.ubrow`
          // remove ID, model and natural key
          delete row.ID
          delete row[mixinCfg.naturalKey]
          delete row.model
          // cleanup optional attributes of mdb based BLOB info's
          for (const attr of entity.blobAttributes) {
            if (row[attr.name]) {
              const blobInfo = JSON.parse(row[attr.name])

              let fileExt = path.extname(blobInfo.origName)
              if (fileExt === '.def') fileExt = '.js'
              const ct = mime.contentType(fileExt) || 'application/octet-stream'
              if (ct === blobInfo.ct) { // content type can be calculated from origName extension - keep only origName in blob attribute value
                row[attr.name] = blobInfo.origName
              } else { // keep a JSON with origName and ct
                row[attr.name] = JSON.stringify({
                  origName: blobInfo.origName,
                  ct: blobInfo.ct
                })
              }
            }
          }
          console.debug('put', JSON.stringify(row), 'into', fn)
          fs.writeFileSync(fn, JSON.stringify(row, null, ' '))
        }
      } else {
        // // TODO - implement filePerRow: false
      }
      App.globalCachePut(CACHE_VERSION_KEY, '') // reset version to force data reload
    } finally {
      App.leaveCriticalSection(FSSTORAGE_CS)
    }
  }

  /**
   * @private
   * @param {ubMethodParams} ctxt
   */
  function fsStorageDelete (ctxt) {
    throw new UB.UBAbort('<<<Deletion is not implemented yet - remove files manually from the file system>>>')
  }

  /**
   * PureJS mStorage.addnew compatible method implementation
   * @private
   * @param {ubMethodParams} ctxt
   */
  function fsStorageAddNew (ctxt) {
    const params = ctxt.mParams
    const requestedFieldList = params.fieldList
    // fill array by default values from metadata
    const defValues = requestedFieldList.map((attrName) => {
      const attr = entity.attr(attrName, true)
      return attr && attr.defaultValue
        ? attr.defaultValue
        : null
    })
    // and initialize store by default values as expected by `addnew` method
    ctxt.dataStore.initialize([defValues], requestedFieldList)
    return true
  }

  let DATA
  let DATA_VERSION = '-1' // not loaded yet
  const CACHE_VERSION_KEY = `fsStorage.${entity.name}.version`
  const CACHE_DATA_KEY = `fsStorage.${entity.name}.data`

  function loadAll () {
    App.enterCriticalSection(FSSTORAGE_CS)
    try {
      const actualVersion = App.globalCacheGet(CACHE_VERSION_KEY)
      if (actualVersion) { // data already loaded in another thread and placed in global cache
        if (DATA_VERSION === actualVersion) { // current thread data is actual
          console.debug('return data from thread cache')
          return DATA
        } else { // current thread data is outdated - get it from global cache and update current thread version
          DATA = JSON.parse(App.globalCacheGet(CACHE_DATA_KEY))
          DATA.version = parseInt(actualVersion, 10)
          DATA_VERSION = actualVersion
          console.debug('return data from GLOBAL cache')
          return DATA
        }
      } else { // global cache is outdated or empty - read data from the file system and put it into global cache
        DATA = loadAllFromFS()
        const dataStr = JSON.stringify(DATA)
        DATA.version = ncrc32(0, dataStr)
        console.debug('put', dataStr.length, 'bytes to global cache key', CACHE_DATA_KEY)
        DATA_VERSION = '' + DATA.version
        App.globalCachePut(CACHE_VERSION_KEY, DATA_VERSION)
        App.globalCachePut(CACHE_DATA_KEY, dataStr)
        return DATA
      }
    } finally {
      App.leaveCriticalSection(FSSTORAGE_CS)
    }
  }

  /**
   * Load entity data from file system.
   * Expected to be called in critical section to prevent a race condition.
   * @return {TubCachedData}
   */
  function loadAllFromFS () {
    console.debug('loading from fs...')
    const startTime = Date.now()
    const dirtyData = []
    const idMap = {}

    function loadFolderOrFile (fPath, modelCode) {
      if (!fs.existsSync(fPath)) return
      function normalizeAndAddNewRow (row, srcFilePath, srcFileName) {
        let isDuplicate = false
        // fill ID, model and natural key attributes
        row.model = modelCode
        if (mixinCfg.filePerRow) {
          row[mixinCfg.naturalKey] = srcFileName.substring(0, srcFileName.length - 6) // remove .ubrow
        }
        if (!row[mixinCfg.naturalKey]) {
          throw new Error(`fsStorage for ${entity.name}: empty ${row[mixinCfg.naturalKey]} attribute in file ${srcFilePath}`)
        }
        row.ID = getID(row)
        if (idMap[row.ID]) {
          if (mixinCfg.allowOverride) {
            isDuplicate = true
          } else {
            throw new Error(`fsStorage for ${entity.name}: duplicate IDs in ${srcFilePath}. Existed:\n ${JSON.stringify(idMap[row.ID])}, \nfailed:\n ${JSON.stringify(row)}`)
          }
        }
        idMap[row.ID] = row
        // verify Document attributes
        entity.blobAttributes.forEach(attr => {
          if (!mixinCfg.modelBased) return

          const cnt = row[attr.name]
          if (!cnt) return
          let docInfo
          if (cnt.charAt(0) === '{') { // JSON content
            docInfo = JSON.parse(cnt)
            // add BLOB info attributes optional for mdb based ubrow
            if (!docInfo.fName) docInfo.fName = docInfo.origName
            if (!docInfo.store) docInfo.store = 'mdb'
            if (!docInfo.size) docInfo.size = 1
            if (!docInfo.md5) docInfo.md5 = '00000000000000000000000000000000'
          } else { // string with origName only
            let fileExt = path.extname(cnt)
            if (fileExt === '.def') fileExt = '.js'
            // mime module do not know .vue extension :(
            const ct = fileExt === '.vue' ? 'script/x-vue' : (mime.contentType(fileExt) || 'application/octet-stream')
            docInfo = {
              store: 'mdb',
              fName: cnt,
              origName: cnt,
              ct,
              size: 1,
              md5: '00000000000000000000000000000000'
            }
          }

          if (!docInfo.origName || !docInfo.origName.startsWith(row[mixinCfg.naturalKey])) {
            throw new Error(`fsStorage for ${entity.name}: invalid '${attr.name}' attribute value in file '${srcFilePath}' - origName value '${docInfo.origName}' must starts with '${row[mixinCfg.naturalKey]}'`)
          }
          // add model to the relPath as expected by mdb BLOB store
          docInfo.relPath = row.model + '|' + mixinCfg.dataPath
          row[attr.name] = JSON.stringify(docInfo)
        })
        if (!isDuplicate) {
          dirtyData.push(row)
        } else {
          const idx = dirtyData.findIndex(r => r.ID === row.ID)
          console.debug(`fsStorage: model ${row.model} override ${dirtyData[idx][mixinCfg.naturalKey]} row data from ${dirtyData[idx].model}`)
          dirtyData[idx] = row
        }
      }
      if (mixinCfg.filePerRow) {
        const files = fs.readdirSync(fPath)
        const ubRowFiles = files.filter(f => f.endsWith('.ubrow'))
        ubRowFiles.forEach(fn => {
          let row
          const fp = fPath + '/' + fn
          try {
            row = JSON.parse(fs.readFileSync(fp, 'utf8'))
          } catch (e) {
            throw new Error(`fsStorage for ${entity.name}: error loading ${fp}: ${e.message}`)
          }
          normalizeAndAddNewRow(row, fp, fn)
        })
      } else { // one file with rows
        let partialData
        try {
          partialData = JSON.parse(fs.readFileSync(fPath, 'utf8'))
        } catch (e) {
          throw new Error(`fsStorage for ${entity.name}: error loading ${fPath}: ${e.message}`)
        }
        partialData.forEach(row => {
          normalizeAndAddNewRow(row, fPath)
        })
      }
    }

    // load data as is
    if (mixinCfg.modelBased) {
      const models = App.domainInfo.models
      for (const modelCode in models) {
        if (!models.hasOwnProperty(modelCode)) continue
        // noinspection JSUnfilteredForInLoop
        const mPath = path.join(models[modelCode].realPublicPath, mixinCfg.dataPath)
        loadFolderOrFile(mPath, modelCode)
      }
    } else {
      loadFolderOrFile(mixinCfg.dataPath, entity.modelName)
    }
    // flatten data {rowCount, fields, data, version}
    const fields = Object.keys(entity.attributes)
    const fieldCount = fields.length
    const result = {
      rowCount: dirtyData.length,
      fields,
      data: [],
      version: -1
    }

    for (let i = 0, L = dirtyData.length; i < L; i++) {
      const row = dirtyData[i]
      const flatArray = []
      for (let j = 0; j < fieldCount; j++) {
        let v = row[fields[j]]
        if (v === undefined) v = null
        flatArray.push(v)
      }
      result.data.push(flatArray)
    }
    console.debug('loaded in', Date.now() - startTime, 'ms')
    return result
  }
}

function wrapEnterLeave (enterText, methodImpl) {
  return function logEnterLeave (ctx) {
    App.logEnter(enterText)
    try {
      methodImpl(ctx)
    } finally {
      App.logLeave()
    }
  }
}
