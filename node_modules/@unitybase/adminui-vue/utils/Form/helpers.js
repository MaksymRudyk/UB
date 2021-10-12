/* global _ */
/**
 * Helpers for Forms. Exported by `@unitybase/adminui-vue` as `formHelpers` and can be used as
 * @example

// valid usage
const formHelpers = require('@unitybase/adminui-vue').formHelpers
// WRONG usage
const helpers = require('@unitybase/adminui-vue/utils/Form/helpers')

 * @module formHelpers
 * @memberOf module:@unitybase/adminui-vue
 */
module.exports = {
  buildExecParams,
  mapInstanceFields,
  computedVuex,
  mergeStore,
  required,
  transformCollections,
  buildDeleteRequest,
  enrichFieldList,
  SET,
  isEmpty,
  change,
  prepareCopyAddNewExecParams,
  validateWithErrorText
}

const UB = require('@unitybase/ub-pub')
const UB_DATA_TYPES = require('@unitybase/cs-shared').UBDomain.ubDataTypes
/** @type VueConstructor */
const Vue = require('vue')
// eslint-disable-next-line no-unused-vars
const Vuex = require('vuex') // required to see a Vuex.d.ts
const { withParams } = require('vuelidate/lib/params')

/**
 * @typedef {object} VuexTrackedInstance
 * @property {boolean} isNew        Whether master instance was loaded or it is newly created
 * @property {object}  data         Master record instance, current values, as shall be shown on UI
 * @property {object}  originalData Shadow copy of modified attributes
 * @property {object<string, VuexTrackedCollection>} collections   List of tracked detain collections
 */

/**
 * @typedef {object} VuexTrackedCollection
 * @property {string} entity                     Entity code
 * @property {string} key                        Unique collection identifier
 * @property {Array<VuexTrackedObject>} items    Current items, as it shall be shown on UI
 * @property {Array<VuexTrackedObject>} deleted  Deleted items, except items which are added
 *   (not originally loaded)
 * @property {string} key Custom unique key which is set on init collection
 * @property {string} entity Entity code
 */

/**
 * @typedef {object} VuexTrackedObject
 * @property {boolean} isNew         Indicator of whether master instance was loaded or it is newly created
 * @property {object}  data          Master record instance, current values, as shall be shown on UI
 * @property {object}  originalData  Shadow copy of modified attributes
 */

/**
 * Check arg1 is strict equal to srg2, can compare primitive values, arrays (deep equal) or Date's. In addition:
 *   - [] and undefined is equal
 *   - {} and undefined is equal
 *   - arrays equality is checked without element order ([1, 2] is equal to [2, 1])
 * @param {*} arg1
 * @param {*} arg2
 */

function isEqual (arg1, arg2) {
  if (Array.isArray(arg1) || Array.isArray(arg2)) {
    if (arg1 === undefined) {
      arg1 = []
    }
    if (arg2 === undefined) {
      arg2 = []
    }
    if (!Array.isArray(arg1) || !Array.isArray(arg2) || (arg1.length !== arg2.length)) {
      return false
    } else if (arg1.find(v => !arg2.includes(v))) {
      return false
    }
    return true
  }

  if (isDate(arg1) || isDate(arg2)) {
    if (!isDate(arg1) || !isDate(arg2)) {
      return false
    }
    return arg1.valueOf() === arg2.valueOf()
  }

  if (isObject(arg1) || isObject(arg2)) {
    if (arg1 === undefined) {
      arg1 = {}
    }
    if (arg2 === undefined) {
      arg2 = {}
    }
    return _.isEqual(arg1, arg2)
  }

  return arg1 === arg2
}

/**
 * Check if value is a Date
 * @param  {*} value
 * @return {boolean}
 */
function isDate (value) {
  return value instanceof Date && !isNaN(value)
}

/**
 * Check if value is an object and not `null`
 * @param value
 */
function isObject (value) {
  return (typeof value === 'object') && (value !== null)
}

/**
 * Check obj is empty (`null` or `{}`)
 * @param  {*} obj
 * @return {Boolean}
 */
function isEmpty (obj) {
  if (obj === null) return true
  return (typeof obj === 'object') && (Object.keys(obj).length === 0)
}

/**
 * A helper method to update the "tracked" object property.
 * @param {VuexTrackedObject} state
 * @param {string} key
 * @param {*} value
 * @param {string} [path]
 *   Path could be deep path.  Using deep path is only allowed to change or set leaf values,
 *   it won't recursively create objects along the path.
 */
