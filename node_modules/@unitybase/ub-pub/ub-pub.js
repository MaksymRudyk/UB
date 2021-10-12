/* global SystemJS */
const i18n = require('./i18n')
const utils = require('./utils')
const transport = require('./transport')
const conn = require('./AsyncConnection')
const injection = require('./injection')
const ClientRepository = require('./ClientRepository')
const LocalRepository = require('./LocalRepository')
const UBCache = require('./UBCache')
const LocalDataStore = require('@unitybase/cs-shared').LocalDataStore
const iso8601ParseAsDate = LocalDataStore.iso8601ParseAsDate
const truncTimeToUtcNull = LocalDataStore.truncTimeToUtcNull
const formatByPattern = require('@unitybase/cs-shared').formatByPattern
const CryptoJS = require('@unitybase/cryptojs')
// const CryptoJSCore = require('@unitybase/cryptojs/core')
const SHA256 = require('@unitybase/cryptojs/sha256')
const MD5 = require('@unitybase/cryptojs/md5')
const BASE64Encl = require('@unitybase/cryptojs/enc-base64')
const UBNativeMessage = require('./UBNativeMessage')

let _errorReporter = null
let _globalVueInstance = null
/**
 * Data layer for accessing UnityBase server from Browser or NodeJS
 * @module @unitybase/ub-pub
 */
