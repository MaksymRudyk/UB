const UB = require('@unitybase/ub')
/* global ubs_message_recipient */
// eslint-disable-next-line camelcase
const me = ubs_message_recipient
me.entity.addMethod('accept')
me.entity.addMethod('addRoles')
me.entity.addMethod('removeRoles')

/**
 * Mark message with specified ID as read by recipient (current logged in user)
 * @method accept
 * @memberOf ubs_message_recipient_ns.prototype
 * @memberOfModule @unitybase/ubs
 * @published
 * @param {ubMethodParams} ctx
 * @param {Number} ctx.mParams.execParams.ID
 */
me.accept = function (ctx) {
  const execParams = ctx.mParams.execParams
  if (!execParams || !execParams.ID) {
    throw new Error('Invalid value of parameter ID')
  }
  const request = {
    fieldList: ['ID'],
    execParams: {
      ID: execParams.ID,
      acceptDate: new Date()
    },
    ID: execParams.ID,
    __skipOptimisticLock: true
  }

  const inst = UB.DataStore('ubs_message_recipient')
  ctx.mParams.resultData = inst.run('update', request)
}

/**
 * Add all users with roles `roles` to a message recipient list
 * @method addRoles
 * @memberOf ubs_message_recipient_ns.prototype
 * @memberOfModule @unitybase/ubs
 * @published
 * @param {ubMethodParams} ctx
 * @param {number} ctx.mParams.execParams.messageID
 * @param {string} ctx.mParams.execParams.roles Comma separated role list
 */
me.addRoles = function (ctx) {
  const execParams = ctx.mParams.execParams
  if (!execParams || !execParams.messageID) {
    throw new Error('Invalid value of parameter messageID')
  }
  if (!execParams || !execParams.roles) {
    throw new Error('Invalid value of parameter roles')
  }
  const roles = String(execParams.roles).split(',').map(Number)
  const messageID = execParams.messageID
  const users = []

  const rInst = UB.DataStore('ubs_message_recipient')
  rInst.run('select', {
    entity: 'uba_userrole',
    fieldList: ['userID', 'roleID'],
    whereList: {
      role: {
        expression: '[roleID]',
        condition: 'in',
        values: {
          roleID: roles
        }
      }
    }
  })
  while (!rInst.eof) {
    users.push(Number(rInst.get('userID')))
    rInst.next()
  }
  const request = {
    fieldList: ['messageID', 'userID'],
    execParams: {
      messageID: messageID,
      userID: 0
    }
  }
  const inst = UB.Repository('ubs_message_recipient')
    .attrs(['ID', 'messageID', 'userID'])
    .where('[messageID]', '=', messageID, 'message')
    .where('[userID]', 'in', users, 'user')
    .selectAsStore()
  while (!inst.eof) {
    const userIdx = users.indexOf(Number(inst.get('userID')))
    if (userIdx >= 0) {
      users.splice(userIdx, 1)
    }
    inst.next()
  }
  for (let i = 0, L = users.length; i < L; i++) {
    request.execParams.userID = users[i]
    inst.run('insert', request)
  }
}

/**
 * Add all users with roles `roles` to a message recipient list
 * @method removeRoles
 * @memberOf ubs_message_recipient_ns.prototype
 * @memberOfModule @unitybase/ubs
 * @published
 * @param {ubMethodParams} ctx
 * @param {number} ctx.mParams.execParams.messageID
 * @param {string} ctx.mParams.execParams.roles Comma separated role list
 */
me.removeRoles = function (ctx) {
  const execParams = ctx.mParams.execParams
  if (!execParams || !execParams.messageID) {
    throw new Error('Invalid value of parameter messageID')
  }
  if (!execParams || !execParams.roles) {
    throw new Error('Invalid value of parameter roles')
  }
  const roles = String(execParams.roles).split(',').map(Number)
  const messageID = execParams.messageID
  const users = []

  let rInst = UB.Repository('uba_userrole')
    .attrs(['userID', 'roleID'])
    .where('[roleID]', 'in', roles)
    .select()

  while (!rInst.eof) {
    users.push(Number(rInst.get('userID')))
    rInst.next()
  }
  rInst = UB.Repository('ubs_message_recipient')
    .attrs(['ID', 'userID', 'messageID'])
    .where('messageID', '=', messageID)
    .where('userID', 'in', users)
    .where('acceptDate', 'isNull')
    .select()

  const request = {
    execParams: {
      ID: 0
    }
  }
  const store = UB.DataStore('ubs_message_recipient')
  while (!rInst.eof) {
    request.execParams.ID = rInst.get('ID')
    store.run('delete', request)
    rInst.next()
  }
}
