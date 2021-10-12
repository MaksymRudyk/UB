/**
 * Create internal BLOB store structure (folders) for specifies FileSystem store.
 *
 * Must be used on the same computer where UnityBase server installed ( remote server connection is not supported).
 *
 * Usage from a command line:

    ubcli createStore -?

 * Usage from a script:

     const storeCreator = require('@unitybase/ubcli/createStore')
     let options = {
        store: "*"
     };
     storeCreator(options)

 * @author pavel.mash
 * @module createStore
 * @memberOf module:@unitybase/ubcli
 */

const fs = require('fs')
const path = require('path')
const cmdLineOpt = require('@unitybase/base').options
const argv = require('@unitybase/base').argv

const RE_TRAILING_PATH_SEP = process.platform === 'win32' ? /\\$/ : /\/$/

module.exports = function createStore (options) {
  if (!options) {
    const opts = cmdLineOpt.describe('createStore',
      'Create internal store structure (folders) for specifies FileSystem store. Must be used on the same computer where UnityBase server installed',
      'ubcli'
    )
      .add({ short: 'cfg', long: 'cfg', param: 'serverConfig', defaultValue: 'ubConfig.json', help: 'Server config' })
      .add({ short: 'store', long: 'store', param: 'storesList', defaultValue: '*', help: 'Comma separated blob stores list' })
    options = opts.parseVerbose({}, true)
    if (!options) return
  }
  let storeNames = options.store
  const config = argv.getServerConfiguration()
  const app = config.application

  if (!app.blobStores) {
    throw new Error('No "blobStores" section inside application config')
  }
  if (!Array.isArray(app.blobStores) || !app.blobStores.length) {
    throw new Error('"blobStores" config section must be in 1.11 format - an non-empty ARRAY of named object')
  }

  let selectedStores
  if (storeNames) {
    storeNames = storeNames.split(',')
    selectedStores = app.blobStores.filter(function (store) {
      return (storeNames.indexOf(store.name) !== -1)
    })
    if (!selectedStores.length) {
      throw new Error('No store with names, passed in "-store" cmd line switch found')
    }
  } else {
    selectedStores = app.blobStores
  }

  function createOneStore (cStore) {
    let newStores=0
    if (!cStore.storeType) {
      cStore.storeType = 'FileSystem'
    }
    if (cStore.path) {
      let cStorePath = cStore.path // already converted to absolute by argv
      if (!RE_TRAILING_PATH_SEP.test(cStorePath)) {
        cStorePath += path.sep
      }
      if (!fs.existsSync(cStorePath)) {
        console.log(`\tStore ${cStore.name}: path '${cStorePath}' not exists and will be created`)
        fs.mkdirSync(cStorePath)
        newStores++
      }
    } else {
      console.log('\tStore ${cStore.name}: skipped - path not defined')
    }
    if (cStore.tempPath) {
      const tmp = cStore.tempPath // already converted to absolute by argv
      if (!fs.existsSync(tmp)) {
        console.log(`\tStore ${cStore.name}: create temp directory ${tmp}`)
        fs.mkdirSync(tmp)
      }
    }
    return newStores
  }

  const created = selectedStores.forEach(createOneStore)
  if (created) {
    console.log(`BLOB stores folders roots are OK (${created} new root folders are created)`)
  } else {
    console.log('BLOB stores folders roots are OK')
  }
}

module.exports.shortDoc = `Create internal BLOB store structure (folders) for
 \t\t\ta specifies FileSystem store`
