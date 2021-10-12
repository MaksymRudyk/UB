/**
 * @module modelLoader
 * @memberOf module:@unitybase/ub
 */

const fs = require('fs')
const path = require('path')
const App = require('./App')
const i18n = require('./i18n')

module.exports = {
  loadEntitiesModules,
  loadLegacyModules,
  loadServerLocale
}

/**
 * Load all *.js for which pair *.meta is exists
 * @param {String} folderPath
 * @param {number} [depth=0] Recursion depth
 */
function loadEntitiesModules (folderPath, depth = 0) {
  if (!fs.existsSync(folderPath)) return

  let folderFiles = fs.readdirSync(folderPath)

  for (let i = 0, l = folderFiles.length; i < l; i++) {
    let fn = folderFiles[i]
    if (fn.startsWith('.') || fn.startsWith('_')) continue // skip

    let fullPath = path.join(folderPath, fn)
    let stat = fs.statSync(fullPath)
    // limit folder recursion to 1 level
    if (stat.isDirectory() && depth === 0) {
      if ((fn === 'modules') || (fn === 'node_modules') || (fn === 'public')) continue
      loadEntitiesModules(fullPath, depth + 1)
    } else if (fn.endsWith('.js')) {
      let baseName = path.basename(fn, '.js')
      if (App.domainInfo.has(baseName)) { // this is entity module
        require(fullPath)
      }
    }
  }
}

/**
 * Load serverLocale/*-??.json for each language code (??) supported by application
 * @param {String} modelPath
 */
function loadServerLocale(modelPath) {
  const localeFolder = path.join(modelPath, 'serverLocale')
  if (!fs.existsSync(localeFolder)) return
  const supportedLanguages = App.serverConfig.application.domain.supportedLanguages || ['en']
  const files = fs.readdirSync(localeFolder).sort()
  files.forEach(fn => {
    supportedLanguages.forEach(langCode => {
      if (fn.endsWith(`-${langCode}.json`)) { // language supported
        const lp = path.join(localeFolder, fn)
        const localeData = require(lp)
        i18n.extend({
          [langCode]: localeData
        })
      }
    })
  })
}

/**
 * For UB < 4.2 compatibility -  require all non - entity js
 * in specified folder add it's subfolder (one level depth),
 * exclude `modules` and `node_modules` subfolder's.
 * From 'public' subfolder only cs*.js are required.
 * To be called in model index.js as such:
 *   const modelLoader = require('@unitybase/ub).modelLoader
 *
 * For new models we recommend to require non-entity modules manually
 *
 * @param {String} folderPath
 * @param {Boolean} isFromPublicFolder
 * @param {number} depth Current recursion depth
 */
function loadLegacyModules (folderPath, isFromPublicFolder = false, depth = 0) {
  if (!fs.existsSync(folderPath)) return

  let folderFiles = fs.readdirSync(folderPath)
  // readdirSync can return UNSORTED file names under Linux (UB.5)
  folderFiles.sort()

  for (let i = 0, l = folderFiles.length; i < l; i++) {
    let fn = folderFiles[i]
    if (fn.startsWith('.') || fn.startsWith('_')) continue // skip

    let fullPath = path.join(folderPath, fn)
    let stat = fs.statSync(fullPath)

    if (stat.isDirectory() && (depth === 0)) {
      if ((fn === 'modules') || (fn === 'node_modules')) continue
      // prevent recursion inside public folder
      if (!isFromPublicFolder) loadLegacyModules(fullPath + path.sep, fn === 'public', depth + 1)
    } else if (fn.endsWith('.js') && (!isFromPublicFolder || fn.startsWith('cs'))) {
      let baseName = path.basename(fn, '.js')
      if (!App.domainInfo.has(baseName)) { // this is NOT an entity module
        require(fullPath)
      }
    }
  }
}
