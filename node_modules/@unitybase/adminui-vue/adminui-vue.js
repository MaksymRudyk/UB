/**
 * @module @unitybase/adminui-vue
 */

/* global SystemJS, Ext, $App */
const _ = require('lodash')
const UB = require('@unitybase/ub-pub')
// vuelidate internally use process.env.BUILD === 'web'
window.process = {
  env: { BUILD: 'web' }
}
const IS_SYSTEM_JS = (typeof SystemJS !== 'undefined')
const isExt = (typeof window.Ext !== 'undefined')

/*
* The BOUNDLED_BY_WEBPACK variable is available only when a project is being built by a webpack.
* But not available in dev mode.
* Please note that BOUNDLED_BY_WEBPACK and window.BOUNDLED_BY_WEBPACK is not the same
* But if BOUNDLED_BY_WEBPACK is undefined app will use window.BOUNDLED_BY_WEBPACK
*/
window.BOUNDLED_BY_WEBPACK = false

// ------------- throttle-debounce --------------------
const throttleDebounce = require('throttle-debounce')
if (IS_SYSTEM_JS && !SystemJS.has('throttle-debounce')) SystemJS.set('throttle-debounce', SystemJS.newModule(throttleDebounce))

/**
 * throttle-debounce see <a href=https://github.com/niksy/throttle-debounce>original doc</a>
 * @type {{throttle: function, debounce: function}}
 */
module.exports.throttleDebounce = throttleDebounce

const Form = require('./utils/Form/Form')
/**
 * Creates a new instance of UI module. See {@link module:Form.Form}
 */
module.exports.Form = Form.Form
const formHelpers = require('./utils/Form/helpers')

/**
 * Helper functions for forms. See {@link module:formHelpers}.
 * `mapInstanceFields` and `computedVuex` are aliased into `@unitybase/adminui-vue`
 */
module.exports.formHelpers = formHelpers
/**
 * See {@link module:formHelpers.mapInstanceFields}
 */
module.exports.mapInstanceFields = formHelpers.mapInstanceFields
/**
 * See {@link module:formHelpers.computedVuex}
 */
module.exports.computedVuex = formHelpers.computedVuex
module.exports.SET = formHelpers.SET
/**
 * Mount a Vue based component as a navbar tab, a modal form or inside other component (as a container).
 * See {@link module:mountUtils mountUtils} module documentation for samples.
 *
 * @type {module:mountUtils}
 */
module.exports.mountUtils = require('./utils/Form/mount')

const magicLink = require('./utils/magicLinks')
/**
 * MagikLinks instance. adminui-vue registers the following commands (using addCommand):
 *   - showList: runs an $App.doCommand({cmdType: 'showList', ...}
 *   - showForm: runs an $App.doCommand({cmdType: 'showForm', ...}
 *   - showReport: runs an $App.doCommand({cmdType: 'showReport', ...}
 *   - setFocus: sets a focus to specified HTML element
 *
 *   Usage of setFocus: `<a href="#" data-cmd-type="setFocus" data-elm-id="my-html-element-id">focus other</a>`
 *
 *   For usage examples for showList/Form/Repost see {@link module:magicLinks magicLinks} module documentation
 *
 * @type {module:magicLinks}
 */
module.exports.magicLink = magicLink
magicLink.install()
magicLink.addCommand('setFocus', magicLinkFocusCommand)

// -------------- Vue --------------------
if (window.Vue === undefined) {
  window.Vue = require('vue')
}
const Vue = window.Vue
// next 2 lines for modules what use ES6 import `import Vue from 'vue' (not recommended for use)
Vue.__useDefault = Vue
Vue.default = Vue
if (IS_SYSTEM_JS && !SystemJS.has('vue')) SystemJS.set('vue', SystemJS.newModule(Vue))

// ------------- Vuex ------------------
const Vuex = require('vuex')
/** type {Vuex} */
window.Vuex = Vuex
// next 2 lines for modules what use ES6 import `import Vuex from 'vuex' (not recommended for use)
Vuex.__useDefault = Vuex
Vuex.default = Vuex
if (IS_SYSTEM_JS && !SystemJS.has('vuex')) SystemJS.set('vuex', SystemJS.newModule(Vuex))
Vue.use(Vuex)

// ------------ ElementUI ------------------
const ElementUI = require('element-ui') // adminui-pub maps element-ui -> element-ui/lib/index.js for SystemJS
window.ElementUI = ElementUI
if (IS_SYSTEM_JS && !SystemJS.has('element-ui')) SystemJS.set('element-ui', SystemJS.newModule(ElementUI))

Vue.use(ElementUI, {
  size: 'small', // set element-ui default size
  i18n: UB.i18n.bind(UB), // redirect ElementUI localization to UB.i18n
  zIndex: 300000 // lat's Vue popovers always be above Ext
})

