/* global _App */
if (typeof _App === 'undefined') {
  throw new Error('(@unitybase/ub).App accessible only inside server thread')
}
const argv = require('@unitybase/base').argv
const path = require('path')
const UBDomain = require('@unitybase/cs-shared').UBDomain
const EventEmitter = require('events').EventEmitter
const THTTPResponse = require('./HTTPResponse')
const THTTPRequest = require('./HTTPRequest')
const createDBConnectionPool = require('@unitybase/base').createDBConnectionPool
const blobStores = require('@unitybase/blob-stores')
const base = require('@unitybase/base')
if (base.ubVersionNum < 5018000) {
  throw new Error('This version of @unitybase/ub package requires UB server to be at least 5.18.0')
}
/**
 * @classdesc
 * Singleton instance of UnityBase application. Allow direct access to the database connections, blob stores,
 * HTTP endpoints (full control on HTTP request & response) registration, read domain and server config.
 *
 * Mixes EventEmitter, and emit:
 *
 *  - `launchEndpoint:before` with parameters: (req, resp, endpointName)
 *  - `endpointName + ':before'` event before endpoint handler  execution
 *  - `endpointName + ':after'` event in case neither exception is raised nor App.preventDefault() is called
 *  - `launchEndpoint:after` with parameters: (req, resp, endpointName, defaultPrevented)
 *
 * To prevent endpoint handler execution `App.preventDefault()` can be used inside `:before` handler.
 *
 * @example
const App = require('@unitybase/ub').App
// Register public (accessible without authentication) endpoint
App.registerEndpoint('echoToFile', echoToFile, false)

// write custom request body to file FIXTURES/req and echo file back to client
// @ param {THTTPRequest} req
// @ param {THTTPResponse} resp
function echoToFile (req, resp) {
  var fs = require('fs')
  fs.writeFileSync(path.join(FIXTURES, 'req'), req.read('bin'))
  resp.statusCode = 200
  resp.writeEnd(fs.readFileSync(path.join(FIXTURES, 'req'), {encoding: 'bin'}))
}

//Before getDocument requests
//@ param {THTTPRequest} req
//@ param {THTTPResponse} resp
function doSomethingBeforeGetDocumentCall(req, resp){
  console.log('User with ID', Session.userID, 'try to get document')
}
// Adds hook called before each call to getDocument endpoint
App.on('getDocument:before', doSomethingBeforeGetDocumentCall)

//
//After getDocument requests
//@ param {THTTPRequest} req
//@ param {THTTPResponse} resp
function doSomethingAfterGetDocumentCall(req, resp){
  params = req.parsedParameters
  console.log('User with ID', Session.userID, 'obtain document using params',  params)
}
App.on('getDocument:after', doSomethingAfterGetDocumentCall)
 *
 * @class ServerApp
 * @mixes EventEmitter
 */
const ServerApp = {}

/**
 * Fires for an {@link module:@unitybase/ub#App UB.App} just after all domain entities (all *.meta) are loaded into server memory
 * and all server-side js are evaluated (for each working thread).
 *
 * On this stage you can subscribe on a cross-model handles.
 *
 * @example:
 *
 const UB = require('@unitybase/ub')
 const App = UB.App
 App.once('domainIsLoaded', function(){
     for (eName in App.domainInfo.entities) {
        // if entity have attribute mi_fedUnit
        if (App.domainInfo.entities[eName].attributes.mi_fedUnit) {
          let entityObj = global[eName]
          entityObj.on('insert:before', fedBeforeInsert) // add before insert handler
        }
     }
   })
 *
 * @event domainIsLoaded
 * @memberOf ServerApp
 */

/**
 * Fires (by native code) for an {@link module:@unitybase/ub#App UB.App} just after HTTP request context tries to got a DB connection for the first time
 *
 * On this stage DB session properties, specific for a current Session can be sets.
 * For example multitenancy mixin subscribes for this event and sets a `ub_tenantID` DB session variable value to `Session.tenantID`
 *
 * @event enterConnectionContext
 * @memberOf ServerApp
 */

// add eventEmitter to application object
EventEmitter.call(ServerApp)
Object.assign(ServerApp, EventEmitter.prototype)

let __preventDefault = false
/**
 * Called by native
 * TODO - remove when all App level method will be implemented in JS
 * @param eventName
 * @param {THTTPRequest} req
 * @param {THTTPResponse} resp
 * @private
 * @returns {boolean}
 */
