/* eslint-disable prefer-promise-reject-errors */
/* global Promise, btoa */
/**
 * Connection to UnityBase server for asynchronous clients (NodeJS, Browser)
 *
 * @module AsyncConnection
 * @memberOf module:@unitybase/ub-pub
 */
const EventEmitter = require('./events')
const ubUtils = require('./utils')
const i18n = require('./i18n').i18n
const transport = require('./transport')

const csShared = require('@unitybase/cs-shared')
const LocalDataStore = csShared.LocalDataStore
const UBSession = csShared.UBSession
const UBDomain = csShared.UBDomain
const UBCache = require('./UBCache')
const CryptoJSCore = require('@unitybase/cryptojs/core')
const SHA256 = require('@unitybase/cryptojs/sha256')
const HMAC_SHA256 = require('@unitybase/cryptojs/hmac-sha256')
const MD5 = require('@unitybase/cryptojs/md5')
const UBNotifierWSProtocol = require('./UBNotifierWSProtocol')
const ClientRepository = require('./ClientRepository')
// regular expression for URLs server not require authorization.
const NON_AUTH_URLS_RE = /(\/|^)(auth|getAppInfo)(\/|\?|$)/
// all request passed in this timeout to run will be send into one runList server method execution
const BUFFERED_DELAY = 20

const AUTH_METHOD_URL = 'auth'

const ANONYMOUS_USER = 'anonymous'
const AUTH_SCHEMA_FOR_ANONYMOUS = 'None'

const TEST_ERROR_MESSAGE_RE = /<<<.*?>>>/
const PARSE_ERROR_MESSAGE_RE = /(?:^|")<<<(.*?)>>>(?:\|(\[[^\]]*]))?(?:$|")/
const SIMPLE_PARSE_ERROR_MESSAGE_RE = /<<<(.*)>>>/

function parseUBErrorMessage (errMsg) {
  return JSON.parse('"' + errMsg.match(SIMPLE_PARSE_ERROR_MESSAGE_RE)[1] + '"')
}

function parseAndTranslateUBErrorMessage (errMsg) {
  // RegExp for fast detection of error message
  if (!TEST_ERROR_MESSAGE_RE.test(errMsg)) {
    return i18n(errMsg)
  }

  // RegExp for full detection of error message by patterns, using parts
  const match = errMsg.match(PARSE_ERROR_MESSAGE_RE)
  if (!match) {
    // Shall never happen
    return i18n(errMsg)
  }

  // Problem is that errMsg is JSON-encoded object, and we are looking for a string inside it.
  const [msgUnparsed, msgPart, argsPart] = match
  if (!argsPart) {
    // No parameters passed, just JSON.parse content inside <<<>>>
    return i18n(JSON.parse('"' + msgPart + '"'))
  }

  // JSON.parse the whole part in quotes, to decode JSON as a string
  const msgStr = JSON.parse(msgUnparsed[0] === '"' ? msgUnparsed : '"' + msgUnparsed + '"')

  const index = msgStr.indexOf('|')
  if (index === -1) {
    // Shall never happen
    return i18n(msgStr)
  }

  const msg = msgStr.substring(3, index - 3) // Use "substring" to get part inside <<<>>>, knowing index of |
  const argsStr = msgStr.substr(index + 1) // Get all the part after |
  const args = JSON.parse(argsStr) // Parse it.  If it fails - it fails, we expect server to return correct JSON
  if (Array.isArray(args)) {
    args.unshift(msg)
    return i18n.apply(null, args)
  } else {
    // Object or a single value
    return i18n(msg, args)
  }
}

const LDS = ((typeof window !== 'undefined') && window.localStorage) ? window.localStorage : false

/**
 * @classdesc
 *
 * Connection to the UnityBase server (for asynchronous client like NodeJS or Browser)
 *
 * In case host set to value other then `location.host` server must be configured to accept
 * <a href="https://developer.mozilla.org/en-US/docs/HTTP/Access_control_CORS">CORS</a> requests.
 * This is usually done by setting "HTTPAllowOrigin" server configuration option.
 *
 * > Recommended way to create a UBConnection is {@link module:@unitybase/ub-pub#connect UB.connect} method
 *
 * @example
 // !! In most case UB.connect should be used to create a connection !!
 // But can be created directly, for example in case of multiple connection from one page
 const UB = require('@ubitybase/ub-pub')
 const UBConnection = UB.UBConnection
 // connect using UBIP schema
 let conn = new UBConnection({
   host: 'http://127.0.0.1:888',
   requestAuthParams: function(conn, isRepeat){
     if (isRepeat){
       throw new UB.UBAbortError('invalid credential')
     } else {
       return Promise.resolve({authSchema: 'UBIP', login: 'admin'})
     }
   }
 })
 conn.query({entity: 'uba_user', method: 'select', fieldList: ['ID', 'name']}).then(UB.logDebug)

 // Anonymous connect. Allow access to entity methods, granted by ELS rules to `Anonymous` role
 // Request below will be success if we grant a `ubm_navshortcut.select` to `Anonymous` on the server side
 let conn = new UBConnection({
   host: 'http://127.0.0.1:888'
 })
 conn.query({entity: 'ubm_navshortcut', method: 'select', fieldList: ['ID', 'name']}).then(UB.logDebug)

 //subscribe to events
 conn.on('authorizationFail', function(reason){
   // indicate user credential is wrong
 })
 conn.on('authorized', function(ubConnection, session, authParams){console.debug(arguments)} )

 * UBConnection mixes an EventEmitter, so you can subscribe for {@link event:authorized authorized}
 * and {@link event:authorizationFail authorizationFail} events.
 *
 * @class UBConnection
 * @mixes EventEmitter
 * @param {Object} connectionParams connection parameters
 * @param {String} connectionParams.host UnityBase server host
 * @param {String} [connectionParams.appName='/'] UnityBase application to connect to
 * @param {Function} [connectionParams.requestAuthParams] Handler to log in.
 *      Must return promise & fulfill it by authorization parameters: {authSchema: authType, login: login, password: password }
 *          for openIDConnect must be fulfilled with  {data: uData, secretWord: ???}
 *      Called with arguments: {UBConnection} conn, {Boolean} isRepeat;
 *      isRepeat === true in case first auth request is invalid.
 *
 *      For Anonymous requests can be either omitted, or return promise, resolved to  `{authSchema: 'None'}`
 * @param {String} [connectionParams.protocol] either 'https' or 'http' (default)
 * @param {boolean} [connectionParams.allowSessionPersistent=false] See {@link connect} for details
 */
