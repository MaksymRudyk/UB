const App = require('./App')

/**
 * @param {THTTPResponse} resp
 * @param {string} [reason]
 * @return {boolean}
 * @deprecated Use `resp.badRequest(reason)`
 * @private
 */
function badRequest (resp, reason) {
  return resp.badRequest(reason)
}

/**
 * @param {THTTPResponse} resp
 * @param {string} reason
 * @return {boolean}
 * @deprecated Use `resp.notFound(reason)`
 * @private
 */
function notFound (resp, reason) {
  return resp.notFound(reason)
}

const PROXY_SEND_FILE_HEADER = App.serverConfig.httpServer['reverseProxy']['sendFileHeader']
const PROXY_SEND_FILE_LOCATION_ROOT = App.serverConfig.httpServer['reverseProxy']['sendFileLocationRoot']

module.exports = {
  badRequest,
  notFound,
  PROXY_SEND_FILE_HEADER,
  PROXY_SEND_FILE_LOCATION_ROOT
}