ServerApp.emitWithPrevent = function (eventName, req, resp) {
  __preventDefault = false
  this.emit(eventName, req, resp)
  return __preventDefault
}
/**
 * Accessible inside app-level `:before` event handler. Call to prevent default method handler.
 * In this case developer are responsible to fill response object, otherwise HTTP 400 is returned.
 * @memberOf ServerApp
 */
ServerApp.preventDefault = function () {
  __preventDefault = true
}

/**
 * Called by native HTTP server worker
 * @param {string} endpointName
 * @emits launchEndpoint:before
 * @emits launchEndpoint:after
 * @private
 * @returns {boolean}
 */
ServerApp.launchEndpoint = function (endpointName) {
  __preventDefault = false
  const req = new THTTPRequest()
  const resp = new THTTPResponse()
  try {
    /**
     * Fires before any endpoint execution
     * @event launchEndpoint:before
     * @memberOf ServerApp
     * @param {THTTPRequest} req
     * @param {THTTPResponse} resp
     * @param {string} endpointName
     */
    this.emit('launchEndpoint:before', req, resp, endpointName)
    /**
     * Fires before endpoint execution. In example below handler is called before each `getDocument` execution
     * @example
const UB = require('@unitybase/ub')
const App = UB.App
function doSomethingBeforeGetDocumentCall(req, resp){
  console.log('User with ID', Session.userID, 'try to get document')
}
// Adds hook called before each call to getDocument endpoint
App.on('getDocument:before', doSomethingBeforeGetDocumentCall)
     * @event endpointName:before
     * @memberOf ServerApp
     * @param {THTTPRequest} req
     * @param {THTTPResponse} resp
     * @param {string} endpointName
     */
    this.emit(endpointName + ':before', req, resp)
    if (!__preventDefault) {
      const handler = appBinding.endpoints[endpointName]
      if (handler) { // JS endpoint
        handler(req, resp)
      } else { // native endpoint
        appBinding.launchNativeEndpoint()
      }
      /**
       * Fires after endpoint execution. In example below handler is called before each `getDocument` execution
       * @event endpointName:after
       * @memberOf ServerApp
       * @param {THTTPRequest} req
       * @param {THTTPResponse} resp
       * @param {string} endpointName
       */
      this.emit(endpointName + ':after', req, resp)
    }
    /**
     * Fires after any endpoint execution
     * @event launchEndpoint:after
     * @memberOf ServerApp
     * @param {THTTPRequest} req
     * @param {THTTPResponse} resp
     * @param {string} endpointName
     */
    this.emit('launchEndpoint:after', req, resp, endpointName, __preventDefault)
  } finally {
    ServerApp.endpointContext = {} // allow GC to release possible context data ASAP
  }
}

/**
 * Called by native RLS mixin. Task of method is to either run a rls.func or eval a rls.expression for ctxt.dataStore.Entity
 * @param {ubMethodParams} ctxt
 * @private
 */
ServerApp.launchRLS = function (ctxt) {
  const rlsMixin = ctxt.dataStore.entity.mixins.rls
  if (rlsMixin.func) { // functional RLS
    if (!rlsMixin.__funcVar) { // parse func namespace 'uba_user.somefunc' (string) -> uba_user.somefunc (function)
      const fPath = rlsMixin.func.split('.')
      let f = global[fPath[0]]
      for (let i = 1, L = fPath.length; i < L; i++) {
        f = f[fPath[i]]
      }
      if (typeof f !== 'function') throw new Error(`${ctxt.dataStore.entity.name} rls func "${rlsMixin.func}" is not a function`)
      rlsMixin.__funcVar = f
    }
    console.debug('Call func', rlsMixin.func)
    rlsMixin.__funcVar.call(global[ctxt.dataStore.entity.name], ctxt) // call RLS function using entity namespace as this
  } else { // expression
    const mParams = ctxt.mParams
    const expr = eval(rlsMixin.expression)
    console.debug('Eval rls expression to', expr)
    if (!mParams.whereList) {
      mParams.whereList = {}
    }
    mParams.whereList[`rls${Date.now()}`] = {
      expression: expr,
      condition: 'custom'
    }
  }
}

