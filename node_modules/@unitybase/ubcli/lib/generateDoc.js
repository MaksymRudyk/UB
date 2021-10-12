/**
 * Command line module. Generate domain documentation into single HTML file.
 * Command line usage:

       ubcli generateDoc -?

 * @author pavel.mash 04.02.14
 * @module generateDoc
 * @memberOf module:@unitybase/ubcli
 */
const fs = require('fs')
const argv = require('@unitybase/base').argv
const options = require('@unitybase/base').options
const _ = require('lodash')
const path = require('path')
const mustache = require('mustache')

const SNIPPETS_FN = '.jsdoc_snippets.json'
const MIXIN_METHODS = {
  select: {
    src: 'mStorage_api.select',
    doc: null
  },
  insert: {
    src: 'mStorage_api.insert',
    doc: null
  },
  update: {
    src: 'mStorage_api.update',
    doc: null
  },
  delete: {
    src: 'mStorage_api.delete',
    doc: null
  },
  addnew: {
    src: 'mStorage_api.addnew',
    doc: null
  },
  lock: {
    src: 'softLock_api.lock',
    doc: null
  },
  unlock: {
    src: 'softLock_api.unlock',
    doc: null
  },
  renewLock: {
    src: 'softLock_api.renewLock',
    doc: null
  },
  isLocked: {
    src: 'softLock_api.isLocked',
    doc: null
  },
  getallroles: {
    src: 'als_api.getallroles',
    doc: null
  },
  getallstates: {
    src: 'als_api.getallstates',
    doc: null
  },
  newversion: {
    src: 'dataHistory_api.newversion',
    doc: null
  },
  fts: {
    src: 'fts_api.fts',
    doc: null
  },
  ftsreindex: {
    src: 'fts_api.ftsreindex',
    doc: null
  }
}

