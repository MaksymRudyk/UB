const UB = require('@unitybase/ub')
const Session = UB.Session
const App = UB.App
/* global uba_els */
// eslint-disable-next-line camelcase
const me = uba_els
me.on('insert:after', ubaAuditNewEls)
me.on('update:after', ubaAuditModifyEls)
me.on('delete:after', ubaAuditDeleteEls)

/**
 * After inserting new user - log event to uba_audit
 * @private
 * @param {ubMethodParams} ctx
 */
function ubaAuditNewEls (ctx) {
  if (!App.domainInfo.has('uba_audit')) return

  const params = ctx.mParams.execParams
  let ruleRole = params.ruleRole
  if (ruleRole) {
    ruleRole = UB.Repository('uba_role').attrs('name').where('[ID]', '=', ruleRole).select()
    ruleRole = ruleRole.eof ? params.ruleRole : ruleRole.get('name')
  }
  const store = UB.DataStore('uba_audit')
  store.run('insert', {
    execParams: {
      entity: 'uba_els',
      entityinfo_id: params.ID,
      actionType: 'INSERT',
      actionUser: Session.uData.login,
      actionTime: new Date(),
      remoteIP: Session.callerIP,
      targetRole: ruleRole,
      toValue: JSON.stringify(params)
    }
  })
}

/**
 * After updating user - log event to uba_audit
 * @private
 * @param {ubMethodParams} ctx
 */
function ubaAuditModifyEls (ctx) {
  if (!App.domainInfo.has('uba_audit')) {
    return
  }
  const params = ctx.mParams.execParams
  const origStore = ctx.dataStore
  const origName = origStore.currentDataName
  let ruleRoleNew = params.ruleRole
  if (ruleRoleNew) {
    const obj = UB.Repository('uba_role').attrs('name').where('[ID]', '=', ruleRoleNew).select()
    ruleRoleNew = obj.eof ? ruleRoleNew : obj.get('name')
  }

  let oldValues, ruleRole
  try {
    origStore.currentDataName = 'selectBeforeUpdate'
    oldValues = origStore.getAsTextInObjectNotation()
    ruleRole = origStore.get('ruleRole')
  } finally {
    origStore.currentDataName = origName
  }
  if (ruleRole && params.ruleRole !== ruleRole) {
    const obj = UB.Repository('uba_role').attrs('name').where('[ID]', '=', ruleRole).select()
    ruleRole = obj.eof ? ruleRole : obj.get('name')
  } else {
    ruleRole = null
  }

  const store = UB.DataStore('uba_audit')
  if (ruleRole && ruleRoleNew !== ruleRole) {
    store.run('insert', {
      execParams: {
        entity: 'uba_els',
        entityinfo_id: params.ID || oldValues.ID,
        actionType: 'DELETE',
        actionUser: Session.uData.login,
        actionTime: new Date(),
        remoteIP: Session.callerIP,
        targetRole: ruleRole,
        fromValue: oldValues,
        toValue: JSON.stringify(params)
      }
    })
    store.run('insert', {
      execParams: {
        entity: 'uba_els',
        entityinfo_id: params.ID || oldValues.ID,
        actionType: 'INSERT',
        actionUser: Session.uData.login,
        actionTime: new Date(),
        remoteIP: Session.callerIP,
        targetRole: ruleRoleNew,
        fromValue: oldValues,
        toValue: JSON.stringify(params)
      }
    })
  } else {
    store.run('insert', {
      execParams: {
        entity: 'uba_els',
        entityinfo_id: params.ID || oldValues.ID,
        actionType: 'UPDATE',
        actionUser: Session.uData.login,
        actionTime: new Date(),
        remoteIP: Session.callerIP,
        targetRole: ruleRole || ruleRoleNew,
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
function ubaAuditDeleteEls (ctx) {
  if (!App.domainInfo.has('uba_audit')) {
    return
  }
  const params = ctx.mParams.execParams
  const origStore = ctx.dataStore
  const origName = origStore.currentDataName
  let oldValues, ruleRole, ruleRoleObj

  try {
    origStore.currentDataName = 'selectBeforeDelete'
    oldValues = origStore.getAsTextInObjectNotation()
    ruleRole = origStore.get('ruleRole')
  } finally {
    origStore.currentDataName = origName
  }
  if (ruleRole) {
    ruleRoleObj = UB.Repository('uba_role').attrs('name').where('[ID]', '=', ruleRole).select()
    ruleRole = ruleRoleObj.eof ? ruleRole : ruleRoleObj.get('name')
  }
  const store = UB.DataStore('uba_audit')
  store.run('insert', {
    execParams: {
      entity: 'uba_els',
      entityinfo_id: params.ID || oldValues.ID,
      actionType: 'DELETE',
      actionUser: Session.uData.login,
      actionTime: new Date(),
      remoteIP: Session.callerIP,
      targetRole: ruleRole,
      fromValue: oldValues
    }
  })
}