const appBinding = process.binding('ub_app')
/**
 * Register a server endpoint.
 * One of the endpoints can be default endpoint - it will be used as a fallback
 * in case URL do not start with any of known endpoints name.
 *
 * Exceptions inside endpoint handler are intercepted by UB server. In case exception is occurred
 * server will rollback any active DB transactions and serialize an exception message
 * to response depending on server execution mode:
 *  - for `dev` mode - original exception text will be serialized (for debugging purpose)
 *  - for production mode - in case exception message is wrapped into `<<<..>>>` then this message will be serialized,
 *  if not - text will be always `Internal server error` (for security reason)
 *
 *  Recommended way to throw an handled error inside endpoint handler is `throw new UB.UBAbort('.....')`
 *
 * @example

 // Write a custom request body to file FIXTURES/req and echo file back to client
 // @param {THTTPRequest} req
 // @param {THTTPResponse} resp
 //
 function echoToFile(req, resp) {
   var fs = require('fs');
   fs.writeFileSync(FIXTURES + 'req', req.read('bin'));
   resp.statusCode = 200;
   resp.writeEnd(fs.readFileSync(FIXTURES + 'req', {encoding: 'bin'}));
 }
 App.registerEndpoint('echoToFile', echoToFile);

 *
 * @param {String} endpointName
 * @param {Function} handler
 * @param {boolean} [authorizationRequired=true] If `true` UB will check for valid Authorization header before
 *  execute endpoint handler
 * @param {boolean} [isDefault=false]
 * @param {boolean} [bypassHTTPLogging=false] Do not put HTTP body into log (for example if body contains sensitive information, like password)
 * @memberOf ServerApp
 */
ServerApp.registerEndpoint = function (endpointName, handler, authorizationRequired, isDefault, bypassHTTPLogging) {
  if (!appBinding.endpoints[endpointName]) {
    appBinding.endpoints[endpointName] = handler
    if (base.ubVersionNum < 5020008) {
      return appBinding.registerEndpoint(
        endpointName,
        authorizationRequired === undefined ? true : authorizationRequired,
        isDefault === true
      )
    } else {
      return appBinding.registerEndpoint(
        endpointName,
        authorizationRequired === undefined ? true : authorizationRequired,
        isDefault === true,
        bypassHTTPLogging === true
      )
    }
  }
}

/**
 * Grant endpoint to role
 * @param {String} endpointName
 * @param {String} roleCode
 * @return {boolean} true if endpoint exists and role not already granted, false otherwise
 * @memberOf ServerApp
 */
ServerApp.grantEndpointToRole = function (endpointName, roleCode) {
  return appBinding.grantEndpointToRole(endpointName, roleCode)
}

/**
 * @method addAppLevelMethod
 * @deprecated Use {@link class:ServerApp.registerEndpoint App.registerEndpoint} instead
 * @memberOf ServerApp
 */
ServerApp.addAppLevelMethod = function () {
  throw new Error('App.addAppLevelMethod is obsolete. Use App.registerEndpoint instead')
}

/**
 * @method  serviceMethodByPassAuthentication
 * @deprecated Use {@link class:App.registerEndpoint App.registerEndpoint} instead
 * @memberOf ServerApp
 */
ServerApp.serviceMethodByPassAuthentication = function () {
  throw new Error('App.serviceMethodByPassAuthentication is obsolete. Use App.registerEndpoint instead')
}

/**
 * Server configuration - result of {@link module:argv~getServerConfiguration argv.getServerConfiguration}
 * @readonly
 * @type {Object}
 * @property {Object} httpServer HTTP server config
 * @property {Object} application
 * @property {string} application.name
 * @property {string} application.defaultLang
 * @property {Object} application.domain
 * @property {Array} application.domain.models
 * @property {Array<string>} application.domain.supportedLanguages
 * @property {Object} application.customSettings
 * @property {Object} uiSettings Section `uiSettings` of ubConfig
 * @property {Object} security
 */
ServerApp.serverConfig = undefined
const SERVER_CONFIG_CS = appBinding.registerCriticalSection('SERVER_CONFIG_CS')
appBinding.enterCriticalSection(SERVER_CONFIG_CS)
try {
  try {
    ServerApp.serverConfig = argv.getServerConfiguration()
  } catch (e) {
    console.error(e.message, e)
  }
} finally {
  appBinding.leaveCriticalSection(SERVER_CONFIG_CS)
}

/**
 * Application `package.json` content (parsed)
 * @type {Object}
 */
ServerApp.package = require(path.join(process.configPath, 'package.json'))

