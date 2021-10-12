/**
 * @class UB.ux.LockManager
 * This class is client manager for softLock mixin.
 * Monitors need to remove lock of entity instance.
 * @singleton
 * @author xmax
 */
Ext.ns('UB.ux.LockManager')

UB.ux.LockManager.lockTimeout = 40 * 1000 // in ms
UB.ux.LockManager.entities = {}
UB.ux.LockManager.schedulers = {}

/**
 * @private
 * @param {String} entity
 * @param {Ext.data.Model|Number} record
 * @param {Boolean} addEmptyCtx
 * @returns {Object} Instance context
 */
UB.ux.LockManager.getContext = function (entity, record, addEmptyCtx) {
  let entityMeta = $App.domainInfo.get(entity)
  entityMeta.checkMixin('softLock')
  let slMixin = entityMeta.mixins.softLock
  let lockEntity = slMixin.lockEntity
  let lockFields = slMixin.lockIdentifier.split('.')
  let entityCtx = this.entities[lockEntity]
  if (!entityCtx) {
    entityCtx = this.entities[lockEntity] = {}
  }

  let id
  if (typeof record !== 'object') {
    id = record
  } else {
    if (record.fields.indexOfKey(lockFields[0]) < 0) {
      throw new Error('Form record of ' + entity + ' entity must have ' + lockFields[0] + ' in fieldList')
    }
    id = record.get(lockFields[0])
  }

  let idCtx = entityCtx[id]
  if (!idCtx && addEmptyCtx) {
    idCtx = entityCtx[id] = []
  }
  return { idCtx: idCtx, lockEntity: lockEntity, id: id, hasEntityALS: !!entityMeta.mixins.als }
}

/**
 * @param {String} entity
 * @param {Number} ID Lock entity instance ID
 * @returns {Boolean}
 */
UB.ux.LockManager.existLock = function (entity, ID) {
  let entityMeta = $App.domainInfo.get(entity)
  entityMeta.checkMixin('softLock')
  let slMixin = entityMeta.mixins.softLock
  let entityCtx = this.entities[slMixin.lockEntity]
  if (!entityCtx) {
    return false
  }
  let idCtx = entityCtx[ID]
  return idCtx && idCtx.length > 0
}

/**
 * Register lock in manager
 * @param {Object} lockInfo
 * @param {Number} [lockInfo.lockIdentifier] Original lock identifier (ubs_softlock.id)
 * @param {String} lockInfo.entity Entity code
 * @param {Object|Number} lockInfo.instance Record or record ID
 * @param {Function} [lockInfo.onLockLoss]  Callback to be executed when lock could not update state.
 * @param {Object} lockInfo.scope
 * @returns {Object}
 */
UB.ux.LockManager.addLock = function (lockInfo) {
  let ctx = this.getContext(lockInfo.entity, lockInfo.instance, true)
  let idCtx = ctx.idCtx
  let rDate = new Date()
  ctx.lockIdentifier = lockInfo.lockIdentifier
  ctx.lockID = rDate.getTime() + '_' + idCtx.length
  ctx.onLockLoss = lockInfo.onLockLoss
  ctx.scope = lockInfo.scope
  ctx.entity = lockInfo.entity
  idCtx.push(ctx)
  this.initUpdateLock(ctx)
  return ctx
}

/**
* Delete lock if not exists link to this lock
* @param entity
* @param ID
*/
UB.ux.LockManager.checkUnlock = function (entity, ID) {
  let me = this
  let ctx = me.addLock({ entity: entity, instance: ID, scope: me })
  if (me.deleteLock(ctx) === true) {
    $App.connection.query({
      entity: entity,
      method: UB.core.UBCommand.methodName.UNLOCK,
      ID: ID
    }, true)
  }
}

/**
*  delete lock
* @param {Object} lockCtx
* @returns {boolean}
*/
UB.ux.LockManager.deleteLock = function (lockCtx) {
  let entityCtx = this.entities[lockCtx.lockEntity]
  if (!entityCtx) return false

  let idCtx = entityCtx[lockCtx.id]

  if (!idCtx) return false

  for (let i = 0, L = idCtx.length; i < L; i++) {
    if (idCtx[i].lockID === lockCtx.lockID) {
      idCtx.splice(i, 1)
      break
    }
  }
  if (idCtx.length === 0) {
    // no link to this lock. Delete it and stop scheduler.
    this.stopUpdateLock(lockCtx)
    delete entityCtx[lockCtx.id]
    return true
  }
  return false
}

/**
 * Init auto updatable lock
 * @param {Object} lockCtx
 */
UB.ux.LockManager.initUpdateLock = function (lockCtx) {
  let me = this
  lockCtx.schedulerID = lockCtx.lockEntity + lockCtx.id
  let scheduler = this.schedulers[lockCtx.schedulerID]
  if (scheduler) {
    return
  }
  me.schedulers[lockCtx.schedulerID] = scheduler = { lockCtx: lockCtx }
  scheduler.updateLockID = setInterval(function () {
    me.updateLock(lockCtx)
  }, me.lockTimeout)
}

/**
 * @private
 * @param {Object} lockCtx
 */
UB.ux.LockManager.stopUpdateLock = function (lockCtx) {
  let me = this
  if (!lockCtx.schedulerID) return
  let scheduler = me.schedulers[lockCtx.schedulerID]
  if (scheduler) {
    clearInterval(scheduler.updateLockID)
    delete me.schedulers[lockCtx.schedulerID]
  }
}

/**
 * @private
 * @param lockCtx
 * @returns {boolean}
 */
UB.ux.LockManager.fireOnLockLoss = function (lockCtx) {
  let entityCtx = this.entities[lockCtx.lockEntity]
  if (!entityCtx) return false

  let idCtx = entityCtx[lockCtx.id]
  if (!idCtx) return false
  for (let i = 0, L = idCtx.length; i < L; i++) {
    let ctx = idCtx[i]
    if (ctx.onLockLoss) {
      Ext.callback(ctx.onLockLoss, ctx.scope || this, [ctx])
    }
  }
}

/**
 * @param {Object} lockCtx
 */
UB.ux.LockManager.updateLock = function (lockCtx) {
  let me = this
  $App.connection.query({
    entity: lockCtx.lockEntity,
    method: 'renewLock',
    lockID: lockCtx.lockIdentifier
  }).then(function (result) {
    if (!result.resultLock.success) {
      if (result.resultLock.lockUser === $App.connection.userLogin()) {
        me.fireOnLockLoss(lockCtx)
        me.stopUpdateLock(lockCtx)
      } else {
        throw new UB.UBError(UB.i18n('lockedBy') + ' ' + result.resultLock.lockUser)
      }
    }
  }).catch(function () {
    me.fireOnLockLoss(lockCtx)
  })
}

/**
 *
 */
UB.ux.LockManager.forceUpdateAllLock = function () {
  let me = this
  for (let entity in me.entities) {
    if (me.entities.hasOwnProperty(entity)) {
      let entityCtx = me.entities[entity]
      for (let id in entityCtx) {
        if (entityCtx.hasOwnProperty(id)) {
          let idCtx = entityCtx[id]
          if (idCtx && idCtx.lentgth > 0) {
            let lockCtx = idCtx[0]
            me.stopUpdateLock(lockCtx)
            me.updateLock(lockCtx)
            me.initUpdateLock(lockCtx)
          }
        }
      }
    }
  }
}
