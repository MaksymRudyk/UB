/**
 * @author pavel.mash
 * Date: 2020-04-26
 * Attributes restriction test
 */
const assert = require('assert')
const base = require('@unitybase/base')
const cmdLineOpt = base.options
const argv = base.argv
const TEST_NAME = 'Attributes restriction test'

module.exports = function runAttrRestrictionTest (options) {
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
    testAttrRestriction()
  } finally {
    // session.logout()
  }

  function testAttrRestriction () {
    assert.throws(() => {
      conn.Repository('uba_user')
        .attrs('uPasswordHashHexa')
        .limit(1).selectAsObject()
    },
    /<<<Access deny>>>/,
    'Should got error for get restricted attribute'
    )

    assert.throws(() => {
      conn.Repository('uba_user')
        .attrs('1 + [uPasswordHashHexa]')
        .limit(1).selectAsObject()
    },
    /<<<Access deny>>>/,
    'Should got error for get restricted attribute in expression'
    )

    assert.throws(() => {
      conn.Repository('uba_els')
        .attrs('[mi_owner.uPasswordHashHexa]')
        .limit(1).selectAsObject()
    },
    /<<<Access deny>>>/,
    'Should got error for get restricted attribute from entity attribute'
    )

    assert.throws(() => {
      conn.Repository('uba_els')
        .attrs('[mi_modifyUser.mi_owner.uPasswordHashHexa]')
        .limit(1).selectAsObject()
    },
    /<<<Access deny>>>/,
    'Should got error for get restricted attribute from long entity attributes chain'
    )

    const admin = conn.Repository('uba_user')
      .attrs('ID', 'disabled', 'trustedIP', 'mi_modifyDate')
      .selectById(base.uba_common.USERS.ADMIN.ID)
    assert.strictEqual(admin.trustedIP, '*****', 'uba_user.trustedIP should be replaced by *****')
    assert.strictEqual(admin.disabled, null, 'uba_user.disabled should be replaced by null')

    assert.throws(() => {
      conn.query({
        entity: 'uba_user',
        method: 'update',
        execParams: {
          ID: admin.ID,
          mi_modifyDate: admin.mi_modifyDate,
          disabled: true
        }
      })
    },
    /<<<Access deny>>>/,
    'Should got error for updating restricted attribute'
    )
  }
}