function UBConnection (connectionParams) {
  const host = connectionParams.host || 'http://localhost:8881'
  let appName = connectionParams.appName || '/'
  let requestAuthParams = connectionParams.requestAuthParams
  let baseURL
  /*
   * Current session (Promise). Result of {@link UBConnection#auth auth} method
   * {@link UBConnection#xhr} use this promise as a first `then` in call chain. In case of 401 response
   * authPromise recreated.
   */
  let currentSession

  EventEmitter.call(this)
  Object.assign(this, EventEmitter.prototype)

  /**
   * Fired for {@link UBConnection} instance in case authentication type CERT and simpleCertAuth is true
   * just after private key is loaded and certificate is parsed but before auth handshake starts.
   *
   * Here you can extract user name from certificate. By default it is EDPOU or DRFO or email.
   *
   * @event defineLoginName
   * @memberOf module:@unitybase/ub-pub.module:AsyncConnection~UBConnection
   * @param {UBConnection} conn
   * @param {object} urlParams
   * @param {object} certInfo
   */

  /**
   * WebSocket `ubNotifier` protocol instance
   * @type {UBNotifierWSProtocol}
   */
  this.ubNotifier = null

  /**
   * Application settings transferred form a server
   * @type {{}}
   */
  this.appConfig = {}

  /**
   * The preferred (used in previous user session if any or a default for application) locale
   * @type {string}
   */
  this.preferredLocale = 'en'

  /**
   * Domain information. Initialized after promise, returned by by function {@link UBConnection#getDomainInfo getDomainInfo} is resolved
   * @type {UBDomain}
   */
  this.domain = null
  /**
   * Allow to override a connection requestAuthParams function passed as config to UBConnection instance
   * @param {function} authParamsFunc Function with the same signature as requestAuthParams parameter in UBConnection constructor
   */
  this.setRequestAuthParamsFunction = function (authParamsFunc) {
    requestAuthParams = authParamsFunc
  }

  if (appName.charAt(0) !== '/') {
    appName = '/' + appName
  }
  /**
   * For a browser env. check silence kerberos login {@see UB.connect UB.connect} for details
   * @param {UBConnection} conn
   * @param {Boolean} isRepeat
   * @returns {*}
   * @private
   */
  function doOnCredentialsRequired (conn, isRepeat) {
    // only anonymous authentication or requestAuthParams not passe in config
    if (!conn.authMethods.length || !requestAuthParams) {
      if (isRepeat) {
        throw new ubUtils.UBError('Access deny')
      } else {
        return Promise.resolve({ authSchema: AUTH_SCHEMA_FOR_ANONYMOUS, login: ANONYMOUS_USER })
      }
    }
    return requestAuthParams(conn, isRepeat)
  }

  const serverURL = host + appName
  /** UB Server URL with protocol and host.
   * @type {string}
   * @readonly
   */
  this.serverUrl = serverURL
  // for react native window exists but window.location - not
  baseURL = ((typeof window !== 'undefined') && window.location && (window.location.origin === host)) ? appName : serverURL
  if (baseURL.charAt(baseURL.length - 1) !== '/') baseURL = baseURL + '/'
  /**
   * The base of all urls of your requests. Will be prepend to all urls while call UB.xhr
   * @type {String}
   * @readonly
   */
  this.baseURL = baseURL
  /** UB application name
   * @type {String}
   * @readonly
   */
  this.appName = appName

  this.allowSessionPersistent = connectionParams.allowSessionPersistent && (LDS !== false)
  if (this.allowSessionPersistent) this.__sessionPersistKey = this.serverUrl + ':storedSession'

  this.cache = null

  /**
   * Store a cached entities request.
   *  - keys is calculated from attributes using this.cacheKeyCalculate
   *  - values is a xhr promise
   *  UBConnection use this map internally to prevent duplicate requests to server for cached entities data,
   *  for example in case we put several combobox on form with the same cached entity
   * TODO - rewrite to WeekMap when IE 11 become popular
   * @private
   * @type {Object<string, Promise>}
   */
  this._pendingCachedEntityRequests = {}

  /**
   * Last successful login name. Filled AFTER first 401 response
   * @type {String}
   */
  this.lastLoginName = ''

  this._bufferedRequests = []
  this._bufferTimeoutID = 0
  this.uiTag = ''

  /**
   * Is user currently logged in. There is no guaranty what session actually exist in server.
   * @returns {boolean}
   */
  this.isAuthorized = function () {
    return (currentSession !== undefined)
  }
  /**
   * Return current user logon name or 'anonymous' in case not logged in
   * @returns {String}
   */
  this.userLogin = function () {
    return this.userData('login')
  }

  /**
   * Return current user language or 'en' in case not logged in
   * @returns {String}
   */
  this.userLang = function () {
    return this.userData('lang')
  }

  /**
   * Return custom data for logged in user, or {lang: 'en', login: 'anonymous'} in case not logged in
   *
   * If key is provided - return only key part of user data. For a list of possible keys see
   * <a href="../server-v5/namespace-Session.html#uData">Session.uData</a> in server side documentation.
   * @example

$App.connection.userData('lang');
// or the same but dedicated alias
$App.connection.userLang()

   * @param {String} [key] Optional key
   * @returns {*}
   */
  this.userData = function (key) {
    const uData = this.isAuthorized()
      ? currentSession.userData
      : { lang: this.appConfig.defaultLang || 'en', login: ANONYMOUS_USER }

    return key ? uData[key] : uData
  }

  function udot (conn, lg) {
    if ((typeof document === 'undefined') || (typeof window === 'undefined') || typeof btoa !== 'function') return
    if (!document.body || !window.location || !window.encodeURIComponent) return
    const h = window.location.hostname
    const appV = conn.appConfig.appVersion
    if (/(localhost|0.0.1)/.test(h)) return
    if (/-dev$/.test(window.location.pathname)) return
    const aui = conn.appConfig.uiSettings.adminUI
    let apn = aui && aui.applicationName
    if (apn && typeof apn === 'object') {
      const k = Object.keys(apn)[0]
      apn = apn[k]
    } else if (typeof apn !== 'string') {
      apn = '-'
    }
    apn = apn.replace(/<\/?[^>]+(>|$)/g, '').slice(0, 50).replace(/[:", ]/g, '.')
    const ut = btoa(window.encodeURIComponent(`${conn.serverVersion}:${MD5(lg)}:${apn}:${h}:${appV}`))
    const t = document.createElement('img')
    t.style.position = 'absolute'
    t.style.display = 'none'
    t.style.width = t.style.height = '0px'
    t.style.display = 'none'
    t.src = `https://unitybase.info/udot.gif?ut=${ut}&rn=${Math.trunc(1e6 * Math.random())}`
    document.body.appendChild(t)
  }
  /**
   * @private
   * @param data
   * @param secretWord
   * @param authSchema
   * @param {Boolean} [restored=false] true in case session is restored from persistent storage
   * @return {UBSession}
   */
  function doCreateNewSession (data, secretWord, authSchema, restored = false) {
    const ubSession = new UBSession(data, secretWord, authSchema)
    // noinspection JSAccessibilityCheck
    const userData = ubSession.userData
    // noinspection JSPotentiallyInvalidUsageOfThis
    if (!userData.lang || this.appConfig.supportedLanguages.indexOf(userData.lang) === -1) {
      // noinspection JSPotentiallyInvalidUsageOfThis
      userData.lang = this.appConfig.defaultLang
    }
    csShared.formatByPattern.setDefaultLang(userData.lang)
    if (!restored) udot(this, userData.login)
    return ubSession
  }
  /**
   * The starter method for all authorized requests to UB server. Return authorization promise resolved to {@link UBSession}.
   * In case unauthorized:
   *
   *  - call requestAuthParams method passed to UBConnection constructor to retrieve user credentials
   *  - call {@link UBConnection#doAuth} method
   *
   * Used inside {@link UBConnection#xhr}, therefore developer rarely call it directly.
   * @method
   * @param {boolean} [isRepeat] in case user provide wrong credential - we must show logon window
   * @fires authorized
   * @fires authorizationFail
   * @returns {Promise<UBSession>} Resolved to {UBSession} if auth success or rejected to `{errMsg: string, errCode: number, errDetails: string}` if fail
   */
  this.authorize = function (isRepeat) {
    const me = this
    if (currentSession) return Promise.resolve(currentSession)

    if (this.allowSessionPersistent && !isRepeat) {
      const storedSession = LDS.getItem(this.__sessionPersistKey)
      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession)
          currentSession = doCreateNewSession.call(this, parsed.data, parsed.secretWord, parsed.authSchema, true)
          me.emit('authorized', me, currentSession)
          return Promise.resolve(currentSession)
        } catch (e) {
          LDS.removeItem(this.__sessionPersistKey) // wrong session persistent data
        }
      }
    }

    if (this._pendingAuthPromise) return this._pendingAuthPromise

    this.exchangeKeysPromise = null
    this._pendingAuthPromise = doOnCredentialsRequired(this, isRepeat)
      .then(function (authParams) {
        const lastAuthType = authParams.authSchema
        return me.doAuth(authParams).then(function (session) {
          me._pendingAuthPromise = null // must be before event emit to clear pending even in case of error in event handler
          currentSession = session
          if (LDS) {
            LDS.setItem(ubUtils.LDS_KEYS.LAST_LOGIN, session.logonname)
            LDS.setItem(ubUtils.LDS_KEYS.LAST_AUTH_SCHEMA, lastAuthType) // session.authSchema
          }

          /**
           * Fired for {@link UBConnection} instance after success authorization.
           * @event authorized
           * @memberOf module:@unitybase/ub-pub.module:AsyncConnection~UBConnection
           * @param {UBConnection} conn
           * @param {UBSession} session
           * @param {object} [authParams]
           */
          me.emit('authorized', me, session, authParams)

          return session
        }).catch(function (reason) {
          me._pendingAuthPromise = null // must be before event emit to clear pending even in case of error in event handler
          if (LDS) {
            LDS.removeItem(ubUtils.LDS_KEYS.SILENCE_KERBEROS_LOGIN)
          }
          if (!reason || !(reason instanceof ubUtils.UBAbortError)) {
            /**
             * Fired for {@link UBConnection} instance in case of bad authorization.
             * @event authorizationFail
             * @memberOf module:@unitybase/ub-pub.module:AsyncConnection~UBConnection
             * @param {*} reason
             * @param {UBConnection} conn
             */
            me.emit('authorizationFail', reason, me)
          }
        }).then(function () {
          return me.authorize(true)
        })
      })
    return this._pendingAuthPromise
  }

  /**
   * Clear current user authorization promise. Next request repeat authorization
   * @private
   */
  this.authorizationClear = function () {
    this.lastLoginName = this.userLogin()
    currentSession = undefined
  }

  /**
   * Switch current session. Use only on server side
   * @param {UBSession} session
   */
  this.switchCurrentSession = function (session) {
    currentSession = session
  }

  /**
   * UBIP Auth schema implementation
   * @param authParams
   * @returns {Promise}
   * @private
   */
  this.authHandshakeUBIP = function (authParams) {
    if (!authParams.login) {
      return Promise.reject({ errMsg: 'invalid user name' })
    }

    return this.post(AUTH_METHOD_URL, '', { headers: { Authorization: authParams.authSchema + ' ' + authParams.login } })
  }

  /**
   * openID Connect auth schema.
   * This function act as a proxy but change authSchema back to 'UB' for authorization token generation
   * @param authParams
   * @return {*}
   * @private
   */
  this.authHandshakeOpenIDConnect = function (authParams) {
    return Promise.resolve(authParams).then(function (authParams) {
      authParams.authSchema = 'UB'
      return authParams
    })
  }

  /**
   * UB Auth schema implementation
   * @param authParams
   * @returns {Promise}
   * @private
   */
  this.authHandshakeUB = function (authParams) {
    const me = this
    let secretWord

    if (!authParams.login || !authParams.password) {
      return Promise.reject({ errMsg: 'invalid user name or password' })
    }

    return this.post(AUTH_METHOD_URL, '', {
      params: {
        AUTHTYPE: authParams.authSchema,
        userName: authParams.login
      }
    }).then(function (resp) {
      let serverNonce, pwdHash, pwdForAuth
      const request = {
        params: {
          AUTHTYPE: authParams.authSchema,
          userName: authParams.login,
          password: ''
        }
      }
      const clientNonce = me.authMock
        ? SHA256('1234567890abcdef').toString()
        : SHA256(new Date().toISOString().substr(0, 16)).toString()
      request.params.clientNonce = clientNonce
      if (resp.data.connectionID) {
        request.params.connectionID = resp.data.connectionID
      }
      // LDAP AUTH?
      const realm = resp.data.realm
      if (realm) {
        serverNonce = resp.data.nonce
        if (!serverNonce) {
          throw new Error('invalid LDAP auth response')
        }
        if (resp.data.useSasl) {
          pwdHash = MD5(authParams.login.split('\\')[1].toUpperCase() + ':' + realm + ':' + authParams.password)
          // we must calculate md5(login + ':' + realm + ':' + password) in binary format
          pwdHash.concat(CryptoJSCore.enc.Utf8.parse(':' + serverNonce + ':' + clientNonce))
          pwdForAuth = MD5(pwdHash).toString()
          secretWord = pwdForAuth // medium unsecured
        } else {
          // window.btoa(authParams.password) fails on non Latin1 chars
          pwdForAuth = CryptoJSCore.enc.Base64.stringify(CryptoJSCore.enc.Utf8.parse(authParams.password))
          secretWord = pwdForAuth // unsecured - to be used only with HTTPS!!
        }
      } else {
        serverNonce = resp.data.result
        if (!serverNonce) {
          throw new Error('invalid auth response')
        }
        pwdHash = SHA256('salt' + authParams.password).toString()
        const appForAuth = appName === '/' ? '/' : appName.replace(/\//g, '')
        pwdForAuth = SHA256(appForAuth.toLowerCase() + serverNonce + clientNonce + authParams.login + pwdHash).toString()
        secretWord = pwdHash
      }
      request.params.password = pwdForAuth
      return me.post(AUTH_METHOD_URL, '', request).then(function (response) {
        response.secretWord = secretWord
        return response
      })
    })
  }

  /**
   * Do authentication in UnityBase server. Usually called from UBConnection #authorize method in case authorization expire or user not authorized.
   * Resolve to {@link UBSession} session object.
   *
   * @private
   * @param {Object} authParams
   * @param {String} [authParams.authSchema] Either 'UB' (default) or 'CERT'. On case of CERT UBDesktop service NPI extension must be installed in browser
   * @param {String} [authParams.login] Optional login
   * @param {String} [authParams.password] Optional password
   * @returns {Promise<UBSession>} Authentication promise. Resolved to {@link UBSession} is auth success or rejected to {errMsg: string, errCode: number, errDetails: string} if fail
   */
  this.doAuth = function (authParams) {
    authParams.authSchema = authParams.authSchema || 'UB'

    if (this.isAuthorized()) {
      return Promise.reject({ errMsg: 'invalid auth call', errDetails: 'contact developers' })
    }

    let promise
    switch (authParams.authSchema) {
      case AUTH_SCHEMA_FOR_ANONYMOUS:
        promise = Promise.resolve({ data: { result: '0+0', uData: JSON.stringify({ login: ANONYMOUS_USER }) }, secretWord: '' })
        break
      case 'UB':
        promise = this.authHandshakeUB(authParams)
        break
      case 'CERT':
        promise = this.pki().then(pkiInterface => pkiInterface.authHandshakeCERT(authParams))
        break
      case 'CERT2':
        promise = this.pki().then(pkiInterface => pkiInterface.authHandshakeCERT2(authParams))
        break
      case 'UBIP':
        promise = this.authHandshakeUBIP(authParams)
        break
      case 'OpenIDConnect':
        promise = this.authHandshakeOpenIDConnect(authParams)
        break
      case 'Negotiate':
        promise = this.post(AUTH_METHOD_URL, '', {
          params: {
            USERNAME: '',
            AUTHTYPE: authParams.authSchema
          }
        }).then(function (resp) {
          resp.secretWord = resp.headers('X-UB-Nonce')
          if (!resp.secretWord) throw new Error('X-UB-Nonce header is required to complete Negotiate authentication. Please, upgrade UB to >= 5.17.9')
          return resp
        })
        break
      default:
        promise = Promise.reject({ errMsg: 'invalid authentication schema ' + authParams.authSchema })
        break
    }
    promise = promise.then(
      (authResponse) => {
        const ubSession = doCreateNewSession.call(this, authResponse.data, authResponse.secretWord, authParams.authSchema)
        if (this.allowSessionPersistent) {
          LDS.setItem(
            this.__sessionPersistKey,
            JSON.stringify({ data: authResponse.data, secretWord: authResponse.secretWord, authSchema: authResponse.authSchema })
          )
        }
        return ubSession
      },

      (rejectReason) => {
        if (!(rejectReason instanceof Error)) {
          const errDescription = rejectReason.data || rejectReason // in case of server-side error we got a {data: {errMsg: ..}..}
          const errInfo = {
            errMsg: errDescription.errMsg,
            errCode: errDescription.errCode,
            errDetails: errDescription.errMsg
          }
          if (rejectReason.status === 403) {
            // in case exception text is wrapped in <<<>>> - use it, else replace to default "access deny"
            // for Access deny error on the auth stage transform it to Invalid user or pwd
            if (!TEST_ERROR_MESSAGE_RE.test(errInfo.errMsg) || (errInfo.errMsg === '<<<Access deny>>>')) {
              errInfo.errMsg = (authParams.authSchema === 'UB') ? 'msgInvalidUBAuth' : 'msgInvalidCertAuth'
            }
          } else if (rejectReason.status === 0) {
            errInfo.errMsg = 'serverIsBusy'
            errInfo.errDetails = 'network error'
          } else {
            if (!errInfo.errMsg) { errInfo.errMsg = 'unknownError' } // internalServerError
          }

          if (TEST_ERROR_MESSAGE_RE.test(errInfo.errMsg)) {
            errInfo.errMsg = parseUBErrorMessage(errInfo.errMsg)
          }

          const codeMsg = this.serverErrorByCode(errInfo.errCode)
          if (codeMsg) {
            errInfo.errDetails = codeMsg + ' ' + errInfo.errDetails
          }
          if (this.allowSessionPersistent) LDS.removeItem(this.__sessionPersistKey)
          throw new ubUtils.UBError(errInfo.errMsg, errInfo.errDetails, errInfo.errCode)
        } else {
          throw rejectReason // rethrow error
        }
      }
    )
    return promise
  }

  this.recordedXHRs = []
  /**
   * Set it to `true` for memorize all requests to recordedXHRs array (for debug only!).
   * @type {Boolean}
   */
  this.recorderEnabled = false
}

