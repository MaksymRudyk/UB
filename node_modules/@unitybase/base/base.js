const argv = require('./argv')
const options = require('./options')
const ServerRepository = require('./ServerRepository')
const SyncConnection = require('./SyncConnection')
const csv1 = require('./csv1')
const dataLoader = require('./dataLoader')
const FileBasedStoreLoader = require('./FileBasedStoreLoader')
const Worker = require('./worker')
// eslint-disable-next-line camelcase
const uba_common = require('./uba_common')
const { createDBConnectionPool, releaseDBConnectionPool } = require('./DBConnections')
/**
 * Classes, common for CLI and server side
 * @module @unitybase/base
 */
module.exports = {
  /**
   * Numeric representation of process.version. For example 'v5.14.1' -> 5014001
   * @type {number}
   */
  ubVersionNum: process.version.slice(1).split('.').map(v => parseInt(v, 10)).reduce((acum, v) => acum*1000 + v),
  /**
   * Command-line utils for connecting to a UnityBase server
   * @type {module:argv}
   * @type {argv}
   */
  argv: argv,
  /**
   * Parse a command line options & environment variables
   * @type {module:options}
   */
  options: options,
  /**
   * Server side & CLI side Repository
   * @type {ServerRepository}
   */
  ServerRepository,
  /**
   * Synchronous connection to external UB server
   * @type {SyncConnection}
   */
  SyncConnection,
  /**
   * CSV data parser
   * @type {module:csv1}
   */
  csv: csv1,
  /**
   * Bulk data loader from CSV/arrays
   * @type {module:dataLoader}
   * @type {dataLoader}
   */
  dataLoader: dataLoader,
  /**
   * ORM **select** method implementation using files as a data source.
   * Used for loading files & transforming it content to {@link module:LocalDataStore.TubCachedData TubCachedData} format
   * @type {module:FileBasedStoreLoader}
   */
  FileBasedStoreLoader,
  /**
   * Execute a script in a dedicated thread
   * @type {Worker}
   */
  Worker,
  /**
   * Constants for administrative security model
   * @type {module:uba_common}
   * @type {uba_common}
   */
  uba_common,
  /**
   * Create a database connection pool from current config
   */
  createDBConnectionPool,
  /**
   * Release previously created connection pool
   */
  releaseDBConnectionPool,
  /**
   * Allows to define a tokenized string and pass an arbitrary number of arguments to replace the tokens.  Each
   * token must be unique, and must increment in the format {0}, {1}, etc.
   * @example
   *
   *     var s = UB.format('{1}/lang-{0}.js', 'en', 'locale');
   *     // s now contains the string: ''locale/lang-en.js''
   *
   * @deprecated Use a ES6 template string literal instead
   * @param {String} stringToFormat The string to be formatted.
   * @param {...*} values The values to replace tokens `{0}`, `{1}`, etc in order.
   * @return {String} The formatted string.
   * @private
   */
  format: function (stringToFormat, ...values) {
    const FORMAT_RE = /{(\d+)}/g
    return stringToFormat.replace(FORMAT_RE, function (m, i) {
      return values[i]
    })
  },
  /**
   * File modified time for files installed by npm
   */
  NPM_EPOCH: new Date('1985-10-26T08:15:00Z').getTime(),
  /**
   * Well known keys used to store data in the App.globalCache
   */
  GC_KEYS: {
    /**
     * Key for storing last modification date-time of the models files.
     * Used by ubm_form / ubs_report virtual entities to refresh a server-side in-memory form/report cache.
     * Virtual entities what depends on file system should refresh this value on insert/update/delete
     */
    MODELS_MODIFY_DATE: 'UB_STATIC.modelsModifyDate',
    /** Key prefix for storing a compiled index.html (used by adminui-reg). Actual index name added after this text */
    COMPILED_INDEX_: 'UB_STATIC.compiled_index_',
    /** Key for storing CSP NONCE generated for compiled index.html */
    COMPILED_INDEX_NONCE: 'UB_STATIC.index_cspNonce',
    /** Key prefix for storing actual file path & type for success request to `models` endpoint */
    UB_MODELS_REQ_: 'UB.MODELS_REQ_',
    /** Key prefix for cache actual file path & type for success request to `clientRequire` endpoint */
    UB_CLIENT_REQ_: 'UB.CLIENT_REQ_',
    /** Key prefix for cache `allLocales` endpoint. Suffix is a language */
    UB_LOCALE_REQ_: 'UB.LOCALE_',

    /** Key prefix for storing flags for running schedulers tasks; Value === 1 in case task in running */
    UBQ_TASK_RUNNING_: 'UBQ.TASK_RUNNING_',
    /** In case schedulers Worker is initialized value is `yes` */
    UBQ_SCHEDULER_INITIALIZED: 'UBQ.schedulersInitialized'
  }
}
