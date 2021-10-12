/**
 *
 * Server-side BLOB stores methods. Accessible via {@link ServerApp.blobStores}
 *

    // get dirty (not committed yet) content of my_entity.docAttribute with ID = 12312 as ArrayBuffer
    let tmpContent = App.blobStores.getContent(
       {ID: 12312, entity: 'my_entity', attribute: 'blobAttribute', isDirty: true},
       {encoding: 'bin'}
    )

    // get BLOB content of my_entity.docAttribute with ID = 12312 as base64 string
    let base64Content = App.blobStores.getContent(
      {ID: 12312, entity: 'my_entity', attribute: 'blobAttribute'},
      {encoding: 'base64'}
    )

    // get BLOB content of my_entity.docAttribute with ID = 12312 as string
    let base64Content = App.blobStores.getContent(
      {ID: 12312, entity: 'my_entity', attribute: 'blobAttribute'},
      {encoding: 'utf8'}
    )

    // read file and but it to BLOB store (not committed yet)
    let content = fs.readFileSync(__filename, {encoding: 'bin'})
    let fn = path.basename(__filename)
    let blobItem = App.blobStores.putContent(
      {ID: 12312, entity: 'my_entity', attribute: 'blobAttribute'},
      content
    )

    // commit blob store
    let dataStore = UB.DataStore(my_entity)
    dataStore.run('update', {
      execParams: {
        ID: 12312,
        blobAttribute: JSON.stringify(blobItem)
      }
    })

 *
 * @module @unitybase/blob-stores
 */
const UBDomain = require('@unitybase/cs-shared').UBDomain
const Repository = require('@unitybase/base').ServerRepository.fabric
const BlobStoreCustom = require('./blobStoreCustom')
const MdbBlobStore = require('./mdbBlobStore')
const FileSystemBlobStore = require('./fileSystemBlobStore')

// const TubDataStore = require('../TubDataStore')
const BLOB_HISTORY_STORE_NAME = 'ub_blobHistory'
let _blobHistoryDataStore

/**
 * @private
 * @return {TubDataStore}
 */
function getBlobHistoryDataStore () {
  // eslint-disable-next-line
  if (!_blobHistoryDataStore) _blobHistoryDataStore = new TubDataStore(BLOB_HISTORY_STORE_NAME)
  return _blobHistoryDataStore
}

/**
 * @type {ServerApp}
 * @private
 */
let App
// App.fsObserve available in UB@5.20.4
let fsObserve = function () {}
/**
 * @type {UBSession}
 * @private
 */
let Session
/**
 * @private
 * @type {Object<string, BlobStoreCustom>}
 */
const blobStoresMap = {}
/**
 * Initialize blobStoresMap. Called by UBApp and initialize a `App.blobStores`
 * @param {ServerApp} appInstance
 * @param {UBSession} sessionInstance
 * @private
  */
function initBLOBStores (appInstance, sessionInstance) {
  App = appInstance
  if (App.fsObserve) {
    fsObserve = App.fsObserve
  }
  Session = sessionInstance
  Session = sessionInstance
  const blobStores = App.serverConfig.application.blobStores
  const res = blobStoresMap
  if (!blobStores) return res
  blobStores.forEach((storeConfig) => {
    const storeImplementationModule = storeConfig.implementedBy
    let StoreClass
    if (storeImplementationModule) {
      StoreClass = require(storeImplementationModule)
    } else { // UB4 compatibility
      if (!storeConfig.storeType || storeConfig.name === 'fileVirtual') {
        StoreClass = FileSystemBlobStore
      } else if (storeConfig.name === 'mdb') {
        StoreClass = MdbBlobStore
      } else {
        StoreClass = FileSystemBlobStore
      }
    }
    if (!StoreClass) throw new Error(`BLOB store implementation module not set for ${storeConfig.name}`)
    if (storeConfig.isDefault) res.defaultStoreName = storeConfig.name
    res[storeConfig.name] = new StoreClass(storeConfig, App, Session)
  })
}

/**
 * Blob store request (parameters passed to get|setDocument)
 * @typedef {Object} BlobStoreRequest
 * @property {Number} ID
 * @property {String} entity
 * @property {String} attribute
 * @property {Boolean} [isDirty]
 * @property {String} [fileName]
 * @property {Number} [revision]
 * @property {String} [extra] Store-specific extra parameters
 */

