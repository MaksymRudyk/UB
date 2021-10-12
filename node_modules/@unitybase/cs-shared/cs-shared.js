const CustomRepository = require('./CustomRepository')
const LocalDataStore = require('./LocalDataStore')
const UBDomain = require('./UBDomain')
const UBSession = require('./UBSession')
const formatByPattern = require('./formatByPattern')

/**
 * Contains classes, common for CLI, server-side and browser side
 * @module @unitybase/cs-shared
 */
module.exports = {
  /**
   * Ancestor for Browser/NodeJS ClientRepository and server side ServerRepository
   * @type {CustomRepository}
   */
  CustomRepository,
  /**
   * Helper class for manipulation with data, stored locally in ({@link TubCachedData} format)
   * @type {module:LocalDataStore}
   */
  LocalDataStore,
  /**
   * Domain metadata
   * @type {UBDomain}
   */
  UBDomain,
  /**
   * User session for connection to UB server
   * @type {UBSession}
   */
  UBSession,
  /**
   * Dates and Numbers formatting using Intl
   */
  formatByPattern
}
