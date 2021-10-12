/**
 * Command line module. Convert ubm_form, ubm_diagram and ubs_reposts to .ubrow format.
 * Usage:

 ubcli convertDefFiles -u root

 * @author pavel.mash 2021-03-09
 * @module convertDefFiles
 * @memberOf module:@unitybase/ubcli
 */
const fs = require('fs')
const argv = require('@unitybase/base').argv
const options = require('@unitybase/base').options
const path = require('path')

module.exports = function convertDefFiles (cfg) {
  if (!cfg) {
    const opts = options.describe('convertDefFiles',
      'Convert ubm_form, ubm_diagram and ubs_reposts to .ubrow format',
      'ubcli'
      ).add(argv.establishConnectionFromCmdLineAttributes._cmdLineParams)

    cfg = opts.parseVerbose({}, true)
    if (!cfg) return
  }
  const session = argv.establishConnectionFromCmdLineAttributes(cfg)

  const conn = session.connection
  const domain = conn.getDomainInfo(true)
  const files2Remove = []
  for (const mn in domain.models) {
    if (!domain.models.hasOwnProperty(mn)) continue
    const model = domain.models[mn]
    if (!model.realPublicPath) continue

    // reports: 1. remove <!--@m comments from .template; extract name attribute
    let dataPath = path.join(model.realPublicPath, 'reports')
    const XML_ATTRS_RE = /<!--@(\w+)\s*"(.+)"\s*-->/gm
    const NAME_ATTRS_RE = /<!--@name\s*"(.+)"\s*-->/m
    if (fs.existsSync(dataPath)) {
      const dataFiles = fs.readdirSync(dataPath).filter(r => r.endsWith('.template'))
      dataFiles.forEach(rc => {
        const tplPath = dataPath + '/' + rc
        const itemCode = rc.substring(0, rc.length - 9) // remove .template
        const ubrowFn = `${dataPath}/${itemCode}.ubrow`
        if (fs.existsSync(ubrowFn)) return

        let body = fs.readFileSync(tplPath, 'utf8')
        const reportNameRe = NAME_ATTRS_RE.exec(body)
        let reportName = ''
        if (reportNameRe) {
          reportName = reportNameRe[1]
        }
        // remove metadata
        body = body.replace(XML_ATTRS_RE, '').trim()
        fs.writeFileSync(tplPath, body)
        const ubrow = {
          name: reportName,
          template: rc,
          code: `${itemCode}.js`
        }
        fs.writeFileSync(ubrowFn, JSON.stringify(ubrow, null, ' '))
        console.log(`Converted report: ${ubrowFn}`)
      })
    }
    //forms
    //formDef "{"fName":"uba_user-changeUserPassword-fm.def","origName":"uba_user-changeUserPassword-fm.def","ct":"text/javascript; charset=UTF-8","size":292,"md5":"fb6a51668017be0950bd18c2fb0474a0","relPath":"UBA|forms"}"
    // formCode"{"fName":"uba_user-changeUserPassword-fm.vue","origName":"uba_user-changeUserPassword-fm.vue","ct":"script/x-vue","size":5022,"md5":"fakemd50000000000000000000000000","relPath":"UBA|forms"}"
    const JSON_ATTRS_RE = /^\/\/[ \t]?@([!|\w]+)\s"(.*?)"/gm
    dataPath = path.join(model.realPublicPath, 'forms')
    if (fs.existsSync(dataPath)) {
      const dataFiles = fs.readdirSync(dataPath).filter(r => r.endsWith('-fm.def'))
      dataFiles.forEach(rc => {
        const tplPath = dataPath + '/' + rc
        const itemCode = rc.substring(0, rc.length - 7) // remove -fm.def
        const ubrowFn = `${dataPath}/${itemCode}.ubrow`
        if (fs.existsSync(ubrowFn)) return

        let body = fs.readFileSync(tplPath, 'utf8')
        const ubrow = {}
        const availableAttributes = {isDefault:1, entity:1, formType:1, caption:1,description:1}
        let attrVal = JSON_ATTRS_RE.exec(body)
        while (attrVal !== null) {
          if (availableAttributes[attrVal[1]]) {
            ubrow[attrVal[1]] = attrVal[2]
          }
          attrVal = JSON_ATTRS_RE.exec(body)
        }
        ubrow.isDefault = (ubrow.isDefault === 'true')

        // remove metadata from def
        body = body.replace(JSON_ATTRS_RE, '').trim()
        if (body) { // def file not empty
          fs.writeFileSync(tplPath, body)
          ubrow.formDef = rc
        } else { // schedule removing def file
          files2Remove.push(`git rm ${fs.realpathSync(tplPath)}`)
        }
        // formCode js|vue file exists
        const codeExt = ubrow.formType === 'vue' ? 'vue' : 'js'
        const codeFn = `${itemCode}-fm.${codeExt}`
        const codeFilePath = `${dataPath}/${codeFn}`
        if (fs.existsSync(codeFilePath)) {
          const jsSrc = fs.readFileSync(codeFilePath, 'utf8')
          // sanitize
          jsSrc.replace(/^{}\s*$/gm, '')
            .replace(/^exports.formCode = {}\s*$/gm, '')
            .trim()
          if (!jsSrc) {
            files2Remove.push(`git rm ${fs.realpathSync(codeFilePath)}`)
          } else { // add formCode BLOB
            ubrow.formCode = codeFn
          }
        }
        fs.writeFileSync(ubrowFn, JSON.stringify(ubrow, null, ' '))
        console.log(`Converted form: ${ubrowFn}`)
      })
    }

    //diagrams
    // "{"fName":"CommonDictionaries.xml","origName":"CommonDictionaries.xml","ct":"application/ubMetaDiagram","size":4377,"md5":"fakemd50000000000000000000000000","relPath":"CDN|erdiagrams"}"
    dataPath = path.join(model.realPublicPath, 'erdiagrams')
    if (fs.existsSync(dataPath)) {
      const dataFiles = fs.readdirSync(dataPath).filter(r => r.endsWith('.xml'))
      dataFiles.forEach(rc => {
        const itemCode = rc.substring(0, rc.length - 4) // remove .xml
        const ubrowFn = `${dataPath}/${itemCode}.ubrow`
        if (fs.existsSync(ubrowFn)) return

        const ubrow = {
          document: rc
        }
        fs.writeFileSync(ubrowFn, JSON.stringify(ubrow, null, ' '))
        console.log(`Converted diagram: ${ubrowFn}`)
      })
    }
  }
  if (files2Remove.length) {
    console.log('\nThe following files no longer required and can be removed (review it first!):\n')
    console.log(files2Remove.join('\n'))
  }
}

module.exports.shortDoc = 'Convert ubm_form, ubm_diagram and ubs_reposts to .ubrow format'
