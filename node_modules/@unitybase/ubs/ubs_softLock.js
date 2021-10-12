const UB = require('@unitybase/ub')
// eslint-disable-next-line no-undef,camelcase
const me = ubs_softLock
/**
 * Clean expired locks from ubs_softLock table. Scheduled at ~5AM
 *
 * @module ubsCleanupJob
 * @memberOf module:@unitybase/ubs
 */
me.cleanupSoftLocks = function () {
  const locksStore = UB.DataStore('ubs_softLock')
  const queryText = 'delete from ubs_softLock where lockType <> :ltype: and lockTime < :ltime:'
  const dayBefore = new Date()
  dayBefore.setHours(-1) // shift one day before
  locksStore.execSQL(queryText, { ltype: 'Persist', ltime: dayBefore })
  return 'ubs_softLock cleared of expired temporary locks'
}
