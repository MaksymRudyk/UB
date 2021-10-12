/* global ubs_globalCache, _App */
// eslint-disable-next-line camelcase
const me = ubs_globalCache
const UB = require('@unitybase/ub')
me.entity.addMethod('select')

/**
 * Read only access to server-side global cache
 * @method select
 * @memberOf ubs_globalCache_ns.prototype
 * @memberOfModule @unitybase/ubs
 * @published
 * @param {ubMethodParams} ctx
 * @param {UBQL} ctx.mParams ORM query in UBQL format
 * @return {Boolean}
 */
me.select = function (ctx) {
  ctx.dataStore.currentDataName = 'select'
  if (!_App.globalCacheList) throw new UB.UBAbort('<<<Upgrade your UB server version >=5.7.5>>>')
  const arrData = JSON.parse(_App.globalCacheList())
  ctx.dataStore.initialize(arrData, ['ID', 'key', 'keyValue'])
  return true // everything is OK
}
