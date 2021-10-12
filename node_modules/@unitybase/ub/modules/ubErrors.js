/**
 * @module ubErrors
 * @memberOf module:@unitybase/ub
 */

/**
 * @classdesc
 * Server-side Abort exception. To be used in server-side logic in case of HANDLED
 * exception. This errors logged using "Error" log level to prevent unnecessary
 * EXC log entries.
 * @example

// UB client will show message inside <<<>>> to user (and translate it using UB.i18n)
const UB = require('@unitybase/ub')
throw new UB.UBAbort('<<<textToDisplayForClient>>>')
// In case, client-side message shall be formatted:
throw new UB.UBAbort('<<<file_not_found>>>', 'bad_file.name')
// The "file_not_found" i18n string on client should be like `'File "{0}" is not found or not accessible'
// Format args can be translated by assing a :i18n modifier to template string: `'File "{0:i18n}" is not found or not accessible'

// In case message should not be shown to the end used by ub-pub globalExceptionHandler `<<<>>>` can be omitted
throw new UB.UBAbort('wrongParameters')

 * @param {String} [message] Message
 * @extends {Error}
 * @constructor
 */
function UBAbort (message, ...args) {
  // For SM<=45 we use a "exception class" inherit pattern below, but it stop working in SM52, so fallback to Error
  this.name = 'UBAbort'
  this.code = 'UBAbort'
  this.errorNumber = 1002 // UBEXC_UBABORT_EXCEPTION in native code. such exceptions are logged as ERR level
  this.message = message || 'UBAbortError'
  if (args.length > 0) {
    this.message += '|' + JSON.stringify(args)
  }
  // FF, IE 10+ and Safari 6+. Fallback for others
  let tmpStack = (new Error()).stack.split('\n').slice(1)
  let realErr = tmpStack.find((str) => str.indexOf('@') > 0) // search for a first error outside of ub core modules
  // realErr ~ 'func@fileName:line:col'; fileName can contains :
  // eslint-disable-next-line no-unused-vars
  let [funcN, rest] = realErr.split('@')
  this.stack = tmpStack.join('\n')
  if (rest) {
    let parts = rest.split(':')
    this.lineNumber = parseInt(parts[parts.length - 2])
    this.fileName = parts.slice(0, -2).join(':')
  } else {
    this.fileName = ''
    this.lineNumber = 0
  }
  // original FF version:
  // this.stack = (new Error()).stack;
}
UBAbort.prototype = Object.create(Error.prototype) // new Error();
UBAbort.prototype.constructor = UBAbort

const E_SECURITY_EX_NUM = process.binding('ub_app')['UBEXC_ESECURITY_EXCEPTION']
/**
 * Server-side Security exception. Throwing of such exception will trigger `Session.securityViolation` event
 * @param {string} reason
 * @constructor
 */
function ESecurityException (reason) {
  this.errorNumber = E_SECURITY_EX_NUM
  this.message = reason || 'ESecurityException'
  // FF, IE 10+ and Safari 6+. Fallback for others
  let tmpStack = (new Error()).stack.split('\n').slice(1)
  let realErr = tmpStack.find((str) => str.indexOf('@') > 0) // search for a first error outside of ub core modules
  let re = /^(.*?)@(.*?):(.*?)$/.exec(realErr) // [undef, undef, this.fileName, this.lineNumber] = re
  this.fileName = re[2]
  this.lineNumber = re[3]
  this.stack = tmpStack.join('\n')
}
ESecurityException.prototype = Object.create(Error.prototype) // new Error();
ESecurityException.prototype.constructor = ESecurityException

module.exports = {
  UBAbort,
  ESecurityException
}