/**
 * Parsed blob store request (validated input parameters and object relations)
 * @typedef {Object} ParsedRequest
 * @property {Boolean} success
 * @property {String} [reason] Error message in case success === false
 * @property {BlobStoreRequest} [bsReq] Parsed parameters in case success
 * @property {UBEntityAttribute} [attribute] Entity attribute in case success
 * @private
 */

/**
 * Blob store item content (JSON stored in database)
 * @typedef {Object} BlobStoreItem
 * @property {Number} [v] Store version. Empty for UB<5. Store implementation must check `v` for backward compatibility
 * @property {String} store Code of store implementation from application config. If empty - use a store from attribute configuration
 * @property {String} fName File name inside store (auto generated in most case)
 * @property {String} origName Original file name (as user upload it)
 * @property {String} [relPath] Relative path of fName inside store folder (for file-based stores)
 * @property {String} ct Content type
 * @property {Number} size Content size
 * @property {String} md5 Content MD5 checksum
 * @property {Number} [revision] Content revision. Used only for stores with `historyDepth` > 0
 * @property {Boolean} [deleting] If true content must be deleted/archived during commit
 * @property {Boolean} [isDirty] ????
 * @property {Boolean} [isPermanent] If `true` - do not delete content during history rotation
 */

/**
 * Check params contains entity,attribute & ID.
 * Entity should be in domain, attribute should be of `Document` type and ID should be Number
 * In case params are invalid return false (and write an error in resp)
 *
 * @param {*} params
 * @return {ParsedRequest}
 * @private
 */
function parseBlobRequestParams (params) {
  const ID = parseInt(params.ID || params.id)
  if (ID <= 0) return { success: false, reason: 'incorrect ID value' }
  if (!params.entity || !params.attribute) {
    return { success: false, reason: 'One of required parameters (entity,attribute) not found' }
  }
  const entity = App.domainInfo.get(params.entity)
  const attribute = entity.getAttribute(params.attribute)
  if (attribute.dataType !== UBDomain.ubDataTypes.Document) {
    return { success: false, reason: `Invalid getDocument Request to non-document attribute ${params.entity}.${params.attribute}` }
  }
  const bsReq = {
    ID: ID,
    entity: params.entity,
    attribute: params.attribute,
    isDirty: (params.isDirty === true || params.isDirty === 'true' || params.isDirty === '1'),
    // UB <5 compatibility
    fileName: (params.origName || params.origname || params.fileName || params.filename || params.fName),
    revision: params.revision ? parseInt(params.revision, 10) : undefined,
    extra: params.extra
  }
  return { success: true, bsReq: bsReq, attribute: attribute }
}

/**
 * Obtain blobInfo depending on requested revision. The main purpose is to take store implementation depending on revision
 * Return either success: false with reason or success: true and requested blobInfo & store implementation
 *
 * @param {ParsedRequest} parsedRequest
 * @return {{success: boolean, reason: string}|{success: boolean, blobInfo: Object, store: BlobStoreCustom}}
 * @private
 */