/**
 * Initialize client cache. Called from application after obtain userDbVersion
 *
 * - recreate Indexed Db database if version changed
 * - create instance of UBCache (accessible via {@link UBConnection#cache UBConnection.cache} property) and clear UBCache.SESSION store.
 *
 * @param {Number} userDbVersion Indexed DB database version required for current application
 * @returns {Promise}
 * @private
 */
UBConnection.prototype.initCache = function (userDbVersion) {
  const dbName = this.baseURL === '/' ? 'UB' : this.baseURL
  /**
   * @property {UBCache} cache
   * @readonly
   * @type {UBCache}
   */
  this.cache = new UBCache(dbName, userDbVersion)
  /**
   * List of keys, requested in the current user session.
   * Cleared each time login done
   * @property {Object} cachedSessionEntityRequested
   */
  this.cachedSessionEntityRequested = {}
  // clear use session store
  return this.cache.clear(UBCache.SESSION)
}

/**
 * Calculate cache key for request. This key is used to store data inside UBCache
 * @param {String} root This is usually entity name
 * @param {Array<string>} [attributes] if present - add attributes hash. This is usually array of entity attributes we want to put inside cache
 * @returns {String}
 */
UBConnection.prototype.cacheKeyCalculate = function (root, attributes) {
  const keyPart = [this.userLogin().toLowerCase(), this.userLang(), root]
  if (Array.isArray(attributes)) {
    keyPart.push(MD5(JSON.stringify(attributes)).toString())
  }
  return keyPart.join('#').replace(/[\\:.]/g, '#') // replace all :, \ -> #;
}

/**
 * Refresh all cache occurrence for root depending on cacheType:
 *
 * - if `Session` - clear indexedDB for this root.
 * - if `SessionEntity` - remove entry in {@link UBConnection#cachedSessionEntityRequested}
 * - else - do nothing
 * @param {String} root Root part of cache key. The same as in {@link UBConnection#cacheKeyCalculate}
 * @param {UBCache.cacheTypes} cacheType
 * @returns {Promise}
 */
UBConnection.prototype.cacheOccurrenceRefresh = function (root, cacheType) {
  const me = this
  let promise = Promise.resolve(true)

  if (cacheType === UBCache.cacheTypes.Session || cacheType === UBCache.cacheTypes.SessionEntity) {
    const entity = this.domain.get(root)
    if (entity && entity.hasMixin('unity')) {
      const unityMixin = entity.mixin('unity')
      const unityEntity = this.domain.get(unityMixin.entity)
      if (unityEntity && (unityMixin.entity !== root) && (unityEntity.cacheType !== UBCache.cacheTypes.None)) {
        promise = promise.then(
          () => me.cacheOccurrenceRefresh(unityMixin.entity, unityEntity.cacheType)
        )
      }
    }
    const cacheKey = me.cacheKeyCalculate(root)
    const machRe = new RegExp('^' + cacheKey)
    const machKeys = Object.keys(me.cachedSessionEntityRequested).filter(function (item) {
      return machRe.test(item)
    })
    machKeys.forEach(function (key) {
      delete me.cachedSessionEntityRequested[key]
    })
    if (cacheType === UBCache.cacheTypes.Session) {
      promise = promise.then(function () {
        return me.cache.removeIfMach(machRe, UBCache.SESSION)
      })
    }
  }
  return promise
}

/**
 * Remove all cache occurrence for root depending on cacheType:
 *
 * - clear indexedDB for this root.
 * - remove entry in {@link UBConnection#cachedSessionEntityRequested}

 * @param {String} root Root part of cache key. The same as in {@link UBConnection#cacheKeyCalculate}
 * @param {String} cacheType One of {@link UBCache#cacheTypes}
 * @returns {Promise}
 */
UBConnection.prototype.cacheOccurrenceRemove = function (root, cacheType) {
  const me = this

  const cacheKey = me.cacheKeyCalculate(root)
  const machRe = new RegExp('^' + cacheKey)
  const machKeys = Object.keys(me.cachedSessionEntityRequested).filter(function (item) {
    return machRe.test(item)
  })
  machKeys.forEach(function (key) {
    delete me.cachedSessionEntityRequested[key]
  })
  const cacheStore = (cacheType === UBCache.cacheTypes.Session) ? UBCache.SESSION : UBCache.PERMANENT
  return me.cache.removeIfMach(machRe, cacheStore)
}

/**
 * Clear all local cache (indexedDB session & permanent and UBConnection.cachedSessionEntityRequested)
 * @returns {Promise}
 */
UBConnection.prototype.cacheClearAll = function () {
  const me = this
  Object.keys(me.cachedSessionEntityRequested).forEach(function (item) {
    delete me.cachedSessionEntityRequested[item]
  })
  return Promise.all([me.cache.clear(UBCache.SESSION), me.cache.clear(UBCache.PERMANENT)])
}

/**
 * The same as {@link module:@unitybase/ub-pub#get UB.get} but with authorization
 * @example

// call entity method using rest syntax
const certResp = await UB.connection.get('/rest/uba_usercertificate/getCertificate?ID=334607980199937')
const certBin = certResp.data

 * @param {string} url Relative or absolute URL specifying the destination of the request
 * @param {Object} [config] optional configuration object - see {@link module:@unitybase/ub-pub#xhr UB.xhr}
 * @returns {Promise<XHRResponse>} Future object
 */
UBConnection.prototype.get = function (url, config) {
  return this.xhr(Object.assign({}, config, {
    method: 'GET',
    url: url
  }))
}

/**
 * The same as {@link module:@unitybase/ub-pub#post UB.post} but with authorization
 * @param {string} url Relative or absolute URL specifying the destination of the request
 * @param {*} data Request content
 * @param {Object=} [config] optional configuration object - see {@link module:@unitybase/ub-pub#xhr UB.xhr}
 * @returns {Promise<XHRResponse>} Future object
 */
UBConnection.prototype.post = function (url, data, config) {
  return this.xhr(Object.assign({}, config, {
    method: 'POST',
    url: url,
    data: data
  }))
}

// noinspection JSUnusedLocalSymbols
/**
 *
 * @param {UBSession} session
 * @param {Object} cfg
 * @return {boolean}
 */
UBConnection.prototype.checkChannelEncryption = function (session, cfg) {
  return true
}
/**
 * Shortcut method to perform authorized/encrypted request to application we connected.
 * Will:
 *
 *  - add Authorization header for non-anonymous sessions
 *  - add {@link UBConnection#baseURL} to config.url
 *  - call {@link module:@unitybase/ub-pub#xhr UB.xhr}
 *  - in case server return 401 clear current authorization, call {@link UBConnection#authorize} and repeat the request
 *
 * @param config Request configuration as described in {@link module:@unitybase/ub-pub#xhr UB.xhr}
 * @fires passwordExpired
 * @return {Promise<XHRResponse>}
 */
UBConnection.prototype.xhr = function (config) {
  const me = this
  const cfg = Object.assign({ headers: {} }, config)
  const url = cfg.url
  let promise

  if (me.recorderEnabled) {
    me.recordedXHRs.push(config)
  }
  // prepend baseURl only if not already prepended
  if (url.length < me.baseURL.length || url.substring(0, me.baseURL.length) !== me.baseURL) {
    cfg.url = me.baseURL + cfg.url
  }

  if (NON_AUTH_URLS_RE.test(url)) { // request not require authentication - pass is as is
    promise = transport.xhr(cfg)
  } else {
    promise = me.authorize().then((session) => me.checkChannelEncryption(session, cfg))

    promise = promise.then(function () {
      // we must repeat authorize to obtain new session key ( because key exchange may happens before)
      return me.authorize().then(/** @param {UBSession} session */ function (session) {
        const head = session.authHeader(me.authMock)
        if (head) cfg.headers.Authorization = head // do not add header for anonymous session
        return transport.xhr(cfg)
      })
    }).catch(function (reason) { // in case of 401 - do auth and repeat request
      let errMsg = ''
      if (reason.status === 401) {
        if (me.allowSessionPersistent) LDS.removeItem(me.__sessionPersistKey) // addled session persisted data
        ubUtils.logDebug('unauth: %o', reason)
        if (me.isAuthorized()) {
          me.authorizationClear()
        }
        // reason.config.url: "/bla-bla/logout"
        if (reason.config.url && /\/logout/.test(reason.config.url)) {
          me.lastLoginName = ''
        } else {
          transport.xhr.allowRequestReiteration() // prevent a monkeyRequestsDetected error during relogon [UB-1699]
          return me.xhr(config)
        }
      }

      if (reason.status === 413) { // Request Entity Too Large
        throw new ubUtils.UBError('Request Entity Too Large')
      }
      // eslint-disable-next-line no-prototype-builtins
      if (reason.data && reason.data.hasOwnProperty('errCode')) { // this is server side error response
        const errCode = reason.data.errCode
        const errDetails = errMsg = reason.data.errMsg

        errMsg = parseAndTranslateUBErrorMessage(errMsg)

        /**
         * Fired for {@link UBConnection} instance in case user password is expired.
         * The only valid endpoint after this is `changePassword`
         *
         * Accept 1 arg `(connection: UBConnection)
         * @event passwordExpired
         * @memberOf module:@unitybase/ub-pub.module:AsyncConnection~UBConnection
         */
        if ((errCode === 72) && me.emit('passwordExpired', me)) {
          throw new ubUtils.UBAbortError()
        }
        throw new ubUtils.UBError(errMsg, errDetails, errCode)
      } else {
        throw reason //! Important - rethrow the reason is important. Do not create a new Error here
      }
    })
  }
  return promise
}

/**
 * Base64 encoded server certificate
 * @property {String} serverCertificate
 * @readonly */
/** Lifetime (in second) of session encryption
 * @property {Number} encryptionKeyLifetime
 * @readonly */
/**
 * Possible server authentication method
 * @property {Array.<string>} authMethods
 * @readonly */
/**
 * Retrieve application information. Usually this is first method developer must call after create connection
 * @method
 * @returns {Promise}  Promise resolved to result of getAppInfo method
 */
