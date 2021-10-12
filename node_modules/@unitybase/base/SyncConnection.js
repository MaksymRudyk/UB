const http = require('http')
const _ = require('lodash')
const csShared = require('@unitybase/cs-shared')
const LocalDataStore = csShared.LocalDataStore
const UBSession = csShared.UBSession
const UBDomain = csShared.UBDomain
const CryptoJS = require('@unitybase/cryptojs/core')
const { ServerRepository } = require('./ServerRepository')

CryptoJS.MD5 = require('@unitybase/cryptojs/md5')
// regular expression for URLs server not require authorization.
const NON_AUTH_URLS_RE = /(\/|^)(models|auth|getAppInfo|downloads)(\/|\?|$)/

/* global nsha256,btoa */

/**
 * @typedef ubRequest
 * @type {object}
 * @property {string} entity
 * @property {string} method
 * @property {Array<string>} [fieldList]
 * @property {Object<string, *>} [execParams]
 */

/**
 * @classdesc
 * Synchronous server-side connection to the UnityBase instance. To be used only inside UnityBase.
 * For nodeJS & browser use asynchronous UBConnection class from @unitybase/ub-pub package.
 *
 * The most used method is {@link SyncConnection#query  SyncConnection.query} - a authorized request to `ubql` endpoint.
 *
 * @example

const SyncConnection = require('@unitybase/base').SyncConnection
const conn = new SyncConnection({URL: 'http://localhost:888'})
conn.onRequestAuthParams = function(){ return {authSchema: 'UB', login: 'admin', password: 'admin'} }
const domain = conn.getDomainInfo();
if (domain.has('my_entity')){
 ..
}

 * @class
 * @param {Object} options Connection parameters. See {@link module:http http.request} for details
 */