const UB = module.exports = {
  /**
   * Return locale-specific resource from it identifier. `localeString` must be:
   *
   * - either previously defined dy call to {@link i18nExtend i18nExtend}
   * - or be a combination of entity and attribute names so that `UB.i18n('uba_user')`
   *  or `UB.i18n('uba_role.description')` would be resolved to  localized entity caption or entity attribute caption
   * - description/documentation of entity/attribute can be localized using hash tag #description / #documentation. See sample below
   *
   * @example

 //Localized string can be formatted either by position args:
 UB.i18nExtend({
   greeting: 'Hello {0}, welcome to {1:i18n}',
   Kiev: 'Kyiv city'
 })
 UB.i18n('greeting', 'Mark', 'Kiev') // Hello Mark, welcome to Kyiv city
 // in sample above :i18n modifier is added to the second format args, so `Kiev` is also translated

 //Or by named args:
 UB.i18nExtend({
   namedGreeting: 'Hello {name}, welcome to {place}'
 })
 UB.i18n('namedGreeting', {name: 'Mark', place: 'Kiev'}) // Hello Mark, welcome to Kiev

 //Localization itself can be an object:
 UB.i18nExtend({
   loginPage: { welcome: 'Welcome to our app', user: 'Dear {user}'}
 })
 UB.i18n('loginPage.welcome') // Welcome to our app
 UB.i18n('loginPage.user', {user: 'Pol}) // Dear Pol
 UB.i18n('loginPage') // return object {welcome: "Welcome to our app", user: "Dear {user}"}

 UB.i18n('uba_user') // -> "Users" (caption from uba_use.meta)
 UB.i18n('uba_user.firstName') // -> "First Name" (caption of uba_user.firstName attribute)

 UB.i18n('uba_user.name#description') // "User login in lower case" (description for uba_user.name attribute)
 UB.i18n('uba_audit#documentation') // "All changes to UBA..." ( documentation for uba_audit entity )

   *
   * @param {String} localeString
   * @param {...*} formatArgs Format args
   * @returns {*}
   */
  i18n: i18n.i18n.bind(i18n),
  /**
   * Merge localizationObject to UB.i18n. Usually called form `modelFolder/locale/lang-*.js` scripts
   * @param {Object} localizationObject
   */
  i18nExtend: function (localizationObject) {
    return i18n.i18nExtend(localizationObject)
  },
  /**
   * Allows to define a tokenized string and pass an arbitrary number of arguments to replace the tokens.  Each
   * token must be unique, and must increment in the format {0}, {1}, etc.  Example usage:
   *
   *     var s = UB.format('{1}/ext-lang-{0}.js', 'en', 'locale');
   *     // s now contains the string: ''locale/ext-lang-en.js''
   *
   * @param {String} stringToFormat The string to be formatted.
   * @param {...*} values The values to replace tokens `{0}`, `{1}`, etc in order.
   * @return {String} The formatted string.
   */
  format: function (stringToFormat, ...values) { return utils.format(stringToFormat, ...values) },
  /**
   * Locale based Date and Number formatters, See details in `@unitybase/cs-shared/formatByPattern`
   * @example
 const d = new Date(2020, 04, 23, 13, 14)
 UB.formatter.formatDate(d, 'date') // without 3rd lang parameter - will be formatted for user default lang (for uk - 23.05.2020)
 UB.formatter.formatDate('2020-05-23', 'date', 'uk') // 23.05.2020
 UB.formatter.formatDate(d, 'date', 'en') // 05/23/2020
 UB.formatter.formatDate(d, 'dateTime', 'uk') // 23.05.2020 13:14
 UB.formatter.formatDate(d, 'date', 'en') // 05/23/2020, 1:14 PM
 const n = 2305.1
 UB.formatter.formatNumber(n, 'sum', 'en') // 2,305.10
 UB.formatter.formatNumber('2305.1', 'sum', 'en') // 2,305.10
 UB.formatter.formatNumber(n, 'sum') // without 3rd lang parameter - will be formatted for user default lang (for uk "2 305,10")
   * @type {module:formatByPattern}
   */
  formatter: formatByPattern,
  /**
   * Copies all the properties of one or several objectsFrom to the specified objectTo.
   * Non-simple type copied by reference!
   * @param {Object} objectTo The receiver of the properties
   * @param {...Object} objectsFrom The source(s) of the properties
   * @return {Object} returns objectTo
   */
  apply: function (objectTo, ...objectsFrom) { return utils.apply(objectTo, ...objectsFrom) },
  /**
   * Creates namespaces to be used for scoping variables and classes so that they are not global.
   * @example

UB.ns('DOC.Report')
DOC.Report.myReport = function() { ... }

   * @method
   * @deprecated Try to avoid namespaces - instead create a module and use require()
   * @param {String} namespacePath
   * @return {Object} The namespace object.
   */
  ns: function (namespacePath) { return utils.ns(namespacePath) },
  /**
   * Convert UnityBase server Boolean response (0 or 1) to JS Boolean (false or true)
   * @param v Value to convert
   * @returns {Boolean|null}
   */
  booleanParse: function (v) { return utils.booleanParse(v) },
  /**
   * Convert UnityBase server dateTime response (ISO8601 string) to Date object
   * @param value String representation of Date in ISO8601 format
   * @returns {Date}
   */
  iso8601Parse: function (value) { return utils.iso8601Parse(value) },
  /**
   * Convert UnityBase server date response to Date object.
   * `date response` is a day with 00 time (2015-07-17T00:00Z), to get a real date we must add current timezone shift
   * @param value
   * @returns {Date}
   */
  iso8601ParseAsDate: iso8601ParseAsDate,
  /**
   * Convert a local DateTime to Date with zero time in UTC0 timezone as expected by UB server for Date attributes
   * @param {Date} v
   * @returns {Date}
   */
  truncTimeToUtcNull: truncTimeToUtcNull,
  /**
   * Fast async transformation of data to base64 string
   * @param {File|ArrayBuffer|String|Blob|Array} data
   * @returns {Promise<string>} resolved to data converted to base64 string
   */
  base64FromAny: function (data) { return utils.base64FromAny(data) },
  /**
   * Fast async transformation of file to Uint8Array
   * @example

   let f = document.getElementById('inputOfTypeFile').files[0]
   ui8Arr = await UB.file2Uint8Array(f)

   * @param {File} file
   * @returns {Promise<Uint8Array>} resolved to file content as Uint8Array
   */
  file2Uint8Array: function (file) { return utils.file2Uint8Array(file) },
  /**
   * Convert base64 encoded string to decoded array buffer
   * @param {String} base64
   * @returns {ArrayBuffer}
   */
  base64toArrayBuffer: function (base64) { return utils.base64toArrayBuffer(base64) },
  /**
   * Client-side exception.
   * Such exceptions will not be showed as unknown error in {@link UB#showErrorWindow UB.showErrorWindow}
   * @type {UBError}
   */
  UBError: utils.UBError,
  /**
   * Quiet exception. Global error handler does not show this exception for user. Use it for silently reject promise.
   * @type {UBAbortError}
   */
  UBAbortError: utils.UBAbortError,
  log: utils.log,
  /**
   * Log error message to console (if console available)
   * @method
   * @param {...*} msg
   */
  logError: utils.logError,
  /**
   * Log warning message to console (if console available)
   * @method
   * @param {...*} msg
   */
  logWarn: utils.logWarn,
  logDebug: utils.logDebug,
  /**
   * An asynchronous HTTP request. Returns a Promise, what resolves to the {@link module:transport#XHRResponse XHRResponse} object:
   *
   * @example

//Get some data from server:
const resp = await UB.xhr({url: 'getAppInfo'})
console.log('app info: %o', resp.data)

//The same, but in more short form via `UB.get` shorthand:
const resp = await UB.get('getAppInfo')
console.log('app info: %o', resp.data)

//Run POST method:
UB.post('ubql', [
  {entity: 'uba_user', method: 'select', fieldList: ['*']}
]).then(function(resp) {
  console.log('success!')
}, function(resp) {
  console.log('request failed with status' + resp.status);
})

//retrieve binary data as ArrayBuffer
const resp = await UB.get('downloads/cert/ACSK(old).cer', {responseType: 'arraybuffer'})
console.log('Got ArrayBuffer of %d byte length', resp.data.byteLength);

   * @param {Object} requestConfig Object describing the request to be made and how it should be
   *    processed. The object has following properties:
   * @param {String} requestConfig.url  Absolute or relative URL of the resource that is being requested
   * @param {String} [requestConfig.method] HTTP method (e.g. 'GET', 'POST', etc). Default is GET
   * @param {Object.<string|Object>} [requestConfig.params] Map of strings or objects which will be turned
   *      to `?key1=value1&key2=value2` after the url. If the value is not a string, it will be JSONified.
   *      Keys and values are URL encoded inside a function.
   * @param {String|Object} [requestConfig.data] Data to be sent as the request message data
   * @param {Object} [requestConfig.headers]  Map of strings or functions which return strings representing
   *      HTTP headers to send to the server. If the return value of a function is null, the
   *      header will not be sent. Merged with {@link xhrDefaults UB.xhrDefaults.headers}
   * @param {function(data, function)|Array.<function(data, function)>} [requestConfig.transformRequest]
   *      Transform function or an array of such functions. The transform function takes the http
   *      request body and headers and returns its transformed (typically serialized) version.
   * @param {function(data, function)|Array.<function(data, function)>} [requestConfig.transformResponse]
   *      Transform function or an array of such functions. The transform function takes the http
   *      response body and headers and returns its transformed (typically deserialized) version.
   * @param  {Number|Promise} [requestConfig.timeout] timeout in milliseconds, or {Promise}
   *      that should abort the request when resolved. Default to {UB.xhrDefaults.timeout}
   * @param  {Boolean} [requestConfig.withCredentials] whether to to set the `withCredentials` flag on the
   *      XHR object. See <a href="https://developer.mozilla.org/en/http_access_control#section_5">requests with credentials</a>
   *      for more information.
   * @param  {String} [requestConfig.responseType] see <a href="https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest#responseType">responseType</a>.
   * @param {Function} [requestConfig.onProgress] XHR onProgress callback, see <a href="https://developer.mozilla.org/en-US/docs/Web/API/ProgressEvent">ProgressEvent</a> for details.
   *      To be user instead obsolete Q Promise.progress()
   * @returns {Promise<XHRResponse>}
   */
  xhr: function (requestConfig) { return transport.xhr(requestConfig) },

  /**
   * Shortcut for {@link module:@unitybase/ub-pub#xhr UB.xhr} to perform a `GET` request
   * @example

// GET http://my-api.com?param=val
const resp = await UB.get('http://my-api.com', {params: {param: 'val'}})
console.log(resp.data)

   * @param {string} url Relative or absolute URL specifying the destination of the request
   * @param {Object=} [config] Optional configuration object as in {@link xhr UB.xhr}
   * @returns {Promise<XHRResponse>}
   */
  get: function (url, config) { return transport.get(url, config) },

  /**
   * Shortcut for {@link module:@unitybase/ub-pub#xhr UB.xhr} to perform a `POST` request
   * @example

// POST http://my-api.com?param1=12&param2=someVal with body contains a stringified object
const resp = await UB.post('http://my-api.com', {this: 'is', body: 'of' request}, {params: {param1: 12, param2: 'someVal'}})
console.log(resp.data)

   * @param {string} url Relative or absolute URL specifying the destination of the request
   * @param {*} data Request content
   * @param {Object=} [config] Optional configuration object as in {@link module:@unitybase/ub-pub#xhr UB.xhr}
   * @returns {Promise<XHRResponse>}
   */
  post: function (url, data, config) { return transport.post(url, data, config) },

  /**
   * Class for communicate with native messages plugin `content script`.
   * @type {UBNativeMessage}
   */
  UBNativeMessage: UBNativeMessage,
  UBConnection: conn,
  /**
   * Client side cache
   * @type {UBCache}
   */
  UBCache: UBCache,
  /**
   * Create authorized connection to UnityBase server.
   *
   * For a browser clients in case value of `silenceKerberosLogin` localStorage key is 'true' and 'Negotiate'
   * authorization method is enable for application will try to authenticate user using Kerberos/NTLM method.
   *
   * Preferred locale tip: to define connection preferredLocale parameter call
   * `localStorage.setItem(UB.LDS_KEYS.PREFERRED_LOCALE, 'uk')`
   * **before** call to UBConnection.connect
   * @example

const UB = require('@unitybase/ub-pub')
let conn = UB.connect({
  host: window.location.origin,
  path: window.location.pathname,
  onCredentialRequired: function(conn, isRepeat){
      if (isRepeat){
          throw new UB.UBAbortError('invalid credential')
      } else {
          return Promise.resolve({authSchema: 'UB', login: 'admin', password: 'admin'})
      }
  },
  onAuthorizationFail:  function(reason){
      alert(reason)
  }
})
conn.then(function(conn){
  conn.get('stat').then(function(statResp){
    document.getElementById('ubstat').innerText = JSON.stringify(statResp.data, null, '\t')
  })

  conn.Repository('ubm_navshortcut').attrs(['ID', 'code', 'caption']).selectAsArray().then(function(data){
    let tmpl = _.template(document.getElementById('repo-template').innerHTML);
    let result = tmpl(data.resultData);
    // document.getElementById('ubnav').innerText = JSON.stringify(data.resultData);
    document.getElementById('ubnav').innerHTML = result;
  })
})

   * @param cfg
   * @param {string} cfg.host Server host
   * @param {string} [cfg.path] API path - the same as in Server config `httpServer.path`
   * @param cfg.onCredentialRequired Callback for requesting a user credentials. See {@link UBConnection} constructor `requestAuthParams` parameter description
   * @param {boolean} [cfg.allowSessionPersistent=false] For a non-SPA browser client allow to persist a Session in the local storage between reloading of pages.
   *  In case user logged out by server side this type persistent not work and UBConnection will call onCredentialRequired handler,
   *  so user will be prompted for credentials
   * @param [cfg.onAuthorizationFail] Callback for authorization failure. See {@link event:authorizationFail} event. Should handle all errors inside!
   * @param [cfg.onAuthorized] Callback for authorization success. See {@link event:authorized} event.
   * @param [cfg.onNeedChangePassword] Callback for a password expiration. See {@link event:passwordExpired} event
   * @param [cfg.onGotApplicationConfig] Called just after application configuration retrieved from server.
   *  Accept one parameter - connection: UBConnection
   *  Usually on this stage application inject some scripts required for authentication (locales, cryptography etc).
   *  Should return a promise then done
   * @param [cfg.onGotApplicationDomain]
   * @return {Promise<UBConnection>}
   */
  connect: function (cfg) {
    return conn.connect(cfg, this).then((conn) => {
      if (_globalVueInstance && _globalVueInstance.$i18n) {
        _globalVueInstance.$i18n.locale = conn.userLang()
      }
      this.Repository = function (entityCodeOrUBQL) {
        if (typeof entityCodeOrUBQL === 'string') {
          return new ClientRepository(conn, entityCodeOrUBQL)
        } else {
          return new ClientRepository(conn, '').fromUbql(entityCodeOrUBQL)
        }
      }
      return conn
    })
  },
  /**
   * After call to UB.connect this property will point to the active connection
   * @type {UBConnection}
   */
  connection: null,
  /**
   * @type {ClientRepository}
   */
  ClientRepository: ClientRepository,
  /**
   * Create a new instance of repository for a current connection.
   * To be used after connection is created.
   *
   * @param {String|Object} entityCodeOrUBQL The name of the Entity for which the Repository is being created or UBQL
   * @returns {ClientRepository}
   */
  Repository: function (entityCodeOrUBQL) {
    throw new Error('function defined only after connect()')
  },
  /**
   * Create a new instance of a repository based on a local data
   * @example

   const UB = require('@unitybase/ub-pub')
   const localData = {data: [[1, 'Jon'], [2, 'Bob']], fields: ['ID', 'name'], rowCount: 2}
   await UB.LocalRepository(localData, 'uba_user').attrs('name').where('ID', '=', 2).selectScalar() // "Bob"

   * @param {TubCachedData} localData
   * @param {string} entityName
   * @return {LocalRepository}
   */
  LocalRepository: function (localData, entityName) {
    return new LocalRepository(localData, entityName)
  },
  /**
   * Set a error reported callback for unhandled errors (including unhandled promise rejections).
   * Callback signature `function({errMsg, errCode, entityCode, detail})`
   *  - `errMsg` is already translated using UB.i18n
   *
   * This callback also called inside `UBPub.showErrorWindow`
   *
   * @param {function} errorReportedFunction
   */
  setErrorReporter: function (errorReportedFunction) {
    _errorReporter = errorReportedFunction
  },
  /**
   * Default error reported handler. Will translate error message using {@link UB#i18n i18n}.
   *
   * For a UI other then adminUI developer can call `UB.setErrorReporter` to set his own error reporter
   * @example

  const UB = require('@unitybase/ub-pub')
  const vm = new Vue({
    ...
    methods: {
      showError: function(errMsg, errCode, entityCode, detail) {
        this.$message({
          showClose: true,
          message: errMsg,
          type: 'error'
        })
      }
      ...
  })
  UB.setErrorReporter(vm.showError.bind(vm))

   * @param {String|Object|Error|UBError} errMsg  message to show
   * @param {String} [errCode] error code
   * @param {String} [entityCode] entity code
   * @param {String} [detail] details
   */
  showErrorWindow: function (errMsg, errCode, entityCode, detail) {
    let parsed
    try {
      parsed = utils.parseUBError(errMsg, errCode, entityCode, detail)
      if (_errorReporter) {
        _errorReporter(parsed)
      } else if (this.userAgent && typeof window !== 'undefined') {
        window.alert(parsed.errMsg)
      } else if (typeof console !== 'undefined') {
        console.error(parsed.errMsg, parsed.detail)
      }
    } catch (e) {
      console.error(e)
    }
  },
  /**
   * @deprecated Use connection.appConfig instead
   */
  appConfig: null,
  /**
   * Helper class for manipulation with data, stored locally in ({@link TubCachedData} format)
   * @type {module:LocalDataStore}
   */
  LocalDataStore: LocalDataStore,

  userAgent: utils.userAgent,
  isChrome: utils.isChrome,
  isWebKit: utils.isWebKit,
  isGecko: utils.isGecko,
  isOpera: utils.isOpera,
  isMac: utils.isMac,
  isSecureBrowser: utils.isSecureBrowser,
  isReactNative: utils.isReactNative,
  /**
   * Inject external script or css to DOM and return a promise to be resolved when script is loaded.
   *
   * if script successfully loaded using inject it will not be loaded anymore with repeatable calls to UB.inject.
   *
   * @example
//Load script.js:
UB.inject('jslibs/script.js')

//Load several script at once and error handling:
Promise.all([UB.inject('jslibs/script.js'), UB.inject('script2.js')])
.catch(function(err){
 console.log('Oh! error occurred: ' + err)
})

//Load one script and then load other
UB.inject('jslibs/js_beautify.js').then(function(){
 console.log('first script loaded. Continue to load second')
 return UB.inject('jslibs/js_beautify1.js')
})

//Load couple of resources:
Promise.all([UB.inject('css/first.css'), UB.inject('css/second.css')])

   * @param {String} url either *js* or *css* resource to load
   * @param {String} [charset]
   * @return {Promise}
   */
  inject: function (url, charset) { return injection.inject(url, charset) },
  addResourceVersion: injection.addResourceVersion,
  /**
   * CryptoJS instance (included modules are enc-base64, sha256, md5)
   */
  CryptoJS: CryptoJS,
  /**
   * Calculate SHA256 checksum
   */
  SHA256: SHA256,
  /**
   * Calculate MD5 checksum
   */
  MD5: MD5,
  /**
   * localDataStorage keys used by @unitybase-ub-pub (in case of browser environment)
   * @readonly
   * @enum
   */
  LDS_KEYS: utils.LDS_KEYS,
  /**
   * Legacy for old adminUI
   * @private
   */
  ux: {},
  /**
   * Legacy for old adminUI
   * @private
   */
  view: {},
  /**
   * Legacy for old adminUI
   * @private
   */
  core: {},
  /**
   * Legacy for old adminUI. UBUtil.js will define this property
   * @private
   */
  Utils: {},

  LIMITS: {
    /**
     * lookups are limited to this value using limit(lookupMaxRows). If result contains a lookupMaxRows rows - error outputted into console.error
     */
    lookupMaxRows: 10000,
    /**
     * If lookup contains more when lookupWarningRows - outputted console.warn
     */
    lookupWarningRows: 2500
  }
}

