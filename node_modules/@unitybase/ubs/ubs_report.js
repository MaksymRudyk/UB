/* global ubs_report ncrc32 */
// eslint-disable-next-line camelcase
const me = ubs_report
const fs = require('fs')
const path = require('path')
const UB = require('@unitybase/ub')
const App = UB.App
me.on('insert:before', generateDefaultJS)

/**
 * Generate template code for report JS using template from `_templates` UMS model folder
 * @private
 * @param {ubMethodParams} ctx
 * @returns {boolean}
 */
function generateDefaultJS (ctx) {
  const row = ctx.mParams.execParams
  if (row.code) return true // already generated
  if (!row.report_code || !row.model) return true // will fails on insert with validation error
  const ID = ncrc32(0, row.report_code)
  // form definition template
  const filePath = path.join(App.domainInfo.models.UBS.realPath, '_templates', 'reportCodeTemplate.js')
  const reportCodeBody = fs.readFileSync(filePath, 'utf8')

  const codeBlob = App.blobStores.putContent({
    entity: me.entity.name,
    attribute: 'code',
    ID: ID,
    fileName: row.report_code + '.js',
    isDirty: true
  }, reportCodeBody)
  row.code = JSON.stringify(codeBlob)

  const tplBlob = App.blobStores.putContent({
    entity: me.entity.name,
    attribute: 'template',
    ID: ID,
    fileName: row.report_code + '.template',
    isDirty: true
  }, 'empty report')
  row.template = JSON.stringify(tplBlob)
}

/**
 * REST endpoint for Report test purpose. Available in `-dev` mode only.
 * Expect POST request with JSON on body {reportCode: 'reportCode', responseType: 'pdf'|'html', reportParams: {paramName: paramValue, ...}}
 * Return a HTML/PDF
 *
 * @param {null} ctxt
 * @param {THTTPRequest} req
 * @param {THTTPResponse} resp
 */
me.testServerRendering = function (ctxt, req, resp) {
  // also used as ubs_report.testServerRendering method for autotest
  const params = req.json()
  const UBServerReport = require('./modules/UBServerReport')
  const mime = require('mime-types')

  const result = UBServerReport.makeReport(params.reportCode, params.responseType, params.reportParams)

  if (result.reportType === 'pdf') {
    console.debug('Generate a PDF report of size=', result.reportData.byteLength)
  } else {
    console.debug('Generate a HTML report of size=', result.reportData.length)
  }
  resp.writeEnd(result.reportData)
  resp.writeHead('Content-Type: ' + mime.lookup(result.reportType))
  resp.statusCode = 200
}

if (process.isDebug) {
  me.entity.addMethod('testServerRendering')
}
