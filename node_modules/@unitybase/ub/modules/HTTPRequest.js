// eslint-disable-next-line camelcase
const {
  req_read, req_read_json, reg_getHeaders, reg_getMethod, reg_getUrl, reg_getURI, reg_getDecodedURI,
  reg_getParameters, reg_getDecodedParameters, req_writeToFile
} = process.binding('http_server')
const queryString = require('querystring')
let req_getReqId = process.binding('http_server').req_getReqId
if (!req_getReqId) {
  req_getReqId = function () { return 0 }// fallback for UB<5.18.2
}

/**
 * @classdesc
 * An `THTTPRequest` object is created by UB server and passed as the first
 * argument to the `endpoint's` methods or as a second argument to the `rest` entity method's event.
 *
 * It may be used to access HTTP request status, headers and data.
 * @class THTTPRequest
 * @implements {UBReader}
 */
class THTTPRequest {
  /**
   * @inheritdoc
   * @param {String} [encoding]
   */
  read (encoding) {
    return req_read(encoding)
  }

  /**
   * Return http request body content as JSON; Faster when JSON.parse(req.read()).
   *
   * Expect body to be in UTF8 encoding
   *
   * @return {*}
   */
  json () {
    return req_read_json()
  }

  /**
   * Write request body content (as binary) to a file. Return true on success
   * @param {string} fullFilePath
   * @param {string} [encoding='bin'] Can be 'bin'(default) or 'base64` - in this case
   *   request body will be converted from base64 into binary before write to file
   * @return {boolean}
   */
  writeToFile (fullFilePath, encoding = 'bin') {
    return req_writeToFile(fullFilePath, encoding)
  }

  /**
   * HTTP request headers
   * @type {string}
   * @readonly
   */
  get headers () {
    if (this._headers === undefined) this._headers = reg_getHeaders()
    return this._headers
  }

  /**
   * Return a header value by name. Name is case-insensitive
   * @example
   // incoming headers string 'Host: unitybase.info\r\nAccept-Encoding: gzip\r\n\r\nAccept-Encoding: deflate, br'
   req.getHeader('accept-Encoding') // 'gzip, deflate, br

   * @param {string} name Case-insensitive header name
   * @return {string|undefined}
   * @since UB@5.19.0
   */
  getHeader (name) {
    if (!this._parsedHeaders) {
      this._parsedHeaders = parseHeaders(this.headers)
    }
    return this._parsedHeaders[name.toLowerCase()]
  }

  /**
   * Returns an array containing the unique names of the headers. All header names are lowercase
   * @example
   // incoming headers string 'Host: unitybase.info\r\nAccept-Encoding: gzip\r\n\r\nAccept-Encoding: deflate, br'
   req.getHeaderNames() // ['host', 'accept-encoding']
   * @return {Array<string>}
   * @since UB@5.19.0
   */
  getHeaderNames () {
    if (!this._parsedHeaders) {
      this._parsedHeaders = parseHeaders(this.headers)
    }
    return Object.keys(this._parsedHeaders)
  }

  /**
   * Return parsed headers object. Keys are lower-cased header names, values are header values
   * @example

   // incoming headers string 'Host: unitybase.info\r\nAccept-Encoding: gzip\r\n\r\nAccept-Encoding: deflate, br'
   req.getHeaders() // {host: "unitybase.info", accept-encoding: "gzip, deflate, br"}

   * @since UB@5.19.0
   */
  getHeaders () {
    if (!this._parsedHeaders) {
      this._parsedHeaders = parseHeaders(this.headers)
    }
    return this._parsedHeaders
  }

  /**
   * HTTP request method GET|POST|PUT......
   * @type {string}
   * @readonly
   */
  get method () {
    if (this._method === undefined) this._method = reg_getMethod()
    return this._method
  }

  /**
   * Full URL
   * @example
   *
   *   // GET http://host:port/ub/rest/doc_document/report?id=1&param2=asdas
   *   req.url === 'ub/rest/doc_document/report?id=1&param2=asdas'
   *
   * @type {string}
   * @readonly
   */
  get url () {
    if (this._url === undefined) this._url = reg_getUrl()
    return this._url
  }

  /**
   * URL WITHOUT appName and endpoint name
   * @example
   *   // GET http://host:port/ub/rest/doc_document/report?id=1&param2=asdas
   *   req.uri === 'doc_document/report'
   *
   * @type {string}
   * @readonly
   */
  get uri () {
    if (this._uri === undefined) this._uri = reg_getURI()
    return this._uri
  }

  /**
   * The same as uri, but URLDecode'd
   * @example
   *   //GET http://host:port/ub/rest/TripPinServiceRW/My%20People"
   *   req.decodedUri === 'TripPinServiceRW/My People'
   *
   * @type {string}
   * @readonly
   */
  get decodedUri () {
    if (this._decodedUri === undefined) this._decodedUri = reg_getDecodedURI()
    return this._decodedUri
  }

  /**
   * URL parameters as string. Better to use `req.parsedParameters` instead, what returns an object
   * @example
   *   // GET http://host:port/ub/rest/doc_document/report?id=1&param2=asdas
   *   req.parameters === 'id=1&param2=asdas'
   *
   * @type {string}
   * @readonly
   */
  get parameters () {
    if (this._parameters === undefined) this._parameters = reg_getParameters()
    return this._parameters
  }

  /**
   * URLDecoded parameters. Better to use `req.parsedParameters` instead, what returns an object
   * @example

   // GET http://host:port/bla-bla?$filter=Name%20eq%20%27John%27
   req.parameters === '$filter=Name%20eq%20%27John%27'
   req.decodedParameters === "$filter=Name eq 'John'"

   * @type {string}
   * @readonly
   */
  get decodedParameters () {
    if (this._decodedParameters === undefined) this._decodedParameters = reg_getDecodedParameters()
    return this._decodedParameters
  }

  /**
   * Return a parsed request parameters (decoded using querystring.parse()).
   * Second call to parsedParameters uses cached result, so it faster than first.
   * @example
    // for parameters 'foo=bar&baz=qux&baz=quux&corge' return
    req.parsedParameters // { foo: 'bar', baz: ['qux', 'quux'], corge: '' }
   * @return {Object<string, string|array<string>>}
   * @since UB@5.19.0
   */
  get parsedParameters () {
    if (this._parsedParameters === undefined) this._parsedParameters = queryString.parse(reg_getParameters())
    return this._parsedParameters
  }

  /**
   * Unique HTTP request ID - the same value as used to fill a `uba_auditTrail.request_id`.
   * In case audit trail is disabled in domain (uba_auditTrail entity not available) or Ub server version < 5.18.2 returns 0
   * @readonly
   * @return {number}
   * @since UB@5.18.2
   */
  get requestId () {
    return req_getReqId()
  }
}

/**
 * Parse a headers string into object. Keys is lower cased header name.
 *
 * Values for the same header names a concatenated using comma
 *
 * @private
 * @param {string} headers
 * @return {Object<string, string>}
 */
function parseHeaders (headers) {
  const parsed = {}
  if (!headers) return parsed
  headers.split('\n').forEach(function (line) {
    const i = line.indexOf(':')
    const key = line.substr(0, i).trim().toLowerCase()
    const val = line.substr(i + 1).trim()

    if (key) {
      if (parsed[key]) {
        parsed[key] += ', ' + val
      } else {
        parsed[key] = val
      }
    }
  })
  return parsed
}

module.exports = THTTPRequest
