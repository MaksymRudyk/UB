/**
 * @author pavel.mash
 * Date: 23.01.14
 * This test connect to UB server and do select for all entities
 */
const assert = require('assert')
const ok = assert.ok
const cmdLineOpt = require('@unitybase/base').options
const argv = require('@unitybase/base').argv
const TEST_NAME = 'Select from all entities'

module.exports = function runTest (options) {
  if (!options) {
    const opts = cmdLineOpt.describe('', TEST_NAME)
      .add(argv.establishConnectionFromCmdLineAttributes._cmdLineParams)
    options = opts.parseVerbose({}, true)
    if (!options) return
  }

  const session = argv.establishConnectionFromCmdLineAttributes(options)
  const conn = session.connection

  try {
    console.debug('Start ' + TEST_NAME)
    testAllSelect(conn)
  } finally {
    // session.logout()
  }

  /**
   *
   * @param {SyncConnection} conn
   */
  function testAllSelect (conn) {
    let recCnt = 0
    let ettCnt = 0
    const domain = conn.getDomainInfo()
    domain.eachEntity(function (entity, eName) {
      if (entity.haveAccessToMethod('select')) {
        console.debug('run select for %s', eName)
        const defaultViewAttrs = []
        entity.eachAttribute((attr, name) => {
          if (attr.defaultView || (attr.name === 'ID')) {
            defaultViewAttrs.push(name)
          }
        })
        const res = conn.Repository(eName).attrs(defaultViewAttrs).limit(10).selectAsArray()
        ok(typeof res === 'object' && res.resultData &&
          res.resultData.data && Array.isArray(res.resultData.data) &&
          res.resultData.rowCount === +res.resultData.rowCount, 'result is dataStore in array representation. Entity: ' + eName)
        recCnt += res.resultData.rowCount
        ettCnt++
      } else {
        console.debug('run select for %s. No "select" method permission. Test skipped', eName)
      }
    })
    console.debug('Entity tested %d. Rows selected %d', ettCnt, recCnt)
  }
}
