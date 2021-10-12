const options = require('./options')
const fs = require('fs')
const http = require('http')
const SyncConnection = require('./SyncConnection')

if (!global.__UB_int) {
  throw new Error('Please, update a server to UB@5.20 or up')
}

/**
 * Command-line utils for connecting to a UnityBase server
 * @example

const argv = require('@unitybase/base').argv
// connect to server
let session = argv.establishConnectionFromCmdLineAttributes()
console.log('Session.uData:', session.uData, typeof session.uData, session.uData.lang)

let userLang = session.uData.lang
let conn = session.connection
// obtain domain information
const domainInfo = conn.getDomainInfo()

 * @module argv
 * @memberOf module:@unitybase/base
 */
module.exports = {
  safeParseJSONfile: safeParseJSONfile,
  /**
   * @deprecated Use `options.switchIndex` instead.
   * @param {string} switchName
   * @returns {Number} switch index if found or -1 otherwise
   */
  findCmdLineSwitch: options.switchIndex,
  /**
   * @deprecated Use `options.switchValue` instead.
   * @param {string} switchName
   * @returns {String} switch value or `undefined` in case switch not found or switch not have value
   */
  findCmdLineSwitchValue: options.switchValue,
  getConfigFileName: getConfigFileName,
  serverSessionFromCmdLineAttributes: serverSessionFromCmdLineAttributes,
  establishConnectionFromCmdLineAttributes: establishConnectionFromCmdLineAttributes,
  checkServerStarted: checkServerStarted,
  getServerConfiguration,
  setServerConfiguration,
  serverURLFromConfig: serverURLFromConfig
}

/* global removeCommentsFromJSON, startServer, stopServer */

/**
 * Get config file name. if -cfg switch passed then use this switch value, else use default
 * @return {String}
 */
function getConfigFileName () {
  return global.__UB_int.getConfigFileName()
}

const verboseMode = options.switchIndex('noLogo') === -1

/**
 * @class ServerSession
 */
