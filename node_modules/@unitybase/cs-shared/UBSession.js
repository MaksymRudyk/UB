/**
 * Exports UBSession class, returned as a result of [UB|Sync]Connection.authorize
 * @module UBSession
 * @memberOf module:@unitybase/cs-shared
 * @author pavel.mash
 */
module.exports = UBSession

/* global ncrc32 */

// ***********   !!!!WARNING!!!!! **********************
// Module shared between server and client code
/**
 * Internal class, returned as a result of [UB|Sync]Connection.authorize()
 * The main method is {@link UBSession.signature UBSession.signature()}
 *
 * Developer never create this class directly.
 * @class
 * @protected
 */
function UBSession (authResponse, secretWord, authSchema) {
  const data = authResponse
  const hexa8ID = hexa8(data.result.split('+')[0])
  const userData = data.uData ? JSON.parse(data.uData) : { lang: 'en', login: 'anonymous' }
  const sessionWord = data.result
  const secret = secretWord || ''
  const sessionSaltCRC = (typeof ncrc32 !== 'undefined') ? ncrc32(0, sessionWord + secret) : null

  if (!userData.login) {
    userData.login = data.logonname
  }

  /** @property {String} sessionID user session id converted to {@link UBSession#hexa8}
   * @protected
   * @readonly
   */
  Object.defineProperty(this, 'sessionID', { enumerable: true, writable: false, value: hexa8ID })
  /**
   * User logon name. Better to access this value using {@link SyncConnection#userLogin SyncConnection.userLogin()} method.
   * @type {String}
   * @private
   * @readonly
   */
  this.logonname = data.logonname

  /** Contain custom user data. Usually filled inside **server** `onUserLogon` event handlers
   *
   * Do not use it directly, instead use helper method {@link SyncConnection#userData SyncConnection.userData()} instead.
   *
   * @type {Object}
   * @protected
   * @readonly
   */
  this.userData = userData

  /**
   * Name of authentication schema
   * @type {String}
   * @protected
   * @readonly
   */
  this.authSchema = authSchema || 'UB'

  /**
   * Session signature for authorized request. Can be added as LAST parameter in url, or to Authorization header (preferred way)
   * @example
   *
   *$App.connection.authorize().then(function(session){
   *    // for URL
   *    return 'session_signature=' + session.signature()
   *    //for header
   *    return {Authorization: session.authSchema + ' ' + session.signature()}
   *});
   * @param {boolean} authMock
   * @returns {string}
   */
  this.signature = function (authMock) {
    let hexaTime
    switch (this.authSchema) {
      case 'None':
        return ''
      case 'UBIP':
        return this.logonname
      case 'ROOT':
        return process.rootOTP()
      default:
        hexaTime = hexa8(authMock ? 1 : Math.floor(Date.now() / 1000))
        return authMock
          ? hexa8ID + hexaTime + hexa8(1)
          : hexa8ID + hexaTime + hexa8((typeof ncrc32 !== 'undefined') ? ncrc32(sessionSaltCRC, hexaTime) : crc32(sessionWord + secret + hexaTime)) // + url?
    }
  }

  /**
   * Current session is anonymous session
   * @returns {boolean}
   */
  this.isAnonymous = function () {
    return (this.authSchema === 'None')
  }

  /**
   * Return authorization header
   * @example
   *
   * $App.connection.authorize().then(function(session){
   *     return {Authorization: session.authHeader()}
   * });
   * @param {boolean} [authMock=false]
   * @returns {string}
   */
  this.authHeader = function (authMock) {
    return this.isAnonymous() ? '' : ((this.authSchema === 'Negotiate' ? 'UB' : this.authSchema) + ' ' + this.signature(authMock))
  }
}

/**
 * Return hexadecimal string of 8 character length from value
 * @param {String|Number} value
 * @returns {String}
 */
UBSession.prototype.hexa8 = function hexa8 (value) {
  const num = parseInt(value, 10)
  return isNaN(num) ? '00000000' : num.toString(16).padStart(8, '0')
}
const hexa8 = UBSession.prototype.hexa8

const CRC32_POLYTABLES = {}
let TE // TextEncoder instance

/* jslint bitwise: true */
/**
 * Calculate CRC32 checksum for UTF8 string representation
 * @param {String} s string to calculate CRC32
 * @param {Number} [polynomial] polynomial basis. default to 0x04C11DB7
 * @param {Number} [initialValue] initial crc value. default to 0xFFFFFFFF
 * @param {Number} [finalXORValue] default to 0xFFFFFFFF
 * @returns {Number}
 */
UBSession.prototype.crc32 = function crc32 (s, polynomial, initialValue, finalXORValue) {
  polynomial = polynomial || 0x04C11DB7
  initialValue = initialValue || 0xFFFFFFFF
  finalXORValue = finalXORValue || 0xFFFFFFFF
  let crc = initialValue

  let table = CRC32_POLYTABLES[polynomial]
  if (!table) {
    TE = new TextEncoder()
    table = CRC32_POLYTABLES[polynomial] = (function build () {
      let i, j, c
      const table = []
      const reverse = function (x, n) {
        let b = 0
        while (n) {
          b = b * 2 + x % 2
          x /= 2
          x -= x % 1
          n--
        }
        return b
      }
      for (i = 255; i >= 0; i--) {
        c = reverse(i, 32)

        for (j = 0; j < 8; j++) {
          c = ((c * 2) ^ (((c >>> 31) % 2) * polynomial)) >>> 0
        }

        table[i] = reverse(c, 32)
      }
      return table
    })()
  }

  // allow non english chars by encoding passed string to UTF8
  const utf8Arr = TE.encode(s)
  for (let i = 0, L = utf8Arr.length; i < L; i++) {
    const c = utf8Arr[i]
    const j = (crc % 256) ^ c
    crc = ((crc / 256) ^ table[j]) >>> 0
  }
  return (crc ^ finalXORValue) >>> 0
}
const crc32 = UBSession.prototype.crc32