/**
 * Full path to application static folder if any, '' if static folder not set
 * @type {String}
 * @readonly
 */
ServerApp.staticPath = ''
if (ServerApp.serverConfig.httpServer && ServerApp.serverConfig.httpServer['inetPub'] &&
  ServerApp.serverConfig.httpServer['inetPub'].trim()) {
  const sp = ServerApp.serverConfig.httpServer['inetPub']
  ServerApp.staticPath = path.isAbsolute(sp)
    ? sp
    : path.join(process.configPath, sp)
}

/**
 * Application default language
 * @type {String}
 * @readonly
 */
ServerApp.defaultLang = ServerApp.serverConfig.application.defaultLang

/**
 * Custom settings for application from ubConfig.app.customSettings
 * @deprecated Use App.serverConfig.application.customSettings: Object instead
 * @type {String}
 */
Object.defineProperty(ServerApp, 'customSettings', {
  enumerable: true,
  get: function () {
    console.warn('App.customSettings is deprecated. Use App.serverConfig.application.customSettings instead')
    return JSON.stringify(ServerApp.serverConfig.application.customSettings)
  }
})

/**
 * Return stringified JSON specified in serverConfig.uiSettings
 * @deprecated Use App.serverConfig.uiSettings: Object instead
 * @return {string}
 */
ServerApp.getUISettings = function () {
  console.warn('App.getUISettings is deprecated. Use App.serverConfig.uiSettings: Object instead')
  return JSON.stringify(ServerApp.serverConfig.uiSettings)
}

/**
 * Full URl HTTP server is listen on (if HTTP server enabled, else - empty string)
 * @type {String}
 * @readonly
 */
ServerApp.serverURL = argv.serverURLFromConfig(ServerApp.serverConfig)

/**
 * URL that the User from the internet will use to access your server. To be used in case server is behind a reverse proxy
 * @type {String}
 * @readonly
 */
ServerApp.externalURL = ServerApp.serverConfig.httpServer.externalURL || ServerApp.serverURL

/**
 * List of a local server IP addresses CRLF (or CR for non-windows) separated
 */
ServerApp.localIPs = _App.localIPs

/**
 * Current application Domain
 * @deprecated UB >=4 use a App.domainInfo - a pure JS domain representation
 * @readonly
 */
Object.defineProperty(ServerApp, 'domain', {
  enumerable: true,
  get: function () {
    throw new Error('App.domain is obsolete. Use App.domainInfo')
  }
})

/**
 * For UB EE return true in case product license is exceed. For UB Se always `false`
 * @type {String}
 */
Object.defineProperty(ServerApp, 'isLicenseExceed', {
  enumerable: true,
  get: function () {
    return typeof appBinding.isLicenseExceed === 'function'
      ? appBinding.isLicenseExceed()
      : false
  }
})

const getDomainInfo = appBinding.getDomainInfo
let _domainCache
/**
 * Extended information about application domain (metadata)
 * @memberOf ServerApp
 * @member {UBDomain} domainInfo
 */
Object.defineProperty(ServerApp, 'domainInfo', {
  enumerable: true,
  get: function () {
    if (!_domainCache) {
      _domainCache = (new UBDomain(getDomainInfo(true))) // get extended domain information
    }
    return _domainCache
  }
})

/**
 * Get value from global cache. Global cache shared between all threads.
 *
 * Return '' (empty string) in case key not present in cache.
 *
 * @param {String} key Key to retrive
 * @return {String}
 */
ServerApp.globalCacheGet = function (key) {
  return _App.globalCacheGet(key)
}
/**
 * Put value to global cache.
 * @param {String} key  Key to put into
 * @param {String|null} value Value to put into this key. If === null then key will be remover from cache
 */
ServerApp.globalCachePut = function (key, value) {
  _App.globalCachePut(key, value)
}

/**
 * Delete row from FTS index for exemplar with `instanceID` of entity `entityName` (mixin `fts` must be enabled for entity)
 * @param {String} entityName
 * @param {Number} instanceID
 */
ServerApp.deleteFromFTSIndex = function (entityName, instanceID) {
  _App.deleteFromFTSIndex(entityName, instanceID)
}
/**
 * Update FTS index for for exemplar with `instanceID` of entity `entityName` (mixin `fts` must be enabled for entity).
 * In case row dose not exist in FTS perform insert action automatically.
 *
 * @param {String} entityName
 * @param {Number} instanceID
 */
