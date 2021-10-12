/**
 * Endpoints for BLOB stores performance test
 *
 * 1) Add test endpoint to the app (for example in the application main file)
 *
 *
 *    const UB = require('@unitybase/ub')
 *    const App = UB.App
 *
 *    const {getDocumentPerfTestEp} = require('@unitybase/blob-stores/storesPerfTest.js')
 *    App.registerEndpoint('getDocumentPerfTest', getDocumentPerfTestEp, false)
 *
 * 2) For a real-life results ensure reverseProxy.kind="nginx" in config
 *
 * 2) Consider we interest in measurement of BLOB store configured for `tst_maindata.fileStoreSimple` attribute
 *   In console
 *
 *   Ensure endpoint works as expected:
 *   curl 'http://app.url/getDocumentPerfTest?entity=tst_maindata&attribute=fileStoreSimple'
 *
 *   Warming up:
 *   wrk -t 8 -c 100 'http://app.url/getDocumentPerfTest?entity=tst_maindata&attribute=fileStoreSimple'
 *
 *   Measure:
 *   wrk -t 8 -c 100 'http://app.url/getDocumentPerfTest?entity=tst_maindata&attribute=fileStoreSimple'
 *
 *   Write performance test:
 *   wrk -t 8 -c 100 'http://app.url/setDocumentPerfTest?entity=tst_maindata&attribute=fileStoreSimple'
 *
 *   Remove test files:
 *   cd /path/to/store
 *   find -L . -name *.test -type f -exec rm -rf {} +
 *
 */

const UB = require('@unitybase/ub')
const Session = UB.Session
const blobStores = require('./blobStores')
const crypto = require('crypto')

module.exports = {
  getDocumentPerfTestEp,
  setDocumentPerfTestEp
}

const MAX_ROWS = 10000
const idsCache = {
  //entityName: [1, 2, 3] // last MAX_ROWS IDs
}
/**
 * Obtains a random (one of last MAX_ROWS (10_000) row) document from specified entity and attribute and send it to response.
 *
 *  GET /getDocumentPerfTest?entity=myEntity&attribute=documentAttr
 *
 * @param {THTTPRequest} req
 * @param {THTTPResponse} resp
 * @private
 */
function getDocumentPerfTestEp(req, resp) {
  const {entity, attribute} = req.parsedParameters

  if (!App.domainInfo.has(entity)) {
    return resp.badRequest('unknown entity')
  }
  if (!idsCache[entity]) {
    console.log(`Load last ${MAX_ROWS} IDs from entity '${entity}'`)
    idsCache[entity] = UB.Repository(entity).attrs('ID').orderByDesc('ID').limit(MAX_ROWS).selectAsArrayOfValues()
  }

  const bsReq = {
    ID: idsCache[entity][randomInt(idsCache[entity].length)],
    entity,
    attribute
  }
  console.debug('Return a document for ', bsReq)
  return Session.runAsAdmin(() => blobStores.writeDocumentToResp(bsReq, req, resp))
}

/**
 * Write a file of a random size to the BLOB store for specified entity and attribute.
 *
 * File content is a random string ( 1000 - 50_000 bytes) repeated a random (1-10) times.
 * This allows testing a file system deduplication and compression (if enabled for store file system)
 *
 * **Warning!!** Files are written directly to the BLOB file system and not inserted to the entity.
 * Dont forget to remove such files after tests.
 *
 *      cd /path/to/store
 *      find -L . -name *.test -type f -exec rm -rf {} +
 *
 *  POST /setDocumentPerfTest?entity=myEntity&attribute=documentAttr
 *
 * @param {THTTPRequest} req
 * @param {THTTPResponse} resp
 * @private
 */
function setDocumentPerfTestEp(req, resp) {
  const {entity, attribute} = req.parsedParameters
  if (!App.domainInfo.has(entity)) {
    return resp.badRequest('unknown entity')
  }
  const attr = App.domainInfo.get(entity).getAttribute(attribute)
  const chunkLen = randomInt(49000) + 1000
  const chunkBuf = crypto.randomBytes(chunkLen)
  const chunkCnt = randomInt(10) + 1
  const parts = []
  for (let i = 0; i < chunkCnt; i++) {
    parts.push(chunkBuf)
  }
  const data = Buffer.concat(parts,chunkLen * chunkCnt)
  const ID = App.dbConnections.DEFAULT.genID(undefined)
  const dirtyContent = App.blobStores.putContent({
    entity: entity,
    attribute: attribute,
    ID,
    fileName: ID + '.test'
  }, data)

  const docContent = blobStores.doCommit(attr, ID, dirtyContent)

  resp.statusCode = 200
  resp.writeEnd(docContent)
}

/**
 * Returns random in [0..maxVal-1]
 * @return number
 */
function randomInt(maxVal) {
  return Math.round(Math.random()*(maxVal-1))
}