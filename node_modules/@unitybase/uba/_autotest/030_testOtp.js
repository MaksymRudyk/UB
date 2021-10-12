const UBA_COMMON = require('@unitybase/base').uba_common
const _ = require('lodash')
const assert = require('assert')
const ok = assert.ok
const cmdLineOpt = require('@unitybase/base').options
const argv = require('@unitybase/base').argv

/* global sleep */
module.exports = function runOTPTest (options) {
  if (!options) {
    const opts = cmdLineOpt.describe('', 'OTP test')
      .add(argv.establishConnectionFromCmdLineAttributes._cmdLineParams)
    options = opts.parseVerbose({}, true)
    if (!options) return
  }

  const session = argv.establishConnectionFromCmdLineAttributes(options)
  // if (!session.__serverStartedByMe) {
  //   throw new Error('Shut down server before run this test')
  // }
  const conn = session.connection

  try {
    console.debug('start uba_otp test')
    testOtpEmail()
  } finally {
    // session.logout()
  }
  function testOtpEmail () {
    let userID, otp
    const EMAIL = 'EMail'
    const inst = conn.Repository('uba_user').attrs(['ID']).where('[name]', '=', 'otp_testuser1').select()

    function genOtp (obj, lifeTime, otpKind) {
      otpKind = otpKind || EMAIL
      lifeTime = lifeTime || 'null'
      otp = conn.post('evaluateScript',
        'return {otp: uba_otp.generateOtp("' + otpKind + '", ' + userID + ', ' +
        JSON.stringify(obj) + ', ' + lifeTime + ')};').otp
      return otp
    }

    function checkAuth (fun, otpKind) {
      let funStr
      otpKind = otpKind || EMAIL

      if (fun) {
        funStr = fun.toSource()
        funStr = ', ' + funStr.substr(1, funStr.length - 2)
      } else {
        funStr = ''
      }
      const auth = conn.post('evaluateScript',
        'return {res: uba_otp.auth("' + otp + '", "' + otpKind + '"' + funStr + '), userID: Session.userID};')
      if (auth.res) { assert.strictEqual(auth.userID, userID, 'invalid userID after successful otp.auth') }
      return auth.res
    }

    //  Prepare test User
    if (inst.length === 0) {
      userID = conn.insert({
        entity: 'uba_user',
        fieldList: ['ID'],
        execParams: {
          name: 'otp_testUser1'
        }
      })
      conn.query({
        entity: 'uba_user',
        method: 'changeOtherUserPassword',
        execParams: {
          newPwd: 'testPwd1',
          forUser: 'otp_testUser1'
        }
      })

      conn.insert({
        entity: 'uba_userrole',
        fieldList: ['ID'],
        execParams: {
          userID: userID,
          roleID: conn.lookup('uba_role', 'ID', {
            expression: 'name',
            condition: 'equal',
            values: { name: UBA_COMMON.ROLES.ADMIN.NAME }
          })
        }
      })
    } else {
      userID = inst[0].ID
    }
    //  Start tests
    console.debug('1. Generate otp 1 (normal)')
    genOtp(null, 3)
    sleep(1000)
    ok(checkAuth(), 'otp.auth actual otp failed')
    ok(!checkAuth(), 'otp.auth already used otp successful')

    console.debug('2. Generate otp 2 (expired)')
    genOtp(null, 2)
    sleep(3000)
    ok(!checkAuth(), 'otp.auth expired otp successful')

    console.debug('3. Generate otp 3 (with uData and correct check)')
    genOtp({ test: 'test' })
    ok(checkAuth(function (uData) { return (JSON.parse(uData).test === 'test') }), 'otp.auth actual otp failed')

    console.debug('4. Generate otp 4 (incorrect check)')
    genOtp()
    ok(!checkAuth(function () { return false }), 'otp.auth incorrect check otp successful')

    console.debug('5. Generate TOTP')
    const totpSecret = genOtp(null, 100, 'TOTP')
    console.log('TOTP secret=', totpSecret)
    const totp = require('../modules/totp')
    let mustBe = totp.getTotp(totpSecret)
    console.log('TOTP value=', mustBe)

    console.debug('6. Validate TOTP')
    let valid = conn.post('evaluateScript',
      `return Session.runAsUser(${userID}, function(){
        return {validationResult: uba_otp.verifyTotp("${mustBe}")}
       })`)
    valid = valid.validationResult
    console.log('TOTP res=', valid)
    assert.strictEqual(valid, true, 'TOTP is valid')

    console.debug('6. Generate TOTP again')
    const totpSecret2 = genOtp(null, 100, 'TOTP')
    assert.strictEqual(totpSecret, totpSecret2, 'second call to generateOtp must return the same secret')

    console.debug('8. Validate TOTP -30 sec')
    mustBe = totp.getTotp(totpSecret, -30)
    valid = conn.post('evaluateScript',
      `return Session.runAsUser(${userID}, function(){
        return {validationResult: uba_otp.verifyTotp("${mustBe}")}
       })`).validationResult
    assert.strictEqual(valid, true, 'TOTP -30 sec is also valid')

    console.debug('test complete')
  }
}