UBConnection.prototype.getAppInfo = function () {
  const me = this
  return me.get('getAppInfo') // non-auth request
    .then(function (resp) {
      const appInfo = resp.data
      /** Is server require content encryption
       * @property {Boolean} trafficEncryption
       * The base of all urls of your requests. Will be prepend to all urls.
       * @readonly */
      Object.defineProperty(me, 'trafficEncryption', { enumerable: true, writable: false, value: appInfo.trafficEncryption || false })
      /** The server certificate for cryptographic operations (base46 encoded)
       * @property {Boolean} serverCertificate
       * @readonly */
      Object.defineProperty(me, 'serverCertificate', { enumerable: true, writable: false, value: appInfo.serverCertificate || '' })
      Object.defineProperty(me, 'encryptionKeyLifetime', { enumerable: true, writable: false, value: appInfo.encryptionKeyLifetime || 0 })
      Object.defineProperty(me, 'authMethods', { enumerable: true, writable: false, value: appInfo.authMethods })
      Object.defineProperty(me, 'simpleCertAuth', { enumerable: true, writable: false, value: appInfo.simpleCertAuth || false })

      /**
       * An array of WebSocket protocol names supported by server
       * @property {Array<String>} supportedWSProtocols
       */
      Object.defineProperty(me, 'supportedWSProtocols', { enumerable: true, writable: false, value: appInfo.supportedWSProtocols || [] })
      /** UnityBase server version
       * @property {String} serverVersion
       * @readonly
       */
      Object.defineProperty(me, 'serverVersion', { enumerable: true, writable: false, value: appInfo.serverVersion || '' })
      ubUtils.apply(me.appConfig, appInfo.uiSettings.adminUI)
      const v = appInfo.serverVersion.split('.')
      const isUBQLv2 = ((v[0] >= 'v5') && (v[1] >= 10))
      /** UBQL v2 (value instead of values)
       * @property {Boolean} UBQLv2
       * @readonly */
      Object.defineProperty(me, 'UBQLv2', { enumerable: true, writable: false, value: isUBQLv2 })
      ClientRepository.prototype.UBQLv2 = isUBQLv2
      Object.defineProperty(me, 'authMock', { enumerable: false, writable: false, value: appInfo.authMock || false })
      return appInfo
    })
}

/**
 * Retrieve domain information from server. Promise resolve instance of UBDomain.
 * @returns {Promise}
 */
UBConnection.prototype.getDomainInfo = function () {
  const me = this
  return me.get('getDomainInfo', {
    params: { v: 4, userName: this.userLogin() }
  }).then(function (response) {
    const result = response.data
    const domain = new UBDomain(result)
    me.domain = domain
    return domain
  })
}

/**
 * Process buffered requests from this._bufferedRequests
 * @private
 */
UBConnection.prototype.processBuffer = function processBuffer () {
  const bufferCopy = this._bufferedRequests
  // get ready to new buffer queue
  this._bufferTimeoutID = 0
  this._bufferedRequests = []
  const reqData = bufferCopy.map(r => r.request)
  const rq = buildUriQueryPath(reqData)
  const uri = `ubql?rq=${rq}&uitag=${this.uiTag}`
  this.post(uri, reqData).then(
    (responses) => {
      // we expect responses in order we send requests to server
      bufferCopy.forEach(function (bufferedRequest, num) {
        bufferedRequest.deferred.resolve(responses.data[num])
      })
    },
    (failReason) => {
      bufferCopy.forEach(function (bufferedRequest) {
        bufferedRequest.deferred.reject(failReason)
      })
    }
  )
}

/**
 * Promise of running UBQL command(s) (asynchronously).
 * The difference from {@link UBConnection.post} is:
 *
 * - ability to buffer request: can merge several `query` in the 20ms period into one ubql call
 *
 * For well known UnityBase methods use aliases (addNew, select, insert, update, doDelete)
 * @param {Object} ubq    Request to execute
 * @param {String} ubq.entity Entity to execute the method
 * @param {String} ubq.method Method of entity to executed
 * @param {Array.<String>} [ubq.fieldList]
 * @param {Object} [ubq.whereList]
 * @param {Object} [ubq.execParams]
 * @param {Number} [ubq.ID]
 * @param {Object} [ubq.options]
 * @param {String} [ubq.lockType]
 * @param {Boolean} [ubq.__skipOptimisticLock] In case this parameter true and in the buffered
 * @param {Boolean} [ubq.__nativeDatasetFormat]
 * @param {Boolean} [allowBuffer] Allow buffer this request to single runList. False by default
 * @method
 * @returns {Promise}
 *
 * @example

 //this two execution is passed to single ubql server execution
 $App.connection.query({entity: 'uba_user', method: 'select', fieldList: ['*']}, true).then(UB.logDebug);
 $App.connection.query({entity: 'ubm_navshortcut', method: 'select', fieldList: ['*']}, true).then(UB.logDebug);

 //but this request is passed in separate ubql (because allowBuffer false in first request
 $App.connection.query({entity: 'uba_user', method: 'select', fieldList: ['*']}).then(UB.logDebug);
 $App.connection.query({entity: 'ubm_desktop', method: 'select', fieldList: ['*']}, true).then(UB.logDebug);
 */
UBConnection.prototype.query = function query (ubq, allowBuffer) {
  const me = this
  if (!allowBuffer || !BUFFERED_DELAY) {
    const uri = `ubql?rq=${ubq.entity}.${ubq.method}&uitag=${this.uiTag}`
    return me.post(uri, [ubq]).then(function (response) {
      return response.data[0]
    })
  } else {
    if (!this._bufferTimeoutID) {
      this._bufferTimeoutID = setTimeout(me.processBuffer.bind(me), BUFFERED_DELAY)
    }
    return new Promise(function (resolve, reject) {
      me._bufferedRequests.push({ request: ubq, deferred: { resolve, reject } })
    })
  }
}

/**
 * @deprecated Since UB 1.11 use `query` method
 * @private
 */
UBConnection.prototype.run = UBConnection.prototype.query

/**
 * Promise of running UBQL command(s) (asynchronously).
 *
 * Result is array of objects or null.
 *
 * The difference from {@link UBConnection.post} is:
 *
 * - ability to buffer request: can merge several `query` in the 20ms period into one ubql call
 *
 * For well known UnityBase methods use aliases (addNew, select, insert, update, doDelete)
 * @param {Object} ubq    Request to execute
 * @param {String} ubq.entity Entity to execute the method
 * @param {String} ubq.method Method of entity to executed
 * @param {Array.<String>} [ubq.fieldList]
 * @param {Object} [ubq.whereList]
 * @param {Object} [ubq.execParams]
 * @param {Number} [ubq.ID]
 * @param {Object} [ubq.options]
 * @param {String} [ubq.lockType]
 * @param {Boolean} [ubq.__skipOptimisticLock] In case this parameter true and in the buffered
 * @param {Boolean} [ubq.__nativeDatasetFormat]
 * @param {Object<string, string>} [fieldAliases] Optional object to change attribute names during transform array to object. Keys are original names, values - new names
 * @param {Boolean} [allowBuffer] Allow buffer this request to single runList. False by default
 * @method
 * @returns {Promise<Array|null>}
 *
 * @example

 //this two execution is passed to single ubql server execution
 $App.connection.queryAsObject({entity: 'uba_user', method: 'select', fieldList: ['*']}, true).then(UB.logDebug);
 $App.connection.queryAsObject({entity: 'ubm_navshortcut', method: 'select', fieldList: ['*']}, true).then(UB.logDebug);

 //but this request is passed in separate ubql (because allowBuffer false in first request
 $App.connection.queryAsObject({entity: 'uba_user', method: 'select', fieldList: ['*']}).then(UB.logDebug);
 $App.connection.queryAsObject({entity: 'ubm_desktop', method: 'select', fieldList: ['*']}, true).then(UB.logDebug);
 */
UBConnection.prototype.queryAsObject = function queryAsObject (ubq, fieldAliases, allowBuffer) {
  if (ubq.execParams && (ubq.method === 'insert' || ubq.method === 'update')) {
    const newEp = stringifyExecParamsValues(ubq.execParams)
    if (newEp) ubq.execParams = newEp
  }
  return this.query(ubq, allowBuffer).then(function (res) {
    return (res.resultData && res.resultData.data && res.resultData.data.length)
      ? LocalDataStore.selectResultToArrayOfObjects(res, fieldAliases)
      : null
  })
}

/**
 * Convert raw server response data to javaScript data according to attribute types.
 * Called by {@link UBConnection#select}
 * Currently only Data/DateTime & boolean conversion done
 * If resultLock present - resultLock.lockTime also converted
 *
 * @example

 // convert all string representation of date/dateTime to Date object, integer representation of bool to Boolean
 return me.query({entity: 'my_entity', method: 'select'}, true)
     .then(me.convertResponseDataToJsTypes.bind(me));

 * @method
 * @param serverResponse
 * @returns {*}
 */
UBConnection.prototype.convertResponseDataToJsTypes = function (serverResponse) {
  return LocalDataStore.convertResponseDataToJsTypes(this.domain, serverResponse)
}

/**
 * Call a {@link LocalDataStore#doFilterAndSort} - see a parameters there
 * @protected
 * @param {TubCachedData} cachedData
 * @param {UBQL} ubql
 * @returns {Object}
 */
UBConnection.prototype.doFilterAndSort = function (cachedData, ubql) {
  return LocalDataStore.doFilterAndSort(cachedData, ubql)
}

/**
 * Promise of running UBQL command with `addNew` method (asynchronously).
 *
 * Response "data" is an array of default values for row.
 *
 * Two difference from {@link class:UBConnection.query UBConnection.query}:
 *
 * - ubRequest.method set to 'addnew'
 * - requests is always buffered in the 20ms period into one ubql call
 * - `Date` & 'DateTime' entity attributes are converted from ISO8601 text representation to javaScript Date object
 *
 * @example

 $App.connection.addNew({entity: 'uba_user', fieldList: ['*']}).then(UB.logDebug)
 // [{"entity":"uba_user","fieldList":["ID","isPending"],"method":"addnew",
 //   "resultData":{"fields":["ID","isPending"],"rowCount": 1, "data":[[332462711046145,0]]}
 // }]

 * @param {Object} serverRequest    Request to execute
 * @param {String} serverRequest.entity Entity to execute the method
 * @param {Array.<string>} serverRequest.fieldList
 * @param {Object} [serverRequest.execParams]
 * @param {Object} [serverRequest.options]
 * @param {String} [serverRequest.lockType]
 * @param {Boolean} [serverRequest.alsNeed]
 * @returns {Promise<Object>}
 */
UBConnection.prototype.addNew = function (serverRequest) {
  const me = this
  serverRequest.method = 'addnew'
  return me.query(serverRequest, true)
    .then(me.convertResponseDataToJsTypes.bind(me))
}

/**
 * Promise of running UBQL command with `addNew` method (asynchronously).
 *
 * Result is Object with default values for row.
 *
 * @example

 $App.connection.addNewAsObject({"entity":"uba_user"}).then(UB.logDebug)
 // result is {ID: 332462709833729, isPending: false}

 * @param {Object} serverRequest    Request to execute
 * @param {String} serverRequest.entity Entity to execute the method
 * @param {Array.<string>} serverRequest.fieldList
 * @param {Object} [serverRequest.execParams]
 * @param {Object} [serverRequest.options]
 * @param {String} [serverRequest.lockType]
 * @param {Boolean} [serverRequest.alsNeed]
 * @param {Object<string, string>} [fieldAliases] Optional object to change attribute names during transform array to object. Keys are original names, values - new names
 * @return {Promise<Object>}
 */
UBConnection.prototype.addNewAsObject = function (serverRequest, fieldAliases) {
  return this.addNew(serverRequest).then(function (res) {
    return LocalDataStore.selectResultToArrayOfObjects(res, fieldAliases)[0]
  })
}

