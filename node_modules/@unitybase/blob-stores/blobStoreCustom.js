const path = require('path')

const FN_VALIDATION_RE = /^[\w\-. ]+$/

/**
 * @classdesc
 * Abstract interface for Virtual store. Must be implemented in descendants.
 * Provide a way to store files in any manner developer want.
 */

/* BlobStoreItem sample:
{"store":"documents","fName":"contr_contractdoc document 3000000405832.pdf",
  "origName":"Contract #01T.pdf",
  "relPath":"435\\",
  "ct":"application/pdf",
  "size":2057405,
  "md5":"3b44f38f6b120615604846b67150fcb0",
  "revision":2}
*/
class BlobStoreCustom {
  /**
   * @param {Object} storeConfig
   * @param {ServerApp} appInstance
   * @param {UBSession} sessionInstance
   */
  constructor (storeConfig, appInstance, sessionInstance) {
    /** @type {ServerApp} */
    this.App = appInstance
    /** @type {UBSession} */
    this.Session = sessionInstance
    this.PROXY_SEND_FILE_HEADER = this.App.serverConfig.httpServer.reverseProxy.sendFileHeader
    this.PROXY_SEND_FILE_LOCATION_ROOT = this.App.serverConfig.httpServer.reverseProxy.sendFileLocationRoot
    /**
     * Store parameters as defined in ubConfig
     */
    this.config = Object.assign({}, storeConfig)
    /**
     * Name of store (from app config)
     */
    this.name = this.config.name
    /**
     * Path to temp folder
     * @type {String}
     * @protected
     */
    this.tempFolder = this.config.tempPath
    /**
     * How many previous revision is stored
     * @type {number}
     */
    this.historyDepth = this.config.historyDepth || 0
  }

  /**
   * Implementation must save file content to temporary store
   * @abstract
   * @param {BlobStoreRequest} request Request params
   * @param {UBEntityAttribute} attribute
   * @param {ArrayBuffer|THTTPRequest} content
   * @returns {BlobStoreItem}
   */
  saveContentToTempStore (request, attribute, content) {}
  /**
   * Returns full path to the file with BLOB content
   * @param {BlobStoreRequest} request
   * @param {BlobStoreItem} blobInfo JSON retrieved from a DB
   * @returns {String}
   */
  getContentFilePath (request, blobInfo) {
    return ''
  }

  /**
   * Retrieve BLOB content from blob store.
   * @abstract
   * @param {BlobStoreRequest} request
   * @param {BlobStoreItem} blobInfo JSON retrieved from a DB
   * @param {Object} [options]
   * @param {String|Null} [options.encoding] Possible values:
   *   'bin' 'ascii' 'binary' 'hex' ucs2/ucs-2/utf16le/utf-16le utf8/utf-8
   *   if `null` will return {@link Buffer}, if `bin` - ArrayBuffer
   * @returns {String|Buffer|ArrayBuffer|null}
   */
  getContent (request, blobInfo, options) {}

  /**
   * Fill HTTP response for getDocument request. Sets resp to 404 status if content not found.
   * @abstract
   * @param {BlobStoreRequest} requestParams
   * @param {BlobStoreItem} blobInfo
   * @param {THTTPRequest} req
   * @param {THTTPResponse} resp
   * @param {boolean} [preventChangeRespOnError=false] If `true` - prevents sets resp status code - just returns false on error
   * @return {Boolean}
   */
  fillResponse (requestParams, blobInfo, req, resp, preventChangeRespOnError) { }
  /**
   * Move content defined by `dirtyItem` from temporary to permanent store.
   * Return a new attribute content which describe a place of BLOB in permanent store
   * @abstract
   * @param {UBEntityAttribute} attribute
   * @param {Number} ID
   * @param {BlobStoreItem} dirtyItem
   * @param {number} newRevision
   * @return {BlobStoreItem|null}
   */
  persist (attribute, ID, dirtyItem, newRevision) { }

  /**
   * Do something with BLOB content during archiving. For example - move to slow drive etc.
   * Default implementation do nothing.
   * @param {UBEntityAttribute} attribute
   * @param {Number} ID
   * @param {BlobStoreItem} blobInfo
   * @returns {BlobStoreItem}
   */
  doArchive (attribute, ID, blobInfo) {
    return blobInfo
  }

  /**
   * Delete persisted BLOB content
   * @abstract
   * @param {UBEntityAttribute} attribute
   * @param {Number} ID
   * @param {BlobStoreItem} blobInfo
   */
  doDeletion (attribute, ID, blobInfo) { }
  /**
   * Get path to temporary file and it's name
   * @protected
   * @param {BlobStoreRequest} request
   * @returns {string}
   */
  getTempFileName (request) {
    // important to use Session.userID. See UB-617
    return path.join(this.tempFolder, `${request.entity}_${request.attribute}_${request.ID}_${this.Session.userID}`)
  }

  /**
   * validate file name contains only alphanumeric characters, -, _, . and space and not contains ..
   * @param fn
   * @throws throws in file name is not valid
   */
  static validateFileName (fn) {
    if (!FN_VALIDATION_RE.test(fn) || (fn.indexOf('..') !== -1)) {
      const e = new Error(`Invalid file name '${fn}' for BLOB store`)
      // emulate a ESecurityException
      e.errorNumber = process.binding('ub_app').UBEXC_ESECURITY_EXCEPTION
      throw e
    }
  }
}

module.exports = BlobStoreCustom
