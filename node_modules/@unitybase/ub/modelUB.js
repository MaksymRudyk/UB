const EventEmitter = require('events').EventEmitter
const UBDomain = require('@unitybase/cs-shared').UBDomain
const ServerRepository = require('@unitybase/base').ServerRepository
const repositoryFabric = ServerRepository.fabric // for backward compatibility with UB 1.7
const App = require('./modules/App')
const Session = require('./modules/Session')
const format = require('@unitybase/base').format
const blobStores = require('@unitybase/blob-stores')
const TubDataStore = require('./TubDataStore')
const Errors = require('./modules/ubErrors')
// TODO - this hack is required for register UB.getWSNotifier. Must be rewrites
const ws = require('./modules/web-sockets')
const mI18n = require('./modules/i18n')
const modelLoader = require('./modules/modelLoader')
const mixinsFactory = require('./modules/mixinsFactory')
const _ = require('lodash')

const LANGS_SET = new Set(App.serverConfig.application.domain.supportedLanguages)
const FORMAT_RE = /{([0-9a-zA-Z_]+)}/g

// if (typeof global['UB'] !== 'undefined') throw new Error('@unitybase/ub already required')
/**
 * @module @unitybase/ub
 */
const UB = module.exports = {
  /**
   * If we are in UnityBase server scripting (both -f or server thread) this property is true, if in browser - undefined or false.
   * Use it for check execution context in scripts, shared between client & server.
   * To check we are in server thread use process.isServer.
   * @readonly
   */
  isServer: true,
  /**
   * Server-side Abort exception. To be used in server-side logic in case of HANDLED
   * exception. This errors logged using "Error" log level to prevent unnecessary
   * EXC log entries.
   * @property {UBAbort} UBAbort
   */
  UBAbort: Errors.UBAbort,
  /**
   * Server-side Security exception. Throwing of such exception will trigger
   * `Session.securityViolation` event
   * @propety {ESecurityException} ESecurityException
   */
  ESecurityException: Errors.ESecurityException,
  /**
   * Creates namespaces to be used for scoping variables and classes so that they are not global.
   * @example

UB.ns('DOC.Report');
DOC.Report.myReport = function() { ... };

   * @deprecated Try to avoid namespaces - instead create a module and use require()
   * @param {String} namespacePath
   * @return {Object} The namespace object.
   */
  ns: ns,
  format: format,
  /**
   * Create new instance of {@link ServerRepository}
   *
   * @param {String} entityName
   * @param {Object} [cfg]
   * @param {SyncConnection} [connection] Pass in case of remote UnityBase server connection.
   * @returns {ServerRepository}
   */
  Repository: function (entityName, cfg, connection) {
    connection = connection || global.conn
    return repositoryFabric(entityName, connection)
  },
  getWSNotifier: ws.getWSNotifier,
  /**
   * Information about the logged in user
   * @property {Session} Session
   */
  Session: Session,
  /**
   * Construct new data store
   * @param {string} entityCode
   * @return {TubDataStore}
   */
  DataStore: function (entityCode) {
    return new TubDataStore(entityCode)
  },
  /**
   * Return locale-specific resource from it identifier.
   * Resources are defined by {@link module:@unitybase/ub#i18nExtend UB.i18nExtend}
   *
   * In case firs element of args is a string with locale code supported by application then translate to specified locale,
   * in other case - to locale of the current user (user who done the request to the server)
   *
   * Localized string can be optionally formatted by position args
   *
   * @example

UB.i18nExtend({
  "en": { greeting: 'Hello {0}, welcome to {1}' },
  "ru": { greeting: 'Привет {0}, добро пожаловать в {1}' }
})
UB.i18n('greeting', 'Mark', 'Kiev') // in case current user language is en -> "Hello Mark, welcome to Kiev"
UB.i18n('greeting', 'uk', 'Mark', 'Kiev') // in case ru lang is supported -> "Привет Mark, добро пожаловать в Kiev"

   * @param {String} msg Message to translate
   * @param {...*} args Format args
   * @returns {*}
   */
  i18n: function i18n (msg, ...args) {
    let lang = args[0]
    if (lang && LANGS_SET.has(lang)) {
      args.shift() // first element is language
    } else {
      lang = Session.userLang || App.defaultLang
    }
    const res = mI18n.lookup(lang, msg)
    if (args && args.length && (typeof res === 'string')) {
      // key-value object
      if ((args.length === 1) && (typeof args[0] === 'object')) {
        const first = args[0]
        return res.replace(FORMAT_RE, function (m, k) {
          return _.get(first, k)
        })
      } else { // array of values
        return res.replace(FORMAT_RE, function (m, i) {
          return args[i]
        })
      }
    } else {
      return res
    }
  },
  /**
   * Merge localizationObject to UB.i18n
   * @example

const UB = require('@unitybase/ub')
UB.i18nExtend({
 "en": {yourMessage: "yourTranslationToEng", ...},
 "uk": {yourMessage: "yourTranslationToUk", ...},
  ....
})
// if logged in user language is `en` will output "yourTranslationToEng"
console.log(UB.i18n(yourMessage))
// will output "yourTranslationToUk"
console.log(UB.i18n(yourMessage, 'uk'))

   * @param {Object} localizationObject
   */
  i18nExtend: mI18n.extend,
  /**
   * For UB < 4.2 compatibility -  require all non - entity js
   * in specified folder add it's subfolder (one level depth),
   * exclude `modules` and `node_modules` subfolder's.
   * From 'public' subfolder only cs*.js are required.
   * To be called in model index.js as such:
   *
   *   const UB = require('@unitybase/ub')
   *   UB.loadLegacyModules(__dirname)
   *
   * For new models we recommend to require non-entity modules manually
   *
   * @param {String} folderPath
   * @param {Boolean} isFromPublicFolder
   * @param {number} depth Current recursion depth
   */
  loadLegacyModules: modelLoader.loadLegacyModules,
  /**
   * Application instance
   * @property {ServerApp} App
   */
  App: App,
  start: start,
  /**
   * A way to add additional mixins into domain
   * @param {string} mixinName A name used as "mixins" section key inside entity *.meta file
   * @param {MixinModule} mixinModule A module what implements a MixinModule interface
   */
  registerMixinModule: mixinsFactory.registerMixinModule
}