/**
 * Called in update/insert/delete methods and if request entity is cached then clear cache
 * @private
 * @param serverResponse
 * @return {Promise} Promise resolved to serverResponse
 */
UBConnection.prototype.invalidateCache = function (serverResponse) {
  const me = this
  const cacheType = me.domain.get(serverResponse.entity).cacheType
  if (cacheType === UBCache.cacheTypes.none) {
    return Promise.resolve(serverResponse)
  }
  return me.cacheOccurrenceRefresh(serverResponse.entity, cacheType).then(function () {
    return serverResponse
  })
}

/**
 * Check execParams contains values of type Object and if Yes - return new execParams with stringified objects values
 * else return false
 * @private
 * @param {Object} execParams
 * @return {Object|false}
 */
function stringifyExecParamsValues (execParams) {
  const keys = Object.keys(execParams)
  const L = keys.length
  let needTransform = false
  for (let i = 0; i < L; i++) {
    const v = execParams[keys[i]]
    if (v && (typeof v === 'object') && !(v instanceof Date)) {
      needTransform = true
      break
    }
  }
  if (!needTransform) return false
  const newParams = {}
  for (let i = 0; i < L; i++) {
    const v = execParams[keys[i]]
    newParams[keys[i]] = (v && (typeof v === 'object') && !(v instanceof Date))
      ? JSON.stringify(v)
      : v
  }
  return newParams
}

/**
 * Promise of running UBQL command with `update` method (asynchronously).
 * Difference from {@link UBConnection.query}:
 *
 * - ubRequest.method set to 'update'
 * - `Date` & 'DateTime' entity attributes are converted from ISO8601 text representation to javaScript Date object
 * - if necessary it will clear cache
 *
 * In case `fieldList` is passed - result will contains updated values for attributes specified in `fieldList`
 *  in Array representation
 *
 * @example

 $App.connection.update({
   entity: 'uba_user',
   fieldList: ['ID','name', 'mi_modifyDate'],
   execParams: {ID: 332462122205200, name:'test', mi_modifyDate:"2019-04-23T13:00:00Z"}
 }).then(UB.logDebug);
 // [{"entity":"uba_user","fieldList":["ID","name","mi_modifyDate"],
 //   "execParams":{"ID":332462122205200,"name":"test","mi_modifyDate":"2019-04-23T13:03:51Z","mi_modifyUser":10},
 //   "method":"update",
 //   "resultData":{"fields":["ID","name","mi_modifyDate"],"rowCount": 1,
 //               "data":[[332462122205200,"test","2019-04-23T13:03:51Z"]]}
 // }]

 * @param {Object} serverRequest          Request to execute
 * @param {String} serverRequest.entity   Entity to execute the method
 * @param {String} [serverRequest.method='update'] Method of entity to executed
 * @param {Array.<string>} [serverRequest.fieldList]
 * @param {Object} serverRequest.execParams Values to update. ID should be present
 * @param {Object} [serverRequest.options]
 * @param {String} [serverRequest.lockType]
 * @param {Boolean} [serverRequest.alsNeed]
 * @param {Boolean} [allowBuffer=false] Allow several "in the same time" request to be buffered to one transaction.
 * @returns {Promise<Object>}
 */
UBConnection.prototype.update = function (serverRequest, allowBuffer) {
  const me = this
  serverRequest.method = serverRequest.method || 'update'
  if (serverRequest.execParams) {
    const newEp = stringifyExecParamsValues(serverRequest.execParams)
    if (newEp) serverRequest.execParams = newEp
  }
  return me.query(serverRequest, allowBuffer)
    .then(me.convertResponseDataToJsTypes.bind(me))
    .then(me.invalidateCache.bind(me))
}

/**
 * Promise of running UBQL command with `update` method (asynchronously).
 *
 * In case `fieldList` is passed - result will contains updated values for attributes specified in `fieldList` as Object;
 *   >If `fieldList` is not passed or empty - return `null`
 *
 * @example

 $App.connection.updateAsObject({
   entity: 'uba_user',
   fieldList: ['ID','name','mi_modifyDate', 'isPending'],
   execParams: {ID: 33246, name:'newName', mi_modifyDate:"2019-04-23T13:00:00Z"}
 }).then(UB.logDebug);
 // {"ID": 332462122205200, "name": newName", "mi_modifyDate": new Date("2019-04-23T13:03:51Z"), isPending: false}

 * @param {Object} serverRequest          Request to execute
 * @param {String} serverRequest.entity   Entity to execute the method
 * @param {String} [serverRequest.method='update'] Method of entity to executed
 * @param {Array.<string>} [serverRequest.fieldList]
 * @param {Object} serverRequest.execParams Values to update. ID should be present
 * @param {Object} [serverRequest.options]
 * @param {String} [serverRequest.lockType]
 * @param {Boolean} [serverRequest.alsNeed]
 * @param {Boolean} [allowBuffer=false] Allow several "in the same time" request to be buffered to one transaction.
 * @param {Object<string, string>} [fieldAliases] Optional object to change attribute names during transform array to object. Keys are original names, values - new names
 * @returns {Promise<Object>}
 */
UBConnection.prototype.updateAsObject = function (serverRequest, fieldAliases, allowBuffer) {
  return this.update(serverRequest, allowBuffer).then(function (res) {
    return (res.resultData && res.resultData.data && res.resultData.data.length)
      ? LocalDataStore.selectResultToArrayOfObjects(res, fieldAliases)[0]
      : null
  })
}

/**
 * Promise of running UnityBase UBQL command with `insert` method (asynchronously).
 * Difference from {@link UBConnection.query}:
 *
 * - ubRequest.method set to 'insert'
 * - `Date` & 'DateTime' entity attributes are converted from ISO8601 text representation to javaScript Date object
 * - if necessary it will clear cache
 *
 * @param {Object} serverRequest    Request to execute
 * @param {String} serverRequest.entity Entity to execute the method
 * @param {String} [serverRequest.method='insert'] Method of entity to executed
 * @param {Array.<string>} serverRequest.fieldList
 * @param {Object} [serverRequest.execParams]
 * @param {Object} [serverRequest.options]
 * @param {String} [serverRequest.lockType]
 * @param {Boolean} [serverRequest.alsNeed]
 *
 * @param {Boolean} [allowBuffer=false] Allow several "in the same time" request to be buffered to one transaction.
 *
 * @method
 * @returns {Promise}
 *
 * @example

 $App.connection.insert({
   entity: 'uba_user', fieldList: ['ID','name'], execParams: {ID: 1, name:'newName'}
 }).then(UB.logDebug);

 */
UBConnection.prototype.insert = function (serverRequest, allowBuffer) {
  const me = this
  serverRequest.method = serverRequest.method || 'insert'
  if (serverRequest.execParams) {
    const newEp = stringifyExecParamsValues(serverRequest.execParams)
    if (newEp) serverRequest.execParams = newEp
  }
  return me.query(serverRequest, allowBuffer)
    .then(me.convertResponseDataToJsTypes.bind(me))
    .then(me.invalidateCache.bind(me))
}

/**
 * Promise of running UnityBase UBQL command with `insert` method (asynchronously).
 *
 * In case `fieldList` is passed - result will contains new values for attributes specified in `fieldList` as Object, otherwise - null
 *
 * @param {Object} serverRequest    Request to execute
 * @param {String} serverRequest.entity Entity to execute the method
 * @param {String} [serverRequest.method='insert'] Method of entity to executed
 * @param {Array.<string>} [serverRequest.fieldList] Attributes to be returned in result
 * @param {Object} serverRequest.execParams Attributes values to be inserted. If `ID` is omitted it will be autogenerated
 * @param {Object} [serverRequest.options]
 * @param {String} [serverRequest.lockType]
 * @param {Boolean} [serverRequest.alsNeed]
 *
 * @param {Object<string, string>} [fieldAliases] Optional object to change attribute names during transform array to object. Keys are original names, values - new names
 * @param {Boolean} [allowBuffer=false] Allow several "in the same time" request to be buffered to one transaction.
 *
 * @method
 * @returns {Promise<Object>}
 *
 * @example

  $App.connection.insertAsObject({
    entity:"uba_user",
    fieldList:['ID', 'name', 'mi_modifyDate'],
    execParams: {name: 'insertedName'}
  }).then(UB.logDebug)
  // {ID: 332462911062017, mi_modifyDate: Tue Apr 23 2019 17:04:30 GMT+0300 (Eastern European Summer Time), name: "insertedname"}
 */
UBConnection.prototype.insertAsObject = function (serverRequest, fieldAliases, allowBuffer) {
  return this.insert(serverRequest, allowBuffer).then(function (res) {
    return (res.resultData && res.resultData.data && res.resultData.data.length)
      ? LocalDataStore.selectResultToArrayOfObjects(res, fieldAliases)[0]
      : null
  })
}

/**
 * Promise of running UBQL command with delete method (asynchronously).
 * Difference from {@link UBConnection.query}:
 *
 * - ubRequest.method set to 'delete' by default
 * - if necessary it will clear cache
 *
 * @param {Object} serverRequest    Request to execute
 * @param {String} serverRequest.entity Entity to execute the method
 * @param {String} [serverRequest.method] Method of entity to executed. Default to 'delete'
 * @param {Object} [serverRequest.execParams]
 * @param {Object} [serverRequest.options]
 * @param {String} [serverRequest.lockType]
 * @param {Boolean} [serverRequest.alsNeed]
 *
 * @param {Boolean} [allowBuffer] Default - false. Allow several "in the same time" request to be buffered to one transaction.
 *
 * @method
 * @returns {Promise}
 *
 * @example

 $App.connection.doDelete({
   entity: 'uba_user', fieldList: ['ID','name'], execParams: {ID: 1, name:'newName'}
 }).then(UB.logDebug);

 */
UBConnection.prototype.doDelete = function (serverRequest, allowBuffer) {
  const me = this
  serverRequest.method = serverRequest.method || 'delete'
  return me.query(serverRequest, allowBuffer)
    .then(me.invalidateCache.bind(me))
}

/**
 * Promise of running UBQL (asynchronously).
 * Two difference from {@link class:UBConnection.query UBConnection.query}:
 *
 * - ubRequest.method by default set to 'select'
 * - requests is always buffered in the 20ms period into one ubql call
 * - `Date` & 'DateTime' entity attributes are converted from ISO8601 text representation to javaScript Date object
 * - if request entity is cached - cache used
 *
 * @param {Object} serverRequest    Request to execute
 * @param {String} serverRequest.entity Entity to execute the method
 * @param {String} [serverRequest.method] Method of entity to executed. Default to 'select'
 * @param {Number} [serverRequest.ID] if passed - request bypass cache, where & order list is ignored. Can be used to load single record from server
 * @param {Array.<string>} serverRequest.fieldList
 * @param {Object} [serverRequest.whereList]
 * @param {Object} [serverRequest.execParams]
 * @param {Object} [serverRequest.options]
 * @param {String} [serverRequest.lockType]
 * @param {Boolean} [serverRequest.alsNeed]
 * @param {Boolean} [serverRequest.__skipOptimisticLock] In case this parameter true and in the buffered
 * @param {Boolean} [bypassCache=false] Do not use cache while request even if entity cached.
 *   If  `__mip_disablecache: true` is passed in serverRequest cache is also disabled.
 * @method
 * @returns {Promise}
 *
 * @example

 //retrieve users
 $App.connection.select({entity: 'uba_user', fieldList: ['*']}).then(UB.logDebug);

 //retrieve users and desktops and then both done - do something
 Promise.all($App.connection.select({entity: 'uba_user', fieldList: ['ID', 'name']})
   $App.connection.select({entity: 'ubm_desktop', fieldList: ['ID', 'code']})
 ).then(UB.logDebug);
 */
