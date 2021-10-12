const _ = require('lodash')

const __i18n = {
  monkeyRequestsDetected: 'Your request has been processed, but we found that it is repeated several times. Maybe you key fuse?'
}
const FORMAT_RE = /{([0-9a-zA-Z_]+)(?::([^\}]+))?}/g
const DOMAIN_RE = /^(\w+)(\.(\w+))?(#(documentation|description))?$/

function domainBasedLocalization (localeString) {
  // $App is accessible only inside adminUI
  if (typeof $App === 'undefined') return localeString

  if ($App.domainInfo == null) {
    // Domain is not loaded yet, cannot resolve string to entity or entity attribute's name
    return localeString
  }

  // Try to resolve string as entity name or entity attribute name
  const domainMatch = DOMAIN_RE.exec(localeString)
  if (!domainMatch) {
    // No match
    return localeString
  }

  const [, entityName, , attributeName, , hash = 'caption'] = domainMatch
  const entity = $App.domainInfo.entities[entityName]
  if (!entity) {
    // First part shall be a valid entity name
    return localeString
  }

  if (attributeName === undefined) {
    // A valid entity name, resolve to the entity's caption
    // Remember in __i18n for performance
    __i18n[localeString] = entity[hash]
    return entity[hash]
  }

  let attr = entity.attributes[attributeName]
  if (!attr) {
    // Expecting the second part to be a valid entity attribute name
    return localeString
  }

  // A valid entity attribute name, resolve to the entity attribute's caption
  // Remember in __i18n for performance
  __i18n[localeString] = attr[hash]
  return attr[hash]
}

/**
 * Gets the value at `path` of `object` or `undefined`
 * @param {object} obj The object to query
 * @param {string} p The path of the property to get
 */
function getByPath (obj, p) {
  if (obj[p]) return obj[p]
  let pp = p.split('.')
  let i = 0
  let L = pp.length
  do {
    obj = obj[pp[i++]]
  } while ((i < L) && (typeof obj === 'object'))
  return (i === L) ? obj : undefined
}

/**
 * see docs in ub-pub main module
 * @private
 * @param {String} localeString
 * @param {...*} formatArgs Format args
 * @returns {*}
 */
module.exports.i18n = function i18n (localeString, ...formatArgs) {
  if (localeString == null) return localeString
  if (typeof localeString !== 'string') return 'i18n: expect string but got ' + JSON.stringify(localeString)
  let res = getByPath(__i18n, localeString)
  if (res === undefined) res = domainBasedLocalization(localeString)
  if (formatArgs && formatArgs.length && (typeof res === 'string')) {
    // key-value object
    if ((formatArgs.length === 1) && (typeof formatArgs[0] === 'object')) {
      let first = formatArgs[0]
      return res.replace(FORMAT_RE, function (m, k, fmt) {
        let val = getByPath(first, k)
        if (fmt && fmt === 'i18n') {
          val = i18n(val)
        }
        return val
      })
    } else { // array of values
      return res.replace(FORMAT_RE, function (m, i, fmt) {
        let val = formatArgs[i]
        if (fmt && fmt === 'i18n') {
          val = i18n(val)
        }
        return val
      })
    }
  } else {
    return res
  }
}

/**
 * see docs in ub-pub main module
 * @private
 * @param {Object} localizationObject
 * @returns {Object} new i18n object
 */
module.exports.i18nExtend = function i18nExtend (localizationObject) {
  return _.merge(__i18n, localizationObject)
}