function ServerSession (config) {
  /**
   * @type {String}
   * @readonly
   */
  this.HOST = config.host
  /**
   * @type {String}
   * @readonly
   */
  this.USER = config.user
  /**
   * @type {String}
   * @readonly
   */
  this.PWD = config.pwd
  /**
   * Custom user data returned by server login method
   * @type {String}
   * @readonly
   */
  this.uData = null
  this.__serverStartedByMe = false
  /**
   * @type {SyncConnection}
   */
  this.connection = null
  /**
   * Shut down server in case it started during connection establish or logout from remote server
   * @method
   */
  this.logout = function () {
    if (this.__serverStartedByMe) {
      if (verboseMode) console.info('Shut down local server')
      stopServer()
    } else {
      this.connection.logout()
    }
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Result of `getAppInfo` endpoint execution
   * @type {Object}
   */
  this.appInfo = {}
}

/**
 * Parse cmd line and environment variables for command line parameters expected by UnityBase `cmd` mode
 * @return {ServerSession}
 */
function serverSessionFromCmdLineAttributes (config) {
  if (!config) {
    config = options.describe('', '').add(establishConnectionFromCmdLineAttributes._cmdLineParams).parse()
  }
  if ((config.pwd === '-') && (config.user !== 'root')) {
    throw new Error('Password (-p password) required for non-root user')
  }
  return new ServerSession(config)
}

/**
 * Service function for establish UnityBase server connection from client-side command line script.
 * Parse command line attributes for switches `host`, `u`, `p` and:
 *
 *  - Check specified server is started (simple request to `host`) and if not started then
 *      start server locally with local config
 *  - Establish connection to specified host
 *  - Retrieve application information and in case authorization is required then call login method using `u` and `p` params
 *  - Return serverSession object with connection in case of success or throw assertion error
 * @param {Object} [config]
 * @param {String} [config.host]
 * @param {String} [config.user]
 * @param {String} [config.pwd]
 * @param {Boolean} [config.forceStartServer=false] If we sure local server not started - start it without checking. Faster because check take near 2 sec.
 * @param {number} [config.timeout=30000] Receive timeout in ms
 * @return {ServerSession}
 */
function establishConnectionFromCmdLineAttributes (config) {
  if (!config) { // for a backward compatibility with UB 1.11
    config = options.describe('', '').add(establishConnectionFromCmdLineAttributes._cmdLineParams).parseVerbose()
    if (!config) throw new Error('Invalid command line arguments')
  }
  if (config.host === 'auto') {
    const appConfig = getServerConfiguration(false)
    config.host = serverURLFromConfig(appConfig)
  }
  const serverSession = serverSessionFromCmdLineAttributes(config)

  if (config.forceStartServer) {
    console.info('Force server starting')
    if (startServer()) {
      console.log('Local server started')
    } else {
      throw new Error('Can\'t start server')
    }
    serverSession.__serverStartedByMe = true
  } else {
    const serverStarted = checkServerStarted(serverSession.HOST)
    if (serverStarted) {
      if (verboseMode) console.info('Server is running - use started server instance')
    } else {
      if (verboseMode) console.info('Server not started - start local server instance')
      if (startServer()) {
        console.log('Local server started')
      } else {
        throw new Error('Can\'t start server')
      }
      serverSession.__serverStartedByMe = true
    }
  }

  if (config.timeout) {
    http.setGlobalConnectionDefaults({ receiveTimeout: parseInt(config.timeout, 10) })
  }
  const conn = serverSession.connection = new SyncConnection({ URL: serverSession.HOST })
  const appInfo = conn.getAppInfo()
  // allow anonymous login in case no UB auth method for application
  if (config.user === 'root') {
    conn.onRequestAuthParams = function () {
      return { authSchema: 'ROOT' }
    }
  } else if (appInfo.authMethods.indexOf('UB') !== -1) {
    conn.onRequestAuthParams = function () {
      return { login: serverSession.USER, password: serverSession.PWD }
    }
  }
  serverSession.appInfo = appInfo
  if (verboseMode) {
    console.info('Connected to ', serverSession.HOST)
  }

  return serverSession
}

/**
 * Options config for establishing connection from command line parameters
 * @type {Array<Object>}
 */
establishConnectionFromCmdLineAttributes._cmdLineParams = [
  { short: 'host', long: 'host', param: 'fullServerURL', defaultValue: 'auto', searchInEnv: true, help: 'Full server URL. If not passed - will try to read host from ubConfig' },
  { short: 'u', long: 'user', param: 'userName', searchInEnv: true, help: 'User name' },
  { short: 'p', long: 'pwd', param: 'password', defaultValue: '-', searchInEnv: true, help: 'User password. Required for non-root' },
  { short: 'cfg', long: 'cfg', param: 'localServerConfig', defaultValue: 'ubConfig.json', searchInEnv: true, help: 'Path to the UB server config' },
  { short: 'timeout', long: 'timeout', param: 'timeout', defaultValue: 120000, searchInEnv: true, help: 'HTTP Receive timeout in ms' }
]

/**
 * Perform check somebody listen on URL
 * @param {String} URL
 * @return {boolean}
 */
function checkServerStarted (URL) {
  const http = require('http')
  if (verboseMode) console.info('Check server is running...')
  try {
    const resp = http.get({ URL: URL + '/getAppInfo', connectTimeout: 1000, receiveTimeout: 1000, sendTimeout: 1000 }) // dummy
    if (verboseMode) console.info('STATUS', resp.statusCode)
    return resp.statusCode === 200
  } catch (e) {}
  return false
}

/**
 * Read server configuration from file, resolved by {@link getConfigFileName}
 * parse it in safe mode, replace environment variables by it values and return parsed config
 *
 * In server thread use `App.serverConfig` to read already parsed server configuration.
 *
 * @param {boolean} [forFutureSave=false] If true will return config ready to save back as new ubConfig
 *  (do not add props model.browser & model.version)
 * @return {Object}
 */
function getServerConfiguration (forFutureSave = false) {
  return global.__UB_int.getServerConfiguration(forFutureSave)
}

/**
 * Set a configuration for native part of UB server
 * WARNING - in case domain already initialized by native this value is ignored until stopServer() is called
 * @param {string|Object} newCfg
 */
function setServerConfiguration (newCfg) {
  if (typeof newCfg === 'string') {
    process.cachedConfigStr = newCfg
  } else {
    process.cachedConfigStr = JSON.stringify(newCfg, null, '\t')
  }
}

/**
 * Return a URL server actually listen on
 * @param {Object} config Server configuration
 */
function serverURLFromConfig (config) {
  const httpCfg = config.httpServer || {}
  let rUrl = (httpCfg.protocol && httpCfg.protocol === 'https') ? 'https://' : 'http://'
  // in case of serverDomainNames in [+, *] replace it to localhost
  rUrl += httpCfg.host ? (httpCfg.host.length === 1 ? 'localhost' : httpCfg.host) : 'localhost'
  if (httpCfg.port) rUrl += ':' + httpCfg.port
  if (httpCfg.path) rUrl += '/' + httpCfg.path
  return rUrl
}

/**
 * JSON file parsing, allow to parse semi-JSON files with comments. In case of errors inside JSON show detailed error description
 * @param {String} fileName
 * @param {Boolean} [allowMultiLineString=false] Replace `\n` before parse (not compatible with JSON format, but multiline string is useful)
 * @param {Function} [preprocessor] Optional function accept file content transform it and return new content
 * @return {Object}
 */
function safeParseJSONfile (fileName, allowMultiLineString, preprocessor) {
  let content = fs.readFileSync(fileName, 'utf8')
  if (preprocessor) content = preprocessor(content)
  content = removeCommentsFromJSON(content)
  try {
    return JSON.parse(content)
  } catch (e) {
    console.error('Error parsing JSON file', fileName, e.message)
    fs.writeFileSync(fileName + '.bak', content)
    console.error('Processed file is saved to "' + fileName + '.bak"')
    throw e
  }
}