UBConnection.prototype.select = function (serverRequest, bypassCache) {
  const me = this
  let dataPromise

  bypassCache = bypassCache || (serverRequest.__mip_disablecache === true)
  const cacheType = bypassCache || serverRequest.ID || serverRequest.bypassCache
    ? UBCache.cacheTypes.None
    : me.domain.get(serverRequest.entity).cacheType

  if (!serverRequest.method) {
    serverRequest.method = 'select'
  }
  // if exist expression where ID = ... bypass cache
  //        if (idInWhere(serverRequest.whereList)){
  //            cacheType = cacheTypes.None;
  //        }
  if (cacheType === UBCache.cacheTypes.None) { // where & order is done by server side
    dataPromise = this.query(serverRequest, true)
      .then(this.convertResponseDataToJsTypes.bind(this))
      .then(response => {
        const responseWithTotal = {}
        ubUtils.apply(responseWithTotal, response)
        if (response.__totalRecCount) {
          responseWithTotal.total = response.__totalRecCount
        } else if (response.resultData && response.resultData.data) {
          const resRowCount = response.resultData.data.length
          if (!serverRequest.options) {
            responseWithTotal.total = resRowCount
          } else {
            const opt = serverRequest.options || {}
            const start = opt.start ? opt.start : 0
            const limit = opt.limit || 0
            // in case we fetch less data then requested - this is last page and we know total
            responseWithTotal.total = (resRowCount < limit) ? start + resRowCount : -1
          }
        }
        return responseWithTotal
      })
  } else { // where & order is done by client side
    return this._doSelectForCacheableEntity(serverRequest, cacheType)
  }
  return dataPromise
}

/**
 * @private
 * @param {Object} serverRequest    Request to execute
 * @param {UBCache.cacheTypes} cacheType
 */
UBConnection.prototype._doSelectForCacheableEntity = function (serverRequest, cacheType) {
// TODO check all filtered attribute is present in whereList - rewrite me.checkFieldList(operation);
  const cKey = this.cacheKeyCalculate(serverRequest.entity, serverRequest.fieldList)
  const cacheStoreName = (cacheType === UBCache.cacheTypes.Session) ? UBCache.SESSION : UBCache.PERMANENT
  // retrieve data either from cache or from server
  return this.cache.get(cKey + ':v', cacheStoreName).then((version) => {
    let cachedPromise
    if (!version || // no data in cache or invalid version
      // or must re-validate version
      (version && cacheType === UBCache.cacheTypes.Entity) ||
      // or SessionEntity cached not for current cache version
      (version && cacheType === UBCache.cacheTypes.SessionEntity && this.cachedSessionEntityRequested[cKey] !== version)
    ) {
      // remove where order logicalPredicates & limits
      const serverRequestWOLimits = {}
      Object.keys(serverRequest).forEach(function (key) {
        if (['whereList', 'orderList', 'options', 'logicalPredicates'].indexOf(key) === -1) {
          serverRequestWOLimits[key] = serverRequest[key]
        }
      })
      serverRequestWOLimits.version = version || '-1'
      const pendingCachedEntityRequest = this._pendingCachedEntityRequests[cKey]
        ? this._pendingCachedEntityRequests[cKey]
        : this._pendingCachedEntityRequests[cKey] = this.query(serverRequestWOLimits, true)
      cachedPromise = pendingCachedEntityRequest
        .then( // delete pending request in any case
          (data) => {
            delete this._pendingCachedEntityRequests[cKey]
            return data
          },
          (reason) => {
            delete this._pendingCachedEntityRequests[cKey]
            throw reason
          }
        )
        .then(this.convertResponseDataToJsTypes.bind(this))
        .then(response => this._cacheVersionedResponse(response, cacheStoreName, cKey))
    } else { // retrieve data from cache
      cachedPromise = this.cache.get(cKey, cacheStoreName)
    }
    return cachedPromise
  }).then(cacheResponse => {
    return this.doFilterAndSort(cacheResponse, serverRequest)
  })
}

/**
 * Put response to cache
 * @private
 * @param {Object} serverResponse
 * @param {Object} serverResponse.resultData
 * @param {Boolean} [serverResponse.resultData.notModified]
 * @param {String} storeName
 * @param {String} cKey Cache key
 * @returns {*}
 */
UBConnection.prototype._cacheVersionedResponse = function (serverResponse, storeName, cKey) {
  if (serverResponse.resultData.notModified) {
    // in case we refresh cachedSessionEntityRequested or just after login - put version to cachedSessionEntityRequested
    this.cachedSessionEntityRequested[cKey] = serverResponse.version
    return this.cache.get(cKey, storeName)
  } else {
    return this.cache.put([
      { key: cKey + ':v', value: serverResponse.version },
      { key: cKey, value: serverResponse.resultData }
    ], storeName).then(() => {
      this.cachedSessionEntityRequested[cKey] = serverResponse.version
      return serverResponse.resultData
    })
  }
}
/**
 * Alias to {@link LocalDataStore#selectResultToArrayOfObjects LocalDataStore.selectResultToArrayOfObjects}
 *
 * @param {{resultData: {data: Array.<Array>, fields: Array.<String>}}} selectResult
 * @returns {Array.<*>}
 * @private
 * @deprecated Use LocalDataStore.selectResultToArrayOfObjects
 */
UBConnection.selectResultToArrayOfObjects = LocalDataStore.selectResultToArrayOfObjects

/**
 * Group several ubRequest into one server request (executed in singe transaction on server side)
 *
 *      $App.connection.runTrans([
 *           { entity: 'my_entity', method: 'update', ID: 1, execParams: {code: 'newCode'} },
 *           { entity: 'my_entity', method: 'update', ID: 2, execParams: {code: 'newCodeforElementWithID=2'} },
 *       ]).then(UB.logDebug);
 *
 * @method
 * @param {Array.<ubRequest>} ubRequestArray
 * @returns {Promise} Resolved to response.data
 */
UBConnection.prototype.runTrans = function (ubRequestArray) {
  for (const serverRequest of ubRequestArray) {
    if (serverRequest.execParams && ((serverRequest.method === 'insert') || ((serverRequest.method === 'update')))) {
      const newEp = stringifyExecParamsValues(serverRequest.execParams)
      if (newEp) serverRequest.execParams = newEp
    }
  }
  const rq = buildUriQueryPath(ubRequestArray)
  const uri = `ubql?rq=${rq}&uitag=${this.uiTag}`
  return this.post(uri, ubRequestArray).then((response) => response.data)
}

/**
 * Group several ubRequest into one server request (executed in singe transaction on server side)
 *
 * Each response will be returned in the same array position as corresponding request.
 *
 * In case response contains `resultData` property of type {data: fields: } it will be converted to array-of-object dataStore format
 *
 * In case method is insert or update array is replaced by first element. Example below use one entity,
 *   but real app can use any combination of entities and methods
 *
 * @example
 $App.connection.runTransAsObject([
   {entity: "tst_aclrls", method: 'insert', fieldList: ['ID', 'caption'], execParams: {caption: 'inserted1'}},
   {entity: "tst_aclrls", method: 'insert', opaqueParam: 'insertWoFieldList', execParams: {caption: 'inserted2'}},
   {entity: "tst_aclrls", method: 'update', fieldList: ['ID', 'caption'], execParams: {ID: 332463213805569, caption: 'updated1'}},
   {entity: "tst_aclrls", method: 'delete', execParams: {ID: 332463213805572}}]
 ).then(UB.logDebug)
 // result is:
  [{
    "entity": "tst_aclrls","method": "insert","fieldList": ["ID","caption"],"execParams": {"caption": "inserted1","ID": 332463256010753},
    "resultData": {"ID": 332463256010753,"caption": "inserted1"}
  }, {
    "entity": "tst_aclrls","method": "insert","opaqueParam": "insertWoFieldList","execParams": {"caption": "inserted2","ID": 332463256010756},"fieldList": []
  }, {
    "entity": "tst_aclrls","method": "update","fieldList": ["ID","caption"],"execParams": {"ID": 332463213805569,"caption": "updated1"},
    "resultData": {"ID": 332463213805569,"caption": "updated1"}
  }, {
    "entity": "tst_aclrls","method": "delete","execParams": {"ID": 332463213805572},
    "ID": 332463213805572
  }]
 *
 * @method
 * @param {Array.<ubRequest>} ubRequestArray
 * @param {Array.<Object<string, string>>} [fieldAliasesArray] Optional array of object to change attribute names during transform.
 *   Keys are original names, values - new names
 * @return {Promise<Array<Object>>}
 */
UBConnection.prototype.runTransAsObject = function (ubRequestArray, fieldAliasesArray = []) {
  for (const serverRequest of ubRequestArray) {
    if (serverRequest.execParams && ((serverRequest.method === 'insert') || ((serverRequest.method === 'update')))) {
      const newEp = stringifyExecParamsValues(serverRequest.execParams)
      if (newEp) serverRequest.execParams = newEp
    }
  }
  const me = this
  return this.post('ubql', ubRequestArray).then((response) => {
    const mutatedEntitiesNames = []
    const respArr = response.data
    respArr.forEach((resp, idx) => {
      const isInsUpd = ((resp.method === 'insert') || (resp.method === 'update'))
      if (resp.entity && (isInsUpd || (resp.method === 'delete'))) {
        if (!mutatedEntitiesNames.includes(resp.entity)) {
          mutatedEntitiesNames.push(resp.entity)
        }
      }
      if (resp.resultData && resp.resultData.data && resp.resultData.data && resp.resultData.fields) {
        me.convertResponseDataToJsTypes(resp) // mutate resp
        const asObjectArr = LocalDataStore.selectResultToArrayOfObjects(resp, fieldAliasesArray[idx])
        resp.resultData = isInsUpd ? asObjectArr[0] : asObjectArr
      }
    })
    if (!mutatedEntitiesNames.length) {
      // cache invalidation is not required
      return respArr
    }

    const invalidations = mutatedEntitiesNames.map(eName => {
      return me.invalidateCache({ entity: eName })
    })
    // await for cache invalidation
    return Promise.all(invalidations).then(() => {
      return respArr
    })
  })
}

const ALLOWED_GET_DOCUMENT_PARAMS = ['entity', 'attribute', 'ID', 'id', 'isDirty', 'forceMime', 'fileName', 'store', 'revision']

/**
 * Get a http link to the "Document" attribute content which is valid for the duration of the user session.
 *
 * This link can be used, for example, in <img src=...> HTML tag and so on.
 *
 * Used in `$App.downloadDocument` method to download a BLOB content
 * and in `FileRenderer` Vue component to display a BLOB content in browser.
 *
 * @example
 //Retrieve content of document as string using GET
 const docURL = await UB.connection.getDocumentURL({
     entity:'ubm_form',
     attribute: 'formDef',
     ID: 100000232003,
     revision: 22,
  })
  // result is alike "/getDocument?entity=ubm_form&attribute=formDef&ID=100000232003&revision=22&session_signature=cbe83ece60126ee4a20d40c2"

 * @method
 * @param {Object} params
 * @param {String} params.entity Code of entity to retrieve from
 * @param {String} params.attribute `document` type attribute code
 * @param {Number} params.ID Instance ID
 * @param {Number} [params.revision] Revision of the document. We strongly recommend to pass this argument for correct HTTP cache work
 * @param {Boolean} [params.isDirty] Set it to `true` to retrieve a document in **dirty** state
 * @param {String} [params.fileName] For dirty document should be passed - getDocument endpoint uses this file
 *   extension to create a correct Content-Type header.
 *   If not passed - dirty document returned with Content-Type: application/octet-stream.
 *
 * @returns {Promise<string>} Document URL (valid for the duration of the user session)
 */
