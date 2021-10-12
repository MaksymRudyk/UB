const UB = require('@unitybase/ub')
/* global ubs_numcounterreserv */
// eslint-disable-next-line camelcase
const me = ubs_numcounterreserv
me.entity.addMethod('reserveRC')
me.entity.addMethod('getReservedRC')

/**
 * Reserves numbers for future use
 * @method reserveRegnum
 * @memberOf ubs_numcounterreserv_ns.prototype
 * @memberOfModule @unitybase/ubs
 * @param {String} regkey Registration key
 * @param {Number} regNum  Number to reserve
 * @param {Date} [reservedDate]  Date for reserve
 * @param {string} [note]  Note of reserve
 * @return {Boolean} success
 */
me.reserveRegnum = function (regkey, regNum, reservedDate, note) {
  let res
  console.debug('==Call JS method ubs_numcounterreserv.reserveRegnum')
  console.debug('Parameters: regkey=' + regkey + ',regNum=' + regNum)
  // Read current counter value
  // Check, that we have value in database for specified key
  const store = UB.Repository('ubs_numcounterreserv')
    .attrs(['ID', 'regKey', 'counter'])
    .where('[regKey]', '=', regkey)
    .where('[counter]', '=', regNum)
    .limit(1)
    .select()
  // insert if not found
  if (store.eof) {
    const insobj = {
      execParams: {
        regKey: regkey,
        counter: regNum,
        reservedDate: reservedDate || null,
        note: note || ''
      }
    }
    res = store.run('insert', insobj)
  }
  return res
}

/**
 * Reserves some numbers for future use
 * @method reserveRC
 * @memberOf ubs_numcounterreserv_ns.prototype
 * @memberOfModule @unitybase/ubs
 * @published
 * @param {ubMethodParams} ctxt
 * @param {string} ctxt.mParams.execParams.regkey
 * @param {number} ctxt.mParams.execParams.regNum
 * @param {Date} ctxt.mParams.execParams.reservedDate
 * @param {string} [ctxt.mParams.execParams.note]
 * @returns {Boolean}
 */
me.reserveRC = function (ctxt) {
  const execParams = ctxt.mParams.execParams
  const upregkey = execParams.regkey
  const upregNum = execParams.regNum
  const reservedDate = execParams.reservedDate
  const note = ctxt.mParams.execParams.note
  return me.reserveRegnum(upregkey, upregNum, reservedDate, note)
}

/**
 * Gets first reserved number for regkey and remove returned number from reservation entity
 * @method getReservedRegnum
 * @memberOf ubs_numcounterreserv_ns.prototype
 * @memberOfModule @unitybase/ubs
 * @param {string} regKey  Registration Key
 * @return {number} Reserved number
 */
me.getReservedRegnum = function (regKey) {
  console.debug('--Call JS method: ubs_numcounterreserv.getReservedRegnum')
  console.debug('Parameters: regkey=', regKey)
  let returnVal = -1

  const repo = UB.Repository('ubs_numcounterreserv')
    .attrs(['ID', 'regKey', 'counter', 'reservedDate'])
    .where('[regKey]', '=', regKey)
    .where('[reservedDate]', 'isNull')
    .orderBy('counter', 'asc')
    .limit(1)
    .select()

  // Read current counter value
  if (repo && (!repo.eof)) {
    const IDValue = repo.get('ID')
    returnVal = repo.get('counter')
    const inst = UB.DataStore('ubs_numcounterreserv')
    inst.run('delete', {
      execParams: { ID: IDValue }
    })
  }
  return returnVal
}

/**
 * Get first reserved number for `regKey` and remove returned number from reservation entity.
 * Actual result returned as `mParams.getReservedRC`
 *
 * @method getReservedRC
 * @memberOf ubs_numcounterreserv_ns.prototype
 * @memberOfModule @unitybase/ubs
 * @published
 * @param {ubMethodParams} ctxt
 * @param ctxt.mParams.execParams.regKey
 * @returns {boolean}
 */
me.getReservedRC = function (ctxt) {
  const mp = ctxt.mParams
  const upRegkey = mp.execParams.regkey
  mp.getReservedRC = me.getReservedRegnum(upRegkey)
  return true
}