/**
 * Allow Request reiteration, for example in case of request are repeated after re-auth
 * @method
 */
UB.xhr.allowRequestReiteration = transport.xhr.allowRequestReiteration
/**
 * Direct access to the default HTTP parameters for {xhr}. Can be used, for example, to change http request timeout globally:
 * @example

 const UB = require('@unitybase/ub-pub')
 UB.xhr.defaults.timeout = 300000 // set all ajax requests timeout to 5 minutes

 */
UB.xhr.defaults = transport.xhrDefaults
/**
 * Vue JS integration
 *  - inject UB localization {@link UB.i18n UB.i18n} to global Vue instance as $ut:
 *  - inject `@unitybase/ub-pub` to global Vue instance as $UB
 *
 * @example

 const Vue = require('vue')
 const UB = require('@unitybase/ub-pub')
 Vue.use(UB)

 // localization of vue template
 <button >{{ $ut('Enter') }}</button>
 // in case translation result is HTML + use formatting
 <p v-html="$ut('UBAuthHeader', appName)"></p>
 // inside binding
 <el-tooltip :content="$ut('UBAuthTip')" placement="bottom" effect="light">
 // inside vue methods
 this.$ut('UBAuthTip')

 // using UB inside vue methods
 methods: {
     hasNegotiate: function () {
       return this.$UB.connection.authMethods.indexOf('Negotiate') !== -1
     }
  }

 * @param {Vue} Vue
 */