UBConnection.prototype.getDocumentURL = async function (params) {
  const urlParams = []
  for (const p in params) {
    if ((ALLOWED_GET_DOCUMENT_PARAMS.indexOf(p) !== -1) && (typeof params[p] !== 'undefined')) {
      urlParams.push(encodeURIComponent(p) + '=' + encodeURIComponent(params[p]))
    }
  }
  const session = await this.authorize()
  urlParams.push('session_signature=' + session.signature())
  return '/getDocument?' + urlParams.join('&')
}
/**
 * Retrieve content of `document` type attribute field from server. Usage samples:
 *
 * @example
 //Retrieve content of document as string using GET
 $App.connection.getDocument({
     entity:'ubm_form',
     attribute: 'formDef',
     ID: 100000232003
  }).then(function(result){console.log(typeof result)}); // string

 //The same, but using POST for bypass cache
 $App.connection.getDocument({
     entity:'ubm_form',
     attribute: 'formDef',
     ID: 100000232003
  }, {
     bypassCache: true
  }).then(function(result){console.log(typeof result)}); // string

 //Retrieve content of document as ArrayBuffer and bypass cache
 $App.connection.getDocument({
     entity:'ubm_form',
     attribute: 'formDef',
     ID: 100000232003
  }, {
     bypassCache: true, resultIsBinary: true
  }).then(function(result){
     console.log('Result is', typeof result, 'of length' , result.byteLength, 'bytes'); //output: Result is ArrayBuffer of length 2741 bytes
     let uiArr = new Uint8Array(result) // view into ArrayButter as on the array of byte
     console.log('First byte of result is ', uiArr[0])
  })

 * @method
 * @param {Object} params
 * @param {String} params.entity Code of entity to retrieve from
 * @param {String} params.attribute `document` type attribute code
 * @param {Number} params.id Instance ID
 * @param {String} [params.forceMime] If passed and server support transformation from source MIME type to `forceMime`
 *   server perform transformation and return document representation in the passed MIME
 * @param {Number} [params.revision] Optional revision of the document (if supported by server-side store configuration).
 *   Default is current revision.
 * @param {String} [params.fileName] For dirty document should be passed - getDocument endpoint uses this file
 *   extension to create a correct Content-Type header.
 *
 *   If not passed - dirty document returned with Content-Type: application/octet-stream.
 *   For non dirty documents Content-Type retrieved from JSON in DB.
 * @param {Boolean} [params.isDirty=false] Optional ability to retrieve document in **dirty** state
 * @param {String} [params.store] ????
 *
 * @param {Object} [options] Additional request options
 * @param {Boolean} [options.resultIsBinary=false] if true - return document content as ArrayBuffer
 * @param {Boolean} [options.bypassCache] HTTP POST verb will be used instead of GET for bypass browser cache
 * @returns {Promise} Resolved to document content (either ArrayBuffer in case options.resultIsBinary===true or text/json)
 */
UBConnection.prototype.getDocument = function (params, options) {
  const opt = Object.assign({}, options)
  const reqParams = {
    url: 'getDocument',
    method: opt.bypassCache ? 'POST' : 'GET'
  }
  if (options && options.resultIsBinary) {
    reqParams.responseType = 'arraybuffer'
  }
  if (opt.bypassCache) {
    reqParams.data = Object.assign({}, params)
    Object.keys(reqParams.data).forEach(function (key) {
      if (ALLOWED_GET_DOCUMENT_PARAMS.indexOf(key) === -1) {
        delete reqParams.data[key]
        ubUtils.logDebug('invalid parameter "' + key + '" passed to getDocument request')
      }
    })
  } else {
    reqParams.params = params
  }
  return this.xhr(reqParams).then((response) => response.data)
}

/**
 * Saves a file content to the TEMP store of the specified entity attribute of Document type.
 *
 * Should be called before insert of update. Result of this function is what shall be assigned to the
 * attribute value during insert/update operation.
 *
 * @method
 * @param {*} content BLOB attribute content
 * @param {Object} params Additional parameters
 * @param {string} params.entity Entity name
 * @param {string} params.attribute Entity attribute name
 * @param {number} params.id ID of the record
 * @param {string} params.origName
 * @param {string} [params.fileName] If not specified, `params.origName` will be used
 * @param {string} [params.encoding] Encoding of `data`. Either omit for binary data
 *   or set to `base64` for base64 encoded data
 * @param {function} [onProgress] Optional onProgress callback
 * @return {Promise<Object>} Promise resolved blob store metadata
 */
UBConnection.prototype.setDocument = function (content, params, onProgress) {
  const xhrParams = {
    url: 'setDocument',
    method: 'POST',
    data: content,
    headers: {
      'Content-Type': 'application/octet-stream'
    },
    params: params
  }
  if (onProgress) xhrParams.onProgress = onProgress
  return this.xhr(xhrParams).then(serverResponse => serverResponse.data.result)
}

/**
 * Alias to {@link UBSession.hexa8 UBSession.hexa8}
 * @private
 * @deprecated since 1.8 use UBSession.prototype.hexa8 instead
 */
UBConnection.prototype.hexa8 = UBSession.prototype.hexa8

/**
 * Alias to {@link UBSession.hexa8 UBSession.crc32}
 * @private
 * @deprecated since 1.8 use UBSession.prototype.crc32 instead
 */
UBConnection.prototype.crc32 = UBSession.prototype.crc32

/**
 * Log out user from server
 */
UBConnection.prototype.logout = function () {
  if (this.allowSessionPersistent) LDS.removeItem(this.__sessionPersistKey)
  if (!this.isAuthorized()) return Promise.resolve(true)

  let logoutPromise = this.post('logout', {})
  if (this._pki) { // unload encryption private key
    const me = this
    logoutPromise = logoutPromise.then(
      () => new Promise((resolve) => { setTimeout(() => { me._pki.closePrivateKey(); resolve(true) }, 20) })
    )
  }
  return logoutPromise
}

/**
 * @class SignatureValidationResultAction
 * @property {String} icon Icon css class name
 * @property {String} tooltip Tooltip caption
 * @property {Function} callback Function for handle click
 */

/**
 * PKI interface
 * @interface
 */
function UbPkiInterface () {}
/**
 * Name of used library
 * @type {string}
 */
UbPkiInterface.prototype.libName = ''
/**
 * Direct library interface
 * @type {{}}
 */
UbPkiInterface.prototype.direct = {}
/**
 * Read private key
 */
UbPkiInterface.prototype.readPrivateKey = function () {}
/**
 * Close private key
 */
UbPkiInterface.prototype.closePrivateKey = function () {}

/**
 * Return parsed certificate for loaded private key
 */
UbPkiInterface.prototype.getPrivateKeyOwnerInfo = function () {}
/**
 * Sing one or several documents.
 *
 * Can accept {BlobStoreRequest} as item - in this case signature hash is calculated on server side
 * for document stored in BLOB store (@ub-d/crypto-api model must be added into domain)
 *
 * @param {Uint8Array|ArrayBuffer|String|BlobStoreRequest|Array<Uint8Array|ArrayBuffer|String|BlobStoreRequest>} data
 * @param {Boolean} [resultIsBinary=false]
 * @param {function} [ownerKeyValidationFunction] optional function what called with one parameter - certInfo: CertificateJson before signing.
 *   Should validate is owner of passed certificate allowed to perform signing,
 *   for example by check equality of certInfo.serial with conn.userData('userCertificateSerial');
 *   In case function returns rejected promise or throw then private key will be unloaded from memory
 *   to allow user to select another key
 * @return {Promise<ArrayBuffer|string|Array<ArrayBuffer|string>>} signature or array of signatures if data is array.
 *   If resultIsBinary===true each signature is returned as ArrayBuffer, otherwise as base64 encoded string
 */
UbPkiInterface.prototype.sign = function (data, resultIsBinary, ownerKeyValidationFunction) {}
/**
 * Verify signature(s) for data. If signature is string function await
 *  this is a base64 encoded binary signature
 *
 * Data can be BlobStoreRequest - in this case verification is done on the server (@ub-d/crypto-api model must be added to domain)
 *
 * @param {File|ArrayBuffer|Blob|Array|String|Array<File|ArrayBuffer|Blob|Array|String>} signatures
 * @param {Uint8Array|String|BlobStoreRequest} data
 * @param {Boolean} [verifyTimestamp=true]
 * @returns {Promise<SignatureValidationResult|Array<SignatureValidationResult>>}
 */
UbPkiInterface.prototype.verify = function (signatures, data, verifyTimestamp) {}
/**
 * CERT2 auth implementation
 * @param {object} authParams
 */
UbPkiInterface.prototype.authHandshakeCERT2 = function (authParams) {}
/**
 * Show UI for library settings
 * @return {Promise<boolean>}
 */
UbPkiInterface.prototype.settingsUI = function () {}

/**
 * Show UI for signature verification result
 * @param {Array<SignatureValidationResult>} validationResults Array of UbPkiInterface.verify() results
 * @param {Array<string>} [sigCaptions] Array of type and name for each signature from validationResults
 * @param {Array<SignatureValidationResultAction>} [actions] Array of action button (icon and callback)
 * @return {Promise<boolean>}
 */
UbPkiInterface.prototype.verificationUI = function (validationResults, sigCaptions, actions) {}

/**
 * Inject encryption implementation and return a promise to object what implements a UbPkiInterface
 * @return {Promise<UbPkiInterface>}
 */
UBConnection.prototype.pki = async function () {
  if (this._pki) return this._pki
  if (!this.appConfig.uiSettings) throw new Error('connection.pki() can be called either after connect() or inside connection.onGotApplicationConfig')
  const availableEncryptions = this.appConfig.availableEncryptions
  let pkiImplModule
  if (availableEncryptions) {
    if (availableEncryptions.length === 1) { // single encryption implementation - select it
      pkiImplModule = availableEncryptions[0].moduleURI
    } else {
      if (window && (typeof window.capiSelectionDialog === 'function')) {
        pkiImplModule = await window.capiSelectionDialog(this)
      } else { // no encryption selection function defined in $App - choose first encryption
        pkiImplModule = availableEncryptions[0].moduleURI
      }
    }
  }
  if (!pkiImplModule) {
    throw new Error('"encryptionImplementation" not defined in "appConfig.uiSettings.adminUI" or "@ub-d/crypto-api" model is not added into domain')
  }
  // use global UB to prevent circular dependency
  // eslint-disable-next-line no-undef
  await UB.inject(pkiImplModule)
  // UA_CRYPT is injected on demand
  // eslint-disable-next-line no-undef
  this._pki = await UA_CRYPT.getPkiInterface(this)
  return this._pki
}

/**
 * Known server-side error codes
 * @enum
 * @private
 */
