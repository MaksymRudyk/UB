const UB = require('@unitybase/ub')
const RLS = UB.ns('RLS')

/**
 * Dirty hack for federalized entities (for example ubs_numcounter) work without FED model.
 *
 * FED model define good realization of RLS.federalize - this is only stub
 */
RLS.federalize = function () {
  return '(1=1)'
}