function SyncConnection (options) {
  const me = this
  const client = http.request(options)
  let /** @type UBDomain */
    _domain
  let ubSession = null
  const lookupCache = {}
  const userDataDefault = { lang: 'en' }
  let appInfo = {}

  /**
  * Internal instance of HTTP client
  * @type {ClientRequest}
  * @protected
  * @readonly
  */
  this.clientRequest = client
  let appName = client.options.path
  let servicePath = client.options.path
  if (servicePath.charAt(servicePath.length - 1) !== '/') servicePath = servicePath + '/' // normalize path
  if (appName.length !== 1) {
    if (appName.charAt(0) === '/') appName = appName.slice(1, 100) // remove leading / from app name
    if (appName.charAt(appName.length - 1) === '/') appName = appName.slice(0, appName.length - 1) // remove / from end of app name
  }

  /**
   * Root path to all application-level method
   * @type {String}
   * @readonly
   */
  this.servicePath = servicePath

  /**
   * Name of UnityBase application
   * @type {String}
   * @readonly
   */
  this.appName = appName
  /**
   * Callback for resolving user credential.
   * Take a {@link SyncConnection} as a parameter, must return authorization parameters object:
   *
   *      {authSchema: authType, login: login, password: password, [apiKey: ]}
   *
   * For a internal usage (requests from a locahost or other systems, etc.) and in case `authShema == 'UB'` it is possible to pass a
   * `apiKey` instead of a password. apiKey is actually a `uba_user.uPasswordHashHexa` content
   *
   * @type {function}
   */
  this.onRequestAuthParams = null

  /**
   * @deprecated Do not use this property due to memory overuse - see http://forum.ub.softline.kiev.ua/viewtopic.php?f=12&t=85
   * @private
   */
  appInfo = this.get('getAppInfo') // non-auth request

  const v = appInfo.serverVersion.split('.')
  /**
   * Server support UBQL v2 (value instead of values)
   * @property {Boolean} UBQLv2
   * @readonly */
  this.UBQLv2 = ((v[0] >= 'v5') && (v[1] >= 10))

  /**
   * Return information about how application is configured as returned by `getAppInfo` endpoint
   * @return {Object}
   */
  this.getAppInfo = function () {
    return appInfo
  }

  /**
   * Retrieve application domain information.
   * @param {Boolean} [isExtended=false] For member of admin group can return a additional domain information,
   *   such as mappings, connection details, indexes, realPath for models etc.
   * @return {UBDomain}
   */
  this.getDomainInfo = function (isExtended = false) {
    if (this._cachedDomainIsExtended !== isExtended) {
      _domain = null
    }
    if (!_domain) {
      // authorize connection to get a valid user name
      if (this.authNeed) this.authorize(false)

      const domainData = this.get('getDomainInfo', {
        v: 4,
        userName: this.userLogin(),
        extended: isExtended || undefined
      })
      _domain = new UBDomain(domainData)
      this._cachedDomainIsExtended = isExtended
    }
    return _domain
  }

  /**
   * Endpoint name for query (`runList` before 1.12, `ubql` after 1.12)
   * @type {string}
   */
  this.queryMethod = appInfo.serverVersion.startsWith('1.9.') || appInfo.serverVersion.startsWith('1.10.') ? 'runList' : 'ubql'

  /** Is server require content encryption
   * @type {Boolean}
   * @readonly
   */
  this.encryptContent = appInfo.encryptContent || false

  /** `base64` encoded server certificate used for cryptographic operation
   * @type {Boolean}
   * @readonly
   */
  this.serverCertificate = appInfo.serverCertificate || ''

  /** Lifetime (in second) of session encryption
   * @type {Number}
   * @readonly
   */
  this.sessionKeyLifeTime = appInfo.sessionKeyLifeTime || 0

  /**
   * Possible server authentication method
   * @type {Array.<string>}
   * @readonly
   */
  this.authMethods = appInfo.authMethods

  /**
   * Is UnityBase server require authorization
   * @type {Boolean}
   * @readonly
   */
  this.authNeed = me.authMethods && (me.authMethods.length > 0)

  // noinspection JSUnusedGlobalSymbols
  /**
   * AdminUI settings
   * @type {Object}
   */
  this.appConfig = appInfo.adminUI

  /**
   * @param {Boolean} isRepeat
   * @private
   * @return {UBSession}
   */
  this.authorize = function (isRepeat) {
    let resp, serverNonce, secretWord, pwdHash
    if (!ubSession || isRepeat) {
      ubSession = null
      if (!this.onRequestAuthParams) {
        throw new Error('set SyncConnection.onRequestAuthParams function to perform authorized requests')
      }
      const authParams = this.onRequestAuthParams(this)
      if (authParams.authSchema === 'UBIP') {
        if (isRepeat) {
          throw new Error('UBIP authentication must not return false on the prev.step')
        }
        resp = this.xhr({ endpoint: 'auth?AUTHTYPE=UBIP', headers: { Authorization: authParams.authSchema + ' ' + authParams.login } })
        ubSession = new UBSession(resp, '', authParams.authSchema)
      } else if (authParams.authSchema === 'ROOT') {
        if (isRepeat) {
          throw new Error('ROOT authentication must not return false on the prev.step')
        }
        resp = this.xhr({ endpoint: 'auth?AUTHTYPE=ROOT', headers: { Authorization: authParams.authSchema + ' ' + process.rootOTP() } })
        ubSession = new UBSession(resp, '', authParams.authSchema)
      } else {
        resp = this.get('auth', {
          AUTHTYPE: authParams.authSchema || 'UB',
          userName: authParams.login
        })
        const clientNonce = nsha256(new Date().toISOString().substr(0, 16))
        const request2 = {
          clientNonce: clientNonce
        }
        if (resp.connectionID) {
          request2.connectionID = resp.connectionID
        }
        request2.AUTHTYPE = authParams.authSchema || 'UB'
        request2.userName = authParams.login
        if (resp.realm) { // LDAP
          serverNonce = resp.nonce
          if (!serverNonce) {
            throw new Error('invalid LDAP auth response')
          }
          if (resp.useSasl) {
            pwdHash = CryptoJS.MD5(authParams.login.split('\\')[1].toUpperCase() + ':' + resp.realm + ':' + authParams.password)
            // we must calculate md5(login + ':' + realm + ':' + password) in binary format
            pwdHash.concat(CryptoJS.enc.Utf8.parse(':' + serverNonce + ':' + clientNonce))
            request2.password = CryptoJS.MD5(pwdHash).toString()
            secretWord = request2.password // todo - must be pwdHash but UB server do not know it :( medium unsecured
          } else {
            request2.password = btoa(authParams.password)
            secretWord = request2.password // todo -  very unsecured to be used only over SSL!!
          }
        } else {
          serverNonce = resp.result
          if (!serverNonce) {
            throw new Error('invalid auth response')
          }
          if (authParams.apiKey) {
            pwdHash = authParams.apiKey
          } else {
            pwdHash = nsha256('salt' + authParams.password)
          }
          request2.password = nsha256(appName.toLowerCase() + serverNonce + clientNonce + authParams.login + pwdHash).toString()
          secretWord = pwdHash
        }
        resp = this.get('auth', request2)
        ubSession = new UBSession(resp, secretWord, authParams.authSchema)
      }
    }
    return ubSession
  }

  /**
   * Check is current connection already perform authentication request
   * @returns {boolean}
   */
  this.isAuthorized = function () {
    return Boolean(ubSession)
  }

  /**
   * Return current user logon or 'anonymous' in case not logged in
   * @returns {String}
   */
  this.userLogin = function () {
    return this.isAuthorized() ? ubSession.logonname : 'anonymous'
  }

  /**
   * Return current user language or 'en' in case not logged in
   * @returns {String}
   */
  this.userLang = function () {
    return this.userData('lang')
  }

  /**
   * Return custom data for logged in user, or {lang: 'en'} in case not logged in
   *
   * If key is provided - return only key part of user data
   *
   * @example

 $App.connection.userData('lang')
 // or the same but dedicated alias
 $App.connection.userLang()

   * @param {String} [key] Optional key
   * @returns {*}
   */
  this.userData = function (key) {
    const uData = this.isAuthorized() ? ubSession.userData : userDataDefault
    return key ? uData[key] : uData
  }

  /**
   * Lookup value in entity using a Condition
   * @example

// create condition using Repository
const myID = conn.lookup('ubm_enum', 'ID',
  conn.Repository('ubm_enum').where('eGroup', '=', 'UBA_RULETYPE').where('code', '=', 'A').ubql().whereList
)
// or pass condition directly
const adminID = conn.lookup('uba_user', 'ID', {
 expression: 'name', condition: 'equal', value: 'admin'}
})

   * @param {String} aEntity - entity to lookup
   * @param {String} lookupAttribute - attribute to lookup
   * @param {String|Object} aCondition - lookup condition. String in case of custom expression,
   *      or whereListItem {expression: condition: value: },
   *      or whereList {condition1: {expression: condition: value: }, condition2: {}, ....}
   * @param {Boolean} [doNotUseCache=false]
   * @return {*} `lookupAttribute` value of first result row or null if not found.
   */
  this.lookup = function (aEntity, lookupAttribute, aCondition, doNotUseCache) {
    const me = this
    const cKey = aEntity + JSON.stringify(aCondition) + lookupAttribute
    let request

    if (!doNotUseCache && lookupCache.hasOwnProperty(cKey)) {
      return lookupCache[cKey] // found in cache
    } else {
      request = this.Repository(aEntity).attrs(lookupAttribute).limit(1).ubql()

      if (typeof aCondition === 'string') {
        request.whereList = { lookup: { expression: aCondition, condition: 'custom' } }
      } else if (aCondition.expression && (typeof aCondition.expression === 'string')) {
        request.whereList = { lookup: aCondition }
      } else {
        request.whereList = aCondition
      }

      const resData = me.query(request).resultData.data
      if ((resData.length === 1) && (resData[0][0] != null)) { // `!= null` is equal to (not null && not undefined)
        if (!doNotUseCache) {
          lookupCache[cKey] = resData[0][0]
        }
        return resData[0][0]
      } else {
        return null
      }
    }
  }
}