UBConnection.prototype.serverErrorCodes = {
  1: 'ubErrNotImplementedErrnum',
  2: 'ubErrRollbackedErrnum',
  3: 'ubErrNotExecutedErrnum',
  4: 'ubErrInvaliddataforrunmethod',
  5: 'ubErrInvaliddataforrunmethodlist',
  6: 'ubErrNoMethodParameter',
  7: 'ubErrMethodNotExist',
  8: 'ubErrElsAccessDeny',
  9: 'ubErrElsInvalidUserOrPwd',
  10: 'ubErrElsNeedAuth',
  11: 'ubErrNoEntityParameter',
  13: 'ubErrNoSuchRecord',
  14: 'ubErrInvalidDocpropFldContent',
  15: 'ubErrEntityNotExist',
  16: 'ubErrAttributeNotExist',
  17: 'ubErrNotexistEntitymethod',
  18: 'ubErrInvalidSetdocData',
  19: 'ubErrSoftlockExist',
  20: 'ubErrNoErrorDescription',
  21: 'ubErrUnknownStore',
  22: 'ubErrObjdatasrcempty',
  23: 'ubErrObjattrexprbodyempty',
  24: 'ubErrNecessaryfieldNotExist',
  25: 'ubErrRecordmodified',
  26: 'ubErrNotexistnecessparam',
  27: 'ubErrNotexistfieldlist',
  28: 'ubErrUpdaterecnotfound',
  29: 'ubErrNecessaryparamnotexist',
  30: 'ubErrInvalidstoredirs',
  31: 'ubErrNofileinstore',
  32: 'ubErrAppnotsupportconnection',
  33: 'ubErrAppnotsupportstore',
  34: 'ubErrDeleterecnotfound',
  35: 'ubErrNotfoundlinkentity',
  36: 'ubErrEntitynotcontainmixinaslink',
  37: 'ubErrEssnotinherfromessaslink',
  38: 'ubErrInstancedatanameisreadonly',
  39: 'ubErrManyrecordsforsoftlock',
  40: 'ubErrNotfoundidentfieldsl',
  41: 'ubErrInvalidlocktypevalue',
  42: 'ubErrLockedbyanotheruser',
  43: 'ubErrInvalidwherelistinparams',
  44: 'ubErrRecnotlocked',
  45: 'ubErrManyrecordsforchecksign',
  46: 'ubErrNotfoundparamnotrootlevel',
  47: 'ubErrCantcreatedirlogmsg',
  48: 'ubErrCantcreatedirclientmsg',
  49: 'ubErrConnectionNotExist',
  50: 'ubErrDirectUnityModification',
  51: 'ubErrCantdelrecthisvalueusedinassocrec',
  52: 'ubErrAssocattrnotfound',
  53: 'ubErrAttrassociationtoentityisempty',
  54: 'ubErrNotfoundconforentityinapp',
  55: 'ubErrNewversionrecnotfound',
  56: 'ubErrElsAccessDenyEntity',
  57: 'ubErrAlsAccessDenyEntityattr',
  58: 'ubErrDatastoreEmptyentity',
  // 59: "ubErrCustomerror"
  67: 'ubErrTheServerHasExceededMaximumNumberOfConnections',
  69: 'ubErrFtsForAppDisabled',
  72: 'ubErrElsPwdIsExpired',
  73: 'ELS_USER_NOT_FOUND',
  74: 'VALUE_MUST_ME_UNIQUE'
}

/**
 * Return server-side error message by error number
 * @param {Number} errorNum
 * @return {String}
 */
UBConnection.prototype.serverErrorByCode = function (errorNum) {
  return this.serverErrorCodes[errorNum]
}

/**
 * Create a new instance of repository
 * @param {String|Object} entityCodeOrUBQL The name of the Entity for which the Repository is being created or UBQL
 * @returns {ClientRepository}
 */
UBConnection.prototype.Repository = function (entityCodeOrUBQL) {
  if (typeof entityCodeOrUBQL === 'string') {
    return new ClientRepository(this, entityCodeOrUBQL)
  } else {
    return new ClientRepository(this, '').fromUbql(entityCodeOrUBQL)
  }
}

/**
 * Calc SHA256 from string
 *
 *    var shaAsSting = UB.connection.SHA256('something').toString()
 */
UBConnection.prototype.SHA256 = SHA256
/**
 * Calc HMAC_SHA256 from key and string
 *
 *    var shaAsSting = UB.connection.HMAC_SHA256('secretKey', 'something').toString()
 */
UBConnection.prototype.HMAC_SHA256 = HMAC_SHA256

/**
 * Sets UI tag for connection.
 *
 * This tag will be added to a ubql HTTP request as `uitag=${uiTag}` and can be used to track from which part of UI request is generated
 *
 * Recommended naming convention for tags are:
 *  - nsc-${shortcutCode} for something executed from navshortcut
 *  - frm-${formCode} for forms
 *  - afm-${entity} for auto-forms
 *  - rpt-${reportCode} for reports
 *
 * @param {string} uiTag
 */
UBConnection.prototype.setUiTag = function (uiTag) {
  this.uiTag = encodeURIComponent(uiTag || '')
}

/**
 * Fires after successful response for update/insert/delete for entity received
 * @example

 UB.connection.on('uba_user:changed', function ({entity, method, resultData}) {
  console.log(`Someone call ${method} User with ID ${resultData.ID}`
})

 * @event entity_name:changed
 * @memberOf module:@unitybase/ub-pub.module:AsyncConnection~UBConnection
 * @param {object} ubqlResponse
 */

/**
 * Emit `${entityCode}:changed` event. In case entity has a unity mixin - emit also for unityEntity
 *
 * @param {string} entityCode
 * @param {Object} payload  An object with at last {entity: 'entityCode', method: 'entityMethod', resultData: {} } attributes
 */
UBConnection.prototype.emitEntityChanged = function (entityCode, payload) {
  const e = this.domain.get(entityCode, false)
  this.emit(`${entityCode}:changed`, payload)
  if (e && e.hasMixin('unity') && e.mixins.unity.entity) {
    const U = e.mixins.unity
    // transform response to match a unity
    const unityPayload = {
      entity: U.entity,
      method: payload.method,
      resultData: U.defaults || {}
    }
    const uAttrsSet = new Set(U.attributeList)
    const uMapping = U.mapping || {}
    const RD = payload.resultData || {}
    for (const attr in RD) {
      if (attr === 'ID') {
        unityPayload.resultData.ID = RD.ID
      } else if (uAttrsSet.has(attr)) {
        unityPayload.resultData[attr] = RD[attr]
      } else if (uMapping[attr]) {
        unityPayload.resultData[uMapping[attr]] = RD[attr]
      }
    }
    this.emit(`${e.mixins.unity.entity}:changed`, unityPayload)
  }
}

/**
 * Is auth schema for logged in user allows password changing (currently - only UB and CERT* with requireUserName)
 * @return {boolean}
 */
UBConnection.prototype.userCanChangePassword = function () {
  if (!LDS) return false
  const lastAuthType = LDS.getItem(ubUtils.LDS_KEYS.LAST_AUTH_SCHEMA) || '' // session.authSchema
  const auis = (this.appConfig.uiSettings && this.appConfig.uiSettings.adminUI) || {}
  return (lastAuthType === 'UB' || lastAuthType === 'Basic') ||
    (lastAuthType.startsWith('CERT') && auis.authenticationCert && auis.authenticationCert.requireUserName)
}

/**
 * see docs in ub-pub main module
 * @private
 * @param cfg
 * @param {string} cfg.host Server host
 * @param {string} [cfg.path] API path - the same as in Server config `httpServer.path`
 * @param cfg.onCredentialRequired Callback for requesting a user credentials. See {@link UBConnection} constructor `requestAuthParams` parameter description
 * @param {boolean} [cfg.allowSessionPersistent=false] For a non-SPA browser client allow to persist a Session in the local storage between reloading of pages.
 *  In case user is logged out by server this persistent dos't work and UBConnection will call onCredentialRequired handler,
 *  so user will be prompted for credentials
 * @param [cfg.onAuthorizationFail] Callback for authorization failure. See {@link event:authorizationFail} event.
 * @param [cfg.onAuthorized] Callback for authorization success. See {@link event:authorized} event.
 * @param [cfg.onNeedChangePassword] Callback for a password expiration. See {@link event:passwordExpired} event
 * @param [cfg.onGotApplicationConfig] Called just after application configuration retrieved from server.
 *  Accept one parameter - `connection: UBConnection`
 *  Usually on this stage application inject some scripts required for authentication (locales, cryptography etc).
 *  Should return a promise then done
 * @param [cfg.onGotApplicationDomain]
 * @param {Object} [ubGlobal=null]
 * @return {Promise<UBConnection>}
 */
function connect (cfg, ubGlobal = null) {
  const config = this.config = Object.assign({}, cfg)

  const connection = new UBConnection({
    host: config.host,
    appName: config.path || '/',
    requestAuthParams: config.onCredentialRequired,
    allowSessionPersistent: cfg.allowSessionPersistent
  })
  // inject connection instance to global UB just after connection creation
  if (ubGlobal) ubGlobal.connection = connection
  if (config.onAuthorizationFail) {
    connection.on('authorizationFail', config.onAuthorizationFail)
  }
  if (config.onNeedChangePassword) {
    connection.on('passwordExpired', config.onNeedChangePassword)
  }
  if (config.onAuthorized) {
    connection.on('authorized', config.onAuthorized)
  }

  return connection.getAppInfo().then(function (appInfo) {
    // apply a default app settings to the gerAppInfo result
    connection.appConfig = Object.assign({
      applicationName: 'UnityBase',
      applicationTitle: 'UnityBase',
      loginWindowTopLogoURL: '',
      loginWindowBottomLogoURL: '',
      themeName: 'UBGrayTheme',
      userDbVersion: null,
      defaultLang: 'en',
      supportedLanguages: ['en'],
      uiSettings: {}
    }, appInfo)
    // create ubNotifier after retrieve appInfo (we need to know supported WS protocols)
    connection.ubNotifier = new UBNotifierWSProtocol(connection)
    // try to determinate default user language
    let preferredLocale = null
    if (LDS) {
      preferredLocale = LDS.getItem(ubUtils.LDS_KEYS.PREFERRED_LOCALE)
    }
    if (!preferredLocale) {
      preferredLocale = connection.appConfig.defaultLang
    }
    // is language supported by application?
    if (connection.appConfig.supportedLanguages.indexOf(preferredLocale) === -1) {
      preferredLocale = connection.appConfig.defaultLang
    }
    connection.preferredLocale = preferredLocale
    // localize application mae

    const adminUICfg = connection.appConfig.uiSettings.adminUI
    if (adminUICfg.applicationName) {
      const appName = (typeof adminUICfg.applicationName === 'string')
        ? adminUICfg.applicationName
        : adminUICfg.applicationName[connection.preferredLocale]
      if (appName) connection.appConfig.applicationName = appName
    }
    return config.onGotApplicationConfig ? config.onGotApplicationConfig(connection) : true
  }).then(function () {
    return connection.initCache(connection.appConfig.userDbVersion)
  }).then(function () {
    return connection.authorize()
  }).then(function () {
    // here we authorized and know a user-related data
    const myLocale = connection.userData('lang')
    LDS && LDS.setItem(ubUtils.LDS_KEYS.PREFERRED_LOCALE, myLocale)
    connection.preferredLocale = myLocale
    let domainPromise = connection.getDomainInfo()
    if (config.onGotApplicationDomain) {
      domainPromise = domainPromise.then((domain) => {
        config.onGotApplicationDomain(domain)
        return domain
      })
    }
    return domainPromise
  }).then(function (domain) {
    connection.domain = domain
    return connection
  })
}

/**
 * Helper function for building `rq` parameter value for ubql entpoint.
 * Takes into account the same method calls sequences. Limit URI length.
 * @private
 * @param {Array<ubRequest>} reqData
 */
function buildUriQueryPath (reqData) {
  const L = reqData.length
  if (!L) return ''
  if (L === 1) return `${reqData[0].entity}.${reqData[0].method}`
  if (L) {
    const methodsArr = []
    methodsArr.push(`${reqData[0].entity}.${reqData[0].method}`)
    let i = 1
    while (i < L) {
      // repeatable methods
      if ((reqData[i].entity === reqData[i - 1].entity) &&
        (reqData[i].method === reqData[i - 1].method)) {
        let repeats = 1
        do {
          repeats++
          i++
        } while ((i < L) && (reqData[i].entity === reqData[i - 1].entity) && (reqData[i].method === reqData[i - 1].method))
        methodsArr.push(repeats)
      }
      if (i < L) {
        methodsArr.push(`${reqData[i].entity}.${reqData[i].method}`)
        if (methodsArr.length > 20) { // in any case limit a URI length
          methodsArr.push('**')
          break
        }
        i++
      }
    }
    return methodsArr.join('*')
  }
}

module.exports.UBConnection = UBConnection
module.exports.connect = connect
