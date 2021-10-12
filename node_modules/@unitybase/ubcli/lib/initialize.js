/**
 * Fill domain entities by it initial values: enumerate all (or specified in -m switch) models `_initialData` folders  and execute all `*.js` from there.
 *
 * Requirements:
 *
 *  - database must exist - see {@link module:@unitybase/ubcli/initDB initDB}
 *  - all tables must exist - see {@link module:@unitybase/ubcli/generateDDL generateDDL}
 *
 * Usage:

      ubcli initialize -?

 * @author pavel.mash
 * @module initialize
 * @memberOf module:@unitybase/ubcli
*/
const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const { options, argv } = require('@unitybase/base')
const { updateVersionsInDB } = require('./flow/migrationUtils')

module.exports = function initialize (cfg) {
  if (!cfg) {
    const opts = options
      .describe('initialize', 'Fill domain entities by it initial values using scripts from models `_initialData` folders', 'ubcli')
      .add(argv.establishConnectionFromCmdLineAttributes._cmdLineParams)
      .add({ short: 'm', long: 'model', param: 'modelName', defaultValue: '*', help: 'Name of model to initialize' })
    cfg = opts.parseVerbose({}, true)
    if (!cfg) return
  }
  if (cfg.model === '*') cfg.model = ''

  const session = argv.establishConnectionFromCmdLineAttributes(cfg)

  try {
    const oneModel = cfg.model

    const config = argv.getServerConfiguration()
    const appConfig = config.application
    const domainConfig = appConfig.domain

    console.info('Scan models `_initialData` folders for initialization scripts')
    if (!Array.isArray(domainConfig.models)) {
      throw new Error('Domain.models configuration MUST be an array on object')
    }
    domainConfig.models.forEach(function (modelConfig) {
      const folderName = path.join(modelConfig.realPath, '_initialData')

      if ((!oneModel || (modelConfig.name === oneModel)) && fs.isDir(folderName)) {
        let files = fs.readdirSync(folderName)
        files = _.filter(files, function (item) { return /\.js$/.test(item) }).sort()
        if (files.length) {
          files.forEach(function (file) {
            requireAndRun(folderName, modelConfig.name, file)
          })
        }
        // check localization
        const localeFolderName = path.join(folderName, 'locale')
        if (fs.isDir(localeFolderName)) {
          const allLocalefiles = fs.readdirSync(localeFolderName)
          _.forEach(session.appInfo.supportedLanguages, function (lang) {
            const langFileRe = new RegExp(lang + '\\^.*\\.js$')
            files = _.filter(allLocalefiles, (item) => langFileRe.test(item)).sort()
            if (files.length) {
              files.forEach((file) => requireAndRun(localeFolderName, modelConfig.name, file))
            }
          })
        }
      }
    })

    // sets initial versions in ub_version table
    updateVersionsInDB(session.connection, config.application.domain.models, {})

  } finally {
    if (session && session.logout) {
      session.logout()
    }
  }

  function requireAndRun (folderName, modelName, file) {
    const realPath = path.join(folderName, file)
    if (file.charAt(0) !== '_') {
      const filler = require(realPath)
      if (typeof filler === 'function') {
        console.info('\tmodel:', modelName, 'file:', file)
        filler(session)
      } else {
        console.warn('File', realPath, 'does not export function')
      }
    } else {
      console.info('File', realPath, 'is ignored because it name start from "_"')
    }
  }
}

module.exports.shortDoc = `Fill domain entities by it initial values:
\t\t\tenumerate all (or specified in -m switch) models
\t\t\t'_initialData' folders and execute all '*.js' from there`