/**
 * Perform authorized UBQL request.
 * Can take one QB Query or an array of UB Query and execute it at once.
 * @param {Object|Array<Object>} ubq
 * @returns {Object|Array}
 */
SyncConnection.prototype.query = function (ubq) {
  if (Array.isArray(ubq)) {
    return this.xhr({ endpoint: this.queryMethod, data: ubq })
  } else {
    return this.xhr({ endpoint: this.queryMethod, data: [ubq] })[0]
  }
}

/**
 * HTTP request to UB server. In case of success response return body parsed to {Object} or {ArrayBuffer} depending of Content-Type response header
 *
 * @example
 conn.xhr({
     endpoint: 'runSQL',
     URLParams: {CONNECTION: 'dba'},
     data: 'DROP SCHEMA IF EXISTS ub_autotest CASCADE; DROP USER IF EXISTS ub_autotest;'
 });

 * @param {Object} options
 * @param {String} options.endpoint
 * @param {String} [options.UBMethod] This parameter is **DEPRECATED**. Use `options.endpoint` instead
 * @param {String} [options.HTTPMethod='POST']
 * @param {Object} [options.headers] Optional request headers in format {headerName: headerValue, ..}
 * @param {Boolean} [options.simpleTextResult=false] do not parse response and return it as is even if response content type is JSON
 * @param {*} [options.URLParams] Optional parameters added to URL using http.buildURL
 * @param {ArrayBuffer|Object|String} [options.data] Optional body
 * @param  {String} [options.responseType] see <a href="https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest#responseType">responseType</a>.
 *    Currently only `arraybuffer` supported.
 * @returns {ArrayBuffer|Object|String|Array<Object>}
 */
