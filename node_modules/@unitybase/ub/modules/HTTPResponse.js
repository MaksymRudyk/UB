
// eslint-disable-next-line camelcase
const { resp_writeHead, resp_write, resp_writeEnd, resp_writeBinaryBase64, resp_validateETag, resp_getStatus, resp_setStatus, resp_getBodyForDebug } = process.binding('http_server')

/**
 * @classdesc
 * This object is created internally by UB server and passed as the second
 * argument to the `endpoint's` methods or as a third argument to the entity level method's called using `rest` endpoint.
 *
 * It represents an in-progress HTTP response.
 * Response body is buffered during calls to {@link THTTPResponse#write write}
 * until {@link THTTPResponse#writeEnd writeEnd} is called.
 * Actual headers and response will be sent after endpoint handler finished.
 *
 * Do not forget to set the {@link THTTPResponse#statusCode statusCode} to 200 on success or use a helper's
 * {@link THTTPResponse#badRequest badRequest} / {@link THTTPResponse#notFound notFound} on errors.
 *
 * TODO To send file content as a response without loading file into memory the following code can be used:
 *
     // Replace this comments by JSDocs style comment
     // param {THTTPRequest} req
     // param {THTTPResponse} resp
     function getPublicDocument(req, resp){
       resp.statusCode = 200;
       resp.writeHead('Content-Type: !STATICFILE\r\nContent-Type: text/plain'); // !STATICFILE is a special content type - will be removed from headers by server during sending
       resp.writeEnd('c:\\myFilesWithPasswords.txt');
     }
 * @class THTTPResponse
 * @implements {UBWriter}
 */
class THTTPResponse {
  /**
   * Response HTTP status code
   * @return {number}
   */
  get statusCode () {
    return resp_getStatus()
  }

  /**
   * @param {number} status
   */
  set statusCode (status) {
    resp_setStatus(status)
  }
  /**
   * Add response header(s). Can be called several times for DIFFERENT header.
   * Can write several headers at once - in this case usa `\r\n` as separator
   *@example
   *    resp.writeHead('Content-Type: text/css; charset=UTF-8\r\nOther-header: value')
   *
   * @param {String} header One header or `\r\n` separated headers
   */
  writeHead (header) {
    resp_writeHead(header)
  }
  /**
   * @inheritdoc
   */
  write (data, encoding) {
    resp_write(data, encoding)
  }
  /**
  * Write base64 encoded data as a binary representation (will decode from base64 to binary before write to response)
  * @param {String} base64Data
  */
  writeBinaryBase64 (base64Data) {
    resp_writeBinaryBase64(base64Data)
  }
  /**
   * Write to internal buffer and set buffer content as HTTP response.
   * See {UBWriter.wrote} for parameter details
   * @param {ArrayBuffer|Object|String} data
   * @param {String} [encoding]
   */
  writeEnd (data, encoding) {
    resp_writeEnd(data, encoding)
  }

  /**
   * For DEBUG PURPOSE ONLY
   * Retrieve a response body created by writeEnd call
   * @return {string}
   */
  getBodyForDebug () {
    return resp_getBodyForDebug()
  }
  /**
   * ETag based HTTP response caching.
   * Must be called after writeEnd called and and statusCode is defined.
   *
   * In case statusCode === 200 and response body length > 64 will
   *  - if request contains a IF-NONE-MATCH header, and it value equal to response crc32
   *  will mutate a statusCode to 304 (not modified) and clear the response body
   *  - in other case will add a ETag header with value = hex representation of crc32(responseBody).
   */
  validateETag () {
    return resp_validateETag()
  }
  /**
   * Write a HTTP 400 Bad Request response. Return false
   * @param {string} [reason] If specified will be written to log as error
   * @return {boolean}
   */
  badRequest (reason) {
    this.statusCode = 400
    this.writeHead('Content-Type: text/plain; charset=UTF-8')
    this.writeEnd('Bad Request')
    if (reason) console.error('Bad request', reason)
    return false
  }
  /**
   * Write a HTTP 404 Not Found response. Return false
   * @param {string} [reason]  If specified will be written to log as error
   * @return {boolean}
   */
  notFound (reason) {
    this.statusCode = 404
    this.writeHead('Content-Type: text/plain; charset=UTF-8')
    this.writeEnd('Not Found')
    if (reason) console.error('Not found', reason)
    return false
  }
  /**
   * Write a HTTP 501 'Not Implemented response. Return false
   * @param {string} [reason]  If specified will be written to log as error
   * @return {boolean}
   */
  notImplemented (reason) {
    this.statusCode = 501
    this.writeHead('Content-Type: text/plain; charset=UTF-8')
    this.writeEnd('Not Implemented')
    if (reason) console.error('Not Implemented', reason)
    return false
  }
}

module.exports = THTTPResponse