module.exports = function generateDoc (cfg) {
  let
    domainI18n,
    i, j, len, lenj, k, lenk

  console.time('Generation time')
  if (!cfg) {
    const opts = options.describe('generateDoc',
      'Generate domain documentation into single HTML file\nDocumentation generated using default language for user, specified in -u',
      'ubcli'
    )
      .add(argv.establishConnectionFromCmdLineAttributes._cmdLineParams)
      .add({
        short: 'out',
        long: 'out',
        param: 'outputFileName',
        defaultValue: './domainDocumentation.html',
        help: 'Output file path'
      })
      .add({ short: 'su', long: 'skipUndocumented', defaultValue: false, help: 'Remove undocumented methods from API documentation' })
    cfg = opts.parseVerbose({}, true)
    if (!cfg) return
  }
  const session = argv.establishConnectionFromCmdLineAttributes(cfg)

  // must be required for translation
  // require('@unitybase/ub/i18n')
  // console.log('Session.uData: ', session.uData, typeof session.uData)
  const conn = session.connection
  const outputFileName = cfg.out

  try {
    const domain = conn.getDomainInfo(true)
    const snippets = generateJsDocSnippets(domain)

    domainI18n = domain.entities

    // add entityCode for each entity in domain
    _.each(domainI18n, function (entity, entityCode) {
      entity.entityCode = entityCode
    })

    domainI18n = _.groupBy(domainI18n, 'modelName')
    // add modelCode for each model in domain
    _.each(domainI18n, function (value, key) {
      value.modelCode = key
      value.entities = []
      const packageJsonFn = path.join(domain.models[key].realPath, 'package.json')
      value.modelPackage = require(packageJsonFn)
    })
    // transform domain to array of entity
    const domainAsArray = _.values(domainI18n)
    const undocumentedMethods = []
    const fakeDocumentedMethods = []
    let documentedMethodsCnt = 0
    let stdMethodsCnt = 0
    let isStdMethod = false
    for (i = 0, len = domainAsArray.length; i < len; ++i) {
      for (j = 0, lenj = domainAsArray[i].length; j < lenj; ++j) {
        domainAsArray[i].entities[j] = domainAsArray[i][j]
        const e = domainAsArray[i].entities[j]
        _.each(e.attributes, function (value, key) {
          value.attrCode = key
        })
        e.attributes = _.values(e.attributes)
        for (k = 0, lenk = e.attributes.length; k < lenk; ++k) {
          if (e.attributes[k].associatedEntity === '') {
            e.attributes[k].associatedEntity = null
          }
        }

        _.each(domainAsArray[i][j].mixins, function (value, key) {
          value.mixinCode = key
        })
        e.mixins = _.values(e.mixins)
        const methods = _.keys(e.entityMethods).sort()
        e.methodsArray = []
        methods.forEach(methodName => {
          const m = {
            name: methodName,
            jsdoc: { description: '' }
          }
          // 1) search find methods declared as function methodName(){}; me.methodName = methodName
          const snippetLongName = `${e.name}_ns#${methodName}`
          let snippet = snippets.find(s => s.longname === snippetLongName)
          if (!snippet) {
            // 2) search for methods declared as me.methodName = function(..){}
            const fn = e.name + '.js'
            snippet = snippets.find(s => s.name === methodName && s.meta.filename === fn)
          }
          if (snippet) {
            convertServerSideParamsToAPI(snippet, e.name, methodName)
          }
          isStdMethod = false
          if (!snippet && MIXIN_METHODS[methodName]) { // check mixin methods in case method not already documented
            snippet = MIXIN_METHODS[methodName].doc
            isStdMethod = true
            stdMethodsCnt++
          }
          let isDocumented = true
          if (!snippet || !snippet.comment) {
            isDocumented = false
            undocumentedMethods.push(`${e.name}.${methodName}`)
          } else if (snippet) {
            if (snippet.comment && (!snippet.params || !snippet.params.length)) {
              fakeDocumentedMethods.push(`${e.name}.${methodName}`)
            }
            if (!isStdMethod) documentedMethodsCnt++
          }
          if (snippet) {
            m.jsdoc = snippet
          }
          if (isDocumented || !cfg.skipUndocumented) {
            e.methodsArray.push(m)
          }
        })
      }
    }

    const tpl = fs.readFileSync(path.join(__dirname, 'templates', 'generateDoc_template.mustache'), 'utf8')
    const appInfo = conn.getAppInfo()
    let appName = appInfo.uiSettings.adminUI.applicationName
    if (typeof appName === 'object') {
      appName = appName[Object.keys(appName)[0]]
      appInfo.uiSettings.adminUI.applicationName = appName
    }
    const rendered = mustache.render(tpl, {
      domain: domainAsArray,
      appInfo: conn.getAppInfo(),
      i18n: function () {
        return function (word) {
          // console.log('translate for ', word, 'to', userLang);
          // return UB.i18n(word, userLang)
          return word
        }
      }
    })
    if (!fs.writeFileSync(outputFileName, rendered)) {
      console.error('Write to file ' + outputFileName + ' fail')
    }
    if (!snippets.length) {
      console.warn('Methods documentation not added because of jsdoc errors')
    } else {
      if (undocumentedMethods.length) {
        console.warn(`Detected ${undocumentedMethods.length} undocumented entity level methods:`)
        console.warn('\t' + undocumentedMethods.join('\n\t'))
      }
      if (fakeDocumentedMethods.length) {
        console.warn(`Documentation w/o parameters detected for ${fakeDocumentedMethods.length} methods:`)
        console.warn('\t' + fakeDocumentedMethods.join('\n\t'))
      }
      console.timeEnd('Generation time')
      console.info(`API methods statistics:
 - total methods count: ${stdMethodsCnt + documentedMethodsCnt + undocumentedMethods.length}
 - methods added by mixins: ${stdMethodsCnt}
 - methods added by developers: ${documentedMethodsCnt + undocumentedMethods.length}
 - documentation written for ${documentedMethodsCnt} custom methods
 - undocumented ${undocumentedMethods.length} custom methods
 - fake documentation (no parameters defined) detected for ${fakeDocumentedMethods.length} custom methods`)
    }
    console.info('Result file', outputFileName)
  } finally {
    if (session && session.logout) {
      session.logout()
    }
  }
}

module.exports.shortDoc = 'Generate domain documentation into HTML file'

/**
 * Generate JsDoc snippets for current domain. `npx ubcli generateDoc` is executed from folder with ubConfig
 * @param {UBDomain} domain
 */