SyncConnection.prototype.xhr = function (options) {
  const me = this
  const req = this.clientRequest
  let resp
  let result = {}

  let path = this.servicePath + (options.endpoint || options.UBMethod)
  if (options.URLParams) {
    path = http.buildURL(path, options.URLParams)
  }
  if (me.authNeed && !NON_AUTH_URLS_RE.test(path)) { // request need authentication
    const session = me.authorize(me._inRelogin)
    req.setHeader('Authorization', session.authHeader())
  }
  req.setMethod(options.HTTPMethod || 'POST') // must be after auth request!
  req.setPath(path)

  if (options.headers) {
    _.forEach(options.headers, function (val, key) {
      req.setHeader(key, val)
    })
  }
  if (options.data) {
    if (options.data.toString() === '[object ArrayBuffer]') {
      req.setHeader('Content-Type', 'application/octet-stream')
    } else {
      req.setHeader('Content-Type', 'application/json;charset=utf-8')
    }
    resp = req.end(options.data)
  } else {
    resp = req.end()
  }
  const status = resp.statusCode

  if (status >= 200 && status < 300) {
    if (options.responseType === 'arraybuffer') {
      result = resp.read('bin')
    } else if (((resp.headers['content-type'] || '').indexOf('json') >= 0) && !options.simpleTextResult) {
      const txtRes = resp.read()
      result = txtRes ? JSON.parse(txtRes) : null
    } else {
      result = resp.read() // return string reads as UTF-8
    }
  } else if (status === 401 && me.isAuthorized()) { // re-login
    if (me._inRelogin) {
      me._inRelogin = false
      throw new Error('invalid user name or password')
    }
    me._inRelogin = true
    console.debug('Session expire - repeat auth request')
    try {
      result = me.xhr(options)
    } finally {
      me._inRelogin = false
    }
  } else {
    if ((status === 500) && ((resp.headers['content-type'] || '').indexOf('json') >= 0)) { // server report error and body is JSON
      const respObj = JSON.parse(resp.read())
      if (respObj.errMsg) {
        throw new Error('Server error: "' + respObj.errMsg)
      } else {
        throw new Error('HTTP communication error: "' + status + ': ' + http.STATUS_CODES[status] + '" during request to: ' + path)
      }
    } else {
      throw new Error('HTTP communication error: "' + status + ': ' + http.STATUS_CODES[status] + '" during request to: ' + path)
    }
  }
  return result
}

