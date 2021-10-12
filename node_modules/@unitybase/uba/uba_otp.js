/*
 * @autor v.orel
 */
const UB = require('@unitybase/ub')
const Session = UB.Session
const totp = require('./modules/totp')
/* global uba_otp createGuid */
// eslint-disable-next-line camelcase
const me = uba_otp
/**
 * Generate one-time-password (OTP) and store it into uba_otp
 *
 * @param {string} otpKind Must be one of 'EMail', 'SMS', 'TOTP'
 * @param {Number} [userID=Session.userID]
 * @param {Object} [uData='']
 * @param {Number} [lifeTime] life time of otp in seconds; Default 30 day for email, 30 min for SMS and 10 years for TOTP
 * @return {string}
 * @memberOf uba_otp_ns.prototype
 * @memberOfModule @unitybase/uba
 * @public
 */
me.generateOtp = function (otpKind, userID, uData, lifeTime) {
  let otp
  userID = userID || Session.userID
  if (otpKind === 'EMail') {
    otp = createGuid()
    if (!lifeTime) lifeTime = 30 * 24 * 60 * 60 // 30 days
  } else if (otpKind === 'SMS') {
    otp = (Math.random() * 1000000 >>> 0).toString(10).padStart(6, '0') // 6 digits random number
    if (!lifeTime) lifeTime = 20 * 60 // 30 minutes
  } else if (otpKind === 'TOTP') {
    return doGenerateTOTPSecret(userID)
  } else {
    throw new Error('invalid otpKind')
  }
  const expiredDate = new Date()
  expiredDate.setTime(expiredDate.getTime() + lifeTime * 1000)
  const uDataStr = uData ? JSON.stringify(uData) : ''
  const store = UB.DataStore('uba_otp')
  const res = store.run('insert', {
    execParams: {
      otp: otp,
      userID: userID,
      otpKind: otpKind,
      expiredDate: expiredDate,
      uData: uDataStr
    }
  })
  if (!res) {
    throw store.lastError
  }
  return otp
}

/**
 * Switch session to user from OTP (SMS or EMail) or execute callback in session of user from OTP.
 * For TOTP use verifyTotp function.
 *
 * @param {string} otp
 * @param {string} otpKind
 * @param {Function} [fCheckUData] function for check OTP from uData
 * @param {Object} [checkData] value for check OTP from uData
 * @param {Function} [call] If defined then this function will be called in user's session and restore original user session after call
 * @returns {Boolean}
 * @method auth
 * @deprecated use authAndExecute instead
 * @memberOf uba_otp_ns.prototype
 * @memberOfModule @unitybase/uba
 * @public
 */
me.auth = function (otp, otpKind, fCheckUData, checkData, call) {
  const repo = UB.Repository('uba_otp').attrs(['userID', 'ID', 'uData'])
    .where('[otp]', '=', otp).where('[expiredDate]', '>=', new Date())
    .whereIf(otpKind, '[otpKind]', '=', otpKind)

  const inst = repo.select()
  if (inst.eof) return false

  if (otpKind !== 'TOTP') {
    const res = inst.run('delete', {
      execParams: { ID: inst.get('ID') }
    })
    if (!res) throw inst.lastError
  }

  if ((!fCheckUData) || (fCheckUData(inst.get('uData'), checkData))) {
    if (call) {
      Session.runAsUser(inst.get('userID'), call.bind(null, inst.get('uData')))
    } else {
      Session.setUser(inst.get('userID'))
    }
    return true
  } else {
    return false
  }
}

/**
 * Verify TOTP for currently logged in user
 *
 * @param {string} totpValue TOTP value entered by user (6 digits string)
 * @param {number} [userID] optional user ID to verify TOTP for. By default - Session.userID
 * @method verifyTotp
 * @memberOf uba_otp_ns.prototype
 * @memberOfModule @unitybase/uba
 * @return {boolean}
 */
me.verifyTotp = function (totpValue, userID) {
  const secret = UB.Repository('uba_otp').attrs('otp')
    .where('userID', '=', userID || Session.userID)
    .where('[expiredDate]', '>=', new Date())
    .where('[otpKind]', '=', 'TOTP')
    .selectScalar()
  if (!secret) return false
  return totp.verifyTotp(secret, totpValue)
}

/**
 * Check given otp, and in case it is correct run callback
 *
 * @example
  // generation otp
  var userID = 100000000122,
     uData = {size: {width: 100, height: 50}};
  var otp = uba_otp.generateOtp('EMail', userID, uData);
  // send this otp via EMail
  //............................
  // after receiving this otp
  var isOtpCorrect =  uba_otp.authAndExecute('EMail', otp, function(uData){
     var params = JSON.parse(uData);
     console.log('user ID is', Session.userID);//'user ID is 100000000122';
     console.log('width is', params.width);//'width is 100';
  }));

 * @param {string} otp
 * @param {string} otpKind
 * @param {Function} callBack This function will be called in user's session with uData parameter from otp if otp is correct.
 * @returns {Boolean} Is otp correct
 * @method authAndExecute
 * @memberOf uba_otp_ns.prototype
 * @memberOfModule @unitybase/uba
 * @public
 */
me.authAndExecute = function (otp, otpKind, callBack) {
  const store = UB.Repository('uba_otp').attrs(['userID', 'ID', 'uData'])
    .where('[otp]', '=', otp).where('[otpKind]', '=', otpKind)
    .where('[userID.disabled]', '=', 0)
    .where('[expiredDate]', '>=', new Date())
    .select()
  if (store.eof) return false

  store.run('delete', { execParams: { ID: store.get('ID') } })
  Session.runAsUser(store.get('userID'), callBack.bind(null, store.get('uData')))
  return true
}

/**
 * Generate TOTP secret for user and store it into uba_otp
 * In case secret already generated return existed secret
 * @param {number} userID
 * @return {string}
 * @private
 */
function doGenerateTOTPSecret (userID) {
  let secret = UB.Repository('uba_otp').attrs('otp')
    .where('userID', '=', userID)
    .where('otpKind', '=', 'TOTP')
    .selectScalar()
  if (secret) return secret

  const store = UB.DataStore('uba_otp')
  secret = totp.generateTotpSecret()
  const lifeTime = 365 * 10 * 24 * 60 * 60 // 10 years
  const expiredDate = new Date()
  expiredDate.setTime(expiredDate.getTime() + lifeTime * 1000)
  store.run('insert', {
    execParams: {
      otp: secret,
      userID: userID,
      otpKind: 'TOTP',
      expiredDate: expiredDate,
      uData: ''
    }
  })
  return secret
}
