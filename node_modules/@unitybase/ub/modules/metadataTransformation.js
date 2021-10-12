/* eslint-disable node/no-deprecated-api */
const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const { file2JSON } = process.binding('fs')
const nativeApp = process.binding('ub_app')
const hookMetadataTransformationFn = '_hookMetadataTransformation.js'

if (typeof nativeApp._nativeInitEntity !== 'function') {
  throw new Error('This version of @unitybase/ub package require UB server to be at last 5.18.0')
}

// manually define a console in case this module is required by native ( before UB.js )
if (typeof global.console === 'undefined') {
  global.console = require('console')
}

const argv = require('@unitybase/base').argv
const cfg = argv.getServerConfiguration()

module.exports = loadDomainIntoJS

/**
 * Load Domain meta & lang files with merge. Result is JS object with keys = entity name.
 * In case `_hookMetadataTransformation.js` file exists in models, it will be required and hook is called with
 * two parameters - domainJSON, serverConfig
 *
 * Hooks can mutate a domainJSON according to their needs.
 *
 * @param {boolean} [skipNativeEntityInit=false] Set it to true in case domain is already loaded but raw domain info must be retrieved
 * @return {object<string, {modelName: string, meta: object, lang: object<string, object>}>}
 */
function loadDomainIntoJS (skipNativeEntityInit) {
  console.time('load domain')
  const { hooks, ePaths } = readAllEntitiesPathsAndHooks()
  const domainJSON = {}
  console.log(`Loading meta files for ${Object.keys(ePaths).length} entities... `)
  for (const en in ePaths) {
    const ep = ePaths[en]
    const p = ep.metaFiles[0].fullPath
    const metaJSON = loadMetaAsJSON(p) // main meta file
    const modelName = ep.metaFiles[0].modelName // original model name
    const overriddenBy = []
    if (ep.metaFiles.length > 1) { // need to merge meta files from other models
      for (let i = 1, L = ep.metaFiles.length; i < L; i++) {
        console.log(`MERGE "${en}" with descendant from "${ep.metaFiles[i].modelName}" model`)
        const override = loadMetaAsJSON(ep.metaFiles[i].fullPath)
        _.mergeWith(metaJSON, override, mergeNamedCollections)
        overriddenBy.push(ep.metaFiles[i].modelName)
      }
      if (overriddenBy.length) metaJSON.overriddenBy = overriddenBy.join(',')
    }
    // merge lang files
    const languages = {}
    let langsExists = false
    for (const ln in ep.langFiles) {
      const l = ep.langFiles[ln]
      if (!l.length) continue // lang files for language ln not exists
      const langJSON = loadMetaAsJSON(l[0].fullPath)
      if (l.length > 1) { // need to merge lang files for ln language from other models
        for (let i = 1, L = l.length; i < L; i++) {
          console.log(`MERGE "${en}" LANG "${ln}" with descendant from "${l[i].modelName}" model`)
          const override = loadMetaAsJSON(l[i].fullPath)
          _.mergeWith(langJSON, override, mergeNamedCollections)
        }
      }
      languages[ln] = langJSON
      langsExists = true
    }

    domainJSON[en] = {
      modelName: modelName,
      meta: metaJSON,
      langs: langsExists ? languages : null
    }
  }
  console.timeEnd('load domain')
  if (hooks.length) {
    // apply all metadata transformation hooks
    console.time('applying hooks')
    hooks.forEach(h => {
      console.log(`applying metadata transformation hook from ${h.modelName}`)
      h.hookFunc(domainJSON, cfg)
    })
    console.timeEnd('applying hooks')
  }
  if (!skipNativeEntityInit) {
    console.time('native init')
    for (const en in domainJSON) {
      const e = domainJSON[en]
      try {
        nativeApp._nativeInitEntity(e.modelName, en, e.meta, e.langs)
      } catch (err) {
        console.error(`Can't init entity ${en}\n Something wrong in entity JSON`)
        throw err
      }
    }
    console.timeEnd('native init')
  }
  return domainJSON
}

/**
 * Search all models folders for *.meta files, creates structure with files locations for future merging
 * Returning hooks is an array of all '_hookMetadataTransformation.js' from models (ordered by model order in config)
 * Returning ePaths object keys is entities codes. langFiles object keys is language code.
 * metaFiles and langFiler arrays is ordered by model order in config. Example:
 *
 *    {uba_user: {
 *      metaFiles: [{
 *        model: 'UBA',
 *        fullPath: '/home/.../uba_user.meta'
 *      }],
 *      langFiles: {
 *        uk: [{
 *          model: 'UBA',
 *          fullPath: '/home/.../uba_user.meta.uk'
 *        }]
 *      }
 *    },
 *    other_entity: {}
 *    }
 *
 * @return {{hooks: array<{modelName: string, hookFunc: function}>, paths: Object.<string, {metaFiles: array<{modelName: string, fullPath: string}>, langFiles: object<string, array<{modelName: string, fullPath: string}>}>})
 */