UB.install = function (Vue) {
  _globalVueInstance = Vue
  // install method is moved out of module.exports to allow WebStorm code insight inside vue work `this.$UB.?`
  Vue.prototype.$UB = UB
  /** @inheritDoc */
  Vue.prototype.$ut = UB.i18n
  Vue.filter('i18n', UB.i18n)
}

let __alreadyAdded = false
let originalOnError = null
/**
 * Intercept all unhandled errors including Promise unhandled rejections.
 * Errors will be parsed and passed to UB.showErrorWindow {@see setErrorReporter setErrorReporter}
 */
function addBrowserUnhandledRejectionHandler (UBPub) {
  if (typeof window === 'undefined' || UBPub.isReactNative || __alreadyAdded) return // non browser environment
  if (__alreadyAdded) console.error('module @unitybase/ub-pub imported several times. This is wrong situation and should be fixed by app developer. Try `npm ddp`')
  __alreadyAdded = true
  if (window.onerror) {
    originalOnError = window.onerror
  }
  // for a unhandled rejection in bluebird-q
  if (window.Q && window.Q.getBluebirdPromise) {
    window.Q.onerror = function (error) {
      window.onerror.apply(UBPub, ['', '', '', '', error])
    }
  }

  // for unhandled rejection in bluebird/native promises (IE 10+)
  window.addEventListener('unhandledrejection', function (e) {
    // NOTE: e.preventDefault() must be manually called to prevent the default
    // action which is currently to log the stack trace to console.warn
    e.preventDefault()
    // NOTE: parameters are properties of the event detail property
    const reason = e.detail ? e.detail.reason : e.reason
    const promise = e.detail ? e.detail.promise : e.promise
    // See Promise.onPossiblyUnhandledRejection for parameter documentation
    if (window.onerror) window.onerror.apply(UBPub, ['', '', '', '', reason])
    console.error('UNHANDLED', reason, promise)
  })

  window.onerror = ubGlobalErrorHandler
}
addBrowserUnhandledRejectionHandler(module.exports)

