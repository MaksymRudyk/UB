/* global uba_user ubs_settings */
// eslint-disable-next-line camelcase
const me = uba_user
const UBA_COMMON = require('@unitybase/base').uba_common
const UB = require('@unitybase/ub')
const Session = UB.Session
const App = UB.App
const publicRegistration = require('./modules/publicRegistration').publicRegistration

me.publicRegistration = publicRegistration
me.entity.addMethod('publicRegistration')

// bypass HTTP logging for changePassword to hide sensitive information
App.registerEndpoint('changePassword', changePasswordEp, true, false, true)

me.entity.addMethod('changeLanguage')
me.entity.addMethod('setUDataKey')
me.entity.addMethod('changeOtherUserPassword')

me.on('insert:before', checkDuplicateUser)
me.on('update:before', checkDuplicateUser)
me.on('insert:before', fillFullNameIfMissing)
me.on('insert:after', ubaAuditNewUser)
me.on('update:after', ubaAuditModifyUser)
me.on('delete:after', ubaAuditDeleteUser)
me.on('delete:before', denyBuildInUserDeletion)

/**
 * Do not allow user with same name but in different case
 * @private
 * @param {ubMethodParams} ctxt
 */
function checkDuplicateUser (ctxt) {
  const params = ctxt.mParams.execParams
  const newName = params.name
  const ID = params.ID
  if (newName) {
    const store = UB.Repository('uba_user').attrs('ID')
      .where('name', '=', newName.toLowerCase())
      .whereIf(ID, 'ID', '<>', ID)
      .select()

    if (!store.eof) {
      throw new UB.UBAbort('<<<Duplicate user name (may be in different case)>>>')
    }
    params.name = newName.toLowerCase() // convert user name to lower case
  }
}

/**
 * Set fullName = name in case fullName is missing
 * Set lastPasswordChangeDate = maxDate in case user is domainUser
 * @private
 * @param {ubMethodParams} ctxt
 */
function fillFullNameIfMissing (ctxt) {
  const params = ctxt.mParams.execParams
  if (!params.fullName) {
    params.fullName = params.name
  }
  if (params.name && params.name.indexOf('\\') !== -1) {
    // domain/ldap user password never expire on UB level
    params.lastPasswordChangeDate = new Date(2099, 12, 31)
  }
}

/**
 * Change user password
 * @param {Number} userID
 * @param {String} userName Either userName or userID must be specified
 * @param  {String} password
 * @param {Boolean} [needChangePassword=false] If true the password will by expired
 * @param {String} [oldPwdHash] Optional for optimisation
 * @method changePassword
 * @memberOf uba_user_ns.prototype
 * @memberOfModule @unitybase/uba
 * @public
 */