function getRequestedBLOBInfo (parsedRequest) {
  const attribute = parsedRequest.attribute
  const entity = attribute.entity
  const ID = parsedRequest.bsReq.ID

  let storeCode, blobInfo
  // dirty request always come to blob store defined in attribute
  if (parsedRequest.bsReq.isDirty) {
    storeCode = attribute.storeName || blobStoresMap.defaultStoreName
  } else {
    // check user have access to the row and retrieve actual blobInfo
    const blobInfoDS = Repository(entity.code)
      .attrs(attribute.code)
      .attrsIf(entity.isUnity, 'mi_unityEntity')
      .selectById(ID)
    let baseInstanceID = ID
    if (blobInfoDS && blobInfoDS.mi_unityEntity) {
      baseInstanceID = Repository(blobInfoDS.mi_unityEntity).attrs('ID').where('ID', '=', ID).selectScalar()
    }
    if (!blobInfoDS || !baseInstanceID) {
      return {
        success: false,
        reason: `${entity.code} with ID=${ID} is not accessible`
      }
    }
    const rev = parsedRequest.bsReq.revision
    const blobInfoTxt = blobInfoDS[attribute.code]
    if (!blobInfoTxt && !rev) {
      // return an error, if request does not contains a "revision" parameter
      return {
        success: false,
        isEmpty: true,
        reason: `${entity.code} with ID=${ID} is empty`
      }
    }
    blobInfo = blobInfoTxt ? JSON.parse(blobInfoTxt) : undefined
    // check revision. If not current - get a blobInfo from history
    // blobInfo.revision is missing in UB<5 - ignore it and retrieve a latest content
    if (rev && (!blobInfo || (blobInfo.revision && (rev !== blobInfo.revision)))) {
      const historicalBlobItem = Repository(BLOB_HISTORY_STORE_NAME)
        .attrs('blobInfo')
        .where('instance', '=', ID)
        .where('attribute', '=', attribute.name)
        .where('revision', '=', rev)
        .selectScalar()
      if (historicalBlobItem) {
        blobInfo = JSON.parse(historicalBlobItem) // use historical blob item
      } else {
        return {
          success: false,
          reason: `Revision ${rev} not found for ${entity.code}.${attribute.code} with ID=${ID}`
        }
      }
    }
    storeCode = (blobInfo && blobInfo.store) ? blobInfo.store : (attribute.storeName || blobStoresMap.defaultStoreName)
  }
  const store = blobStoresMap[storeCode]
  if (!store) {
    return {
      success: false,
      reason: `Store "${storeCode}" not found in application config`
    }
  }
  return {
    success: true,
    blobInfo,
    store
  }
}

/**
 * Writes a BLOB content to the response without verifying an ALS (but RLS is verified) or
 * return an error without modifying a response.
 *
 * **SECURITY** - method can be used inside endpoint or rest entity method, which already checks the access rights to the document
 *
 * Returns:
 *  - `{success: false, reason: 'fail reason description}` if attribute value is empty or
 *  record with specified ID not found or not accessible or entity/attribute is unknown or id not passed etc.
 *  - `{success: true}` if content is written to the response
 *
 *
 * @param {BlobStoreRequest} requestParams
 * @param {THTTPRequest} req
 * @param {THTTPResponse} resp
 * @return {{success: boolean, reason: string}}
 */
function internalWriteDocumentToResp (requestParams, req, resp) {
  const parsed = parseBlobRequestParams(requestParams)
  if (!parsed.success) return parsed

  const requested = getRequestedBLOBInfo(parsed)
  if (!requested.success) {
    return requested
  }
  // call store implementation method
  const fillRespResult = requested.store.fillResponse(parsed.bsReq, requested.blobInfo, req, resp, true)
  if (!fillRespResult) {
    return { success: false, reason: 'Content not found' }
  } else {
    return { success: true }
  }
}

/**
 * Obtains the document content from a blobStore and sends it to the response
 *
 * @param {BlobStoreRequest} requestParams
 * @param {THTTPRequest} req
 * @param {THTTPResponse} resp
 * @param {boolean} withBody Set to false to check whether the document is available without sending it's body.
 */
function writeDocumentToResp (requestParams, req, resp, withBody = true) {
  const parsed = parseBlobRequestParams(requestParams)
  if (!parsed.success) return resp.badRequest(parsed.reason)
  // check user have access to entity select method
  if (!App.els(parsed.attribute.entity.code, 'select')) {
    console.error(`getDocument: Access deny to ${parsed.attribute.entity.code}.select method for user "${Session.uData.login}"`)
    return {
      success: false,
      reason: `Access deny to ${parsed.attribute.entity.code}.select method`
    }
  }
  const requested = getRequestedBLOBInfo(parsed)
  if (!requested.success) {
    return resp.badRequest(requested.reason)
  }

  if (!withBody) {
    resp.statusCode = 200
    return
  }

  // call store implementation method
  return requested.store.fillResponse(parsed.bsReq, requested.blobInfo, req, resp)
}

/**
 * Obtains document content from blobStore and send it to response.
 *
 * HTTP method can be either GET - in this case parameters passed in the URL
 * or POST - in this case parameters as JSON in body
 *
 * @param {THTTPRequest} req
 * @param {THTTPResponse} resp
 * @private
 */
function getDocumentEndpoint (req, resp) {
  return getDocumentEndpointInternal(req, resp, true)
}