function ubGlobalErrorHandler (msg, file, line, column, errorObj) {
  let message
  let detail = ''

  if (errorObj && utils.UBAbortError && errorObj instanceof utils.UBAbortError) {
    console.log(errorObj)
    return
  }
  let isHandled = errorObj && utils.UBError && errorObj instanceof utils.UBError

  if (errorObj && Error && errorObj instanceof Error) {
    message = errorObj.message
    detail = ''
    if (file && (/q\.js/.test(file) === false)) {
      detail += 'file: "' + file + '" line: ' + line
    }
    const strace = errorObj.stack || ''
    detail += strace
      .replace(/\?ubver=\w*/g, '').replace(/\?ver=\w*/g, '') // remove any versions
      .replace(/\\n(?!\d)/g, '\n\t') // beatify stack trace
    detail = detail.replace(new RegExp(window.location.origin.replace(/:/g, '\\$&'), 'g'), '') // remove address if same as origin
    detail = detail.replace(/\/[\w-]+(\.js)?:/g, '<b>$&</b>&nbsp;line ') // file name is BOLD
    detail = detail.replace(/\n/g, '<br>&nbsp;&nbsp;')
  } else if (errorObj && errorObj.data && errorObj.data.errMsg) {
    message = errorObj.data.errMsg
  } else if (errorObj && errorObj.status === 0) { // long network request
    message = 'serverIsBusy'
    isHandled = true
  } else if (errorObj && errorObj.errMsg) {
    message = errorObj.errMsg
    detail = errorObj.detail ? errorObj.detail : message
  } else {
    message = errorObj && (typeof errorObj === 'string') ? errorObj : msg
  }
  if (errorObj && errorObj.detail) {
    detail = errorObj.detail.replace(/\\n(?!\d)/g, '\n\t\t') + // beatify stack trace
      (detail ? '<br/>' + detail : '')
    // 405 Method Not Allowed
    if (errorObj.detail === 'Method Not Allowed') {
      message = 'recordNotExistsOrDontHaveRights'
    }
  }
  if (!message) {
    message = 'internalServerError'
  }

  if (!isHandled) {
    // see https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
    // ResizeObserver loop completed with undelivered notifications
    // ResizeObserver loop limit exceeded
    if (typeof message === 'string' && message.startsWith('ResizeObserver')) {
      console.warn(message)
      return
    }
    if (!detail) {
      detail = message
    } else {
      detail = `<h4>${message}</h4>${detail}`
    }
    message = 'unknownError'
  }
  try {
    module.exports.showErrorWindow(message, '', '', detail)
  } catch (err) {
    window.alert(message)
  }
  if (originalOnError) originalOnError.apply(this, arguments)
}

if (typeof SystemJS !== 'undefined') { // browser
  if (!SystemJS.has('@unitybase/cryptojs')) SystemJS.set('@unitybase/cryptojs', SystemJS.newModule(CryptoJS))
  if (!SystemJS.has('@unitybase/ub-pub')) SystemJS.set('@unitybase/ub-pub', SystemJS.newModule(module.exports))
}
