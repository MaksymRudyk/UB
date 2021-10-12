const path = require('path')
const fs = require('fs')
const BlobStoreCustom = require('./blobStoreCustom')
const mime = require('mime-types')

// model's public folder may not exists - in this we will create it
// during `getPermanentFileName` and cache verified path's here
const VERIFIED_PATH = {}
/**
 *  @classdesc
 *  Blob store implementation for storing content inside models `public` folders.
 *  Key conceptions:
 *
 *    - relative path created in format modelName|relativePathFromModelDir to hide real file place from client
 *    - OS user temp folder used for store temporary content
 *
 *  Used in:
 *
 *    - ubm_form for store form def & js inside /public/forms
 *    - ubm_diagrams for store diagram inside /public/erdiagrams
 *    - ubs_report for store report template inside /public/reports
 *    - e.t.c.
 *
 * @singleton
 */
class MdbBlobStore extends BlobStoreCustom {
  /**
   * @param {Object} storeConfig
   * @param {ServerApp} appInstance
   * @param {UBSession} sessionInstance
   */
  constructor (storeConfig, appInstance, sessionInstance) {
    super(storeConfig, appInstance, sessionInstance)
    const tmpFolder = this.tempFolder // already normalized inside argv
    if (!tmpFolder || !fs.existsSync(tmpFolder)) {
      throw new Error(`Temp folder '${tmpFolder}' for BLOB store '${this.name}' doesn't exist.
      Please, set a 'tempPath' store config parameter to existing folder,
      for example 'tempPath': './_temp'`)
    }
  }

  /**
   * @inheritDoc
   * @param {BlobStoreRequest} request Request params
   * @param {UBEntityAttribute} attribute
   * @param {ArrayBuffer|THTTPRequest} content
   * @returns {BlobStoreItem}
   */
  saveContentToTempStore (request, attribute, content) {
    const fn = this.getTempFileName(request)
    console.debug('temp file will be written to', fn)
    if (content.writeToFile) {
      if (!content.writeToFile(fn)) throw new Error(`Error write to ${fn}`)
    } else {
      fs.writeFileSync(fn, content)
    }
    const md5 = nhashFile(fn, 'MD5')
    let fileExt = path.extname(request.fileName)
    if (fileExt === '.def') fileExt = '.js'
    const ct = mime.contentType(fileExt) || 'application/octet-stream'
    const fileSize = fs.statSync(fn).size
    return {
      store: this.name,
      fName: request.fileName,
      origName: request.fileName,
      ct,
      size: fileSize,
      md5,
      isDirty: true
    }
  }

  /**
   * Retrieve BLOB content from blob store.
   * @abstract
   * @param {BlobStoreRequest} request
   * @param {BlobStoreItem} blobInfo JSON retrieved from a DB.
   * @param {Object} [options]
   * @param {String|Null} [options.encoding] Default to 'bin'. Possible values: 'bin'|'ascii'|'utf-8'
   *   If `undefined` UB will send query to entity anf get it from DB.
   *   At last one parameter {store: storeName} should be defined to prevent loading actual JSON from DB
   * @returns {String|ArrayBuffer}
   */
  getContent (request, blobInfo, options) {
    const filePath = request.isDirty ? this.getTempFileName(request) : this.getPermanentFileName(blobInfo)
    return fs.readFileSync(filePath, options)
  }

  /**
   * Fill HTTP response for getDocument request
   * @param {BlobStoreRequest} requestParams
   * @param {BlobStoreItem} blobItem
   * @param {THTTPRequest} req
   * @param {THTTPResponse} resp
   * @param {boolean} [preventChangeRespOnError=false] If `true` - prevents sets resp status code - just returns false on error
   * @return {Boolean}
   */
  fillResponse (requestParams, blobItem, req, resp, preventChangeRespOnError) {
    const filePath = requestParams.isDirty ? this.getTempFileName(requestParams) : this.getPermanentFileName(blobItem)
    if (filePath) {
      resp.statusCode = 200
      if (this.PROXY_SEND_FILE_HEADER) {
        // Redirect to `models` internal location to unify retrieving of models and cmodels.
        // On production cmodels is in /var/opt/unitybase/.. while models is in /opt/unitybase/...
        // linkStatic links both to `inetpub/clientRequire/models`
        let head
        if (requestParams.isDirty) {
          const storeRelPath = path.relative(process.configPath, filePath)
          head = `${this.PROXY_SEND_FILE_HEADER}: /${this.PROXY_SEND_FILE_LOCATION_ROOT}/app/${storeRelPath}`
        } else {
          // relPath === '[modelCode]|folderPath' so replacing | -> / is enough
          head = `${this.PROXY_SEND_FILE_HEADER}: /${this.PROXY_SEND_FILE_LOCATION_ROOT}/models/${blobItem.relPath.replace('|', '/')}/${blobItem.fName}`
        }
        head += `\r\nContent-Type: ${blobItem.ct}`
        console.debug('<- ', head)
        resp.writeHead(head)
        resp.writeEnd('')
      } else {
        resp.writeHead(`Content-Type: !STATICFILE\r\nContent-Type: ${blobItem.ct}`)
        resp.writeEnd(filePath)
      }
      return true
    } else {
      return preventChangeRespOnError
        ? false
        : resp.notFound('mdb store item ' + filePath)
    }
  }

  /**
   * Move content defined by `dirtyItem` from temporary to permanent store.
   * In case `oldItem` is present store implementation & parameters should be taken from oldItem.store.
   * Return a new attribute content which describe a place of BLOB in permanent store
   *
   * @param {UBEntityAttribute} attribute
   * @param {Number} ID
   * @param {BlobStoreItem} dirtyItem
   * @param {number} newRevision
   * @return {BlobStoreItem}
   */
  persist (attribute, ID, dirtyItem, newRevision) {
    const tempPath = this.getTempFileName({
      entity: attribute.entity.name,
      attribute: attribute.name,
      ID: ID
    })
    const permanentPath = this.getPermanentFileName(dirtyItem)
    console.debug('move temp file', tempPath, 'to', permanentPath)
    fs.renameSync(tempPath, permanentPath)
    const nameWoPath = path.basename(permanentPath)
    return {
      store: this.name,
      fName: nameWoPath,
      origName: nameWoPath,
      relPath: dirtyItem.relPath,
      ct: dirtyItem.ct,
      size: dirtyItem.size,
      md5: dirtyItem.md5
    }
  }

  /**
   * For MDB blob store relPath === '[modelCode]|folderPath'
   * @private
   * @param {BlobStoreItem} bsItem
   */
  getPermanentFileName (bsItem) {
    const pathPart = bsItem.relPath.split('|')
    if (pathPart.length !== 2) return '' // this is error
    const model = this.App.domainInfo.models[pathPart[0]]
    if (!model) throw new Error('MDB blob store - not existed model' + pathPart[0])
    BlobStoreCustom.validateFileName(pathPart[1])
    const folder = path.join(model.realPublicPath, pathPart[1])
    if (!VERIFIED_PATH[folder]) {
      // verify public path exists
      if (!fs.existsSync(model.realPublicPath)) {
        fs.mkdirSync(model.realPublicPath)
      }
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder)
      }
      VERIFIED_PATH[folder] = true
    }
    return path.join(folder, bsItem.fName)
  }
}

module.exports = MdbBlobStore