/**
 * Perform get request to `endpoint` with optional URLParams.
 * @param {String} endpoint
 * @param {*} [URLParams]
 * @returns {ArrayBuffer|Object|String}
 */
SyncConnection.prototype.get = function (endpoint, URLParams) {
  const params = {
    endpoint: endpoint,
    HTTPMethod: 'GET'
  }
  if (URLParams) { params.URLParams = URLParams }
  return this.xhr(params)
}

/**
 * Shortcut method to perform authorized `POST` request to application we connected
 * @param {String} endpoint
 * @param {ArrayBuffer|Object|String} data
 * @returns {ArrayBuffer|Object|String|Array<object>}
 */
SyncConnection.prototype.post = function (endpoint, data) {
  return this.xhr({ endpoint: endpoint, data: data })
}

/**
 * Shortcut method to perform authorized `POST` request to `ubql` endpoint
 * @private
 * @deprecated Since UB 1.11 use SyncConnection.query
 * @param {Array<ubRequest>} runListData
 * @returns {Object}
 */
SyncConnection.prototype.runList = function (runListData) {
  return this.xhr({ endpoint: this.queryMethod, data: runListData })
}

/**
 * Send request to any endpoint. For entity-level method execution (`ubql` endpoint) better to use {@link SyncConnection#query SyncConnection.query}
 * @returns {*} body of HTTP request result. If !simpleTextResult and response type is json - then parsed to object
 */
SyncConnection.prototype.runCustom = function (endpoint, aBody, aURLParams, simpleTextResult, aHTTPMethod) {
  return this.xhr({ HTTPMethod: aHTTPMethod || 'POST', endpoint: endpoint, URLParams: aURLParams, data: aBody, simpleTextResult: simpleTextResult })
  // throw new Error ('Use one of runList/run/post/xhr SyncConnection methods');
}

/**
 * Shortcut method to perform authorized `POST` request to `ubql` endpoint.
 * Can take one ubRequest and wrap it to array
 * @deprecated Since UB 1.11 use SyncConnection.query
 * @param {ubRequest} request
 * @returns {Object}
 */
SyncConnection.prototype.run = function (request) {
  return this.xhr({ endpoint: this.queryMethod, data: [request] })[0]
}

/**
 * Logout from server if logged in
 */
SyncConnection.prototype.logout = function () {
  if (this.isAuthorized()) {
    try {
      this.post('logout', '')
    } catch (e) {
    }
  }
}

/**
 * Saves a file content as a potential value of the specified entity instance attribute to the TEMP store.
 *
 * Call this function before entity insert of update. Result of this function is what shall be assigned to the
 * attribute value, to "execParams".
 * @param {string} entity Entity name
 * @param {string} attribute Entity attribute name
 * @param {number} id ID of the record
 * @param {ArrayBuffer|string} data File content
 * @param {string} origName
 * @param {string} [fileName] If not specified, origName will be used.
 * @param {string} dataEncoding Specify `data` parameter encoding. Either omit for binary data
 *   or set to `base64` for base64 encoded data
 * @return {string}
 *
 * @example
const myObj = conn.Repository(entityName)
  .attrs('ID', 'mi_modifyDate')
  .where('code', '=', code)
  .selectSingle()
const {ID, mi_modifyDate} = myObj
const data = fs.readFileSync(fileName, {encoding: 'bin'})
const tempStoreResult = conn.setDocument(entityName, 'configuration', ID, data, fn)
conn.query({
  entity: entityName,
  method: 'update',
  execParams: {ID, configuration: tempStoreResult, mi_modifyDate}
})
 */