ServerApp.updateFTSIndex = function (entityName, instanceID) {
  _App.updateFTSIndex(entityName, instanceID)
}

/**
 * Databases connections pool
 * @type {Object<string, DBConnection>}
 */
ServerApp.dbConnections = createDBConnectionPool(ServerApp.domainInfo.connections)

/**
 * Check database are used in current endpoint context and DB transaction is already active.
 * @param {String} connectionName
 * @return {Boolean}
 */
ServerApp.dbInTransaction = function (connectionName) {
  return _App.dbInTransaction(connectionName)
}
/**
 * Commit active database transaction if any.
 * In case `connectionName` is not passed will commit all active transactions for all connections.
 * Return `true` if transaction is committed, or `false` if database not in use or no active transaction.
 * @param {String} [connectionName]
 * @return {Boolean}
 */
ServerApp.dbCommit = function (connectionName) {
  return connectionName ? _App.dbCommit(connectionName) : _App.dbCommit()
}
/**
 * Rollback active database transaction if any.
 * In case `connectionName` is not passed will rollback all active transactions for all connections.
 * Return `true` if transaction is rollback'ed, or `false` if database not in use or no active transaction.
 * @param {String} [connectionName]
 * @return {Boolean}
 */
ServerApp.dbRollback = function (connectionName) {
  return connectionName ? _App.dbRollback(connectionName) : _App.dbRollback()
}
/**
 * Start a transaction for a specified database. If database is not used in this context will
 * create a connection to the database and start transaction.
 *
 * For Oracle with DBLink first statement to DBLink'ed table must be
 * either update/insert/delete or you MUST manually start transaction
 * to prevent "ORA-01453: SET TRANSACTION be first statement"
 *
 * @param {String} connectionName
 * @return {Boolean}
 */
ServerApp.dbStartTransaction = function (connectionName) {
  return _App.dbStartTransaction(connectionName)
}

/**
 * Try retrieve  or create new session from request headers.
 * Return `true` if success, `false` if more auth handshakes is required.
 * In case of invalid credential throw security exception
 *
 * @param {boolean} noHTTPBodyInResp If true do not write a uData to the HTTP response
 * @param {boolean} doSetOutCookie If true set a out authorization cookie on success response (Negotiate only)
 * @return {Boolean}
 */
ServerApp.authFromRequest = function (noHTTPBodyInResp = false, doSetOutCookie = false) {
  return _App.authFromRequest(noHTTPBodyInResp, doSetOutCookie)
}

/**
 * Logout a current user (kill current session)
 */
ServerApp.logout = function () {
  return _App.logout()
}
/**
 * Check Entity-Level-Security for specified entity/method
 * @example
if App.els('uba_user', 'insert'){
       // do something
}
 * @param {String} entityCode
 * @param {String} methodCode
 * @return {boolean}
 */
ServerApp.els = function (entityCode, methodCode) {
  return _App.els(entityCode, methodCode)
}

/**
 * Register a named critical section. Can be done only in initialization mode.
 * In case section with the same name already registered in another thread - returns existed CS index
 *
 * All threads MUST register section in the same way, do not put call into condition what may evaluates
 * too the different values in the different threads.
 *
 * @example
const App = require('@unitybase/ub').App
// critical section must be registered once in the moment modules are evaluated without any conditions
const MY_CS = App.registerCriticalSection('SHARED_FILE_ACCESS')

function concurrentFileAccess() {
  // prevents mutual access to the same file from the different threads
  App.enterCriticalSection(FSSTORAGE_CS)
  try {
    const data = fs.readfileSync('/tmp/concurrent.txt', 'utf8')
    // do some operation what modify data
    fs.writefileSync('/tmp/concurrent.txt', data)
  } finally {
    // important to leave critical section in finally block to prevent forever lock
    App.leaveCriticalSection(FSSTORAGE_CS)
  }
}
 * @method
 * @param {string} csName Critical section name
 * @return {number}
 */
ServerApp.registerCriticalSection = appBinding.registerCriticalSection
/**
 * Waits for ownership of the specified critical section object. The function returns when the calling thread is granted ownership.
 *
 * ** IMPORTANT** A thread must call `App.leaveCriticalSection` once for each time that it entered the critical section.
 *
 * @method
 * @param {number} csIndex A critical section index returned by `App.registerCriticalSection`
 */
