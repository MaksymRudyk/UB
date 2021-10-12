/* eslint-disable node/no-deprecated-api */
/**
 * User: felix
 * Date: 26.01.14
 * Check various SQL builder cases
 */
const assert = require('assert')
const cmdLineOpt = require('@unitybase/base').options
const uba = require('@unitybase/base').uba_common
const argv = require('@unitybase/base').argv
const TEST_NAME = 'SQL builder test'

module.exports = function runTest (options) {
  let session, conn

  if (!options) {
    let opts = cmdLineOpt.describe('', TEST_NAME)
      .add(argv.establishConnectionFromCmdLineAttributes._cmdLineParams)
    options = opts.parseVerbose({}, true)
    if (!options) return
  }

  session = argv.establishConnectionFromCmdLineAttributes(options)
  // if (!session.__serverStartedByMe) {
  //   throw new Error('Shut down server before run this test')
  // }
  conn = session.connection

  try {
    console.debug('Start ' + TEST_NAME)
    testCommon(conn)
  } finally {
    // session.logout()
  }

  /**
   * @param {SyncConnection} conn
   */
  function testCommon (conn) {
    let res

    console.debug('Parameter with : inside')
    assert.doesNotThrow(
      function () {
        conn.Repository('uba_user').attrs('ID', 'name').where('name', 'in', [ 'as:da', 'admin' ]).selectAsArray()
      },
      'string parameters with : inside must not throw'
    )

    console.debug('Case sensitive LIKE')
    res = conn.Repository('uba_user')
      .attrs([ 'ID' ])
      .where('[name]', 'like', uba.USERS.ADMIN.NAME)
      .limit(1)
      .selectAsArray()
    assert.equal(res.resultData.rowCount, 1, 'case sensitive LIKE fails')

    console.debug('Case insensitive LIKE')
    res = conn.Repository('uba_user')
      .attrs([ 'ID' ])
      .where('[name]', 'like', uba.USERS.ADMIN.NAME.toUpperCase())
      .limit(1)
      .selectAsArray()
    assert.equal(res.resultData.rowCount, 1, 'case insensitive LIKE fails')

    res = conn.Repository('uba_user')
      .attrs([ 'ID' ])
      .where('[name]', 'like', 'Admin')
      .limit(1)
      .selectAsArray()
    assert.equal(res.resultData.rowCount, 1, 'mixed case insensitive LIKE fails')

    console.debug('IN condition for array of Numbers')
    res = conn.Repository('uba_user')
      .attrs([ 'ID' ])
      .where('[ID]', 'in', [uba.USERS.ADMIN.ID, uba.USERS.ANONYMOUS.ID])
      .limit(3)
      .selectAsArray()
    assert.equal(res.resultData.rowCount, 2, 'IN condition for array of Numbers fails')

    console.debug('Where item condition without values')
    assert.throws(() => {
      conn.Repository('uba_user').attrs('ID').where('ID', '=', undefined).select()
    }, /Internal Server Error/, 'throws a string instead of error dont raise AV')

    conn.Repository('uba_user').attrs(['ID', 'name']) // select users
    // who are not disabled
      .where('disabled', '=', 0)
      // who do not login during this year
      .notExists(
        conn.Repository('uba_audit')
          .correlation('actionUser', 'name') // here we link to uba_user.name
          .where('actionTime', '>', new Date(2016, 1, 1))
          .where('actionType', '=', 'LOGIN')
      )
      // but modify some data
      .exists(
        conn.Repository('uba_auditTrail')
          .correlation('actionUser', 'ID') // here we link to uba_user.ID
          .where('actionTime', '>', new Date(2016, 1, 1))
      )
      .select()

    console.debug('Unsupported whereItem condition')
    assert.throws(() => {
      conn.query({ entity: 'uba_user', method: 'select', fieldList: ['ID','name'], whereList: { byName: { expression: '[name]', condition: 'equals', value: 'admin' } } })
    }, /Internal Server Error/, 'throws in case of invalid condition in whereList')
  }
}
