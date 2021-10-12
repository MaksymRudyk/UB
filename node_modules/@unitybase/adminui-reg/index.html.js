/* global nsha256, ncrc32 */
const App = require('@unitybase/ub').App
const { GC_KEYS } = require('@unitybase/base')
/**
 * Return models config for `admin-UI` web client
 * The purpose is to load model initialization script BEFORE application start
 */
const mustache = require('mustache')
const fs = require('fs')
const path = require('path')

const MODULES_ROOT = path.join(process.configPath, 'node_modules')

/**
 * Resolve a path to module entry point by module name
 * @param {string} moduleName
 * @param {Array<{moduleName: string, entryPoint: string}>} modulesMap
 * @return {undefined|string}
 */
function resolveModuleEntryPoint (moduleName, modulesMap, modelsConfig) {
  if (modulesMap.find(m => m.moduleName === moduleName)) return // already added
  if (modelsConfig.find(m => m.moduleName === moduleName)) return // models injected separately
  let resolvedPath = path.resolve(MODULES_ROOT, moduleName)
  if (!fs.existsSync(resolvedPath)) { // try js file
    resolvedPath = resolvedPath + '.js'
  }
  let stat = fs.statSync(resolvedPath)
  if (stat.isDirectory()) {
    let pkgName = path.join(resolvedPath, 'package.json')
    if (fs.existsSync(pkgName)) {
      let pkgMain = JSON.parse(fs.readFileSync(pkgName, 'utf8')).main || './index.js'
      resolvedPath = path.join(resolvedPath, pkgMain)
    } else {
      resolvedPath = path.join(resolvedPath, 'index.js')
    }
  }
  if (resolvedPath) {
    return path.relative(MODULES_ROOT, resolvedPath)
  }
}

function initCspAllow (cspAllow, cspAllowP, name, init) {
  if (!cspAllow[name]) {
    cspAllow[name] = {}
  }
  if (init) {
    cspAllow[name].initValues = init
  }
  cspAllowP[name] = Object.keys(cspAllow[name]).map(f => cspAllow[name][f]).join(' ')
}

/**
 *
 * @param {THTTPRequest} req
 * @param {THTTPResponse} resp
 * @param {String} indexName
 * @param {boolean} [addCSP=true] Add a CSP header
 */