function change (state, key, value, path) {
  let currentValue = state.data[key]
  if (path !== undefined) {
    currentValue = _.get(currentValue, path)
  }
  if (isEqual(currentValue, value)) {
    return
  }

  if (!(key in state.originalData)) {
    // No value in "originalData" - edited for the first time, so save old value to "originalData"
    // TODO: for object types, need to create clone
    Vue.set(state.originalData, key, _.cloneDeep(state.data[key]))
  }

  if (path === undefined) {
    Vue.set(state.data, key, value)
  } else {
    if (typeof state.data[key] !== 'object' || state.data[key] === null) {
      // Create an object, if current value is not a valid object
      Vue.set(state.data, key, {})
    }

    // If json path is deep (like 'accounts[0].fullFIO.middleName') -
    // we need pass to Vue.set separated target object (state.data[key].accounts[0].fullFIO) and last propertyName (middleName).
    // To supporting bracket notation, brackets replaces to dot.
    // accounts[0].fullFIO.middleName -> accounts.0.fullFIO.middleName -> ['accounts', '0', 'fullFIO', 'middleName] ->
    // _.get(state.data[key], ['accounts', '0', 'fullFIO'])
    // This code works with plain path too (split return [path] if no '.').
    // **Disadvantages of implementation**:
    // 1. Bracket notation for string properties especially with '.' (accounts["prop.a"]) - not supported
    // 2. Client need care yourself of existence target part of path (state.data[key].accounts[0].fullFIO).
    //    This implementation don't create not existed parts of path (like _.set() do)
    const parts = path.replace(/]/g, '').replace(/\[/g, '.').split('.')
    path = parts.pop()
    const jsonAttr = parts.length === 0 ? state.data[key] : _.get(state.data[key], parts)
    if (typeof jsonAttr === 'object' && jsonAttr !== null) {
      if (value !== undefined) {
        Vue.set(jsonAttr, path, value)
      } else {
        Vue.delete(jsonAttr, path)
      }
    }
  }

  if (isEqual(state.originalData[key], state.data[key])) {
    // After and only after setting value, check if we got the same value as in originalData
    // If set value to its original value, means reverting any changes made, so delete it from "originalData"
    Vue.delete(state.originalData, key)
  }
}

/**
 * "execParams" and "fieldList"
 *
 * @typedef {object} UbQueryParams
 * @property {object} execParams
 * @property {array} fieldList
 */

/**
 * Build "execParams" out of the state tracked by "instance" module.
 *
 * @param {VuexTrackedObject} trackedObj
 * @param {string} entity
 * @return {object|null}
 */
function buildExecParams (trackedObj, entity) {
  const execParams = {}
  const schema = UB.connection.domain.get(entity)

  if (trackedObj.isNew) {
    for (const [key, value] of Object.entries(trackedObj.data)) {
      const attr = schema.attributes[key]
      if (!(attr && attr.readOnly) && !key.includes('.')) {
        if (attr && attr.dataType === UB_DATA_TYPES.Date) {
          execParams[key] = UB.truncTimeToUtcNull(trackedObj.data[key])
        } else {
          execParams[key] = value
        }
      }
    }
    if (schema.hasMixin('dataHistory')) {
      // Let server fill historical attributes
      ['mi_data_id', 'mi_dateFrom', 'mi_dateTo'].forEach(f => {
        if (!execParams[f]) delete execParams[f]
      })
    }
    replaceMultilangParams(execParams)
    return execParams
  }

  if (!Object.keys(trackedObj.originalData).length) {
    return null
  }

  execParams.ID = trackedObj.data.ID
  if (schema.attributes.mi_modifyDate) {
    execParams.mi_modifyDate = trackedObj.data.mi_modifyDate
  }

  for (const key of Object.keys(trackedObj.originalData)) {
    if (!key.includes('.')) {
      const attr = schema.attributes[key]
      if (trackedObj.data[key] && attr && attr.dataType === UB_DATA_TYPES.Date) {
        execParams[key] = UB.truncTimeToUtcNull(trackedObj.data[key])
      } else {
        execParams[key] = trackedObj.data[key]
      }
    }
  }
  replaceMultilangParams(execParams)
  return execParams
}

function buildDeleteRequest (entity, ID) {
  return {
    entity,
    method: 'delete',
    execParams: {
      ID
    }
  }
}

/**
 * Create an object with getter and setter for each of passed stateDataProps from vuex store state.data[propName]
 *
 * Setter perform a validation (if property is a subject for validation in $v - see {@link UForm.validation}) and
 * calls `SET_DATA` store mutation.
 *
 * @param {string[]} stateDataProps array of store state.data property names to create a getter/setter for
 * @param {string} [submoduleName] optional submodule name of store state
 */
function mapInstanceFields (stateDataProps, submoduleName) {
  if (!Array.isArray(stateDataProps)) throw new Error('First argument for mapInstanceFields must be array of string')
  const obj = {}
  for (const key of stateDataProps) {
    obj[key] = {
      get () {
        if (submoduleName) {
          return this.$store.state[submoduleName].data[key]
        } else {
          return this.$store.state.data[key]
        }
      },
      set (value) {
        if (this.$v && key in this.$v) {
          this.$v[key].$touch()
        }
        if (submoduleName) {
          this.$store.commit(`${submoduleName}/SET_DATA`, { key, value })
        } else {
          this.$store.commit('SET_DATA', { key, value })
        }
      }
    }
  }
  return obj
}

/**
 * Create an object with getter and setter for each of passed stateProp from vuex store state.
 * Setter calls a SET mutation what should be implemented in store (imported from helpers for example).
 *
 * @param {string[]} stateProps array of store state property names to create a getter/setter for
 * @param {string} [submoduleName] optional submodule name of store state
 */
