const UB = require('@unitybase/ub')
/* global uba_als */
// eslint-disable-next-line camelcase
const me = uba_als
me.entity.addMethod('save')

/**
 * Save one ALS row. If case unique row "entity+attribute+state+roleName" is found in the database then
 * row will be update, else will be inserted
 *
 * @method save
 * @param {ubMethodParams} ctxt
 * @return {boolean}
 * @memberOf uba_als_ns.prototype
 * @memberOfModule @unitybase/uba
 * @published
 */
me.save = function (ctxt) {
  const execParams = ctxt.mParams.execParams

  const alsDataStore = UB.Repository('uba_als')
    .attrs(['ID'])
    .where('[entity]', '=', execParams.entity)
    .where('[attribute]', '=', execParams.attribute)
    .where('[state]', '=', execParams.state)
    .where('[roleName]', '=', execParams.roleName)
    .select()

  const rowCount = alsDataStore.rowCount
  const execInst = UB.DataStore('uba_als')

  console.debug('rowCount:', rowCount)

  if (rowCount === 0) {
    // insert
    console.debug('executing INSERT')
    const insertExecParams = {
      entity: execParams.entity,
      attribute: execParams.attribute,
      state: execParams.state,
      roleName: execParams.roleName,
      actions: execParams.actions
    }

    execInst.run('insert', {
      execParams: insertExecParams
    })
  } else {
    // update
    console.debug('executing UPDATE')
    const updateExecParams = {
      ID: alsDataStore.get('ID'),
      actions: execParams.actions
    }

    execInst.run('update', {
      execParams: updateExecParams
    })
  }
  return true
}