ServerApp.enterCriticalSection = appBinding.enterCriticalSection
/**
 * Releases ownership of the specified critical section
 * @method
 * @param {number} csIndex
 */
ServerApp.leaveCriticalSection = appBinding.leaveCriticalSection

/**
 * Enter a log recursion call.
 * ** IMPORTANT** A thread must call `App.logLeave` once for each time that it entered the log recursion
 * @example

 function wrapEnterLeave(enterText, originalMethod) {
    return function(ctx) {
      App.logEnter(enterText)
      try {
        originalMethod(ctx)
      } finally {
        App.logLeave()
      }
    }
  }

 * @method
 * @param {string} methodName
 */
ServerApp.logEnter = appBinding.logEnter
/**
 * Exit a log recursion call
 * @method
 */
ServerApp.logLeave = appBinding.logLeave

/**
 * Observe a file system operation time (exposed as prometheus `unitybase_fs_operation_duration_seconds` histogram).
 *
 * **WARNING** do not use a full file path - use a folder name or better a mnemonic name (BLOB store name for example).
 * Amount of metric labels SHOULD be as less as possible. The same is true for operation`s names.
 *
 * See fileSystemBlobStore for real life usage example.
 * @param {number} durationSec fs operation duration in **seconds**
 * @param {string} path
 * @param {string} operation
 */
ServerApp.fsObserve = appBinding.fsObserve

/**
 * Observe a HTTP client operation time (exposed as prometheus `unitybase_httpext_duration_seconds` histogram).
 *
 * `http` module automatically observe each request, passing `host` as `uri` parameter.
 * Method can be called manually in case some part of path should be observed also.
 *
 * **WARNING** do not use a full path - use a part what identify an endpoint without parameters.
 * Amount of metric labels SHOULD be as less as possible. The same is true for operation`s names.
 *
 * @param {number} durationSec request duration in **seconds**
 * @param {string} uri request URI
 * @param {number} respStatus HTTP response status code
 */
ServerApp.httpCallObserve = appBinding.httpCallObserve

/**
 * Remove all user sessions (logout user).
 * @method
 * @param {number} userID
 * @return {boolean} true if user had had any session
 */
ServerApp.removeUserSessions = appBinding.removeUserSessions || function () {}

/**
 * Is event emitter enabled for App singleton. Default is `false`
 * @deprecated Starting from 1.11 this property ignored (always TRUE)
 * @type {Boolean}
 */
ServerApp.emitterEnabled = true

/**
 * Defense edition only,
 * Base64 encoded public server certificate
 *
 * Contains non empty value in case `security.dstu.trafficEncryption` === `true` and
 * key name defined in `security.dstu.novaLib.keyName`
 *
 * @type {string}
 */
ServerApp.serverPublicCert = _App.serverPublicCert

/**
 * BLOB stores methods. For usage examples see:
 *  - {@link module:@unitybase/blob-stores~getContent App.blobStores.getContent} - load content of BLOB into memory
 *  - {@link module:@unitybase/blob-stores~getContentPath App.blobStores.getContentPath} - get a path to the file based store BLOB content
 *  - {@link module:@unitybase/blob-stores~putContent App.blobStores.putContent} - put a BLOB content to the temporary storage
 *  - {@link module:@unitybase/blob-stores~markRevisionAsPermanent App.blobStores.markRevisionAsPermanent} - mark specified revision of a historical store as permanent
 *  - {@link module:@unitybase/blob-stores~internalWriteDocumentToResp App.blobStores.internalWriteDocumentToResp} - mark specified revision of a historical store as permanent
 */
ServerApp.blobStores = {
  getContent: blobStores.getContent,
  getContentPath: blobStores.getContentPath,
  putContent: blobStores.putContent,
  markRevisionAsPermanent: blobStores.markRevisionAsPermanent,
  internalWriteDocumentToResp: blobStores.internalWriteDocumentToResp
}

/**
 * Endpoint context. Application logic can store here some data what required during single HTTP method call;
 * Starting from UB@5.17.9 server reset `App.endpointContext` to {} after endpoint implementation execution,
 * so in the beginning of execution it's always empty
 *
 *    App.endpointContext.MYMODEL_mykey = 'some value we need to share between different methods during a single user request handling'
 *
 * @type {Object}
 * @since UB@5.17.9
 */
ServerApp.endpointContext = {}

module.exports = ServerApp