/**
 * Checks whether the document is available to be obtained with getDocumentEndpoint.
 *
 * @param {THTTPRequest} req
 * @param {THTTPResponse} resp
 * @private
 */
function checkDocumentEndpoint (req, resp) {
  return getDocumentEndpointInternal(req, resp, false)
}

/**
 * Internal endpoint function which accepts additional boolean flag after req, resp arguments.
 * Checks an access to the document, obtains it's content from blobStore and by default sends it to response.
 *
 * @param {THTTPRequest} req
 * @param {THTTPResponse} resp
 * @param {boolean} withBody Set to false to check whether the document is available without sending it's body.
 */
function getDocumentEndpointInternal (req, resp, withBody = true) {
  /** @type BlobStoreRequest */
  let params
  if (req.method === 'GET') { // TODO - should we handle 'HEAD' here?
    params = req.parsedParameters
  } else if (req.method === 'POST') {
    const paramStr = req.read()
    try {
      params = JSON.parse(paramStr)
    } catch (e) {
      console.error('Exception when parsing POST parameters "{paramStr}":' + e)
      return resp.badRequest('wrong parameters passed' + req.method)
    }
  } else {
    return resp.badRequest('invalid HTTP verb' + req.method)
  }

  return writeDocumentToResp(params, req, resp, withBody)
}

/**
 * Retrieve BLOB content from the blob store
 * Return `null` in case attribute value is null.
 * @param {BlobStoreRequest} request
 * @param {Object} [options]
 * @param {String|Null} [options.encoding] Possible values:
 *   'bin' 'ascii' 'binary' 'hex' ucs2/ucs-2/utf16le/utf-16le utf8/utf-8
 *   if `null` will return {@link Buffer}, if `bin` - ArrayBuffer
 * @returns {String|Buffer|ArrayBuffer|null}
 */
function getContent (request, options) {
  const parsed = parseBlobRequestParams(request)
  if (!parsed.success) throw new Error(parsed.reason)
  const requested = getRequestedBLOBInfo(parsed)
  if (!requested.success) {
    if (requested.isEmpty) {
      return null
    } else {
      throw new Error(requested.reason)
    }
  }
  const st = Date.now()
  const content = requested.store.getContent(parsed.bsReq, requested.blobInfo, options)
  fsObserve((Date.now() - st) / 1000, requested.store.name, 'getcontent')
  return content
}

/**
 * Retrieve full path to a file with BLOB content
 * Returns:
 *   - `null` in case attribute value is null (document not assigned)
 *   - '' (empty string) in case store is not file based (reserved for future use)
 *   - full path to file on success
 *   - throws if parameters is invalid or document is not accessible
 * @param {BlobStoreRequest} request
 * @returns {String|null}
 */
function getContentPath (request) {
  const parsed = parseBlobRequestParams(request)
  if (!parsed.success) throw new Error(parsed.reason)
  const requested = getRequestedBLOBInfo(parsed)
  if (!requested.success) {
    if (requested.isEmpty) {
      return null
    } else {
      throw new Error(requested.reason)
    }
  }
  return requested.store.getContentFilePath(parsed.bsReq, requested.blobInfo)
}

/**
 * Endpoint for putting BLOB content (in the POST request body) to the BLOB store temporary storage.
 * Return a JSON with blob store item info {@link BlobStoreItem}
 *
 * Accept 3 mandatory parameter: entity,attribute,ID
 * and 2 optional parameter: fileName, encoding
 *
 * Encoding should be either omitted or `base64` in case body is base64 encoded BLOB
 *
 * @param {THTTPRequest} req
 * @param {THTTPResponse} resp
 * @private
 */
