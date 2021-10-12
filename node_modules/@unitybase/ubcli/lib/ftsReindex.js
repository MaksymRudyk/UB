/**
 * Rebuild Full Text Search (FTS) indexes if any
 *
 * Usage from a command line:

      ubcli ftsReindex -?

 * @author pavel.mash
 * @module ftsReindex
 * @memberOf module:@unitybase/ubcli
 */

const http = require('http')
const options = require('@unitybase/base').options
const argv = require('@unitybase/base').argv

module.exports = function ftsReindex (cfg) {
  if (!cfg) {
    const opts = options.describe('ftsReindex', 'Rebuild Full Text Search (FTS) index', 'ubcli')
      .add(argv.establishConnectionFromCmdLineAttributes._cmdLineParams)
      .add({ short: 'e', long: 'entity', param: 'entityCode', defaultValue: '*', help: 'Entity code to rebuild index for. If FTS scope for entity = "Connection" then the same as -c' })
      .add({ short: 'c', long: 'connection', param: 'ftsConnectionName', defaultValue: 'ftsDefault', help: 'Name of connection for index rebuild. ALL entity with this fts.connection will be re-indexed' })
      .add({ short: 'chunk', long: 'chunk', param: 'chunkLength', defaultValue: 10000, help: 'The number of records that can be selected and committed at once' })
      .add({ short: 'limit', long: 'limit', param: 'limitCount', defaultValue: -1, help: 'Limit of re-indexed records for developer or debug purpose. Do not set "limit" in other cases' })
    cfg = opts.parseVerbose({}, true)
    if (!cfg) return
  }
  let req

  // increase receive timeout to 5hours - in case DB server is slow we can easy reach 30s timeout
  http.setGlobalConnectionDefaults({ receiveTimeout: 5 * 60 * 60 * 1000 })
  const session = argv.establishConnectionFromCmdLineAttributes(cfg)
  const conn = session.connection
  let reindexFor = cfg.connection
  const reindexLimit = cfg.limit
  const reindexChunk = cfg.chunk
  if (reindexFor) { // connection
    console.info('Start reindex FTS for connection', reindexFor)
    req = {
      entity: 'fts_' + reindexFor,
      method: 'ftsreindex'
    }
    if (reindexLimit !== -1) {
      req._ftsReindexLimit = reindexLimit
    }
    if (reindexChunk) {
      req._ftsReindexChunk = reindexChunk
    }
  } else if (cfg.entity) { // entity
    reindexFor = cfg.entity
    console.info('Start reindex FTS for entity', reindexFor)
    req = {
      entity: reindexFor,
      method: 'ftsreindex'
    }
    if (reindexLimit !== -1) {
      req._ftsReindexLimit = reindexLimit
    }
    if (reindexChunk) {
      req._ftsReindexChunk = reindexChunk
    }
  } else {
    console.error('Invalid command line cfg. See `>UB cmd/ftsReindex -help` for details')
  }

  try {
    console.time('Reindex time')
    conn.query(req)
    console.timeEnd('Reindex time')
  } finally {
    if (session && session.logout) {
      session.logout()
    }
  }
}

module.exports.shortDoc = 'Rebuild Full Text Search (FTS) indexes'