// ------------- Moment -------------------
const momentPlugin = require('./utils/moment-plugin')
Vue.use(momentPlugin)

// ------------- UB theme -----------------
require('normalize.css/normalize.css')
require('./theme/fonts.css')
require('./theme/icons/ub-icons.css')
require('./theme/ub-body.css')
if (BOUNDLED_BY_WEBPACK) {
  // webpack MiniCssExtractPlugin extract all styles (for vue SFC), so we need to inject dist/adminui-vue.css
  UB.inject('/clientRequire/@unitybase/adminui-vue/dist/adminui-vue.min.css')
}
Vue.use(UB)

// ----------- UbComponents ----------------------
const UbComponents = require('./utils/install-ub-components')
Vue.use(UbComponents)

// ---------- Vuelidate ---------------------------
const Vuelidate = require('vuelidate').default
if (IS_SYSTEM_JS && !SystemJS.has('vuelidate')) SystemJS.set('vuelidate', SystemJS.newModule(Vuelidate))
Vue.use(Vuelidate)

const { validationMixin } = require('./utils/Form/validation')
/**
 * Mixin for using in forms with own single-form validation. Mixin automatically creates
 * and passes a validator instance for use in nested controls (UFormRow for example).
 */
module.exports.validationMixin = validationMixin

// ------------------ uDialogs -----------------
const uDialogs = require('./utils/uDialogs')
/**
 * Modal uDialogs (message boxes) for showing errors, information and confirmation
 * For usage examples see {@link module:uDialogs uDialogs} module documentation
 *
 * @type {module:uDialogs}
 */
module.exports.uDialogs = uDialogs
/**
 * Show modal dialog with 3 optional button and text/html content, see {@link module:uDialogs.dialog uDialogs.dialog}
 * @type {uDialogs.dialog}
 */
module.exports.dialog = uDialogs.dialog
/**
 * Error dialog, see {@link module:uDialogs.dialogError uDialogs.dialogError}
 * @type {uDialogs.dialogError}
 */
module.exports.dialogError = uDialogs.dialogError
/**
 * Information dialog, see {@link module:uDialogs.dialogInfo uDialogs.dialogInfo}
 * @type {uDialogs.dialogInfo}
 */
module.exports.dialogInfo = uDialogs.dialogInfo
/**
 * Confirmation dialog, see {@link module:uDialogs.dialogYesNo uDialogs.dialogYesNo}
 * @type {uDialogs.dialogYesNo}
 */
module.exports.dialogYesNo = uDialogs.dialogYesNo
/**
 * Error reporter dialog, see {@link module:uDialogs.errorReporter uDialogs.errorReporter}
 * @type {uDialogs.errorReporter}
 */
module.exports.errorReporter = uDialogs.errorReporter
// add $dialog* to Vue prototype
Vue.use(uDialogs)
UB.setErrorReporter(uDialogs.errorReporter)

// ---------------- lookups --------------------
const lookups = require('./utils/lookups')
/**
 * A reactive (in terms of Vue reactivity) entities data cache.
 * See examples in {@link module:lookups lookups} module documentation
 * @type {module:lookups}
 */
module.exports.lookups = lookups
Vue.use(lookups)

if (isExt) {
  const {
    replaceExtJSDialogs,
    replaceExtJSNavbar,
    replaceExtJSMessageBarDialog,
    replaceShowList
  } = require('./utils/replaceExtJSWidgets')
  $App.on('applicationReady', () => {
    replaceExtJSDialogs()
    replaceExtJSNavbar()
    replaceExtJSMessageBarDialog()
    replaceShowList()
  })
  UB.connection.on('ubm_navshortcut:changed', (execParams) => {
    if (execParams && execParams.method !== 'delete') {
      UB.core.UBStoreManager.updateNavshortcutCacheForItem(execParams.resultData, false)
    }
  })
}

const Sidebar = require('./components/sidebar/USidebar.vue').default
function addVueSidebar () {
  const SidebarConstructor = Vue.extend(Sidebar)
  // eslint-disable-next-line no-new
  new SidebarConstructor({
    el: '#sidebar-placeholder'
  })
}

const Relogin = require('./components/relogin/URelogin.vue').default
function replaceDefaultRelogin () {
  const ReloginConstructor = Vue.extend(Relogin)
  const instance = new ReloginConstructor()
  const vm = instance.$mount()
  document.body.appendChild(vm.$el)
}

function magicLinkAdminUiCommand (params) {
  $App.doCommand(params)
}

/**
 * Magic link to focus DOM/Ext element with specified id
 * @example

 <a href="#" data-cmd-type="setFocus" data-elm-id="my-html-element-id">focus other</a>

 * @param {Object} params
 * @param {string} params.elmId
 * @param {EventTarget} target
 */