function generateIndexPage (req, resp, indexName, addCSP = true) {
  function modelVer (modelCode) {
    let m = App.domainInfo.models[modelCode]
    return m ? `?ver=${m.version}` : '?ver=0'
  }

  let uiSettings = App.serverConfig.uiSettings || {}
  let cspAllow = uiSettings.cspAllow || {}
  let cspAllowP = {}
  let compiledIndexKey = GC_KEYS.COMPILED_INDEX_ + indexName
  let compiledIndex = App.globalCacheGet(compiledIndexKey)
  if (!compiledIndex) {
    if (!uiSettings.adminUI) {
      uiSettings.adminUI = { themeName: 'UBGrayTheme' }
    } else if (!uiSettings.adminUI.themeName) {
      uiSettings.adminUI.themeName = 'UBGrayTheme'
    }
    if (!uiSettings.adminUI.loginURL) {
      if (App.domainInfo.models['adminui-vue']) {
        uiSettings.adminUI.loginURL = '/models/adminui-vue/views/ub-auth.html'
      } else {
        uiSettings.adminUI.loginURL = '/models/adminui-pub/login-stub.html'
      }
    }
    let adminUIPath = path.dirname(require.resolve('@unitybase/adminui-pub'))
    let indexTpl = fs.readFileSync(path.join(adminUIPath, indexName), 'utf8')

    let cspNonce = nsha256('' + Date.now()).substr(0, 8)
    App.globalCachePut(GC_KEYS.COMPILED_INDEX_NONCE, cspNonce)
    // create view for mustache
    // noinspection JSUnusedGlobalSymbols
    let view = {
      uiSettings: uiSettings,
      modulesMap: [ // modules with entry point path differ from specified in package.json main section. In futur ewill be used for ESM module import configuration
        { moduleName: 'css', entryPoint: 'systemjs-plugin-css/css.js' },
        { moduleName: 'vue', entryPoint: 'vue/dist/vue.common.dev.js' }, // should be the same as in adminui-vue webpack config
        { moduleName: 'element-ui', entryPoint: 'element-ui/lib/index.js' },
        { moduleName: 'systemjs-hmr', entryPoint: 'systemjs-hmr/dist/systemjs-hmr.js' }
      ],
      modelVersions: [],
      modelInitialization: [],
      adminUIModel: '',
      cspNonce: cspNonce,
      staticVersion: '' + ncrc32(0, App.globalCacheGet(GC_KEYS.MODELS_MODIFY_DATE)),
      UB_API_PATH: App.serverConfig.httpServer.path || '/',
      modelVer: function () {
        return modelVer
      }
    }

    // add admin-ui and models what require initialisation
    let modelsConfig = App.serverConfig.application.domain.models
    const ADMINUI_MODEL = '@unitybase/adminui-pub'
    let modelCfg = modelsConfig.find(m => m.moduleName === ADMINUI_MODEL)
    view.adminUIModel = modelCfg.browser
    App.domainInfo.orderedModels.forEach((model) => {
      // fill model versions
      if (model.realPublicPath) {
        view.modelVersions.push({
          modelName: model.name,
          modelVersion: model.version
        })
      }
      if (model.moduleName !== ADMINUI_MODEL) {
        let modelCfg = modelsConfig.find(m => m.name === model.name)
        if (modelCfg.browser) {
          view.modelInitialization.push(modelCfg.browser)
        } else if (model.needInit) { // ub 5.0.5 compatibility
          console.warn(`Compatibility warning! Model ${model.name} has browser initialization script,
but "browser" section in package.json is not defined. Will fallback to "browser": "./public/initModel.js"`)
          let pathStart = /node_modules/.test(model.path)
            ? model.moduleName + '/public'
            : path.join('/clientRequire', model.path).replace(/\\/g, '/')
          view.modelInitialization.push({
            dev: `${pathStart}/initModel.js`,
            prod: `${pathStart}/initModel.js`
          })
        }
      }
    })

    // prepare a modules entry points map
    // if (!fs.existsSync(MODULES_ROOT)) {
    //   throw new Error(`node_modules folder not found in the folder with app config. Expected "${MODULES_ROOT}". May be you miss "npm i" command?`)
    // }
    // let tm = fs.readdirSync(MODULES_ROOT)
    // tm.forEach(m => {
    //   if (m.startsWith('.')) return
    //   if (m.startsWith('@')) { // namespace
    //     let ttm = fs.readdirSync(path.join(MODULES_ROOT, m))
    //     ttm.forEach(sm => {
    //       if (sm.startsWith('.')) return
    //       let moduleName = m + '/' + sm
    //       let resolved = resolveModuleEntryPoint(moduleName, view.modulesMap, modelsConfig)
    //       if (resolved) {
    //         view.modulesMap.push({ moduleName: moduleName, entryPoint: resolved })
    //       }
    //     })
    //   } else {
    //     let resolved = resolveModuleEntryPoint(m, view.modulesMap, modelsConfig)
    //     if (resolved) {
    //       view.modulesMap.push({ moduleName: m, entryPoint: resolved })
    //     }
    //   }
    // })

    compiledIndex = mustache.render(indexTpl, view)
    if (compiledIndex) {
      App.globalCachePut(compiledIndexKey, compiledIndex)
    }
    console.log(`${indexName} is generated from template ${path.join(adminUIPath, indexName)}`)
  } else {
    console.debug('Compiled %s is used', indexName)
  }
  if (compiledIndex) {
    resp.writeEnd(compiledIndex)
    // resp.writeEnd(index_tpl);
    resp.statusCode = 200
    // cache forever - do not cache index*.html
    let cspHeader = ''
    if (addCSP) {
      let cspNonce = App.globalCacheGet(GC_KEYS.COMPILED_INDEX_NONCE)
      // let wsSrc = 'ws' + App.externalURL.slice(4)
      // let uiSettings = App.serverConfig.uiSettings
      // let onlyOfficeServer = (uiSettings.adminUI.onlyOffice && uiSettings.adminUI.onlyOffice.serverIP) || ''

      if (!uiSettings.cspAllow) {
        cspAllow = uiSettings.cspAllow = {}
      }
      initCspAllow(cspAllow, cspAllowP, 'defaultSrc', 'https://localhost:8083 http://localhost:8081')
      initCspAllow(cspAllow, cspAllowP, 'scriptSrc', 'https://localhost:8083 http://localhost:8081 resource://pdf.js/build/ resource://pdf.js/web/')
      initCspAllow(cspAllow, cspAllowP, 'connectSrc', 'https://localhost:8083 http://localhost:8081')
      initCspAllow(cspAllow, cspAllowP, 'objectSrc', 'https://localhost:8083 http://localhost:8081')
      initCspAllow(cspAllow, cspAllowP, 'styleSrc')
      initCspAllow(cspAllow, cspAllowP, 'imgSrc')
      initCspAllow(cspAllow, cspAllowP, 'frameSrc')
      initCspAllow(cspAllow, cspAllowP, 'fontSrc')
      initCspAllow(cspAllow, cspAllowP, 'baseUri', 'resource:')

      let wsNotifier = App.serverConfig.uiSettings.adminUI.amqpNotificationUrl || ''
      let cspHeaders =
        `default-src 'self' ${cspAllowP.defaultSrc}; ` +
        `connect-src 'self' ${wsNotifier} ${cspAllowP.connectSrc} blob:; ` + // we need blob: for UBDocument (ER diagrams, org chart etc.)
        // 'unsafe-inline' is removed in flavor of 'nonce-...'
        // TODO - remove 'unsafe-eval' after removing all `eval(` from Ext
        `script-src 'self' 'nonce-${cspNonce}' 'unsafe-eval' ${cspAllowP.scriptSrc}; ` +
        `object-src blob: ${cspAllowP.objectSrc}; ` +
        `base-uri ${cspAllowP.baseUri}; ` +
        `style-src 'self' 'unsafe-inline' data: ${cspAllowP.styleSrc}; ` +
        `font-src 'self' data: ${cspAllowP.fontSrc}; ` +
        `frame-src 'self' ${cspAllowP.frameSrc} blob:; ` + // blob src required for chrome PDF viewer. Self - for JS PDF viewer
        `img-src 'self' https://unitybase.info ${cspAllowP.imgSrc} data: blob:; ` + // blob: is for pictures inside tinyMCE
        `plugin-types application/pdf`
      cspHeader = '\r\nContent-Security-Policy: ' + cspHeaders
      console.debug(cspHeaders)
    }
    resp.writeHead('X-Frame-Options: sameorigin\r\nX-Content-Type-Options: nosniff\r\nX-XSS-Protection: 1; mode=block\r\nContent-Type: text/html\r\nCache-Control: no-cache, no-store, max-age=0, must-revalidate\r\nPragma: no-cache\r\nExpires: Fri, 01 Jan 1990 00:00:00 GMT' + cspHeader)
  } else {
    resp.statusCode = 404
  }
}

