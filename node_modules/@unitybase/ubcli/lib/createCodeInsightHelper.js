/**
 * Create service scripts containing entity definition for code insight in WebStorm or other IDE work well.
 *
 * Usage from a command line:

     ubcli createCodeInsightHelper -u admin -p admin -m UBS -cfg myConfig.json

 * Usage from a code:

     const createCodeInsightHelper = require('@unitybase/ubcli/createCodeInsightHelper')
     var options = {
          host: "http://localhost:888",
          user: "admin",
          pwd:  "admin",
          model: 'UBS'
     }
     createCodeInsightHelper(options)

 * @author pavel.mash
 * @module createCodeInsightHelper
 * @memberOf module:@unitybase/ubcli
 */
const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const mustache = require('mustache')
const options = require('@unitybase/base').options
const argv = require('@unitybase/base').argv

module.exports = function createCodeInsightHelper (cfg) {
  if (!cfg) {
    const opts = options.describe('createCodeInsightHelper',
      'create service scripts containing entity definition for code insight in WebStorm or other IDE work well',
      'ubcli'
    ).add(
      argv.establishConnectionFromCmdLineAttributes._cmdLineParams
    ).add({
      short: 'm',
      long: 'model',
      param: 'model',
      defaultValue: '*',
      help: 'Model name to generate helpers for. If not specified then all domain models is used'
    })
    cfg = opts.parseVerbose({}, true)
    if (!cfg) return
  }

  const config = argv.getServerConfiguration()
  const domain = config.application.domain

  let models = domain.models
  if (!Array.isArray(models)) {
    throw new Error('Domain.models configuration MUST be an array on object')
  }
  const filterByModel = cfg.model
  if (filterByModel) {
    console.log('Will generate a helpers for model', filterByModel)
    models = _.filter(models, function (modelCfg) {
      return modelCfg.name === filterByModel
    })
  }
  models = _.filter(models, function (modelCfg) {
    return modelCfg.path !== '_public_only_'
  })

  /**
   * Convert named collection - {name1: {}, name2: {}} to array -> [{name: name1, ...}, ...]
   * Will mutate original!
   * @param {object} namedCollection
   */
  function namedCollection2Array (namedCollection) {
    const result = []
    let item
    _.forEach(namedCollection, function (value, key) {
      item = { name: key }
      item = _.defaults(item, value)
      result.push(item)
    })
    return result
  }

  const ub2JS = (dataType, associatedEntity) => {
    const ubTypes = {
      Unknown: () => '*',
      String: () => 'String',
      Int: () => 'Number',
      BigInt: () => 'Number',
      Float: () => 'Number',
      Currency: () => 'Number',
      Boolean: () => 'Boolean',
      DateTime: () => 'Date',
      Text: () => 'String',
      ID: () => 'Number',
      Entity: associatedEntity => `Number|${_.camelCase(associatedEntity)}Attrs`,
      Document: () => 'String',
      Many: associatedEntity => `Number|${_.camelCase(associatedEntity)}Attrs`,
      TimeLog: () => 'Number',
      Enum: () => 'String|ubmEnumAttrs',
      BLOB: () => 'ArrayBuffer',
      Date: () => 'Date'
    }
    return (typeof ubTypes[dataType] === 'function') ? ubTypes[dataType](associatedEntity) : '*'
  }

  const tpl = fs.readFileSync(path.join(__dirname, 'templates', 'codeInsightHelper.mustache'), 'utf8')

  function processEntities (entities, folderName, modelName) {
    let res, resFileName

    const modulePackage = require(path.join(folderName, 'package.json'))
    if (entities.length) {
      res = mustache.render(tpl, {
        module: modulePackage,
        entities: entities,
        getJSType: function () {
          return '{' + (ub2JS(this.dataType, this.associatedEntity) || '*') + '}'
        },
        getDefaultValue: function () {
          var res = ''
          if (this.allowNull) {
            res = 'null'
          } else {
            switch (ub2JS[this.dataType]) {
              case 'String':
                res = "''"
                break
              case 'Number':
                res = '0'
                break
              case 'Date':
                res = 'new Date()'
                break
              default:
                res = 'undefined'
            }
          }
          return res
        },
        getAccessLevel: function () {
          return (this.defaultView === false) ? 'not viewable by default' : undefined
        }
      })
      if (res) {
        resFileName = path.join(folderName, '_' + modelName + '_entities.js')
        console.log('Generate %s', resFileName)
        fs.writeFileSync(resFileName, res)
      }
    }
  }

  // function processFolder (folderName, modelName) {
  //   let files = fs.readdirSync(folderName)
  //   let entities = []
  //
  //   function validateAndParse (fileName) {
  //     let arr = /^([^_].+)\.meta$/.exec(fileName)
  //     let meta
  //
  //     if (arr && arr[1]) {
  //       try {
  //         meta = argv.safeParseJSONfile(path.join(folderName, fileName), true) // JSON.parse(content);
  //         if (!_.isArray(meta.attributes)) {
  //                       // convert attributes to array of object
  //           meta.attributes = namedCollection2Array(meta.attributes)
  //         }
  //         entities.push({name: arr[1], meta: meta})
  //       } catch (e) {
  //         console.error('Invalid JSON file ' + folderName + '\\' + fileName + ' \n' + e.toString())
  //       }
  //     } else if (/^[^_].+\\$/.test(fileName)) { // this is folder
  //       let nameOfSubModel = modelName + '_' + fileName.split('\\')[0] // remove last \ from fileName
  //       processFolder(path.join(folderName, fileName), nameOfSubModel)
  //     }
  //   }
  //   files.forEach(validateAndParse)
  //   processEntities(entities, folderName, modelName)
  // }

  mustache.parse(tpl)

  const session = argv.establishConnectionFromCmdLineAttributes(cfg)
  const realDomain = session.connection.getDomainInfo()
  let entities = []

  models.forEach(function processModel (modelCfg) {
    const currentPath = modelCfg.realPath
    entities = []

    _.forEach(realDomain.entities, function (entityDef, entityName) {
      if (entityDef.modelName === modelCfg.name) {
        entityDef.attributes = namedCollection2Array(entityDef.attributes)
        entityDef.mixins = namedCollection2Array(entityDef.mixins)
        let doc = entityDef.description ? entityDef.description : entityDef.caption
        if (entityDef.documentation) doc += '.\n * ' + entityDef.documentation
        entities.push({
          name: entityName,
          camelName: _.camelCase(entityName),
          description: doc,
          meta: entityDef
        })
      }
    })
    processEntities(entities, currentPath, modelCfg.name)
  })
}

module.exports.shortDoc = `Create service scripts containing entity definition
\t\t\tfor code insight in WebStorm or other IDE work well`