function generateJsDocSnippets (domain) {
  const JSDOC_CONG_TMP = '.jsdoc_conf_tmp.json'
  const JSDOC_CONF_TMP_PATH = path.join(process.cwd(), JSDOC_CONG_TMP)
  // check jsdoc is installed
  const jsdocPath = path.join(process.cwd(), 'node_modules', 'jsdoc', 'jsdoc.js')
  if (!fs.existsSync(jsdocPath)) {
    console.error(`Can't find jsdoc module (expected to be in ${jsdocPath}). API methods documentation generation is skipped`)
    return []
  }
  // create config for jsdoc based on available domain models
  const jsdocConf = {
    recurseDepth: 2,
    tags: {
      allowUnknownTags: true
    },
    source: {
      include: [
        './node_modules/@unitybase/stubs/_UBMixinsAPI-stub.js' // mixins doc: mStorage etc
      ],
      includePattern: '.+\\.js(m|x)?$',
      // "excludePattern": "(\\/_.*\\/|\\\\_.*\\\\|public)"
      excludePattern: '(\\/public|\\\\public|\\/_autotest|\\\\/_autotest|\\/_migration|\\\\/_migration)'
    },
    plugins: [
      'plugins/markdown',
      './node_modules/ub-jsdoc/plugins/sripPFromDescription',
      './node_modules/ub-jsdoc/plugins/memberOfModule.js',
      './node_modules/ub-jsdoc/plugins/publishedTag.js'
    ]
  }
  if (!fs.existsSync(path.join(process.cwd(), 'node_modules/@unitybase/stubs'))) {
    console.warn('@unitybase/stubs package should be added ad dev dependency for mixin methods documentation generation')
  }
  domain.orderedModels.forEach(m => {
    if (m.realPath) jsdocConf.source.include.push(m.realPath)
  })

  if (fs.existsSync(JSDOC_CONF_TMP_PATH)) fs.unlinkSync(JSDOC_CONF_TMP_PATH)
  fs.writeFileSync(JSDOC_CONF_TMP_PATH, JSON.stringify(jsdocConf, null, '\t'))
  const snippetsFullFn = path.join(process.cwd(), SNIPPETS_FN)
  if (fs.existsSync(snippetsFullFn)) fs.unlinkSync(snippetsFullFn)

  let cmd, shell
  if (process.platform === 'win32') {
    shell = 'cmd.exe'
    cmd = `/c "node.exe ${jsdocPath} -r -c ./${JSDOC_CONG_TMP} -X > ./${SNIPPETS_FN}"`
  } else {
    shell = '/bin/sh'
    cmd = `-c "${jsdocPath} -r -c ./${JSDOC_CONG_TMP} -X > ./${SNIPPETS_FN}"`
  }
  console.log(`Run jsdoc shell command: ${shell} ${cmd}`)
  // eslint-disable-next-line no-undef
  const res = shellExecute(shell, cmd)
  if (res !== 0) {
    console.error(`Got error from jsdoc while executing command: ${shell} ${cmd}`)
    return []
  }

  const snippets = require(snippetsFullFn)
  // fill build-in mixins
  // TODO - how to add a custom mixin documentation (ldoc etc)?
  Object.keys(MIXIN_METHODS).forEach(m => {
    const mixinMethodDoc = MIXIN_METHODS[m]
    mixinMethodDoc.doc = snippets.find(s => s.longname === mixinMethodDoc.src)
    if (mixinMethodDoc.doc) convertServerSideParamsToAPI(mixinMethodDoc.doc, '', mixinMethodDoc.src.split('.')[1])
  })
  return snippets
}

/**
 * Mutate a snipped what contains a server-side parameters description into client-side API
 *  - replace ubMethodParams type -> object
 *  - removes mParams
 *  - adds entity & method parameters if not already added
 * @param {object} snippet
 * @param {string} eName
 * @param {string} mName
 */
function convertServerSideParamsToAPI (snippet, eName, mName) {
  const prms = snippet.params
  if (!prms || !prms.length) return
  let topLevelObjPrm = null
  prms.forEach(p => {
    // ubMethodParams -> object
    if (p.type && p.type.names) {
      p.type.names = p.type.names.map(n => {
        if (n === 'ubMethodParams') {
          topLevelObjPrm = p
          return 'object'
        } else {
          return n
        }
      })
    }
    // ctxt.mParams.newPwd -> ctxt.newPwd
    p.name = p.name.replace('.mParams', '')
    if (!p.description) p.description = ''
  })
  if (topLevelObjPrm) { // @param {ubMethodParam} pn is defined - use this parameter name to add a entity & method if not exists
    let pn = `${topLevelObjPrm}.entity`
    let prm = prms.find(p => p.name === pn)
    let pp = 1
    if (!prm) { // add entity parameter
      prms.splice(pp, 0, {
        type: {
          names: ['string']
        },
        description: eName ? `Should be "${eName}"` : 'Entity code',
        name: `${topLevelObjPrm.name}.entity`
      })
      pp++
    }
    pn = `${topLevelObjPrm}.method`
    prm = prms.find(p => p.name === pn)
    if (!prm) { // add method parameter
      prms.splice(pp, 0, {
        type: {
          names: ['string']
        },
        description: mName ? `Should be "${mName}"` : 'This method code',
        name: `${topLevelObjPrm.name}.method`
      })
      pp++
    }
  }
}
