/* global UB */

const Vue = require('vue')
// vuex required for type checking
// eslint-disable-next-line no-unused-vars
const Vuex = require('vuex')
const { required } = require('vuelidate/lib/validators/index')

const { mapInstanceFields } = require('./helpers')

const attrCaptionsMixin = {
  computed: {
    attributeCaptions () {
      const { attributeCaptions } = this.$options
      if (typeof attributeCaptions === 'function') {
        return attributeCaptions.call(this)
      }
      return attributeCaptions
    }
  },

  methods: {
    getCustomFormCaptionByPath (path) {
      return path.reduce(getPropByKey, this.attributeCaptions)
    },

    getAttributeCaption (path) {
      return this.getCustomFormCaptionByPath(path) ?? getEntityAttributeCaption(this.entitySchema, path[0])
    }
  },

  attributeCaptions: {}
}

/**
 * Abstraction for easy managing of validation of some form. This class uses a `Vue`
 * instance with configured `Vuelidate` state to provide reactivity of form data.
 */
class Validator {
  constructor (vueInstance) {
    this._vueInstance = vueInstance
  }

  /**
   * Create a instance for form data validation based on some options defined as Vue mixin.
   * Default behavior is to check entity schema attributes with `allowNull=true` and `defaultView=true`.
   *
   * `customValidationMixin` can extend default behavior by it own rules.
   *
   * @param {object} params
   * @param {Vuex} params.store Store
   * @param {UBEntity} params.entitySchema Entity schema
   * @param {string[]} params.masterFieldList Field list of master entity
   * @param {Vue} [customValidationMixin={}] Custom validations what extends default
   */
  static initializeWithCustomOptions ({
    store,
    entitySchema,
    masterFieldList,
    customValidationMixin = {}
  }) {
    const requiredAttributesNames = entitySchema
      .filterAttribute(attr => attr.defaultView && !attr.allowNull && masterFieldList.includes(attr.code))
      .map(attr => attr.name)

    const defaultValidationMixin = {
      computed: {
        ...mapInstanceFields(entitySchema.getAttributeNames()),

        entitySchema () {
          return entitySchema
        }
      },

      validations () {
        return Object.fromEntries(requiredAttributesNames.map(attr => [attr, { required }]))
      }
    }

    const vueInstance = new Vue({
      store,
      mixins: [
        attrCaptionsMixin,
        defaultValidationMixin,
        customValidationMixin
      ]
    })

    return new Validator(vueInstance)
  }

  /**
   * Returns the current state of validation. The method is useful when you have dynamic validation
   *
   * @returns {object} Vuelidate object
   */
  getValidationState () {
    return this._vueInstance.$v
  }

  /**
   * Get caption by attribute name from `attributeCaptions` sections. If it
   * is not defined, default locale i18n(`${entity}.${attributeName}`) will be returned
   *
   * @param {string} attributeName
   * @returns {string}
   */
  getAttributeCaption (attributeName) {
    const attributePath = attributeName.split('.')
    const caption = this._vueInstance.getAttributeCaption(attributePath)
    return UB.i18n(caption)
  }

  /**
   * Get error text for some first failed validation rule of the attribute
   *
   * @param {string} attributeName
   * @returns {string | null}
   */
  getErrorForAttribute (attributeName) {
    const attributePath = attributeName.split('.')
    const attrValidationState = attributePath.reduce(getPropByKey, this._vueInstance.$v)

    if (!attrValidationState || !attrValidationState.$error) {
      return null
    }

    for (const param in attrValidationState.$params) {
      if (attrValidationState[param] === false) {
        const ruleParams = attrValidationState.$params[param]
        const errorText = ruleParams ? ruleParams.$errorText : null
        if (errorText) {
          return UB.i18n(errorText)
        }
      }
    }

    return UB.i18n('requiredField')
  }

  /**
   * Check if the attribute has the required rule in the configured validation
   *
   * @param {string} attributeName
   * @returns {boolean}
   */
  getIsAttributeRequired (attributeName) {
    const attributePath = attributeName.split('.')
    const attrValidationState = attributePath.reduce(getPropByKey, this._vueInstance.$v)
    return attrValidationState && 'required' in attrValidationState
  }

  /**
   * Validates form data with the Vuelidate help. If validation is failed `UBAbortError` will be thrown
   *
   * @param {object} [params = {}]
   * @param {boolean} [params.showErrorModal = true] To display error modal if validation is failed
   * @param {string} [params.errorMsgTemplate = 'validationError'] Error message template for the error modal
   * @throws {UB.UBAbortError}
   */
  validateForm ({
    showErrorModal = true,
    errorMsgTemplate = 'validationError'
  } = {}) {
    const { $v } = this._vueInstance

    $v.$touch()
    if (!$v.$error) {
      return
    }

    const invalidFieldsCaptions = new Set()
    for (const { path } of $v.$flattenParams()) {
      const attrValidation = path.reduce(getPropByKey, $v)
      if (attrValidation.$error) {
        // for array validation remove $each.XXX: aaa.bbb.$each.125.ccc.ddd ->  aa.bbb.$each.125.ccc.ddd
        const attrCaption = this.getAttributeCaption(path.filter((f, idx, arr) => (f !== '$each') && (arr[idx - 1] !== '$each')).join('.'))
        invalidFieldsCaptions.add(attrCaption)
      }
    }
    const errMsg = UB.i18n(errorMsgTemplate, [...invalidFieldsCaptions].join(', '))

    if (showErrorModal) {
      UB.showErrorWindow(errMsg)
    }

    throw new UB.UBAbortError(errMsg)
  }

  /**
   * Reset validation state
   */
  reset () {
    this._vueInstance.$v.$reset()
  }
}

/**
 * Helper function that returns an object property by the key. This method is useful for
 * passing to the `reduce()` array function to get some object nested property
 *
 * @param {object|null} obj
 * @param {string} key
 * @returns {object|null}
 */
function getPropByKey (obj, key) {
  return obj ? obj[key] : null
}

/**
 * Get entity attribute caption in the current locale
 *
 * @param {UBEntity} entitySchema
 * @param {string} attr
 * @returns {string}
 */
function getEntityAttributeCaption (entitySchema, attr) {
  const localeString = `${entitySchema.code}.${attr}`
  return UB.i18n(localeString) === localeString ? attr : UB.i18n(localeString)
}

const validationMixin = {
  inject: {
    entitySchema: {
      from: 'entitySchema',
      default: {}
    }
  },

  mixins: [
    attrCaptionsMixin
  ],

  provide () {
    return {
      validator: this.validator
    }
  },

  computed: {
    validator () {
      return new Validator(this)
    }
  }
}

module.exports = {
  Validator,
  validationMixin
}