/**
 * Initialize UnityBase application:
 *  - create namespaces (global objects) for all `*.meta` files from domain
 *  - require all packages specified in config `application.domain.models`
 *  - apply a server-side i18n JSONs from models serverLocale folder
 *  - emit {@link event:domainIsLoaded App.domainIsLoaded} event
 *  - register build-in UnityBase {@link module:@unitybase/ub.module:endpoints endpoints}
 */
function start () {
  normalizeEnums()
  initializeDomain()
  /**
   * @deprecated Use `const UB = require('@unitybase/ub')`
   */
  global.UB = UB
  /**
   * @deprecated Use `const App = require('@unitybase/ub').App`
   */
  global.App = App

  // for each model:
  // - load all entities modules
  // - require a model itself
  const orderedModels = App.domainInfo.orderedModels
  orderedModels.forEach((model) => {
    if (model.realPath && (model.name !== 'UB')) { // UB already loaded by UB.js
      modelLoader.loadEntitiesModules(model.realPath)
      modelLoader.loadServerLocale(model.realPath)
      require(model.realPath)
    }
  })
  mixinsFactory.initializeMixins()
  App.emit('domainIsLoaded')
  blobStores.initBLOBStores(App, Session)

  // ENDPOINTS
  const { clientRequireEp, modelsEp, getAppInfoEp, getDomainInfoEp, staticEp, runSQLEp, restEp, allLocalesEp } = require('./modules/endpoints')
  App.registerEndpoint('getAppInfo', getAppInfoEp, false)
  App.registerEndpoint('models', modelsEp, false)
  App.registerEndpoint('clientRequire', clientRequireEp, false)
  App.registerEndpoint('getDomainInfo', getDomainInfoEp, true)
  App.registerEndpoint('getDocument', blobStores.getDocumentEndpoint, true)
  App.registerEndpoint('setDocument', blobStores.setDocumentEndpoint, true)
  App.registerEndpoint('checkDocument', blobStores.checkDocumentEndpoint, true)
  App.registerEndpoint('runSQL', runSQLEp, true)
  App.registerEndpoint('rest', restEp, true)
  App.registerEndpoint('allLocales', allLocalesEp, false)
  App.registerEndpoint('statics', staticEp, false, true)
}

// normalize ENUMS TubCacheType = {Entity: 1, SessionEntity: 2} => {Entity: 'Entity', SessionEntity: 'SessionEntity'}
function normalizeEnums () {
  const enums = ['TubftsScope', 'TubCacheType', 'TubEntityDataSourceType',
    'TubAttrDataType', 'TubSQLExpressionType', 'TubSQLDialect', 'TubSQLDriver']
  enums.forEach(eN => {
    const e = global[eN]
    if (!e) return
    const vals = Object.keys(e)
    vals.forEach(k => { e[k] = k })
  })
}

// domain initialization
function initializeDomain () {
  const { addEntityMethod } = process.binding('ub_app')
  const { getDomainInfo } = process.binding('ub_app')
  // create scope for all domain objects
  const tempDomain = new UBDomain(getDomainInfo(true))
  tempDomain.eachEntity(entity => {
    const e = global[entity.code] = { }
    Object.defineProperty(e, 'entity', {
      writable: false,
      enumerable: true,
      value: entity
    })
    EventEmitter.call(e)
    Object.assign(e, EventEmitter.prototype)
    e.entity.addMethod = (function (entityCode) {
      return function (methodCode) {
        addEntityMethod(entityCode, methodCode)
      }
    })(entity.code)
  })
  // TODO - validate domain
  // 1) if (FAttr.dataType = adtDocument) and (FAttr.storeName <> '') and
  // ubLog.Add.Log(sllError, 'DomainLoad: Error loading entity "%". A storeName="%" specified in attribute "%" not in defined in application.blobStore config)',
  // 2) fLog.Log(sllInfo, 'Check blob store "%" folder "%": folder exists', [fAppConfig.blobStores[i].name, fAppConfig.blobStores[i].path]);
}

function ns (namespacePath) {
  let root = global
  const parts = namespacePath.split('.')

  for (let j = 0, subLn = parts.length; j < subLn; j++) {
    const part = parts[j]

    if (!root[part]) {
      root[part] = {}
    }
    root = root[part]
  }
  return root
}

/**
 * @type Session
 * @deprecated Use `const Session = require('@unitybase/ub').Session`
 */
Object.defineProperty(global, 'Session', {
  value: Session
})

// legacy 1.12
require('./modules/RLS')

// register mixin
const multitenancyImpl = require('./mixins/multitenancyMixin')
UB.registerMixinModule('multitenancy', multitenancyImpl)

const fsStorageImpl = require('./mixins/fsStorageMixin')
UB.registerMixinModule('fsStorage', fsStorageImpl)

module.exports = UB