me.changePassword = function (userID, userName, password, needChangePassword, oldPwdHash) {
  if (!(userID || userName) || !password) throw new Error('Invalid parameters')

  const store = UB.DataStore('uba_user')
  if (userID && (!userName || !oldPwdHash)) {
    UB.Repository('uba_user').attrs(['ID', 'name', 'uPasswordHashHexa']).where('[ID]', '=', userID).select(store)
    userName = store.get('name')
    oldPwdHash = store.get('uPasswordHashHexa')
  } else if (userName && (!userID || !oldPwdHash)) {
    UB.Repository('uba_user').attrs(['ID', 'name', 'uPasswordHashHexa']).where('[name]', '=', userName.toLowerCase()).select(store)
    userID = store.get('ID')
    oldPwdHash = store.get('uPasswordHashHexa')
  }

  // eslint-disable-next-line camelcase
  const passwordPolicy = ubs_settings
    ? {
        minLength: ubs_settings.loadKey('UBA.passwordPolicy.minLength', 3),
        checkCmplexity: ubs_settings.loadKey('UBA.passwordPolicy.checkCmplexity', false),
        checkDictionary: ubs_settings.loadKey('UBA.passwordPolicy.checkDictionary', false),
        allowMatchWithLogin: ubs_settings.loadKey('UBA.passwordPolicy.allowMatchWithLogin', false),
        checkPrevPwdNum: ubs_settings.loadKey('UBA.passwordPolicy.checkPrevPwdNum', 4)
      }
    : {}

  let newPwd = password || ''
  // minLength
  if (passwordPolicy.minLength > 0) {
    if (newPwd.length < passwordPolicy.minLength) {
      throw new Error('<<<Password is too short>>>')
    }
  }

  // checkCmplexity
  if (passwordPolicy.checkCmplexity) {
    if (!(/[A-Z]/.test(newPwd) && /[a-z]/.test(newPwd) &&
      /[0-9]/.test(newPwd) && /[~!@#$%^&*()_+|\\=\-/'":;<>.,[\]{}?]/.test(newPwd))
    ) {
      throw new Error('<<<Password is too simple>>>')
    }
  }
  // checkDictionary
  if (passwordPolicy.checkDictionary) {
    // todo - check password from dictionary
    // if (false) {
    //   throw new Error('<<<Password is dictionary word>>>')
    // }
  }

  // allowMatchWithLogin
  if (!passwordPolicy.allowMatchWithLogin) {
    if (newPwd.includes(userName)) {
      throw new Error('<<<Password matches with login>>>')
    }
  }

  newPwd = Session._buildPasswordHash(userName, newPwd)
  // checkPrevPwdNum
  if (passwordPolicy.checkPrevPwdNum > 0) {
    UB.Repository('uba_prevPasswordsHash')
      .attrs('uPasswordHashHexa')
      .where('userID', '=', userID)
      .limit(passwordPolicy.checkPrevPwdNum)
      .orderBy('mi_createDate', 'desc').select(store)
    store.first()
    while (!store.eof) {
      if (store.get('uPasswordHashHexa') === newPwd) {
        throw new Error('<<<Previous password is not allowed>>>')
      }
      store.next()
    }
  }

  // since attribute uPasswordHashHexa is not defined in entity metadata
  // for security reason we need to execute SQL
  // It's always better to not use execSQL at all!
  store.execSQL(
    'update uba_user set uPasswordHashHexa=:newPwd:, lastPasswordChangeDate=:lastPasswordChangeDate: where id = :userID:',
    {
      newPwd: newPwd,
      lastPasswordChangeDate: needChangePassword ? new Date(2000, 1, 1) : new Date(),
      userID: userID
    }
  )
  // store oldPwdHash
  if (oldPwdHash) {
    store.run('insert', {
      entity: 'uba_prevPasswordsHash',
      execParams: {
        userID: userID,
        uPasswordHashHexa: oldPwdHash
      }
    })
  }
}

/**
 * Change (or set) user password for currently logged in user.
 * Members of `Supervisor` role can change password for other users using uba_user.changeOtherUserPassword method
 * @private
 * @param {THTTPRequest}  req
 * @param {THTTPResponse} resp
 */
function changePasswordEp (req, resp) {
  const reqBody = req.read()
  const params = JSON.parse(reqBody)
  const newPwd = params.newPwd || ''
  const pwd = params.pwd || ''
  const needChangePassword = params.needChangePassword || false
  const store = UB.DataStore('uba_user')
  let dbPwdHash

  let failException = null
  const userID = Session.userID
  const userName = Session.uData.login
  try {
    if (!newPwd) throw new UB.ESecurityException('changePassword: newPwd parameter is required')
    UB.Repository('uba_user').attrs('name', 'uPasswordHashHexa').where('ID', '=', userID).select(store)
    if (store.eof) {
      throw new UB.ESecurityException('Can\'t load a used by ID')
    }
    dbPwdHash = store.get('uPasswordHashHexa')
    // check password
    const currentPwdHash = Session._buildPasswordHash(userName, pwd)
    if (currentPwdHash !== dbPwdHash) {
      throw new UB.ESecurityException('<<<Incorrect old password>>>')
    }
    me.changePassword(userID, userName, newPwd, needChangePassword, dbPwdHash)
  } catch (e) {
    failException = e
  }

  // make uba_audit record
  if (App.domainInfo.has('uba_audit')) {
    store.run('insert', {
      entity: 'uba_audit',
      execParams: {
        entity: 'uba_user',
        entityinfo_id: userID, // Session.userID,
        actionType: failException ? 'SECURITY_VIOLATION' : 'UPDATE',
        actionUser: Session.uData.login,
        actionTime: new Date(),
        remoteIP: Session.callerIP,
        targetUser: userName.toLowerCase(),
        toValue: failException
          ? JSON.stringify({ action: 'changePassword', reason: failException.message })
          : JSON.stringify({ action: 'changePassword' })
      }
    })
    App.dbCommit()
  }
  if (failException) throw failException
  resp.statusCode = 200
}

/**
 * Change (or set) user password for any user.
 * Call of this method should be restricted to a small number of roles/groups. By default can be called by supervisor role
 *
 * @param {ubMethodParams} ctxt
 * @param {string|number} ctxt.mParams.execParams.forUser Name or ID of the user for whom you want to change the password
 * @param {string} ctxt.mParams.execParams.newPwd         New password
 * @param {boolean} [ctxt.mParams.execParams.needChangePassword=false] Indicates that the user must change the password at the first login
 * @memberOf uba_user_ns.prototype
 * @memberOfModule @unitybase/uba
 * @published
 */
function changeOtherUserPassword (ctxt) {
  const { newPwd, needChangePassword, forUser } = ctxt.mParams.execParams
  const store = UB.DataStore('uba_user')

  if (!newPwd) throw new Error('newPwd parameter is required')

  let failException = null
  const userID = UBA_COMMON.USERS.ANONYMOUS.ID
  try {
    UB.Repository('uba_user').attrs('ID', 'uPasswordHashHexa').where('[name]', '=', '' + forUser.toLowerCase()).select(store)
    if (store.eof) throw new Error('User not found')

    const userID = store.get('ID')
    const oldPwd = store.get('uPasswordHashHexa')

    me.changePassword(userID, forUser, newPwd, needChangePassword || false, oldPwd)
  } catch (e) {
    failException = e
  }

  // make uba_audit record
  if (App.domainInfo.has('uba_audit')) {
    store.run('insert', {
      entity: 'uba_audit',
      execParams: {
        entity: 'uba_user',
        entityinfo_id: userID,
        actionType: failException ? 'SECURITY_VIOLATION' : 'UPDATE',
        actionUser: Session.uData.login,
        actionTime: new Date(),
        remoteIP: Session.callerIP,
        targetUser: forUser.toLowerCase(),
        toValue: failException
          ? JSON.stringify({ action: 'changePassword', reason: failException.message })
          : JSON.stringify({ action: 'changePassword' })
      }
    })
    App.dbCommit()
  }
  if (failException) throw failException
}
me.changeOtherUserPassword = changeOtherUserPassword

/**
 * Change uba_user.uData JSON key to value
 * @param {string} key
 * @param {*} value
 */
function internalSetUDataKey (key, value) {
  const userID = Session.userID
  const user = UB.Repository('uba_user').attrs(['name', 'uData', 'mi_modifyDate']).where('ID', '=', userID).select()
  if (user.eof) {
    throw new Error('user is unknown or not logged in')
  }
  let newUData
  try {
    newUData = JSON.parse(user.get('uData'))
  } catch (e) {
    newUData = {}
  }
  if (!newUData) {
    newUData = {}
  }
  newUData[key] = value
  user.run('update', {
    execParams: {
      ID: userID,
      uData: JSON.stringify(newUData),
      mi_modifyDate: user.get('mi_modifyDate')
    }
  })
}

/**
 * Change (or set) current user language.
 * After call to this method UI must logout user and reload itself.
 *
 * @param {ubMethodParams} ctxt
 * @param {String} ctxt.mParams.newLang new user language
 * @memberOf uba_user_ns.prototype
 * @memberOfModule @unitybase/uba
 * @published
 */
function changeLanguage (ctxt) {
  const params = ctxt.mParams
  const newLang = params.newLang

  if (!newLang) {
    throw new Error('newLang parameter is required')
  }

  const supportedLangs = uba_user.entity.connectionConfig.supportLang
  if (supportedLangs.indexOf(newLang) < 0) {
    throw new Error(`Language "${newLang}" not supported`)
  }
  internalSetUDataKey('lang', newLang)
}
me.changeLanguage = changeLanguage

/**
 * Set key value inside `uba_user.uData` and store new JSON do DB.
 * All other uData JSON keys will remain unchanged.
 *
 * **WARNING** - overall length of uba_user.uData is 2000 characters, so only short values should be stored there
 *
 * @param {ubMethodParams} ctxt
 * @param {String} ctxt.mParams.key key to change
 * @param {String} ctxt.mParams.value new value
 * @memberOf uba_user_ns.prototype
 * @memberOfModule @unitybase/uba
 * @published
 */
function setUDataKey (ctxt) {
  const params = ctxt.mParams
  const key = params.key
  const value = params.value
  if (!key) throw new Error('key parameter is required')
  if (value === undefined) throw new Error('value parameter is required')

  internalSetUDataKey(key, value)
}
me.setUDataKey = setUDataKey

/**
 * After inserting new user - log event to uba_audit
 * @private
 * @param {ubMethodParams} ctx
 */
function ubaAuditNewUser (ctx) {
  if (!App.domainInfo.has('uba_audit')) return

  const params = ctx.mParams.execParams
  const store = UB.DataStore('uba_audit')
  store.run('insert', {
    execParams: {
      entity: 'uba_user',
      entityinfo_id: params.ID, // Session.userID,
      actionType: 'INSERT',
      actionUser: Session.uData.login,
      actionTime: new Date(),
      remoteIP: Session.callerIP,
      targetUser: params.name,
      toValue: JSON.stringify(params)
    }
  })
}

/**
 * After updating user - log event to uba_audit.
 * Logout a user if disabled is sets to 1
 * @private
 * @param {ubMethodParams} ctx
 */
function ubaAuditModifyUser (ctx) {
  const params = ctx.mParams.execParams
  if (params.disabled) {
    App.removeUserSessions(params.ID)
  }

  const store = UB.DataStore('uba_audit')
  const origStore = ctx.dataStore
  const origName = origStore.currentDataName
  let oldValues, oldName

  try {
    origStore.currentDataName = 'selectBeforeUpdate'
    oldValues = origStore.getAsTextInObjectNotation()
    oldName = origStore.get('name')
  } finally {
    origStore.currentDataName = origName
  }

  if (params.name) {
    store.run('insert', {
      execParams: {
        entity: 'uba_user',
        entityinfo_id: params.ID,
        actionType: 'DELETE',
        actionUser: Session.uData.login,
        actionTime: new Date(),
        remoteIP: Session.callerIP,
        targetUser: oldName,
        fromValue: oldValues,
        toValue: JSON.stringify(params)
      }
    })
    store.run('insert', {
      execParams: {
        entity: 'uba_user',
        entityinfo_id: params.ID,
        actionType: 'INSERT',
        actionUser: Session.uData.login,
        actionTime: new Date(),
        remoteIP: Session.callerIP,
        targetUser: params.name,
        fromValue: oldValues,
        toValue: JSON.stringify(params)
      }
    })
  } else {
    store.run('insert', {
      execParams: {
        entity: 'uba_user',
        entityinfo_id: params.ID,
        actionType: 'UPDATE',
        actionUser: Session.uData.login,
        actionTime: new Date(),
        remoteIP: Session.callerIP,
        targetUser: oldName,
        fromValue: oldValues,
        toValue: JSON.stringify(params)
      }
    })
  }
}

/**
 * After deleting user - log event to uba_audit
 * @private
 * @param {ubMethodParams} ctx
 */
function ubaAuditDeleteUser (ctx) {
  const params = ctx.mParams.execParams
  const store = UB.DataStore('uba_audit')
  const origStore = ctx.dataStore
  const origName = origStore.currentDataName
  let oldValues, oldName

  try {
    origStore.currentDataName = 'selectBeforeDelete'
    oldValues = origStore.getAsTextInObjectNotation()
    oldName = origStore.get('name')
  } finally {
    origStore.currentDataName = origName
  }

  store.run('insert', {
    execParams: {
      entity: 'uba_user',
      entityinfo_id: params.ID,
      actionType: 'DELETE',
      actionUser: Session.uData.login,
      actionTime: new Date(),
      remoteIP: Session.callerIP,
      targetUser: oldName,
      fromValue: oldValues
    }
  })
}

/**
 * Prevent delete a build-in user
 * @private
 * @param {ubMethodParams} ctx
 */
function denyBuildInUserDeletion (ctx) {
  const ID = ctx.mParams.execParams.ID

  for (const user in UBA_COMMON.USERS) {
    if (UBA_COMMON.USERS[user].ID === ID) {
      throw new UB.UBAbort('<<<Removing of built-in user is prohibited>>>')
    }
  }
}
