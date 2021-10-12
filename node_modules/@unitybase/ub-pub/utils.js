/**
 * Utility functions for @unitybase/ub-pub module
 *
 * @module utils
 * @memberOf module:@unitybase/ub-pub
 * @author UnityBase team
 */

/* global FileReader, Blob */
const i18n = require('./i18n')

/**
 * see docs in ub-pub main module
 * @private
 * @param {Object} objectTo The receiver of the properties
 * @param {...Object} objectsFrom The source(s) of the properties
 * @return {Object} returns objectTo
 */
module.exports.apply = function (objectTo, objectsFrom) {
  Array.prototype.forEach.call(arguments, function (obj) {
    if (obj && obj !== objectTo) {
      Object.keys(obj).forEach(function (key) {
        objectTo[key] = obj[key]
      })
    }
  })
  return objectTo
}

const FORMAT_RE = /{(\d+)}/g
/**
 * see docs in ub-pub main module
 * @private
 * @param {String} stringToFormat The string to be formatted.
 * @param {...*} values The values to replace tokens `{0}`, `{1}`, etc in order.
 * @return {String} The formatted string.
 */
module.exports.format = function (stringToFormat, ...values) {
  return stringToFormat.replace(FORMAT_RE, function (m, i) {
    return values[i]
  })
}

/**
 * see docs in ub-pub main module
 * @private
 * @param {String} namespacePath
 * @return {Object} The namespace object.
 */
module.exports.ns = function (namespacePath) {
  let root = window
  let parts, part, j, subLn

  parts = namespacePath.split('.')

  for (j = 0, subLn = parts.length; j < subLn; j++) {
    part = parts[j]
    if (!root[part]) root[part] = {}
    root = root[part]
  }
  return root
}

/**
 * see docs in ub-pub main module
 * @private
 * @param value
 * @returns {Date}
 */
module.exports.iso8601Parse = function (value) {
  return value ? new Date(value) : null
}

/**
 * see docs in ub-pub main module
 * @private
 * @param v Value to convert
 * @returns {Boolean|null}
 */
module.exports.booleanParse = function (v) {
  if (typeof v === 'boolean') return v
  if ((v === undefined || v === null || v === '')) return null
  return v === 1
}

/**
 * see docs in ub-pub main module
 * @private
 * @param {File|ArrayBuffer|String|Blob|Array} data
 * @returns {Promise<string>} resolved to data converted to base64 string
 */
module.exports.base64FromAny = function (data) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    const blob = (data instanceof Blob) ? data : new Blob([data])
    reader.addEventListener('loadend', function () {
      resolve(reader.result.split(',', 2)[1]) // remove data:....;base64, from the beginning of string //TODO -use indexOf
    })
    reader.addEventListener('error', function (event) {
      reject(event)
    })
    reader.readAsDataURL(blob)
  })
}

/**
 * see docs in ub-pub main module
 * @private
 * @param {File} file
 * @returns {Promise<Uint8Array>} resolved to file content as Uint8Array
 */
module.exports.file2Uint8Array = function (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = function () {
      resolve(new Uint8Array(reader.result))
    }
    reader.onerror = function (reason) {
      reject(reason)
    }
    reader.readAsArrayBuffer(file)
  })
}

const BASE64STRING = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const BASE64ARR = [];
(function () {
  for (let i = 0, l = BASE64STRING.length - 1; i < l; i++) {
    BASE64ARR.push(BASE64STRING[i])
  }
})()

const BASE64DECODELOOKUP = new Uint8Array(256);
(function () {
  for (let i = 0, l = BASE64STRING.length; i < l; i++) {
    BASE64DECODELOOKUP[BASE64STRING[i].charCodeAt(0)] = i
  }
})()

/**
 * see docs in ub-pub main module
 * @private
 * @param {String} base64
 * @returns {ArrayBuffer}
 */
module.exports.base64toArrayBuffer = function (base64) {
  let bufferLength = base64.length * 0.75
  const len = base64.length
  let p = 0
  let encoded1, encoded2, encoded3, encoded4

  if (base64[base64.length - 1] === '=') {
    bufferLength--
    if (base64[base64.length - 2] === '=') bufferLength--
  }

  const arrayBuffer = new ArrayBuffer(bufferLength)
  const bytes = new Uint8Array(arrayBuffer)

  for (let i = 0; i < len; i += 4) {
    encoded1 = BASE64DECODELOOKUP[base64.charCodeAt(i)]
    encoded2 = BASE64DECODELOOKUP[base64.charCodeAt(i + 1)]
    encoded3 = BASE64DECODELOOKUP[base64.charCodeAt(i + 2)]
    encoded4 = BASE64DECODELOOKUP[base64.charCodeAt(i + 3)]

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4)
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2)
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63)
  }

  return arrayBuffer
}

/**
 * UnityBase client-side exception.
 * Such exceptions will not be showed as unknown error in {@link UB#showErrorWindow UB.showErrorWindow}
 * @example

 // in adminUI will show message box with text:
 // "Record was locked by other user. It\'s read-only for you now"
 throw new UB.UBError('lockedBy')

 * @param {String} message Message can be either localized message or locale identifier - in this case UB#showErrorWindow translate message using {@link UB#i18n}
 * @param {String} [detail] Error details
 * @param {Number} [code] Error code (for server-side errors)
 * @extends {Error}
 */
