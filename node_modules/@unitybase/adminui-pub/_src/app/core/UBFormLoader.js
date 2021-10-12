/* global Ext, $App, SystemJS */
require('./UBAppConfig')
require('./UBService')
require('./UBUtil')
require('./UBCommand')
const UB = require('@unitybase/ub-pub')

/**
 * Load form View (formCode.def) and from controller (formCode*.js) if any from local cache or from model `public/forms` folder.
 * Evaluate both & return evaluation result. Used in $App.doCommand in case command type is `showForm`.
 */
Ext.define('UB.core.UBFormLoader', {
  uses: ['UB.core.UBApp'],
  singleton: true,
  formType: {
    auto: 'auto',
    custom: 'custom'
  },

  /**
   * Array of ExtJS class names, defined by UBFormLoader
   * This array is used by undefineExtClass to **"undefine"** Pure Ext JS forms defined by form loader
   * @protected
   */
  definedClasses: [],

  /**
   * @private
   * @param def
   * @return {*}
   */
  getComponentClassName: function (def) {
    return this.getComponentPart(def, /(?:Ext.define\s*?\(\s*?["'])([\w.]+?)(?=["'])/, 1)
  },

  /**
   * @private
   * @param def
   * @param regexp
   * @param partNo
   * @return {String}
   */
  getComponentPart: function (def, regexp, partNo) {
    let m = regexp.exec(def)

    return (m && m.length > partNo) ? UB.core.UBUtil.removeWhitespaces(m[partNo]) : undefined
  },

  /**
   * Lookup form in `ubm_form` store
   * @param {String} entity Entity code for search
   * @param {Boolean} [allForms=false] return array of all entity forms or only first form founded
   * @return {Ext.data.Model|Array<Ext.data.Model>}
   */
  getFormByEntity: function (entity, allForms) {
    let store = UB.core.UBStoreManager.getFormStore()
    let forms = []
    let defForms = []

    store.each(function (item) {
      if (item.get('entity') === entity) {
        forms.push(item)
        if (item.get('isDefault') === true) {
          defForms.push(item)
        }
      }
    })
    forms.sort(function (a, b) {
      let c1 = a.get('code')
      let c2 = b.get('code')
      return c1 < c2 ? -1 : (c1 === c2 ? 0 : 1)
    })
    // in case of several default forms - use one from the LAST model to allow forms override
    let models = UB.connection.domain.models
    defForms.sort(function (a, b) {
      // reverse order sort
      return models[b.get('model')].order - models[a.get('model')].order
    })
    let defaultForm = defForms.length ? defForms[0] : forms[0]
    return allForms ? forms : defaultForm
  },

  /**
   * Dirty hack to clear Ext-JS based forms. Do not use in production!
   * @protected
   * @param {string} className
   */
  undefineExtClass: function (className) {
    let parts = className.split('.')
    let root = window
    let c = Ext.ClassManager.get(className)
    let lastPart

    if (!c) return

    delete Ext.ClassManager.classes[className]
    // noinspection JSAccessibilityCheck
    delete Ext.ClassManager.existCache[className]
    if (parts.length) {
      lastPart = parts.pop()
      for (let i = 0, ln = parts.length; i < ln; i++) {
        root = root[parts[i]]
        if (!root) break
      }
      if (root) delete root[lastPart]
    }
  },

  /**
   * Retrieve form view `def` and form module. Look in the localStore first and if not found - go to server.
   *
   * @param {Object} config
   * @param {String} config.formCode Code of form from `ubm_form.code`
   * @param {Function} [config.callback] Called with two parameter `callback(viewDefinition, codeDefinition)`
   * @param {Object} [config.scope] Scope to execute callback in
   * @return {Promise} Promise resolved to object {formView: ..., formController: ..., formType:..} object or function in case of ExtJS form
   */
  getFormViewAndController: function (config) {
    let me = this

    let formStore = UB.core.UBStoreManager.getFormStore()
    let record = formStore.findRecord('code', config.formCode, 0, false, true, true)
    if (!record) throw new Error(`Unknown form code "${config.formCode}"`)

    let formType = record.get('formType').toString()
    let formDefReference = record.get('formDef')
    let formJSReference = record.get('formCode') // null is possible here

    let formModelName = record.get('model')
    let model = $App.domainInfo.models[formModelName]
    let defImportPath = `${model.clientRequirePath}/forms/${config.formCode}-fm.def`
    let jsImportPath = `${model.clientRequirePath}/forms/${config.formCode}-fm.${formType === 'vue' ? 'vue' : 'js'}`
    if (formType === 'custom') {
      jsImportPath = '' // custom forms always in one *.def file
    } else if (formType === 'vue' || formType === 'module') {
      defImportPath = '' // vue & module forms always in one *.vue or *.js file
    }
    if (!formJSReference) jsImportPath = ''
    if (!formDefReference) defImportPath = ''
    let pJS, pDef
    if (jsImportPath) pJS = SystemJS.import(jsImportPath)
    if (defImportPath) pDef = SystemJS.import(defImportPath)
    return Promise.all([pDef, pJS]).then(([formView, formController]) => {
      if (formType === 'auto' && formView.requires && formView.requires.length) {
        console.warn(`"requires" section in "${defImportPath}" form definition should be removed and replaced by require()`)
      }
      if (formType === 'custom') { // extract Ext class name from module and retrieve formView from Ext.ClassManager
        if (typeof formView.formDef !== 'string') {
          console.error(`Custom form "${defImportPath}" must export a Ext class name as string (Example: exports.formDef = 'UBM.userSettings')`)
        }
        formView = me.getExtClassByName(formView.formDef)
      }
      return {
        formType,
        formView: formView
          ? formView.formDef ? formView.formDef : formView
          : null,
        formController: formController
          ? formController.formCode ? formController.formCode : formController
          : null
      }
    })
  },
  /**
   * Get ExtJS class defined by custom form
   * @protected
   * @param {String} className String Name of class exported defined by custom form
   * @return {Ext.Class} class
   */
  getExtClassByName: function (className) {
    let definedClass = Ext.ClassManager.get(className)
    if (!UB.core.UBFormLoader.definedClasses.find(cn => cn === className)) {
      UB.core.UBFormLoader.definedClasses.push(className)
    }
    return definedClass
  }
})
