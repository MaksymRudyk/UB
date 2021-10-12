/* global Ext, $App */
const _ = require('lodash')
require('./UBAppConfig')
const UBDomain = require('@unitybase/cs-shared').UBDomain
const UB = require('@unitybase/ub-pub')

const ALLOWED_MISC = [
  '__mip_ondate ',
  '__mip_recordhistory',
  '__mip_recordhistory_all',
  '__mip_disablecache',
  '__allowSelectSafeDeleted'
]

/**
 * File: UB.core.UBUtil.js
 * Author Nozhenko Igor
 *
 * General functions
 */

Ext.define('UB.core.UBUtil', {
  singleton: true,

  /**
   * @return {String[]}
   */
  getLocalStorageKeys: function () {
    let keys = []
    let ls = window.localStorage
    if (ls) {
      for (var i = 0, len = ls.length; i < len; ++i) {
        keys.push(ls.key(i))
      }
    }
    return keys
  },

  /**
   * @param {String} key
   * @return {String|undefined}
   */
  getLocalStorageItem: function (key) {
    return window.localStorage ? window.localStorage.getItem(key) : undefined
  },

  /**
   * @param {String} key
   * @param {String} data
   */
  setLocalStorageItem: function (key, data) {
    if (window.localStorage) {
      window.localStorage.setItem(key, data)
    }
  },

  /**
   * @param {String} key
   */
  removeLocalStorageItem: function (key) {
    if (window.localStorage) {
      window.localStorage.removeItem(key)
    }
  },

  /**
   *  Clear local storage
   */
  clearLocalStorage: function () {
    if (window.localStorage) {
      window.localStorage.clear()
    }
  },

  /**
   * @param {String/Array} val
   * @return {String}
   */
  extractfromBrackets: function (val) {
    if (Array.isArray(val)) {
      val = val.join(',')
    }

    return typeof val === 'string' ? val.replace(/\[([^\]]*?)]/g, '$1') : val
  },

  /**
   * @param {String} val
   * @return {String}
   */
  removeWhitespaces: function (val) {
    return typeof val === 'string' ? val.replace(/\s/g, '') : val
  },

  /**
   * Concatenate two string with separator (in case both string !== '')
   * @param {String} strBegin
   * @param {String} strEnd
   * @param {String} [separator] (optional)
   * @return {String}
   */
  gatherStr: function (strBegin, separator, strEnd) {
    strBegin = strBegin || ''
    separator = separator || ''
    strEnd = strEnd || ''

    if (!strBegin.length) {
      return strEnd
    } else if (!strEnd.length) {
      return strBegin
    } else {
      return strBegin + separator + strEnd
    }
  },

  /**
   *
   * @return {Number}
   */
  getWindowHeight: function () {
    return (window.innerHeight
      ? window.innerHeight
      : (document.documentElement && document.documentElement.clientHeight
        ? document.documentElement.clientHeight
        : (document.body.clientHeight ? document.body.clientHeight : 400))) - 200
  },

  /**
   *
   * @return {Number}
   */
  getWindowWidth: function () {
    return (window.innerWidth
      ? window.innerWidth
      : (document.documentElement && document.documentElement.clientWidth
        ? document.documentElement.clientWidth
        : (document.body.clientWidth ? document.body.clientWidth : 800))) - 200
  },

  /**
   * @param {Object} objLeft
   * @param {Object} objRight
   * @return {Boolean}
   */
  allPropsEqual: function (objLeft, objRight) {
    for (let p in objRight) {
      if (objRight.hasOwnProperty(p) && (objLeft[p] !== objRight[p])) {
        return false
      }
    }
    return true
  },

  /**
   * @param {String} name
   * @param {String|String[]|Object} [more] (optional)
   * @return {String}
   */
  getNameMd5: function (name, more) {
    let addStr = ''

    if (arguments.length === 0) {
      return undefined
    }

    name = arguments[0]
    for (let i = 1, len = arguments.length; i < len; ++i) {
      let param = arguments[i]
      let strEnd = JSON.stringify(param)
      addStr = this.gatherStr(addStr, '_', strEnd)
    }

    return this.gatherStr(name, '_', addStr && addStr.length ? UB.MD5(addStr).toString() : '')
  },

  /**
   *
   * @param {String} str
   * @param {RegExp} regexp
   * @param {Number} groupNo
   * @return {String|undefined}
   */
  getRegExpGroup: function (str, regexp, groupNo) {
    var m = regexp.exec(str)

    return m && m.length > groupNo ? m[groupNo] : undefined
  },

  /**
   * @deprecated OBSOLETTE since UB4. Use _.find(array, [propertyName, propertyValue])
   * @param {Object[]} array
   * @param {String} propertyName
   * @param {Boolean/Number/String} propertyValue
   * @return {Object}
   */
  getByPropertyValue: function (array, propertyName, propertyValue) {
    throw new Error('UBUtils.getByPropertyValue is obsolete. Use _.find(array, [propertyName, propertyValue])')
  },

  /**
   *
   * @param {String/Object} src
   * @param {String} propertyName
   * @return {Array/Boolean/Date/Function/Number/Object/RegExp/String}
   */
  getProperty: function (src, propertyName) {
    var tmpObj = Ext.isString(src) ? Ext.JSON.decode(src, true) : src

    return tmpObj ? tmpObj[propertyName] : undefined
  },

  /**
   * Checks if two values are equal, taking into account certain
   * special factors, for example dates.
   * @param {Object} a The first value
   * @param {Object} b The second value
   * @return {Boolean} True if the values are equal
   */
  isEqual: function (a, b) {
    if (Ext.isDate(a) && Ext.isDate(b)) {
      return Ext.Date.isEqual(a, b)
    }
    return a === b
  },

  /**
   *
   * @param {String|Date} value
   * @return {Date}
   */
  dateISO8601Parse: function (value) {
    var result
    return Ext.isDate(value) ? value : (!isNaN(result = Date.parse(value)) ? new Date(result) : null)
  },

  /**
   *
   * @param {String[]} arr
   * @param {String} prefix
   * @param {String} separator (optional)
   * @return {String[]}
   */
  addPrefix: function (arr, prefix, separator) {
    var result = []

    if (!Array.isArray(arr)) {
      return result
    }

    for (var i = 0, len = arr.length; i < len; ++i) {
      result.push(this.gatherStr(prefix, separator, arr[i]))
    }

    return result
  },

  /**
   * @deprecated This function is OBSOLETE since UB4
   * @param {Object} l
   * @param {Object} r
   * @return {Boolean}
   */
  isObjectEqual: function (l, r) {
    throw new Error('UBUtils.isObjectEqual is obsolete')
  },

  /**
   * @deprecated This function is OBSOLETE since UB4
   * @param {Array} l
   * @param {Array} r
   * @return {Boolean}
   */
  isArrayEqual: function (l, r) {
    throw new Error('UBUtils.isArrayEqual is obsolete')
  },

  base64String: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',

  /**
   * @deprecated Since UB1.12 use UB.base64fromAny
   */
  base64fromArrayBuffer: function () {
    throw new Error('UB.core.UBUtil.base64fromArrayBuffer deprecated. Use UB.base64fromArrayBuffer')
  },

  /**
   * @param {String} base64
   * @returns {Array}
   */
  base64toArrayOfFloats: function (base64) {
    var arrayBuffer = this.toArrayBuffer(base64)
    var floatArray = new Float32Array(arrayBuffer)

    var arrayOfFloats = []
    for (var i = 0, il = floatArray.length; i < il; i++) {
      arrayOfFloats.push(floatArray[i])
    }

    return arrayOfFloats
  },

  /**
   * @param {Date} v
   * @returns {Date}
   */
  truncTimeToUtcNull: function (v) { return UB.truncTimeToUtcNull(v) },

  truncTime: function (value) {
    if (!value) return value

    return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  },

  /**
   *
   * @param {Date} inDate
   * @param {Number} countDay
   * @returns {Date}
   */
  addDays: function (inDate, countDay) {
    if (!inDate) return inDate

    var result = new Date()
    result.setTime(inDate.getTime())
    result.setDate(inDate.getDate() + countDay)
    return result
  },

  /**
   * Convert date to UB format
   * @param {Date} value
   * @param {String} dataType
   * @returns {Date}
   */
  convertDate: function (value, dataType) {
    if (!value || !Ext.isDate(value)) {
      return value
    }
    if (dataType === UBDomain.ubDataTypes.Date) {
      return UB.truncTimeToUtcNull(value)
    }
    return value
  },

  /**
   *
   * @param {String} text
   * @returns {String}
   */
  escapeForRegexp: function (text) {
    return typeof text === 'string' ? text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') : ''
  },

  /**
   * Takes fieldList configuration and prepare it to using in query to DB
   * @param {Array<String|Object>} fieldList
   * @param {Boolean} [onlyVisibleFields] return only visible (field.visibility !== false) fields. Default False mean return all
   * @returns {Array<String>} fieldList
   */
  convertFieldListToNameList: function (fieldList, onlyVisibleFields) {
    var result = []
    _.forEach(fieldList, function (item) {
      if (typeof item === 'string') {
        result.push(item)
      } else if (!onlyVisibleFields || (onlyVisibleFields && item.visibility !== false)) {
        result.push(item.name)
      }
    })
    return result
  },

  /**
  * Takes fieldList configuration and prepare it to drawing in grid
  * @param {Array<String|Object>} fieldList
  * @returns {Array<Object>} fieldList
  */
  convertFieldListToExtended: function (fieldList) {
    return fieldList.map(function (field) {
      return (typeof field === 'string') ? { name: field } : field
    })
  },

  /**
   * Create {@link Ext.Component#Configs } configuration based on entity attribute definition
   * @param {String|UBEntity} entityName
   * @param {Object} attributeDefinition
   * @return {Object}
   */
  attribute2cmpConfig: function (entityName, attributeDefinition) {
    var
      cmpConfig,
      entity, attribute

    if (typeof (entityName) === 'string') {
      entity = $App.domainInfo.get(entityName)
    } else {
      entity = entityName
    }

    attribute = entity.attr(attributeDefinition.attributeName)
    if (attribute) {
      cmpConfig = this.ubDt2Ext(attribute, attributeDefinition)
      cmpConfig.name = attributeDefinition.attributeName
      cmpConfig.fieldLabel = attribute.caption || attributeDefinition.attributeName
      if (Ext.isDefined(attribute.isMultiLang)) {
        cmpConfig.isMultiLang = attribute.isMultiLang
      }
      if (Ext.isDefined(attribute.allowNull)) {
        cmpConfig.allowBlank = attribute.allowNull
      }
      cmpConfig.entityName = entity.code
    }

    return cmpConfig
  },

  /**
   * @param {UBEntityAttribute} attribute
   * @return {Object} {@link Ext.Component#configs}
   * @private
   */
  ubDt2Ext: function (attribute, attributeDefinition) {
    const ubDataTypes = UBDomain.ubDataTypes

    let ext
    switch (attribute.dataType) {
      case ubDataTypes.Enum:
        ext = this.getComponentConfig4Enum(attribute.enumGroup, attributeDefinition)
        break
      case ubDataTypes.Entity:
        ext = this.getComponentConfig4Entity(attribute.associatedEntity, attributeDefinition)
        break
      case ubDataTypes.Many:
        let fieldListExist = Array.isArray(attributeDefinition.fieldList) && (attributeDefinition.fieldList.length > 0)
        let associatedEntityDisplayField = fieldListExist ? attributeDefinition.fieldList[0] : $App.domainInfo.get(attribute.associatedEntity).getDescriptionAttribute()
        let fieldList = ['ID'].concat(fieldListExist ? attributeDefinition.fieldList : [associatedEntityDisplayField])
        let whereList = attributeDefinition ? attributeDefinition.whereList : undefined
        fieldList = (attributeDefinition ? attributeDefinition.fieldList : null) || fieldList
        let orderList = (attributeDefinition ? attributeDefinition.orderList : undefined) ||
                { '_asc': { expression: associatedEntityDisplayField, order: UB.core.UBCommand.order.sqlotAsc } }

        ext = {
          xtype: 'ubboxselect', // "comboboxselect"
          store: Ext.create('UB.ux.data.UBStore', {
            ubRequest: {
              entity: attribute.associatedEntity,
              method: 'select',
              fieldList: fieldList,
              orderList: orderList,
              whereList: whereList
            },
            autoLoad: false,
            autoDestroy: true
          }),
          valueField: 'ID',
          displayField: associatedEntityDisplayField,
          queryMode: 'remote',
          editable: true,
          forceSelection: true,
          grow: false
        }
        break
      case ubDataTypes.Document:
        ext = { xtype: 'ubdocument' }
        if (attribute.documentMIME) {
          ext.documentMIME = attribute.documentMIME
        }
        break
      case ubDataTypes.Text:
        ext = { xtype: 'textareafield' }
        break
      case ubDataTypes.Json:
        ext = { xtype: 'ubcodemirror', valueIsJson: true }
        break
      case ubDataTypes.Date:
        ext = { xtype: 'ubdatefield', fieldType: ubDataTypes.Date, format: Ext.util.Format.dateFormat }
        break
      case ubDataTypes.DateTime:
        ext = { xtype: 'ubdatetimefield', fieldType: ubDataTypes.DateTime } /*, format: Ext.util.Format.date Format */
        break
      case ubDataTypes.Currency:
      case ubDataTypes.Float:
        let decPrecision = (attribute.dataType === ubDataTypes.Currency) ? 2 : UBDomain.FLOATING_SCALE_PRECISION
        let minValue = attribute.dataType === ubDataTypes.Currency ? -8999000000000000 : -8999000000000
        let maxValue = attribute.dataType === ubDataTypes.Currency ? 8999000000000000 : 8999000000000
        ext = {
          xtype: 'numberfield',
          enforceMaxLength: true,
          hideTrigger: true,
          keyNavEnabled: false,
          mouseWheelEnabled: false,
          decimalPrecision: decPrecision,
          validator: function (val) {
            if (Number(val.replace(/[^0-9,.]/, '').replace(',', '.')) < maxValue &&
              Number(val.replace(/[^0-9,.]/, '').replace(',', '.')) > minValue
            ) {
              let rv = val.replace('-', '').match(/[0-9]*[^0-9]{1}([0-9]+)/)
              if ((rv && rv.length > 1 && rv[1].length <= this.decimalPrecision) || !rv || rv.length === 1) {
                return true
              }
            }
            return UB.i18n('numberOfSignificantDigits')
          },
          valueToRaw: UB.core.UBUtil.formatAsCurrency,
          maxValue,
          minValue
        }
        break
      default:
        ext = this.getComponentConfigByDataType(attribute.dataType, attribute.size)
        break
    }
    if (attribute.readOnly) ext.readOnly = true
    return ext
  },
  /**
   * Create currency format value
   * @param {currency} value
   */
  formatAsCurrency: function (value) {
    return _.isNumber(value) ? Ext.util.Format.currency(value, '', this.decimalPrecision || 2).replace(/ /g, '') : ''
  },
  /**
   * Create component config by data type
   * @param {String} dataType
   * @param {Number} [size] (optional) in case dataType = String - length of attribute
   */
  getComponentConfigByDataType: function (dataType, size) {
    let configs = {
      'int': { xtype: 'numberfield', allowDecimals: false, hideTrigger: true },
      'float': { xtype: 'numberfield', hideTrigger: true },
      'date': { xtype: 'ubdatefield', format: Ext.util.Format.dateFormat },
      'boolean': { xtype: 'checkboxfield' },
      'string': { xtype: 'ubtextfield', enforceMaxLength: true }
    }
    let physicalType = UBDomain.getPhysicalDataType(dataType)
    let config = configs[physicalType] || { xtype: 'ubtextfield' }

    if (physicalType === 'string') {
      config = size > 256 ? { xtype: 'ubtextareafield', rows: 3 } : { xtype: 'ubtextfield' }
      if (size) {
        Ext.apply(config, {
          maxLength: size,
          enforceMaxLength: true
        })
      }
    }

    return config
  },

  /**
   * Create combobox config for entity
   * Example:
   *  pvdCombo = Ext.widget( Ext.apply(UB.core.UBDomainManager.getComponentConfig4Entity('tri_pvd'), {fieldLabel: 'ПВД', labelAlign: 'right'}));
   *  frm = Ext.create('Ext.window.Window', {items: [pvdCombo]});
   *
   * @param {String|UBEntity} entityCode
   * @param {Object} config
   * @param {Array} [config.fieldList=["ID", entity.descriptionAttribute]] field list for combobox store
   * @param {Object} [config.whereList] where list for combobox store
   * @param {String} [config.attributeName] in case component created from entity attribute - attribute code
   * @param {Object} [config.orderList] Custom order list for combo. By default combo sorted by first attribute (usually this is description attribute)
   */
  getComponentConfig4Entity: function (entityCode, config) {
    let entity
    let whereList = config ? config.whereList : undefined
    let fieldList = config ? config.fieldList : null
    let orderList = config ? config.orderList : undefined

    if (typeof (entityCode) === 'string') {
      entity = $App.domainInfo.get(entityCode)
    } else {
      entity = entityCode
    }

    fieldList = fieldList || [entity.getDescriptionAttribute()]
    if (fieldList.indexOf('ID') < 0) {
      fieldList = ['ID'].concat(fieldList)
    }

    let ubRequest = {
      entity: entity.code,
      method: UB.core.UBCommand.methodName.SELECT,
      fieldList: fieldList,
      whereList: whereList,
      orderList: orderList || { _asc: { expression: fieldList[1], order: UB.core.UBCommand.order.sqlotAsc } }
    }

    _.forEach(ALLOWED_MISC, function (misc) {
      if (config && config[misc] !== undefined) {
        ubRequest[misc] = config[misc]
      }
    })

    return {
      xtype: 'ubcombobox',
      store: Ext.create('UB.ux.data.UBStore', {
        ubRequest: ubRequest,
        autoLoad: false,
        autoDestroy: true
      }),
      valueField: 'ID',
      displayField: fieldList[1],
      fieldList: fieldList,
      entityName: entity.code
    }
  },

  /**
   * Create combobox config for enum
   * @param enumGroup
   * @param {Object} config
   * @param {Array} config.filters Array of filter for enum store
   * @return {Object}
   *
   */
  getComponentConfig4Enum: function (enumGroup, config) {
    let whereList = config && config.whereList ? config.whereList : {}
    let orderList = config && config.orderList
      ? config.orderList
      : { byOrder: { expression: 'sortOrder', order: 'asc' } }

    if (UB.connection.UBQLv2) {
      whereList.enumGroupFilter = {
        expression: '[eGroup]',
        condition: 'equal',
        value: enumGroup
      }
    } else {
      whereList.enumGroupFilter = {
        expression: '[eGroup]',
        condition: 'equal',
        values: { eGroup: enumGroup }
      }
    }

    let store = Ext.create('UB.ux.data.UBStore', {
      ubRequest: {
        entity: 'ubm_enum',
        method: UB.core.UBCommand.methodName.SELECT,
        fieldList: (config && config.fieldList) ? _.union(config.fieldList, ['eGroup', 'sortOrder']) : ['eGroup', 'code', 'name', 'shortName', 'sortOrder'],
        whereList: whereList,
        orderList: orderList,
        idProperty: 'code'
      },
      disablePaging: true,
      autoLoad: false,
      autoDestroy: true
    })
    store.load()
    return {
      xtype: 'ubbasebox',
      disableContextMenu: true,
      store: store,
      valueField: 'code',
      displayField: 'name',
      queryMode: 'local',
      editable: false,
      forceSelection: true,
      grow: false
    }
  },

  /**
   *
   * @param {String} entityName
   * @return {Object}
   */
  getEntityAttributesTree: function (entityName) {
    var entity = $App.domainInfo.get(entityName)
    return entity ? {
      leaf: false,
      id: entityName,
      expanded: true,
      text: entity.caption || entityName,
      children: UB.core.UBUtil.getEntityAttributesTreeData(entity, '', 1)
    } : undefined
  },

  /**
   * Return tree data of entity attributes (3 level depth)
   * @param {String|UBEntity} entityName
   * @param {String} parentEntityName
   * @return {Array}
   */
  getEntityAttributesTreeData: function (entityName, parentEntityName, level) {
    const data = []
    let entity

    if (typeof entityName === 'string') {
      entity = $App.domainInfo.get(entityName)
    } else {
      entity = entityName
    }

    if ((!entity) || (level > 3)) { // possible self circle so limit deep by 3 - it enough in real system usage
      return data
    }

    entity.eachAttribute(function (attr, attrName) {
      let nodeHtml = !attr.allowNull ? `<strong>${attrName}</storng>` : attrName
      if (attr.dataType === UBDomain.ubDataTypes.Entity) {
        nodeHtml += ` -> ${attr.getAssociatedEntity().name}`
      }
      if (attr.caption && (attr.caption.toUpperCase() !== attrName.toUpperCase())) {
        nodeHtml += `<span class="u-form-row__description"> - ${attr.caption}</span>`
      }
      const node = {
        id: (parentEntityName ? parentEntityName + '.' : '') + attrName,
        text: nodeHtml,
        leaf: attr.dataType !== UBDomain.ubDataTypes.Entity,
        parentId: parentEntityName || entityName
      }

      if ((attr.dataType === UBDomain.ubDataTypes.Entity) &&
          (entityName !== attr.associatedEntity)) { // self circle entity
        node.children = UB.core.UBUtil.getEntityAttributesTreeData(attr.associatedEntity, node.id, level + 1)
      }
      data.push(node)
    })

    return data
  }

}, function () {
  Ext.ns('UB.Utils')
  UB.Utils = UB.core.UBUtil
})