function UBError (message, detail, code) {
  this.name = 'UBError'
  this.detail = detail
  this.code = code
  this.message = message || 'UBError'
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, UBError)
  } else {
    this.stack = (new Error()).stack
  }
}

UBError.prototype = new Error()
UBError.prototype.constructor = UBError

module.exports.UBError = UBError

/**
 * Quiet exception. Global error handler does not show this exception for user. Use it for silently reject promise.
 * @param {String} [message] Message
 * @param {String} [detail] Error details
 * @extends {Error}
 */
function UBAbortError (message, detail) {
  this.name = 'UBAbortError'
  this.detail = detail
  this.code = 'UBAbortError'
  this.message = message || 'UBAbortError'
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, UBAbortError)
  } else {
    this.stack = (new Error()).stack
  }
}

UBAbortError.prototype = new Error()
UBAbortError.prototype.constructor = UBAbortError

module.exports.UBAbortError = UBAbortError

/**
 *  Parse error and translate message using {@link UB#i18n i18n}
 * @param {string|Object|Error|UBError} errMsg  message to show
 * @param {string} [errCode] (Optional) error code
 * @param {string} [entityCode] (Optional) entity code
 * @param {string} detail erro detail
 * @return {{errMsg: string, errCode: *, entityCode: *, detail: *|string}}
 */
module.exports.parseUBError = function (errMsg, errCode, entityCode, detail) {
  let errDetails = detail || ''
  if (errMsg && errMsg instanceof UBError) {
    errCode = errMsg.code
    errDetails = errMsg.detail
    if (errMsg.stack) {
      errDetails += '<br/>stackTrace:' + errMsg.stack
    }
    errMsg = errMsg.message
  } else if (errMsg instanceof Error) {
    if (errMsg.stack) {
      errDetails += '<br/>stackTrace:' + errMsg.stack
    }
    errMsg = errMsg.toString()
  } else if (errMsg && (typeof errMsg === 'object')) {
    errCode = errMsg.errCode
    entityCode = errMsg.entity
    errMsg = errMsg.errMsg ? errMsg.errMsg : JSON.stringify(errMsg)
    errDetails = errMsg.detail || errDetails
  }
  return {
    errMsg: i18n.i18n(errMsg),
    errCode: errCode,
    entityCode: entityCode,
    detail: errDetails
  }
}

/**
 * Log message to console (if console available)
 * @method
 * @param {...*} msg
 */
module.exports.log = function log (msg) {
  if (console) console.log.apply(console, arguments)
}

/**
 * Log error message to console (if console available)
 * @method
 * @param {...*} msg
 */
module.exports.logError = function logError (msg) {
  if (console) {
    console.error.apply(console, arguments)
  }
}

/**
 * Log warning message to console (if console available)
 * @method
 * @param {...*} msg
 */
module.exports.logWarn = function logWarn (msg) {
  if (console) {
    console.warn.apply(console, arguments)
  }
}

/**
 * Log debug message to console.
 * Since it binds to console, can also be used to debug Promise resolving in this way:
 *
 *      UB.get('timeStamp').then(UB.logDebug);
 *
 * @method
 * @param {...*} msg
 */
module.exports.logDebug = console.info.bind(console)

const userAgent = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent.toLowerCase() : 'nodeJS'
/** @type {String} */
module.exports.userAgent = userAgent.toLowerCase()
/** @type {Boolean} */
module.exports.isChrome = /\bchrome\b/.test(userAgent)
/** @type {Boolean} */
module.exports.isWebKit = /webkit/.test(userAgent)
/** @type {Boolean} */
module.exports.isGecko = !/webkit/.test(userAgent) && /gecko/.test(userAgent)
/** @type {Boolean} */
module.exports.isOpera = /opr|opera/.test(userAgent)
/** @type {Boolean} */
module.exports.isMac = /macintosh|mac os x/.test(userAgent)
/** @type {Boolean} */
module.exports.isSecureBrowser = /\belectron\b/.test(userAgent)
/** @type {Boolean} */
module.exports.isReactNative = (typeof navigator !== 'undefined' && navigator.product === 'ReactNative')
/** @type {Boolean} */
module.exports.isNodeJS = /nodeJS/.test(userAgent)

/**
 * localDataStorage keys used by @unitybase-ub-pub (in case of browser environment)
 */
module.exports.LDS_KEYS = {
  /**
   * Authentication schema used by user during last logon
   */
  LAST_AUTH_SCHEMA: 'lastAuthType',
  /**
   * In case stored value is 'true' then login using Negotiate without prompt
   */
  SILENCE_KERBEROS_LOGIN: 'silenceKerberosLogin',
  /**
   * Last logged in user name (login)
   */
  LAST_LOGIN: 'lastLogin',
  /**
   * In case stored value is 'true' then used call logout directly (i.e. press logout button)
   */
  USER_DID_LOGOUT: 'userDidLogout',
  /**
   * In case document url is set using URI Schema, for example `document.location.href="ms-word:ofv|u|http://...."`
   * window.onbeforeunload should skip call og App.logout(). Since we do not have access to the target URL inside onbeforeunload event
   * caller must set this flar in localstorage to `true` to prevent log out of current user
   */
  PREVENT_CALL_LOGOUT_ON_UNLOAD: 'preventLogoutOnUnload',
  /**
   * locale, preferred by user. Empty in case of first login
   */
  PREFERRED_LOCALE: 'preferredLocale'
}
