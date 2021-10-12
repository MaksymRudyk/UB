const UB = require('@unitybase/ub')
const App = UB.App
const Session = UB.Session

/* global uba_usergroup */
// eslint-disable-next-line camelcase
const me = uba_usergroup

me.on('insert:after', ubaAuditNewUserGroup)
me.on('update:after', ubaAuditModifyUserGroup)
me.on('delete:after', ubaAuditDeleteUserGroup)

/**
 * After inserting new user group - log event to uba_audit
 * @private
 * @param {ubMethodParams} ctx
 */
function ubaAuditNewUserGroup (ctx) {
  const params = ctx.mParams.execParams
  let group = params.groupID
  let user = params.userID

  App.removeUserSessions(user)

  if (group) {
    const obj = UB.Repository('uba_group').attrs('name').where('[ID]', '=', group).select()
    group = obj.eof ? group : obj.get('name')
  }
  if (user) {
    const obj = UB.Repository('uba_user').attrs('name').where('[ID]', '=', user).select()
    user = obj.eof ? user : obj.get('name')
  }

  const auditStore = UB.DataStore('uba_audit')
  auditStore.run('insert', {
    execParams: {
      entity: 'uba_usergroup',
      entityinfo_id: params.ID,
      actionType: 'INSERT',
      actionUser: Session.uData.login || Session.userID,
      actionTime: new Date(),
      remoteIP: Session.callerIP,
      targetUser: user,
      targetGroup: group,
      toValue: JSON.stringify(params)
    }
  })
}

/**
 * After updating user group - log event to uba_audit
 * @private
 * @param {ubMethodParams} ctx
 */
function ubaAuditModifyUserGroup (ctx) {
  const params = ctx.mParams.execParams
  const actionUser = Session.uData.login
  const origStore = ctx.dataStore
  const origName = origStore.currentDataName
  let groupNew = params.groupID
  let userNew = params.userID
  if (!userNew) {
    userNew = UB.Repository(me.entity.name).attrs('userID').where('ID', '=', params.ID).selectScalar()
  }
  App.removeUserSessions(userNew)

  if (groupNew) {
    const obj = UB.Repository('uba_group').attrs('name').where('[ID]', '=', groupNew).select()
    groupNew = obj.eof ? groupNew : obj.get('name')
  }
  if (userNew) {
    const obj = UB.Repository('uba_user').attrs('name').where('[ID]', '=', userNew).select()
    userNew = obj.eof ? userNew : obj.get('name')
  }

  let user, group, oldValues
  try {
    origStore.currentDataName = 'selectBeforeUpdate'
    oldValues = origStore.getAsTextInObjectNotation()
    group = origStore.get('groupID')
    user = origStore.get('userID')
  } finally {
    origStore.currentDataName = origName
  }
  if (group) {
    const obj = UB.Repository('uba_group').attrs('name').where('[ID]', '=', group).select()
    group = obj.eof ? group : obj.get('name')
  }
  if (user) {
    const obj = UB.Repository('uba_user').attrs('name').where('[ID]', '=', user).select()
    user = obj.eof ? user : obj.get('name')
  }
  const auditStore = UB.DataStore('uba_audit')
  auditStore.run('insert', {
    execParams: {
      entity: 'uba_usergroup',
      entityinfo_id: params.ID,
      actionType: 'DELETE',
      actionUser: actionUser,
      actionTime: new Date(),
      remoteIP: Session.callerIP,
      targetGroup: group,
      targetUser: user,
      fromValue: oldValues
    }
  })
  auditStore.run('insert', {
    execParams: {
      entity: 'uba_usergroup',
      entityinfo_id: params.ID,
      actionType: 'INSERT',
      actionUser: actionUser,
      actionTime: new Date(),
      remoteIP: Session.callerIP,
      targetGroup: groupNew || group,
      targetUser: userNew || user,
      fromValue: oldValues,
      toValue: JSON.stringify(params)
    }
  })
}

me.on('delete:before', function (ctxt) {
  if (!App.domainInfo.has('uba_audit')) return
  const execParams = ctxt.mParams.execParams

  const store = UB.Repository('uba_usergroup')
    .attrs(['userID', 'groupID'])
    .where('[ID]', '=', execParams.ID).select()
  ctxt.mParams.delUserID = store.get('userID')
  ctxt.mParams.delGroupID = store.get('groupID')
})

/**
 * After deleting user group - log event to uba_audit
 * @private
 * @param {ubMethodParams} ctx
 */
function ubaAuditDeleteUserGroup (ctx) {
  const params = ctx.mParams.execParams
  let user = ctx.mParams.delUserID
  App.removeUserSessions(user)

  let group = ctx.mParams.delGroupID
  if (group) {
    const obj = UB.Repository('uba_group').attrs('name').where('[ID]', '=', group).select()
    group = obj.eof ? group : obj.get('name')
  }
  if (user) {
    const obj = UB.Repository('uba_user').attrs('name').where('[ID]', '=', user).select()
    user = obj.eof ? user : obj.get('name')
  }

  const auditStore = UB.DataStore('uba_audit')
  auditStore.run('insert', {
    execParams: {
      entity: 'uba_usergroup',
      entityinfo_id: params.ID,
      actionType: 'DELETE',
      actionUser: Session.uData.login,
      actionTime: new Date(),
      remoteIP: Session.callerIP,
      targetGroup: group,
      targetUser: user
    }
  })
}