function setDocumentEndpoint (req, resp) {
  /** @type BlobStoreRequest */
  let request
  // TODO HTTP 'DELETE'
  if (req.method === 'POST') {
    request = req.parsedParameters
  } else {
    return resp.badRequest('invalid HTTP verb' + req.method)
  }

  const parsed = parseBlobRequestParams(request)
  if (!parsed.success) return resp.badRequest(parsed.reason)
  const attribute = parsed.attribute
  if (attribute.entity.isUnity) {
    return resp.badRequest(`Direct modification of then UNITY entity ${attribute.entity.code} is not allowed`)
  }
  const storeCode = attribute.storeName || blobStoresMap.defaultStoreName
  const store = blobStoresMap[storeCode]
  if (!store) return resp.badRequest(`Blob store ${storeCode} not found in application config`)
  let content
  if (request.encoding === 'base64') {
    content = req.read('base64')
  } else {
    content = req
  }

  const st = Date.now()
  const blobStoreItem = store.saveContentToTempStore(parsed.bsReq, attribute, content)
  resp.statusCode = 200
  fsObserve((Date.now() - st) / 1000, store.name, 'save2tmp')
  resp.writeEnd({ success: true, errMsg: '', result: blobStoreItem })
}

/**
 * Server-side method for putting BLOB content to BLOB store temporary storage.
 * Can accept a THTTPRequest as a content, in this case request body will be used as BLOB content
 *
 * @example

 // convert base64 encoded string stored in `prm.signature` to binary and put to the store
 docContent = App.blobStores.putContent({
   entity: 'iit_signature',
   attribute: 'signature',
   ID: ID,
   fileName: ID + '.p7s'
 }, Buffer.from(prm.signature, 'base64'))

 * @param {BlobStoreRequest} request
 * @param {ArrayBuffer|String|THTTPRequest} content
 * @return {BlobStoreItem}
 */
function putContent (request, content) {
  const parsed = parseBlobRequestParams(request)
  if (!parsed.success) throw new Error(parsed.reason)
  const attribute = parsed.attribute
  if (attribute.entity.isUnity) {
    throw new Error(`Direct modification of the UNITY entity ${attribute.entity.code} is not allowed`)
  }
  const storeCode = attribute.storeName || blobStoresMap.defaultStoreName
  const store = blobStoresMap[storeCode]
  if (!store) throw new Error(`Blob store ${storeCode} not found in application config`)
  const st = Date.now()
  const resp = store.saveContentToTempStore(parsed.bsReq, attribute, content)
  fsObserve((Date.now() - st) / 1000, store.name, 'save2tmp')
  return resp
}

/**
 * @private
 * @param {UBEntityAttribute} attribute
 * @param {BlobStoreItem} blobItem
 * @return {BlobStoreCustom}
 */
function getBlobStore (attribute, blobItem) {
  const storeName = blobItem.store || attribute.storeName || blobStoresMap.defaultStoreName
  const store = blobStoresMap[storeName]
  if (!store) throw new Error(`Blob store ${storeName} not found in application config`)
  return store
}

/**
 * History rotation for specified attribute.
 * Will delete expired historical BLOBs and insert a new row into ub_blobHistory with blobInfo content
 * @param {BlobStoreCustom} store
 * @param {UBEntityAttribute} attribute
 * @param {number} ID
 * @param {BlobStoreItem} blobInfo Newly inserted/updated blobInfo. null in case of deletion
 * @private
 */
function rotateHistory (store, attribute, ID, blobInfo) {
  if (!blobInfo) return // deletion
  // clear expired historical items (excluding isPermanent)
  const histData = Repository(BLOB_HISTORY_STORE_NAME)
    .attrs(['ID', 'blobInfo'])
    .where('instance', '=', ID)
    .where('attribute', '=', attribute.name)
    .where('permanent', '=', false)
    .orderBy('revision')
    .limit(store.historyDepth)
    .selectAsObject()
  const dataStore = getBlobHistoryDataStore()
  for (let i = 0, L = histData.length - store.historyDepth; i < L; i++) {
    const item = histData[i]
    const historicalBlobInfo = JSON.parse(item.blobInfo)
    const store = getBlobStore(attribute, historicalBlobInfo)
    // delete persisted item
    store.doDeletion(attribute, ID, historicalBlobInfo)
    // and information about history from ub_blobHistory
    dataStore.run('delete', { execParams: { ID: item.ID } })
  }
  const archivedBlobInfo = store.doArchive(attribute, ID, blobInfo)
  // insert new historical item
  const createdAt = new Date()
  createdAt.setMilliseconds(0)
  dataStore.run('insert', {
    execParams: {
      instance: ID,
      entity: attribute.entity.name,
      attribute: attribute.name,
      revision: blobInfo.revision,
      permanent: blobInfo.isPermanent,
      createdAt,
      blobInfo: JSON.stringify(archivedBlobInfo)
    }
  })
}