function computedVuex (stateProps, submoduleName) {
  if (!Array.isArray(stateProps)) throw new Error('First argument for computedVuex must be array of string')
  const obj = {}
  const SET_CMD = submoduleName ? submoduleName + '/SET' : 'SET'
  for (const prop of stateProps) {
    obj[prop] = {
      get () {
        return submoduleName ? this.$store.state[submoduleName][prop] : this.$store.state[prop]
      },
      set (value) {
        this.$store.commit(SET_CMD, { key: prop, value })
      }
    }
  }
  return obj
}

/**
 * Assign source store options into target store options
 * @param {Vuex.StoreOptions} target Target store
 * @param {Vuex.StoreOptions} source Source store
 */
function mergeStore (target, source) {
  const sourceState = typeof source.state === 'function'
    ? source.state()
    : source.state

  function assignWith (key) {
    target[key] = Object.assign({}, source[key], target[key])
  }

  target.state = Object.assign({}, sourceState, target.state)
  assignWith('getters')
  assignWith('mutations')
  assignWith('actions')
  assignWith('modules')

  // merge plugins
  if (source.plugins) {
    if (!target.plugins) {
      target.plugins = []
    }
    target.plugins.push(...source.plugins)
  }

  // merge strict mode
  if (source.strict !== undefined) {
    target.strict = source.strict
  }
}

/**
 * throw error on missing required prop of func
 * @param param
 */
function required (param) {
  throw new Error(`Parameter "${param}" is required`)
}

/**
 * Transform's each collection object to
 * `key: {
 *   repository: store => UB.Repository(),
 *   lazy: true/false
 * }`
 *
 * @param {object} collections
 * @return {void}
 */
function transformCollections (collections) {
  for (let [key, collectionInfo] of Object.entries(collections)) {
    // Replace shorthand syntax, when collection is defined by repository to full collection info object
    if (isRepository(collectionInfo) || typeof collectionInfo === 'function') {
      collectionInfo = collections[key] = {
        repository: collectionInfo,
        lazy: false
      }
    }

    // Replace ClientRepository with a factory function, and output a warning for developers
    if (isRepository(collectionInfo.repository)) {
      if (window.isDeveloperMode) {
        console.warn(
          'Use factory function for building collection requests, not ready Repository objects!  collection: %s, entity',
          key, collectionInfo.repository.entityName
        )
      }
      const repositoryInstance = collectionInfo.repository
      collectionInfo.repository = () => repositoryInstance
    }

    if (typeof collectionInfo.repository !== 'function') {
      throw new UB.UBError(`Can't find ClientRepository in "${key}" collection`)
    }

    collectionInfo.lazy = collectionInfo.lazy === true
  }
}

function isRepository (obj) {
  return obj instanceof UB.ClientRepository
}

/**
 * This mutation is needed in order to reuse it in the store modules,
 * since computedVuex will not work in the store module without such a mutation
 * Set base state values
 * @param {VuexTrackedInstance} state
 * @param {object} payload
 * @param {String} payload.key state key
 * @param {*} payload.value value
 */
function SET (state, { key, value }) {
  state[key] = value
}

/**
 * @param {UBEntity} entitySchema
 * @param {string[]} fieldList
 * @param {string[]} requiredAttrs
 * @return {string[]}
 */
function enrichFieldList (entitySchema, fieldList, requiredAttrs) {
  const fieldsToAppend = requiredAttrs.filter(attr => fieldList.indexOf(attr) === -1 && entitySchema.attributes[attr])
  return fieldList.concat(fieldsToAppend)
}

const langParamRegex = /(\S+)_\S+\^/

/**
 * If execParams includes locale params
 * will replace the locale param with base param.
 *
 * For example in case userLang === 'en'
 * and execParams includes key 'name_uk^'
 * will replace key name to 'name_en^'
 *
 * @param {object} execParams
 */
function replaceMultilangParams (execParams) {
  const langParams = Object.keys(execParams)
    .filter(a => a.includes('^'))
  const userLang = UB.connection.userLang()

  langParams.forEach(p => {
    const res = p.match(langParamRegex)
    if (res && res[1] in execParams) {
      const key = res[1]
      const localeKey = key + '_' + userLang + '^'
      execParams[localeKey] = execParams[key]
      delete execParams[key]
    }
  })
}

/**
 * @param {object} originalExecParams
 * @param {string} entity
 * @returns {object} execParams
 */
function prepareCopyAddNewExecParams (originalExecParams, entity) {
  const execParams = { ...originalExecParams }

  // exclude ID
  delete execParams.ID

  // convert Json fields into string
  for (const attrCode of Object.keys(execParams)) {
    const attr = UB.connection.domain.get(entity).getAttribute(attrCode)
    if (attr.dataType === UB.connection.domain.ubDataTypes.Json) {
      execParams[attrCode] = JSON.stringify(execParams[attrCode])
    }
  }

  return execParams
}

/**
 * Assign some error text for validator function.
 * @param {string} errorLocale
 * @param {function(*):boolean} validator
 * @returns {function(*):boolean}
 */
function validateWithErrorText (errorLocale, validator) {
  return withParams({ $errorText: errorLocale }, validator)
}