SyncConnection.prototype.setDocument = function (entity, attribute, id, data, origName, fileName, dataEncoding) {
  const urlParams = {
    entity,
    attribute,
    id,
    origName: origName || fileName,
    filename: fileName || origName
  }
  if (dataEncoding) urlParams.encoding = dataEncoding
  const setDocumentResponse = this.xhr({
    HTTPMethod: 'POST',
    endpoint: 'setDocument',
    data,
    URLParams: urlParams
  })
  return JSON.stringify(setDocumentResponse.result)
}

const ALLOWED_GET_DOCUMENT_PARAMS = ['entity', 'attribute', 'ID', 'id', 'isDirty', 'forceMime', 'fileName', 'store', 'revision']
/**
 * Retrieve content of `document` type attribute field from server
 * @example

 //Retrieve content of document as string using GET
 let frmContent = conn.getDocument({
     entity:'ubm_form',
     attribute: 'formDef',
     ID: 100000232003
  })
  console.log(typeof frmContent)

 //The same, but using POST for bypass cache
 let frmContent = conn.getDocument({
     entity:'ubm_form',
     attribute: 'formDef',
     ID: 100000232003
  }, {
     bypassCache: true
  })
  console.log(typeof frmContent) // string

 //Retrieve content of document as ArrayBuffer and bypass cache
 let frmContent = conn.getDocument({
   entity:'ubm_form',
   attribute: 'formDef',
   ID: 100000232003
  }, {
   bypassCache: true, resultIsBinary: true
 })
  console.log('Result is', typeof frmContent, 'of length' , frmContent.byteLength, 'bytes'); //output: Result is object of length 2741 bytes

 * @param {Object} params
 * @param {String} params.entity Code of entity to retrieve from
 * @param {String} params.attribute `document` type attribute code
 * @param {Number} params.id Instance ID
 * @param {String} [params.forceMime] If passed and server support transformation from source MIME type to `forceMime` server perform transformation and return documenRt representation in the passed MIME
 * @param {Number} [params.revision] Optional revision of the documnet (if supported by server-side store configuration). Default is current revision.
 * @param {String} [params.fileName] ????
 * @param {Boolean} [params.isDirty=false] Optional ability to retrieve document in **dirty** state
 * @param {String} [params.store] ????
 *
 * @param {Object} [options] Additional request options
 * @param {Boolean} [options.resultIsBinary=false] if true - return document content as arrayBuffer
 * @param {Boolean} [options.bypassCache] HTTP POST verb will be used instead of GET for bypass browser cache
 * @returns {ArrayBuffer|String} Document content (either ArrayBuffer in case options.resultIsBinary===true or text/json)
 */
SyncConnection.prototype.getDocument = function (params, options) {
  const opt = Object.assign({}, options)
  const reqParams = {
    endpoint: 'getDocument',
    HTTPMethod: opt.bypassCache ? 'POST' : 'GET'
  }
  if (options && options.resultIsBinary) {
    reqParams.responseType = 'arraybuffer'
  }
  if (opt.bypassCache) {
    reqParams.data = Object.assign({}, params)
    Object.keys(reqParams.data).forEach(function (key) {
      if (ALLOWED_GET_DOCUMENT_PARAMS.indexOf(key) === -1) {
        delete reqParams.data[key]
      }
    })
  } else {
    reqParams.URLParams = params
  }
  return this.xhr(reqParams)
}

