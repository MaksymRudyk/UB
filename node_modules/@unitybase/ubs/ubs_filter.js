const Session = require('@unitybase/ub').Session
/* global ubs_filter */
// eslint-disable-next-line camelcase
const me = ubs_filter
/**
 * Set owner to current user before inserting data
 * @private
 * @param {ubMethodParams} ctxt
 * @returns {boolean}
 */
me.on('insert:before', function (ctxt) {
  const execParams = ctxt.mParams.execParams
  execParams.owner = Session.userID
  return true
})

/**
 * Used in RLS to filter by owner == Session.userID
 * @method byOwner
 * @memberOf ubs_filter_ns.prototype
 * @memberOfModule @unitybase/ubs
 * @protected
 * @return {string}
 */
me.byOwner = function () {
  return '( [owner] = :(' + Session.userID + '): )'
}
