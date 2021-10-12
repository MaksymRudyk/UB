/* global sleep */
/**
 * @author pavel.mash
 * Date: 09.10.14
 * Entity Level Security (ELS) rules test
 */

const _ = require('lodash')
const UBA_COMMON = require('@unitybase/base').uba_common
const assert = require('assert')
const ok = assert.ok
const cmdLineOpt = require('@unitybase/base').options
const argv = require('@unitybase/base').argv
const TEST_NAME = 'Entity Level Security (ELS) test'

module.exports = function runELSTest (options) {
  if (!options) {
    const opts = cmdLineOpt.describe('', TEST_NAME)
      .add(argv.establishConnectionFromCmdLineAttributes._cmdLineParams)
    options = opts.parseVerbose({}, true)
    if (!options) return
  }

  let session = argv.establishConnectionFromCmdLineAttributes(options)
  // if (!session.__serverStartedByMe) {
  //   throw new Error('Shut down server before run this test')
  // }
  let conn = session.connection

  try {
    console.debug('Start ' + TEST_NAME)
    testELS()
  } finally {
    // session.logout()
  }

  function testELS () {
    let domainInfo = conn.getDomainInfo()
    const addedArray = []

    function relogon (credential) {
      const opts = _.merge({}, options, { forceStartServer: true }, credential)
      session.logout() // shut down server
      session = argv.establishConnectionFromCmdLineAttributes(opts)
      conn = session.connection
    }

    let testUserID = conn.lookup('uba_user', 'ID', { expression: 'name', condition: 'equal', value: 'testelsuser' })

    if (testUserID) {
      console.warn('\t\tSkip ELS test - uba_user "testelsuser" already exists. Test can be run only once after app initialization')
      return
    }

    let admin2ID = conn.lookup('uba_user', 'ID', { expression: 'name', condition: 'equal', value: 'admin2' })
    if (!admin2ID) {
      admin2ID = conn.insert({
        entity: 'uba_user',
        fieldList: ['ID'],
        execParams: {
          name: 'admin2',
          description: 'Test user who can not login (throws inside login event)'
        }
      })
      conn.query({
        entity: 'uba_user',
        method: 'changeOtherUserPassword',
        execParams: {
          newPwd: 'admin2',
          forUser: 'admin2'
        }
      })
      grantRoleToUser(UBA_COMMON.ROLES.ADMIN.ID, admin2ID)
    }

    const TEST_ENTITY = 'uba_role'

    assert.deepStrictEqual(
      Object.keys(domainInfo.get(TEST_ENTITY).entityMethods).sort(),
      ['select', 'insert', 'update', 'addnew', 'delete'].sort(),
      'must be 5 permission for ' + TEST_ENTITY + ' methods but got: ' + JSON.stringify(domainInfo.get(TEST_ENTITY).entityMethods)
    )

    console.debug('Create new role testRole, user testelsuser and assign testelsuser to testRole')

    testUserID = conn.insert({
      entity: 'uba_user',
      fieldList: ['ID'],
      execParams: {
        name: 'testelsuser'
      }
    })
    conn.query({
      entity: 'uba_user',
      method: 'changeOtherUserPassword',
      execParams: {
        newPwd: 'testElsPwd',
        forUser: 'testelsuser'
      }
    })

    const testRole1 = conn.insert({
      entity: 'uba_role',
      fieldList: ['ID', 'mi_modifyDate'],
      execParams: {
        name: 'testRole',
        allowedAppMethods: 'ubql'
      }
    })
    function grantRoleToUser (roleID, userID) {
      return conn.insert({
        entity: 'uba_userrole',
        fieldList: ['ID'],
        execParams: {
          userID: userID,
          roleID: roleID
        }
      })
    }

    grantRoleToUser(testRole1[0], testUserID)

    assert.throws(function () { grantRoleToUser(testRole1[0], testUserID) }, /.*/, 'must deny duplicate roles adding')
    console.debug('Start re-logon using testelsuser user')
    relogon({ user: 'testelsuser', pwd: 'testElsPwd' })

    /* deprecated since 1.8. Now Everyone role add getDomainInfo rights
     assert.throws(function(){
     domainInfo = conn.getDomainInfo();
     }, /405:/, 'getDomainInfo app level method is forbidden');

     */
    domainInfo = conn.getDomainInfo()
    assert.ok(domainInfo)
    relogon()

    console.debug('Extend allowedAppMethods for role testRole by add getDomainInfo app level method')
    conn.query({
      entity: 'uba_role',
      fieldList: ['ID'],
      method: 'update',
      execParams: {
        ID: testRole1[0],
        mi_modifyDate: testRole1[1],
        allowedAppMethods: 'ubql,getDomainInfo'
      }
    })

    console.debug('Test new role do not have permissions')
    relogon({ user: 'testelsuser', pwd: 'testElsPwd' })
    domainInfo = conn.getDomainInfo()
    if (domainInfo.has(TEST_ENTITY)) {
      throw new Error('no permission by default, but actual is: ' + JSON.stringify(domainInfo.get(TEST_ENTITY).entityMethods))
    }

    assert.throws(function () { conn.Repository(TEST_ENTITY).attrs('ID').select() }, /Access deny/, 'must deny select permission for testelsuser ' + TEST_ENTITY)

    function addUBSAuditPermission (method, rule) {
      const res = conn.insert({
        entity: 'uba_els',
        fieldList: ['ID'],
        execParams: {
          entityMask: TEST_ENTITY,
          methodMask: method,
          ruleType: rule,
          ruleRole: testRole1[0],
          description: 'test rule for ' + TEST_ENTITY
        }
      })
      addedArray.push(res)
      return res
    }
    const accessDenyRe = /Access deny/
    assert.throws(function () { conn.Repository(TEST_ENTITY).attrs('ID').select() }, accessDenyRe, 'must deny select permission for testelsuser ' + TEST_ENTITY)
    assert.throws(addUBSAuditPermission.bind(null, 'select', 'A'), accessDenyRe, 'must deny insert permission for testelsuser to ' + TEST_ENTITY)

    console.debug('Add permission for testElsRole to', TEST_ENTITY, 'and verify it')
    relogon()
    ok(addUBSAuditPermission('select', 'A'), 'must allow insert permission for testelsuser to ' + TEST_ENTITY)
    ok(addUBSAuditPermission('addnew', 'A'), 'must allow insert permission for testelsuser to ' + TEST_ENTITY)
    relogon({ user: 'testelsuser', pwd: 'testElsPwd' })
    assert.ok(conn.Repository(TEST_ENTITY).attrs('ID').select(), 'must allow select permission for testelsuser ' + TEST_ENTITY)
    domainInfo = conn.getDomainInfo()
    assert.deepStrictEqual(Object.keys(domainInfo.get(TEST_ENTITY).entityMethods).sort(), ['select', 'addnew'].sort(), 'testelsuser have only ' + TEST_ENTITY + '.select & addnew permission')

    console.debug('Add Compliment rule for testElsRole to' + TEST_ENTITY + '.addnew and verify it')
    relogon()
    ok(addUBSAuditPermission('addnew', 'C'), 'must allow insert permission for testelsuser to ' + TEST_ENTITY)
    relogon({ user: 'testelsuser', pwd: 'testElsPwd' })
    domainInfo = conn.getDomainInfo()
    assert.deepStrictEqual(Object.keys(domainInfo.get(TEST_ENTITY).entityMethods), ['select'], 'testelsuser have only ' + TEST_ENTITY + '.select permission')

    relogon()
    console.debug('Check beforeinsert indirect execution if insert is granted')
    ok(addUBSAuditPermission('insert', 'A'), 'add insert permission for testelsuser to ' + TEST_ENTITY)
    relogon({ user: 'testelsuser', pwd: 'testElsPwd' })
    ok(conn.insert({
      entity: 'uba_role',
      fieldList: ['ID'],
      execParams: {
        name: 'testRole2',
        sessionTimeout: 10,
        allowedAppMethods: 'ubql'
      }
    }), 'must allow insert for testelsuser to ' + TEST_ENTITY)

    console.debug('Add', UBA_COMMON.ROLES.ADMIN.NAME, 'role for testelsuser and verify addnew method, complimented for role testElsRole is accessible via admin allow role')
    relogon()
    const adminRoleID = conn.lookup('uba_role', 'ID', { expression: 'name', condition: 'equal', values: { nameVal: UBA_COMMON.ROLES.ADMIN.NAME } })
    ok(adminRoleID, `role "${UBA_COMMON.ROLES.ADMIN.NAME}" not found in uba_role`)
    ok(grantRoleToUser(adminRoleID, testUserID), `role "${UBA_COMMON.ROLES.ADMIN.NAME}" not added for user testelsuser`)
    relogon({ user: 'testelsuser', pwd: 'testElsPwd' })
    domainInfo = conn.getDomainInfo()
    assert.deepStrictEqual(Object.keys(domainInfo.get(TEST_ENTITY).entityMethods).sort(), ['select', 'insert', 'update', 'addnew', 'delete'].sort(), TEST_ENTITY + ' permission for 5 method')

    console.debug('Add Deny rule for', UBA_COMMON.ROLES.ADMIN.NAME, 'role to', TEST_ENTITY, '.update and test neither admin no testelsuser have access to ', TEST_ENTITY + '.update')
    ok(conn.insert({
      entity: 'uba_els',
      fieldList: ['ID'],
      execParams: {
        entityMask: TEST_ENTITY,
        methodMask: 'update',
        ruleType: 'D',
        ruleRole: adminRoleID,
        description: 'deny ' + TEST_ENTITY + '.update for user with admin role'
      }
    }), 'D rule for ' + TEST_ENTITY + '.update not added for role' + UBA_COMMON.ROLES.ADMIN.NAME)
    relogon()
    domainInfo = conn.getDomainInfo()
    assert.deepStrictEqual(Object.keys(domainInfo.get(TEST_ENTITY).entityMethods).sort(), ['select', 'insert', 'addnew', 'delete'].sort(), TEST_ENTITY + ' permission do not have addnew for admin')

    relogon({ user: 'testelsuser', pwd: 'testElsPwd' })
    domainInfo = conn.getDomainInfo()
    assert.deepStrictEqual(Object.keys(domainInfo.get(TEST_ENTITY).entityMethods).sort(), ['select', 'insert', 'addnew', 'delete'].sort(), +TEST_ENTITY + ' permission do not have addnew for testelsuser')

    console.debug('rls.func test without where')
    conn.Repository('ubm_navshortcut').attrs('ID').select()
    console.debug('rls.func test with where')
    conn.Repository('ubm_navshortcut').attrs('ID')
      .where('ID', '>', 0, 'A01')
      .where('ID', '>', 1, 'A02')
      .logic('([A01] OR [A02])')
      .select()

    // cleanup
    relogon()
    addedArray.forEach(function (permissionID) {
      conn.query({
        entity: 'uba_els',
        fieldList: ['ID'],
        method: 'delete',
        execParams: {
          ID: permissionID
        }
      })
    })
  }
}