let adminUIEndpointName
if (App.serverConfig.uiSettings && App.serverConfig.uiSettings.adminUI) {
  adminUIEndpointName = App.serverConfig.uiSettings.adminUI.endpoint
}
adminUIEndpointName = adminUIEndpointName || App.serverConfig.application.rootHandler || 'index.html'
/**
 * @param {THTTPRequest} req
 * @param {THTTPResponse} resp
 */
App.registerEndpoint(adminUIEndpointName, function (req, resp) {
  if (req.url.endsWith('/')) {
    resp.statusCode = 301 // HTTP_MOVEDPERMANENTLY
    resp.writeHead(`Location: ${App.externalURL}${adminUIEndpointName}`)
    return
  }
  generateIndexPage(req, resp, 'index.mustache')
}, false)

/**
 * @param {THTTPRequest} req
 * @param {THTTPResponse} resp
 */
App.registerEndpoint(adminUIEndpointName + '-dev', function (req, resp) {
  if (process.isDebug) {
    if (req.url.endsWith('/')) {
      resp.statusCode = 301 // HTTP_MOVEDPERMANENTLY
      resp.writeHead(`Location: ${App.externalURL}${adminUIEndpointName}`)
      return
    }
    generateIndexPage(req, resp, 'index-dev.mustache', false)
  } else {
    const prodWarning = `
<html><body>
<h1>Debug mode not allowed</h1>
<p>To enable <strong>dev</strong> mode server should be started with <u>-dev</u> switch. Type <strong>ub --help</strong> for details</p>
<p><strong>Warning: in developer mode server runs in single-threaded mode and allows unsafe code execution - <u>NEVER do such on production</u></strong></p>
</body></html>`
    resp.writeHead('Content-Type: text/html; charset=UTF-8')
    resp.writeEnd(prodWarning)
    resp.statusCode = 404
  }
}, false)