/**
 * Execute insert method by add method: 'insert' to `ubq` query (if req.method not already set)
 *
 * If `ubq.fieldList` contain only `ID` return inserted ID, else return array of attribute values passed to `fieldList`.
 * If no field list passed at all - return response.resultData (null usually).
 *
 * @example
const testRole = conn.insert({
  entity: 'uba_role',
  fieldList: ['ID', 'mi_modifyDate'],
  execParams: {
      name: 'testRole1',
      allowedAppMethods: 'runList'
  }
})
console.log(testRole) //[3000000000200,"2014-10-21T11:56:37Z"]

const testRoleID = conn.insert({
  entity: 'uba_role',
  fieldList: ['ID'],
  execParams: {
      name: 'testRole1',
      allowedAppMethods: 'runList'
  }
})
console.log(testRoleID) //3000000000200
 *
 * @param {ubRequest} ubq
 * @return {*}
 */
SyncConnection.prototype.insert = function (ubq) {
  // var req = _.clone(ubq, true)
  const req = ubq
  req.method = req.method || 'insert'
  const res = this.query(req)
  if (req.fieldList) {
    return ((req.fieldList.length === 1) && (req.fieldList[0] === 'ID')) ? res.resultData.data[0][0] : res.resultData.data[0]
  } else {
    return res.resultData
  }
}

/**
 * Run UBQL command with `insert` method
 *
 * In case `fieldList` is passed - result will contains new values for attributes specified in `fieldList` as Object, otherwise - null
 *
 * In opposite to `insert` method values in result are PARSED based on Domain (as in AsyncConnection) - so values
 * for boolean attributes is true/false, date is typeof Date etc.
 *
 * @param {ubRequest} ubq
 * @param {Object<string, string>} [fieldAliases] Optional object to change attribute names during transform array to object. Keys are original names, values - new names
 * @returns {Object}
 *
 * @example

const newRole = conn.insertAsObject({
  entity: 'uba_role',
  fieldList: ['ID', 'name', 'allowedAppMethods', 'mi_modifyDate'],
  execParams: {
      name: 'testRole61',
      allowedAppMethods: 'runList'
  }
}, {mi_modifyDate: 'modifiedAt'})
console.log(newRole) // {ID: 332462911062017, name: 'testRole1', allowedAppMethods: 'runList', mi_modifyDate: 2020-12-21T15:45:01.000Z}
console.log(newRole.modifiedAt instanceof Date) //true

 */
SyncConnection.prototype.insertAsObject = function (ubq, fieldAliases) {
  const req = ubq
  req.method = req.method || 'insert'
  const serverResp = this.query(req)
  const res = LocalDataStore.convertResponseDataToJsTypes(this.getDomainInfo(), serverResp)
  return (res.resultData && res.resultData.data && res.resultData.data.length)
    ? LocalDataStore.selectResultToArrayOfObjects(res, fieldAliases)[0]
    : null
}

/**
 * Execute addnew method: add method 'addnew' to `ubq` query (if req.method not already set)
 *
 * If `ubq.fieldList` contain only `ID` return generated ID, otherwise return array of attribute values passed to `fieldList`.
 * If no field list passed at all - return response.resultData (null usually).
 *
 * @example
 const testRole = conn.addNew({
    entity: 'uba_role',
    fieldList: ['ID', 'name', 'allowedAppMethods'],
    execParams: {
      name: 'testRole1',
      allowedAppMethods: 'runList'
    }
  })
 console.log(testRole) //[3000000000200,"testRole1","runList"]

 const testRoleID = conn.addNew({
    entity: 'uba_role',
    fieldList: ['ID']
  })
 console.log(testRoleID) //3000000000200
 *
 * @param {ubRequest} ubq
 * @return {*}
 */
SyncConnection.prototype.addNew = function (ubq) {
  // var req = _.clone(ubq, true)
  const req = ubq
  req.method = req.method || 'addnew'
  const res = this.query(req)
  if (!req.fieldList) {
    return res.resultData
  } else if (req.fieldList.length === 1 && req.fieldList[0] === 'ID') {
    return res.resultData.data[0][0]
  } else {
    return res.resultData.data[0]
  }
}