function readAllEntitiesPathsAndHooks () {
  const ePaths = {}
  const result = {
    hooks: [],
    ePaths
  }
  const SKIP_NAMES = new Set(['modules', 'public', 'node_modules'])
  const LANGS = new Set(cfg.application.domain.supportedLanguages)

  function readDir (modelName, dirPath, withSubFolders) {
    const files = fs.readdirSync(dirPath).sort()
    files.forEach(f => {
      if (f.startsWith('.') || f.startsWith('_') || SKIP_NAMES.has(f)) return // skip
      const fullPath = path.join(dirPath, f)
      if (fs.lstatSync(fullPath).isDirectory()) {
        return withSubFolders ? readDir(modelName, fullPath, false) : true
      }
      const [entity, ext, lang] = f.split('.')
      if ((ext !== 'meta') || (lang && !LANGS.has(lang))) return // only *.meta, *.meta.lang
      let e = ePaths[entity]
      if (!e) {
        e = ePaths[entity] = {
          metaFiles: [],
          langFiles: {}
        }
        LANGS.forEach(l => { e.langFiles[l] = [] })
      }
      if (lang) {
        e.langFiles[lang].push({ modelName, fullPath })
      } else {
        e.metaFiles.push({ modelName, fullPath })
      }
    })
  }

  console.log('Loading domain models...')
  cfg.application.domain.models.forEach(model => {
    if (model.path === '_public_only_') return // public model without entities
    if (!fs.existsSync(model.realPath)) {
      console.error(`Model "${model.name}" path "${model.path}" resolved to "${model.realPath}" does not exist, model not loaded`)
      return
    }
    console.info(`"${model.name}"(${model.version}) from "${model.path}"`)
    // todo - check public path
    readDir(model.name, model.realPath, true)
    const possibleHookFN = path.join(model.realPath, hookMetadataTransformationFn)
    if (fs.existsSync(possibleHookFN)) {
      const h = require(possibleHookFN)
      result.hooks.push({
        modelName: model.name,
        hookFunc: h
      })
    }
  })

  // remove entities with lang files buf without meta file
  const eNames = Object.keys(ePaths)
  eNames.forEach(e => {
    if (!ePaths[e].metaFiles.length) {
      delete ePaths[e]
    }
  })
  return result
}

/**
 * Recursively merge two named collection
 * This method **mutate** `orig` or return `desc` if `orig` is empty collection
 *
 * @private
 * @param {*} orig
 * @param {*} desc
 */
function mergeNamedCollections (orig, desc) {
  if (Array.isArray(orig) && Array.isArray(desc) &&
    ((orig.length && orig[0].name) || (desc.length && desc[0].name))
  ) {
    if (!orig.length) return desc
    desc.forEach(dItem => {
      const oItem = orig.find(oItem => oItem.name === dItem.name)
      if (oItem) {
        _.mergeWith(oItem, dItem, mergeNamedCollections)
      } else {
        orig.push(dItem)
      }
    })
    return orig
  } else {
    return undefined // let's lodash do a merge
  }
}

/**
 * Read meta file from metaPath and return JSON
 * @param {string} metaPath
 * @return {*}
 */
function loadMetaAsJSON (metaPath) {
  let metaJson
  try {
    metaJson = file2JSON(metaPath)
  } catch (e) {
    console.error(`Error loading ${metaPath}`)
    throw e
  }
  checkMetadataFormat(metaJson, metaPath)
  return metaJson
}

/**
 * Check attributes amd all mappings oin meta file is arrays. UB@4 allow to store it as objects - such meta file not supported yet
 * @param e
 * @param ePath
 */
function checkMetadataFormat (e, ePath) {
  if (e.attributes && !Array.isArray(e.attributes)) {
    throw new Error(`Attributes in meta file must be an array\nCommand\nnpx ubcli meta-tr -m ${ePath}\n can be used to transform meta file from old format`)
  }
  if (e.mapping && !Array.isArray(e.mapping)) {
    throw new Error(`Mappings for entity in meta file must be an array\nCommand\nnpx ubcli meta-tr -m ${ePath}\n can be used to transform meta file from old format`)
  }
  if (e.attributes) {
    e.attributes.forEach(attr => {
      if (attr.mapping && !Array.isArray(attr.mapping)) {
        throw new Error(`Mappings for attributes in meta file must be an array\nCommand\nnpx ubcli meta-tr -m ${ePath}\n can be used to transform meta file from old format`)
      }
    })
  }
}
