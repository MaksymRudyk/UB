const UB = require('@unitybase/ub')
const App = UB.App
const Session = UB.Session
const UBA_COMMON = require('@unitybase/base').uba_common

/* global uba_grouprole */
// eslint-disable-next-line camelcase
const me = uba_grouprole

me.on('insert:before', UBA_COMMON.denyBuildInRoleAssignmentAndAdminsOnlyForAdmins)
me.on('update:before', UBA_COMMON.denyBuildInRoleAssignmentAndAdminsOnlyForAdmins)
me.on('insert:after', ubaAuditNewGroupRole)
me.on('update:after', ubaAuditModifyGroupRole)
me.on('delete:after', ubaAuditDeleteGroupRole)

/**
 * After inserting new group role - log event to uba_audit
 * @private
 * @param {ubMethodParams} ctx
 */
function ubaAuditNewGroupRole (ctx) {
  if (!App.domainInfo.has('uba_audit')) return

  const params = ctx.mParams.execParams
  let role = params.roleID
  let group = params.groupID
  if (role) {
    const obj = UB.Repository('uba_role').attrs('name').where('[ID]', '=', role).select()
    role = obj.eof ? role : obj.get('name')
  }
  if (group) {
    const obj = UB.Repository('uba_group').attrs('name').where('[ID]', '=', group).select()
    group = obj.eof ? group : obj.get('name')
  }

  const auditStore = UB.DataStore('uba_audit')
  auditStore.run('insert', {
    execParams: {
      entity: 'uba_grouprole',
      entityinfo_id: params.ID,
      actionType: 'INSERT',
      actionUser: Session.uData.login || Session.userID,
      actionTime: new Date(),
      remoteIP: Session.callerIP,
      targetGroup: group,
      targetRole: role,
      toValue: JSON.stringify(params)
    }
  })
}

/**
 * After updating group role - log event to uba_audit
 * @private
 * @param {ubMethodParams} ctx
 */
function ubaAuditModifyGroupRole (ctx) {
  if (!App.domainInfo.has('uba_audit')) return

  const params = ctx.mParams.execParams
  const actionUser = Session.uData.login
  const origStore = ctx.dataStore
  const origName = origStore.currentDataName
  let roleNew = params.roleID
  let groupNew = params.groupID
  if (roleNew) {
    const obj = UB.Repository('uba_role').attrs('name').where('[ID]', '=', roleNew).select()
    roleNew = obj.eof ? roleNew : obj.get('name')
  }
  if (groupNew) {
    const obj = UB.Repository('uba_group').attrs('name').where('[ID]', '=', groupNew).select()
    groupNew = obj.eof ? groupNew : obj.get('name')
  }

  let group, role, oldValues
  try {
    origStore.currentDataName = 'selectBeforeUpdate'
    oldValues = origStore.getAsTextInObjectNotation()
    role = origStore.get('roleID')
    group = origStore.get('groupID')
  } finally {
    origStore.currentDataName = origName
  }
  if (role) {
    const obj = UB.Repository('uba_role').attrs('name').where('[ID]', '=', role).select()
    role = obj.eof ? role : obj.get('name')
  }
  if (group) {
    const obj = UB.Repository('uba_group').attrs('name').where('[ID]', '=', group).select()
    group = obj.eof ? group : obj.get('name')
  }
  const auditStore = UB.DataStore('uba_audit')
  auditStore.run('insert', {
    execParams: {
      entity: 'uba_grouprole',
      entityinfo_id: params.ID,
      actionType: 'DELETE',
      actionUser: actionUser,
      actionTime: new Date(),
      remoteIP: Session.callerIP,
      targetRole: role,
      targetGroup: group,
      fromValue: oldValues
    }
  })
  auditStore.run('insert', {
    execParams: {
      entity: 'uba_grouprole',
      entityinfo_id: params.ID,
      actionType: 'INSERT',
      actionUser: actionUser,
      actionTime: new Date(),
      remoteIP: Session.callerIP,
      targetRole: roleNew || role,
      targetGroup: groupNew || group,
      fromValue: oldValues,
      toValue: JSON.stringify(params)
    }
  })
}

me.on('delete:before', function (ctxt) {
  if (!App.domainInfo.has('uba_audit')) return
  const execParams = ctxt.mParams.execParams

  const store = UB.Repository('uba_grouprole')
    .attrs(['groupID', 'roleID'])
    .where('[ID]', '=', execParams.ID).select()
  ctxt.mParams.delGroupID = store.get('groupID')
  ctxt.mParams.delRoleID = store.get('roleID')
})

/**
 * After deleting group role - log event to uba_audit
 * @private
 * @param {ubMethodParams} ctx
 */
function ubaAuditDeleteGroupRole (ctx) {
  if (!App.domainInfo.has('uba_audit')) return

  const params = ctx.mParams.execParams

  let role = ctx.mParams.delRoleID
  if (role) {
    const obj = UB.Repository('uba_role').attrs('name').where('[ID]', '=', role).select()
    role = obj.eof ? role : obj.get('name')
  }
  let group = ctx.mParams.delGroupID
  if (group) {
    const obj = UB.Repository('uba_group').attrs('name').where('[ID]', '=', group).select()
    group = obj.eof ? group : obj.get('name')
  }

  const auditStore = UB.DataStore('uba_audit')
  auditStore.run('insert', {
    execParams: {
      entity: 'uba_grouprole',
      entityinfo_id: params.ID,
      actionType: 'DELETE',
      actionUser: Session.uData.login,
      actionTime: new Date(),
      remoteIP: Session.callerIP,
      targetRole: role,
      targetGroup: group
    }
  })
}