function magicLinkFocusCommand (params, target) {
  const extCmp = isExt && Ext.getCmp(params.elmId)
  if (extCmp) { // try Ext
    Ext.callback(extCmp.focus, extCmp, [], 100)
  } else { // try DOM
    const domElm = document.getElementById(params.elmId)
    if (domElm && domElm.focus) domElm.focus()
  }
}

if (window.$App) {
  magicLink.addCommand('showForm', magicLinkAdminUiCommand)
  magicLink.addCommand('showList', magicLinkAdminUiCommand)
  magicLink.addCommand('showReport', magicLinkAdminUiCommand)

  window.$App.on('applicationReady', () => {
    replaceDefaultRelogin()
    addVueSidebar()
    const UNavbarDefaultSlot = require('./components/navbarSlotDefault/UNavbarDefaultSlot.vue').default
    /**
     * Additional components can be added to the Sidebar and NavBar using this event
     * @example
     *   window.$App.on('applicationReady', () => {
     *     const SidebarSlotExample = require('./samples/SidebarSlotExample.vue').default
     *     $App.fireEvent('portal:sidebar:defineSlot', SidebarSlotExample, { some attrs })
     *
     *     const NavBarSlotExample = require('./samples/NavbarSlotExample.vue').default
     *     $App.fireEvent('portal:navbar:defineSlot', NavBarSlotExample, { some attrs })
     *   }
     * @event portal:navbar:defineSlot
     */
    $App.fireEvent('portal:navbar:defineSlot', UNavbarDefaultSlot, {})
  })
  $App.on('buildMainMenu', items => {
    items.splice(0, 1) // remove top panel ExtJS hamburger menu button
  })
}

if (isExt && window.$App && $App.connection.appConfig.uiSettings.adminUI.vueAutoForms) {
  UB.core.UBCommand.showAutoForm = require('./utils/replaceExtJSWidgets').replaceAutoForms
}

/**
 * Create fake (hidden) message and return it zIndex
 * This hack is required to obtain current ElementUI zIndex
 */
Vue.prototype.$zIndex = () => {
  const vm = Vue.prototype.$message({
    customClass: 'ub-fake-notification'
  })
  return vm.$el.style.zIndex
}

Vue.config.warnHandler = (err, vm, trace) => {
  console.error(err, vm, trace)
  const newErrText = '<b>THIS MESSAGE APPEARS ONLY IN DEBUG BUILD</b><br>' + err
  window.onerror.apply(UB, [newErrText, trace, '', '', new UB.UBError(newErrText, trace)])
}

Vue.config.errorHandler = function (err, vm, trace) {
  console.error(err, vm, trace)
  window.onerror.apply(UB, ['', trace, '', '', err])
}

/**
 * @deprecated Use $UB.formatter instead
 * @type {{formatDate:function, formatNumber:function, setLang2LocaleHook:function, datePatterns: string[], numberPatterns: string[], setDefaultLang: function, collationCompare:function}}
 */
Vue.prototype.$formatByPattern = UB.formatter

/**
 * Define custom merging strategy for the `validations` and `attributeCaptions` options.
 * This allows reusing some code in `Form.validation()` for different forms.
 * Now you can use mixins here with partial validations and not define validation
 * for entity attributes with `notNull = true` that are defined by default
 */
Vue.config.optionMergeStrategies.validations = mergeReactiveOptions
Vue.config.optionMergeStrategies.attributeCaptions = mergeReactiveOptions

/**
 * Helper function that merges validation config defined in mixins
 * @param {object|function|undefined} a
 * @param {object|function|undefined} b
 * @returns {object}
 */
function mergeReactiveOptions (a, b) {
  if (typeof a === 'function' || typeof b === 'function') {
    return function () {
      const aObj = typeof a === 'function' ? a.call(this) : a
      const bObj = typeof b === 'function' ? b.call(this) : b
      return _.merge(aObj, bObj)
    }
  }
  return _.merge(a, b)
}
// register adminui-vue after all module.exports are defined - SystemJS.newModule memoryse an object props,
// so any new property added after call to SystemJS.newModule are not available to importers
if ((typeof SystemJS !== 'undefined') && !SystemJS.has('@unitybase/adminui-vue')) SystemJS.set('@unitybase/adminui-vue', SystemJS.newModule(module.exports))

// for CERT2 auth we must select crypto provider before connection, on this stage models is not available
// the only way to give pki() function access to capiSelectionDialog is global window object
const capiSelectionDialog = require('./views/capiSelectionDialog')
if (window) {
  window.capiSelectionDialog = capiSelectionDialog
}
