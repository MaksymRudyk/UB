/**
 * Dates and Numbers formatting using Intl
 * On client this module exposed as `UB.formatter` and `Vue.prototype.$UB.formatter`
 *
 * @module formatByPattern
 * @author xmax
 * @memberOf module:@unitybase/cs-shared
 */
// {month:  '2-digit', day: 'numeric', year: 'numeric',  hour: '2-digit', minute: '2-digit', second: '2-digit'})
const datePatterns = {
  date: { month: '2-digit', day: '2-digit', year: 'numeric' },
  dateFull: { month: '2-digit', day: '2-digit', year: '2-digit' },
  dateShort: { month: '2-digit', year: '2-digit' },
  dateFullLong: { month: 'long', day: '2-digit', year: 'numeric' },
  dateMYY: { month: '2-digit', year: 'numeric' },
  dateMYLong: { month: 'long', year: 'numeric' },
  time: { hour: '2-digit', minute: '2-digit' },
  timeFull: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
  dateTime: { month: '2-digit', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  dateTimeFull: { month: '2-digit', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }
}
// {style: 'decimal', useGrouping: true, minimumIntegerDigits: 10, maximumFractionDigits: 2, minimumFractionDigits: 2, minimumSignificantDigits: 5}
const numberPatterns = {
  sum: { style: 'decimal', useGrouping: true, maximumFractionDigits: 2, minimumFractionDigits: 2 },
  numberGroup: { style: 'decimal', useGrouping: true, maximumFractionDigits: 0 },
  sumDelim: { style: 'decimal', useGrouping: true, maximumFractionDigits: 2, minimumFractionDigits: 2 },
  number: { style: 'decimal', useGrouping: false, maximumFractionDigits: 0 },
  decimal1: { style: 'decimal', useGrouping: true, maximumFractionDigits: 1, minimumFractionDigits: 1 },
  decimal2: { style: 'decimal', useGrouping: true, maximumFractionDigits: 2, minimumFractionDigits: 2 },
  decimal3: { style: 'decimal', useGrouping: true, maximumFractionDigits: 3, minimumFractionDigits: 3 },
  decimal4: { style: 'decimal', useGrouping: true, maximumFractionDigits: 4, minimumFractionDigits: 4 },
  decimal5: { style: 'decimal', useGrouping: true, maximumFractionDigits: 5, minimumFractionDigits: 5 },
  decimal6: { style: 'decimal', useGrouping: true, maximumFractionDigits: 6, minimumFractionDigits: 6 }
}

/**
 * lang to ICU locale hook (if defined by setLang2LocaleHook)
 * @private
 * @type {null|function}
 */
let l2lHook = null
const langToICU = {
  en: 'en-US',
  ru: 'ru-RU',
  uk: 'uk-UA',
  az: 'az'
}

// TODO - FIX ME by prevent `@unitybase/cs-shared` package includes into every compiled module
//  (adminui-pub, adminui-vue, vendor packages etc.).
if (typeof _defaultLang === 'undefined') {
  _defaultLang = 'en'
}
_collator = undefined

/**
 * Create a ICU locale based on UB language
 * @param lang
 * @return {string}
 */
function lang2locale (lang) {
  if (l2lHook) return l2lHook(lang)
  lang = lang || _defaultLang
  if ((lang.length < 3) && langToICU[lang]) {
    return langToICU[lang]
  } else {
    return lang + '-' + lang.toUpperCase()
  }
}

/**
 * Intl number formatters cache.
 *
 * Keys is a language, values is an object with keys is date pattern, value is Intl.NumberFormat for this pattern
 * {en: {sum: new Intl.NumberFormat('en-US', numberPatterns.sum)}
 * @private
 */
let numberFormaters = {}

/**
 * Intl Date formatters cache.
 *
 * Keys is a language, values is an object with keys is date pattern, value is Intl.DateTimeFormat for this pattern
 * {en: {date: new Intl.DateTimeFormat('en-US', datePatterns.date)}
 * @private
 */
let dateTimeFormaters = {}

/**
 * Format date by pattern
 * @example
    const formatByPattern = require('@unitybase/cs-shared').formatByPattern
    const d = new Date(2020, 04, 23, 13, 14)
    formatByPattern.formatDate(d, 'date') // on client can be called without 3rd lang parameter - will be formatted for user default lang (for uk - 23.05.2020)
    formatByPattern.formatDate('2020-05-23', 'date', 'uk') // 23.05.2020
    formatByPattern.formatDate(d, 'date', 'en') // 05/23/2020
    formatByPattern.formatDate(d, 'dateTime', 'uk') // 23.05.2020 13:14
    formatByPattern.formatDate(d, 'dateTimeFull', 'uk') // 23.05.2020 13:14:00
    formatByPattern.formatDate(d, 'date', 'en') // 05/23/2020, 1:14 PM
 *
 * @param {*} dateVal Date object or Number/String what will be converted to Date using new Date();
 *   null, undefined and empty string will be converted to empty string
 * @param {string} patternName One of `formatByPattern.datePatterns`
 * @param {string} [lang=defaultLang] UB language code. If not specified value defined by setDefaultLang is used
 * @return {string}
 */
module.exports.formatDate = function (dateVal, patternName, lang = _defaultLang) {
  if (!dateVal) return ''
  if (!(dateVal instanceof Date)) dateVal = new Date(dateVal)

  // lazy create Intl object
  if (!dateTimeFormaters[lang]) dateTimeFormaters[lang] = {}
  if (!dateTimeFormaters[lang][patternName]) {
    const pattern = datePatterns[patternName]
    if (!pattern) throw new Error(`Unknown date pattern ${patternName}`)
    const locale = lang2locale(lang)
    dateTimeFormaters[lang][patternName] = new Intl.DateTimeFormat(locale, pattern)
  }
  return dateTimeFormaters[lang][patternName].format(dateVal)
}

/**
 * Format number by pattern. Use parseFloat to convert non-number numVal argument into Number. Returns empty string for `!numVal` and `NaN`
 * @example
 const formatByPattern = require('@unitybase/cs-shared').formatByPattern
 const n = 2305.1
 formatByPattern.formatNumber(n, 'sum', 'en') // 2,305.10
 formatByPattern.formatNumber('2305.1', 'sum', 'en') // 2,305.10
 formatByPattern.formatNumber(n, 'sum') // on client can be called without 3rd lang parameter - will be formatted for user default lang (for uk "2 305,10")
 *
 * @param {*} numVal
 * @param {string} patternName One of `formatByPattern.datePatterns`
 * @param {string} [lang=defaultLang] UB language code. If not specified value defined by `setDefaultLang` is used
 * @return {string}
 */
module.exports.formatNumber = function (numVal, patternName, lang = _defaultLang) {
  if (!numVal && (numVal !== 0)) return ''
  const v = (typeof numVal === 'number') ? numVal : parseFloat(numVal)
  if (Number.isNaN(v)) return ''
  // lazy create Intl object
  if (!numberFormaters[lang]) numberFormaters[lang] = {}
  if (!numberFormaters[lang][patternName]) {
    const pattern = numberPatterns[patternName]
    if (!pattern) throw new Error(`Unknown number pattern ${patternName}`)
    const locale = lang2locale(lang)
    numberFormaters[lang][patternName] = new Intl.NumberFormat(locale, pattern)
  }
  return numberFormaters[lang][patternName].format(numVal)
}

/**
 * Set application-specific UB lang to ICU locale transformation hook.
 * Default hook uses `{en: 'en-US', ru: 'ru-RU', uk: 'uk-UA', az: 'az'}` translation, any other language `ln` translated into `ln-LN`.
 *
 * Application can redefine this rule by sets his own hook, for example to translate `en -> 'en-GB'` etc.
 *
 * @param {function} newL2lHook function whats takes a UB language string and returns a ICU locale string
 */
module.exports.setLang2LocaleHook = function (newL2lHook) {
  l2lHook = newL2lHook
  // reset cache
  numberFormaters = {}
  dateTimeFormaters = {}
}
/**
 * Available date patterns
 * @type {string[]}
 */
module.exports.datePatterns = Object.keys(datePatterns)
/**
 * Available Number patterns
 * @type {string[]}
 */
module.exports.numberPatterns = Object.keys(numberPatterns)

/**
 * Set a default language to use with `strCmp`, `formatNumber` and `formatDate`.
 * For UI this is usually a logged in user language.
 * @param {string} lang
 */
function setDefaultLang (lang) {
  if (_defaultLang === lang) return
  _defaultLang = lang
  _collator = undefined
  if ((typeof Intl === 'object') && Intl.Collator) {
    _collator = new Intl.Collator(lang, { numeric: true })
  }
}

module.exports.setDefaultLang = setDefaultLang

/**
 * Compare two value using `Intl.collator` for default language.
 * Returns 0 if values are equal, otherwise 1 or -1.
 * @param {*} v1
 * @param {*} v2
 * @return {number}
 */
module.exports.collationCompare = function (v1, v2) {
  if (_collator) {
    return _collator.compare(v1, v2)
  } else {
    if (v1 === v2) return 0
    return v1 > v2 ? 1 : -1
  }
}
