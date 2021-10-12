/*
 * Server side i18n
 */
const _ = require('lodash')
/**
 * i18n localization data. Do not use directly - use UB.i18n method instead
 * @property {Object} i18nData
 * @private
*/
let i18nData = {}

_.merge(i18nData, {
  'en': {
    property: 'property',
    Model: 'Model',
    Attribute: 'Attribute',
    Type: 'Type',
    Caption: 'Caption',
    Description: 'Description',
    eof: ''
  },

  'ru': {
    property: 'свойство',
    Model: 'Модель',
    Attribute: 'Атрибут',
    Type: 'Тип',
    Caption: 'Заголовок',
    Description: 'Описание',
    eof: ''
  },

  'uk': {
    property: 'властивість',
    Model: 'Модель',
    Attribute: 'Атрибут',
    Type: 'Тип',
    Caption: 'Заголовок',
    Description: 'Опис',
    eof: ''
  },

  'az': {
    property: 'əmlak',
    Model: 'Model',
    Attribute: 'Attribute',
    Type: 'Type',
    Caption: 'Caption',
    Description: 'Description',
    eof: ''
  },

  'ka': {
    property: 'property',
    Model: 'Model',
    Attribute: 'Attribute',
    Type: 'Type',
    Caption: 'Caption',
    Description: 'Description',
    eof: ''
  },

  'tg': {
    property: 'свойство',
    Model: 'Модель',
    Attribute: 'Атрибут',
    Type: 'Тип',
    Caption: 'Заголовок',
    Description: 'Описание',
    eof: ''
  },

  'ky': {
    property: 'свойство',
    Model: 'Модель',
    Attribute: 'Атрибут',
    Type: 'Тип',
    Caption: 'Заголовок',
    Description: 'Описание',
    eof: ''
  }
})

/**
 * @module i18n
 * @memberOf module:@unitybase/ub
 */
/**
 * Merge localizationObject to UB.i18n. Usually called form serverLocale scripts
 * @param {Object} localizationObject
 */
function extend (localizationObject) {
  _.merge(i18nData, localizationObject)
}

/**
 * Localize a message to lang. Return original message either lang not found
 * or msg mot found in lang
 * @param {String} lang
 * @param {*} msg
 * @return {*}
 */
function lookup (lang, msg) {
  if (!i18nData[lang]) return msg
  return i18nData[lang][msg] ? i18nData[lang][msg] : msg
}

module.exports = {
  lookup: lookup,
  extend: extend
}