/**
 * Get number of new revision for historical BLOB store attribute using BLOB history table.
 * Used in case original BLOB content is emtpy (for example because user clear BLOB before)
 * @param {UBEntityAttribute} attribute
 * @param {number} ID
 * @private
 */
function estimateNewRevisionNumber (attribute, ID) {
  const maxNum = Repository(BLOB_HISTORY_STORE_NAME)
    .attrs(['MAX([revision])'])
    .where('instance', '=', ID)
    .where('attribute', '=', attribute.name)
    .selectScalar()
  return maxNum ? maxNum + 1 : 1
}
/**
 * Server-side method for moving content defined by `dirtyItem` from temporary to permanent store.
 * For internal use only. In app logic use {@link TubDataStore#commitBLOBStores} method
 * In case of historical store will archive the oldItem.
 * Return a new attribute content which describe a place of BLOB in permanent store
 *
 * @param {UBEntityAttribute} attribute
 * @param {Number} ID
 * @param {BlobStoreItem} dirtyItem
 * @param {BlobStoreItem} [oldItem]
 * @return {BlobStoreItem}
 * @private
 */
function doCommit (attribute, ID, dirtyItem, oldItem) {
  if (!(dirtyItem.isDirty || dirtyItem.deleting)) {
    throw new Error('Committing of BLOBs allowed either for dirty content or in case of deletion')
  }
  let newRevision = 1
  let oldItemStore
  const store = getBlobStore(attribute, dirtyItem)
  if (oldItem) {
    oldItemStore = getBlobStore(attribute, oldItem)
    if (oldItem.revision) newRevision = oldItem.revision + 1
  } else if (store.historyDepth) {
    newRevision = estimateNewRevisionNumber(attribute, ID)
  }
  const st = Date.now()
  const persistedItem = store.persist(attribute, ID, dirtyItem, newRevision)
  if (store.historyDepth) { // for historical stores add item to history
    rotateHistory(store, attribute, ID, persistedItem)
  } else if (oldItem) { // delete / archive old item
    oldItemStore.doDeletion(attribute, ID, oldItem)
  }
  fsObserve((Date.now() - st) / 1000, store.name, 'persist')
  return persistedItem
}

/**
 * For a historical BLOB stores mark specified revision as a permanent.
 * Permanents revisions will not be deleted during history rotation.
 * @example
 *
const UB = require(@unitybase/ub')
const App = UB.App
App.blobStores.markRevisionAsPermanent({
  entity: 'my_entity',
  attribute: 'attributeOfTypeDocument',
  ID: 1000,
  revision: 2
})

 * @param {BlobStoreRequest} request
 * @param  {Number} request.revision revision to be marked as permanent
 */
function markRevisionAsPermanent (request) {
  const r = parseBlobRequestParams(request)
  if (!r.success) throw new Error(r.reason)
  const revisionFor = r.bsReq.revision
  if (!revisionFor) throw new Error('Missing revision parameter')
  const store = getBlobStore(r.attribute, {})
  if (!store.historyDepth) throw new Error(`Store ${store.name} is not a historical store`)
  const histID = Repository(BLOB_HISTORY_STORE_NAME)
    .attrs(['ID'])
    .where('instance', '=', r.bsReq.ID)
    .where('attribute', '=', r.attribute.name)
    .where('permanent', '=', false)
    .where('revision', '=', r.bsReq.revision)
    .limit(1)
    .selectScalar()
  if (histID) {
    const dataStore = getBlobHistoryDataStore()
    dataStore.run('update', {
      execParams: {
        ID: histID,
        permanent: 1
      }
    })
  } else {
    console.error(`Revision ${r.bsReq.revision} not exists for ${r.attribute.entity.name}.${r.attribute.name} with ID ${r.bsReq.ID}`)
  }
}

module.exports = {
  getDocumentEndpoint,
  checkDocumentEndpoint,
  writeDocumentToResp,
  internalWriteDocumentToResp,
  setDocumentEndpoint,
  markRevisionAsPermanent,
  getContent,
  getContentPath,
  putContent,
  doCommit,
  initBLOBStores,
  classes: {
    BlobStoreCustom,
    MdbBlobStore,
    FileSystemBlobStore
  }
}
