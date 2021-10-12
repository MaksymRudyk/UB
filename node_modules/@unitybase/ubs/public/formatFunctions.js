/*
* Created by xmax on 17.02.2018
*/
// UB.formatter is client side only - use a cs-shared.formatByPattern directly
const {formatNumber, formatDate} = require('@unitybase/cs-shared').formatByPattern

/**
   * @param {Object} me
 * @param {String} property
 * @returns {*}
 */
function getDottedProperty (me, property) {
  let value = me
  property.split('.').forEach(function (name) {
    if (!value) throw new Error('Invalid property ' + name)
    value = value[name]
  })
  return value
}

/**
 *
 * @param {String} lang
 * @param {String} [format]
 * @param {String} [fixFormat] "number" or "date"
 * @return {Function}
 */
function formatMustache (lang, format, fixFormat) {
  return function (val, render) {
    const me = this
    const data = render(val)
    // inside the loops or condition blocks function scope is a loop/condition variable
    // in this case for template
    // {{#dateObj.dInner}}Terms:{{#$f}}"dateObj.dInner","dateTime"{{/$f}}{{/dateObj.dInner}}
    // scope is a value of dateObj.dInner - the Date object
    const valueIsIterable = ((me !== null) && (typeof me === 'object') && !(me instanceof Date))
    if (!data) return data
    let dataArr
    if (data === '""') { // {{#dateObj.dInner}}{{#$fd}}""{{/$fd}}{{/dateObj.dInner}}
      dataArr = []
    } else {
      dataArr = JSON.parse('[' + data + ']')
      if (dataArr < 1) {
        throw new Error('$format function require one or two parameter. {{#$f}}"amount"{{/f}} {{#$f}}"amount","sum"{{/f}} ')
      }
    }
    let value
    if (valueIsIterable) {
      value = getDottedProperty(me, dataArr[0])
    } else {
      value = me
    }
    if (fixFormat && (value !== undefined && value !== null)) {
      if (fixFormat === 'number') value = Number(value)
      else if (fixFormat === 'date' && !(value instanceof Date)) {
        value = value ? new Date(value) : ''
      }
    }
    if (typeof value === 'number') {
      let f = formatNumber(value, dataArr.length > 1 ? dataArr[1] : format || 'sum', lang)
      if ((format === 'sumDelim') && (value < 0)) {
        f = '<span style="color: #ff0000;">' + f + '</span>'
      }
      return f
    } else if (value && value instanceof Date) {
      return formatDate(value, dataArr.length > 1 ? dataArr[1] : (format || 'date'), lang)
    } else {
      return value ? '' + value : ''
    }
  }
}

/**
 * Add base sys function to data
 * @param {Object} data
 * @param {String} lang
 */
function addBaseMustacheSysFunction (data, lang) {
  data.i18n = function () {
    if (UB.isServer) {
      return function (word) {
        return UB.i18n(word, lang)
      }
    } else {
      return UB.i18n
    }
  }
}

/**
 * Add string format function to data
 * @param {Object} data
 * @param {String} [lang=en]
 */
function addMustacheSysFunction (data, lang) {
  lang = lang || 'en'
  /**
   * Format number or date by pattern. Usage {{#$f}}"fieldName","paternCode"{{/$f}}. List of pattern see in formatByPattern.js
   */
  data.$f = data.$$f = function () {
    return formatMustache(lang)
  }

  /**
   * Format number. Usage {{/$fn}}"fieldName"{{#$fn}}
   */
  data.$fn = data.$$fn = function () {
    return formatMustache(lang, 'number', 'number')
  }

  /**
   * Format number by pattern. Fix number data type and pattern "sum". Usage {{#$fs}}"fieldName"{{/$fs}}
   */
  data.$fs = data.$$fs = function () {
    return formatMustache(lang, 'sumDelim', 'number')
  }

  data.$crn = data.crn = function () {
    return formatMustache(lang, 'sum', 'number')
  }

  /**
   * Format date by pattern. Fix number data type and pattern "date". Usage {{#$fd}}"fieldName"{{/$fd}}
   */
  data.$fd = data.$$fd = function () {
    return formatMustache(lang, 'date', 'date')
  }

  /**
   * Format date by pattern. Fix number data type and pattern "time". Usage {{#$ft}}"fieldName"{{/$ft}}
   */
  data.$ft = data.$$ft = function () {
    return formatMustache(lang, 'time', 'date')
  }

  /**
   * Format date by pattern. Fix number data type and pattern "dateTime". Usage {{#$fdt}}"fieldName"{{/$fdt}}
   */
  data.$fdt = data.$$fdt = function () {
    return formatMustache(lang, 'dateTime', 'date')
  }

  /**
   * Format date by pattern. Fix number data type and pattern "dateTime". Usage {{#$fdt}}"fieldName"{{/$fdt}}
   */
  data.$fdts = data.$$fdts = function () {
    return formatMustache(lang, 'dateTimeFull', 'date')
  }
}

module.exports = {
  addBaseMustacheSysFunction: addBaseMustacheSysFunction,
  addMustacheSysFunction: addMustacheSysFunction
}