/**
 * Run UBQL command with `addnew` method
 *
 * In case `fieldList` is passed - result will contains new values for attributes specified in `fieldList` as Object, otherwise - null
 *
 * In opposite to `addNew` method values in result are PARSED based on Domain (as in AsyncConnection) - so values
 * for boolean attributes is true/false, date is typeof Date etc.
 *
 * @param {ubRequest} ubq
 * @param {Object<string, string>} [fieldAliases] Optional object to change attribute names during transform array to object. Keys are original names, values - new names
 * @returns {Object}
 *
 * @example

 const newRole = conn.addNewAsObject({
  entity: 'uba_role',
  fieldList: ['ID', 'name', 'allowedAppMethods'],
  execParams: {
      name: 'testRole61',
      allowedAppMethods: 'runList'
  }
})
 console.log(newRole) // {ID: 332462911062017, name: 'testRole1', allowedAppMethods: 'runList'}

 */
SyncConnection.prototype.addNewAsObject = function (ubq, fieldAliases) {
  const req = ubq
  req.method = req.method || 'addnew'
  const serverResp = this.query(req)
  const res = LocalDataStore.convertResponseDataToJsTypes(this.getDomainInfo(), serverResp)
  return (res.resultData && res.resultData.data && res.resultData.data.length)
    ? LocalDataStore.selectResultToArrayOfObjects(res, fieldAliases)[0]
    : null
}

/**
 * Execute update method (adds method: 'update' if req.method is not already set)
 */
SyncConnection.prototype.update = function (ubq) {
  const req = ubq
  req.method = req.method || 'update'
  const res = this.query(req)
  return res.resultData
}

/**
 * Run UBQL command with `update` method
 *
 * In case `fieldList` is passed - result will contains new values for attributes specified in `fieldList` as Object, otherwise - null
 *
 * In opposite to `update` method values in result are PARSED based on Domain (as in AsyncConnection) - so values
 * for boolean attributes is true/false, date is typeof Date etc.
 *
 * @param {ubRequest} ubq
 * @param {Object<string, string>} [fieldAliases] Optional object to change attribute names during transform array to object. Keys are original names, values - new names
 * @returns {Object}
 *
 * @example

 const newRole = conn.updateAsObject({
  entity: 'uba_role',
  fieldList: ['ID', 'name', 'allowedAppMethods', 'mi_modifyDate'],
  execParams: {
      ID: 123,
      name: 'testRole61'
  }
}, {mi_modifyDate: 'modifiedAt'})
 console.log(newRole) // {ID: 332462911062017, name: 'testRole1', allowedAppMethods: 'runList', mi_modifyDate: 2020-12-21T15:45:01.000Z}
 console.log(newRole.modifiedAt instanceof Date) //true

 */
SyncConnection.prototype.updateAsObject = function (ubq, fieldAliases) {
  const req = ubq
  req.method = req.method || 'update'
  const serverResp = this.query(req)
  const res = LocalDataStore.convertResponseDataToJsTypes(this.getDomainInfo(), serverResp)
  return (res.resultData && res.resultData.data && res.resultData.data.length)
    ? LocalDataStore.selectResultToArrayOfObjects(res, fieldAliases)[0]
    : null
}

/**
 * Create a new instance of repository
 * @param {String|Object} entityCodeOrUBQL The name of the Entity for which the Repository is being created or UBQL
 * @returns {ServerRepository}
 */
SyncConnection.prototype.Repository = function (entityCodeOrUBQL) {
  if (typeof entityCodeOrUBQL === 'string') {
    return new ServerRepository(this, entityCodeOrUBQL)
  } else {
    return new ServerRepository(this, '').fromUbql(entityCodeOrUBQL)
  }
}

module.exports = SyncConnection
