/**
 * Server-side Report builder
 *
 * @example

// Server side report generation
const fs = require('fs');
const UBReport = require('@unitybase/ubs/modules/UBServerReport');
let reportResult = UBReport.makeReport('test','pdf',{});
if (reportResult.reportType === 'pdf') {
 console.debug('Generate a PDF report of size=', result.reportData.byteLength)
 fs.writeFileSync('d:/result.pdf', result.reportData )
} else {
 console.debug('Generate a HTML report of size=', result.reportData.length)
 fs.writeFileSync('d:/result.html', result.reportData )
}

 * @module UBServerReport
 * @memberOf module:@unitybase/ubs
 */
module.exports = {
  /**
   * Render report with code `reportCode` on the server side
   * Report templates and creation rules are defined in `ubs_report` entity.
   *
   * @param {string|Object} reportCode If reportCode type is Object it is a config object { code: String, type: String, params: String|Object }
   * @param {string} [reportType='html'] Possible values: 'html'|'pdf'
   * @param {*} params Any parameters passed to the buildReport function from report code block
   * @returns {ReportResult}
   */
  makeReport: function (reportCode, reportType, params) {
    const report = new UBServerReport(reportCode, reportType, params)
    return report.makeReport()
  }
}

const Mustache = require('mustache')
// TODO - remove Q.when in future - it added for compatibility with .then() on client
// eslint-disable-next-line no-unused-vars
const Q = require('when')
const _ = require('lodash')
const path = require('path')
const UB = require('@unitybase/ub')
const Session = UB.Session
const App = UB.App
const formatFunctions = require('../public/formatFunctions')

const xmldom = require('xmldom')
global.DOMParser = xmldom.DOMParser
global.XMLSerializer = xmldom.XMLSerializer

// PDF unicode-text require atob & btoa to be in global
global.atob = function (text) {
  const buf = Buffer.from(text, 'base64')
  return buf.toString('binary') // buffer.toString('utf-8')
}

/**
 * Report generation result
 * @typedef {Object} ReportResult
 * @property {string} reportCode
 * @property {string} reportType
 * @property {Object} incomeParams
 * @property {Object} reportOptions
 * @property {string|ArrayBuffer|*} reportData Result of buildReport function execution
 */

/**
 * Server-side report builder
 * @class
 * @protected
 * @param {string|Object} reportCode
 * If reportCode type is Object it is a config object { code: String, type: String, params: String|Object }
 * @param {string} [reportType='html'] Possible values: 'html'|'pdf'
 * @param {{}} params
 * @param {String} [language=Session.userLang]
 */
function UBServerReport (reportCode, reportType, params, language) {
  /**
   * Report code
   * @property {string} reportCode
   */
  this.reportCode = reportCode
  /**
   * Possible values: 'html', 'pdf'
   * @property {string} reportCode
   */
  this.reportType = reportType || 'html'
  /**
   * Report parameters
   * @property {{}} incomeParams
   */
  this.incomeParams = params || {}
  /**
   * The options of report. Known options: pageOrientation.
   * @property {{}} reportOptions
   */
  this.reportOptions = {}

  this.lang = language || Session.userLang

  if (typeof reportCode === 'object') {
    this.reportCode = reportCode.code
    this.reportType = reportCode.type || 'html'
    this.incomeParams = reportCode.params
    this.lang = reportCode.language || Session.userLang
    this.debug = reportCode.debug
  }
}

/**
* Load report template and code.
*/
UBServerReport.prototype.init = function () {
  const reportInfo = UB.Repository('ubs_report')
    .attrs(['ID', 'report_code', 'name', 'template', 'code', 'model'])
    .where('[report_code]', '=', this.reportCode)
    .selectSingle()

  if (!reportInfo) throw new Error(`Report with code "${this.reportCode}" not found`)

  this.reportRW = {
    ID: reportInfo.ID,
    name: reportInfo.name,
    template: reportInfo.template,
    code: reportInfo.code,
    model: reportInfo.model,
    report_code: this.reportCode
  }
  this.reportRW.templateData = this.getDocument('template')
  this.prepareTemplate()
  // loaded in prepareCode this.reportRW.codeData =  this.getDocument('code');
  this.prepareCode()
}

UBServerReport.prototype.prepareTemplate = function () {
  const reOptions = /(<!--%\w+?:(.+?)-->)/gi
  // <!--{{userrole}}-->
  this.reportRW.templateData = this.reportRW.templateData.replace(/<!--({{.+?}})-->/g, '$1')
  // <!--@name "123"-->
  this.reportRW.templateData = this.reportRW.templateData.replace(/<!--@\w+?[ ]*?".+?"-->/g, '')

  // parse options
  const matches = this.reportRW.templateData.match(reOptions)
  if (matches && matches.length > 0) {
    _.forEach(matches, (item) => {
      let itemVal = item.match(/<!--%(\w+?:.+?)-->/)[1]
      itemVal = itemVal.split(':')
      this.reportOptions[itemVal[0]] = itemVal[1]
    })
    // value = value.replace(reOptions, '');
  }
}

/**
 * Render report on server
 * @example

const UBReport = require('@unitybase/ubs/modules/UBServerReport')
let reportResult = UBReport.makeReport('reportCode', 'html', {
  login: email,
  password: password,
  activateUrl: registrationAddress,
  appConfig: App.serverConfig
})

 * @param {Object} [params]
 * @returns {ReportResult}
 */
UBServerReport.prototype.makeReport = function (params) {
  let prm = _.clone(this.incomeParams)
  if (params) {
    prm = _.assign(prm, params)
  }
  this.init()
  const promiseOrData = this.buildReport(prm)
  let report
  let errInsidePromise
  // convert to value
  if (promiseOrData && (typeof promiseOrData.then === 'function')) {
    promiseOrData.then(
      data => { report = data },
      err => { errInsidePromise = err }
    )
  } else {
    report = promiseOrData
  }
  if (errInsidePromise) throw errInsidePromise // rethrow real error
  return this.makeResult(report)
}

/**
* Render HTML report
* @param {Object} reportData
* @returns {string}
*/
UBServerReport.prototype.buildHTML = function (reportData) {
  if (!reportData || (typeof reportData !== 'object') || reportData instanceof Array) {
    throw new Error('reportData must be a Object')
  }
  formatFunctions.addBaseMustacheSysFunction(reportData, this.lang)
  formatFunctions.addMustacheSysFunction(reportData, this.lang)
  return Mustache.render(this.reportRW.templateData, reportData)
}

/**
* Prepare PDF report from html
* @param {string} html
* @param {Object} options
* @param {Array|Object} [options.fonts]
* [{ fontName: "TimesNewRoman", fontStyle: "Normal" }, ..]
* @param {Boolean} [options.outputPdf] If it is not False build PDF output at end. By default it is True.
* @returns {Promise} A promise that resolves with an ArrayBuffer with PDF or instance of PDF.csPrintToPdf with rendered HTML on it when options.outputPdf is false.
*/
UBServerReport.prototype.transformToPdf = function (html, options = {}) {
  const PDF = require('@unitybase/pdf')

  PDF.PrintToPdf.requireFonts({
    fonts: options.fonts
      ? options.fonts
      : [
          { fontName: 'TimesNewRoman', fontStyle: 'Normal' },
          { fontName: 'TimesNewRoman', fontStyle: 'Bold' },
          { fontName: 'TimesNewRoman', fontStyle: 'Italic' },
          { fontName: 'TimesNewRoman', fontStyle: 'BoldItalic' }
        ]
  })

  let pdfConfig = {
    orientation: this.reportOptions.pageOrientation === 'landscape' ? 'l' : 'p',
    font: {
      name: 'TimesNewRoman',
      type: 'Normal',
      size: 12
    },
    margin: {
      top: 5,
      right: 5,
      bottom: 8,
      left: 5
    }
  }
  if (this.onTransformConfig) {
    pdfConfig = this.onTransformConfig(pdfConfig)
  }
  const pdf = new PDF.PrintToPdf(pdfConfig)
  pdf.writeHtml({
    html: html,
    orientation: this.reportOptions.pageOrientation,
    onPositionDetermine: options.onPositionDetermine
  })
  this.pdf = pdf
  if (options.outputPdf === false) {
    return pdf
  } else {
    return pdf.output('arrayBuffer').buffer
  }
}

/**
* @private
* @param {ArrayBuffer|String} reportData
* @returns {Object}
*/
UBServerReport.prototype.makeResult = function (reportData) {
  if (!reportData) {
    throw new Error(`Report ${this.reportCode} return empty report`)
  }
  return {
    reportCode: this.reportCode,
    reportType: this.reportType,
    incomeParams: this.incomeParams,
    reportOptions: this.reportOptions,
    reportData: reportData
  }
}

/**
* Apply user code to itself
* @private
*/
UBServerReport.prototype.prepareCode = function () {
  const modelPublicPath = App.domainInfo.models[this.reportRW.model].realPublicPath
  const reportModulePath = path.join(modelPublicPath, 'reports', this.reportRW.report_code + '.js')
  const reportModule = require(reportModulePath)
  if (reportModule.reportCode) {
    _.forEach(reportModule.reportCode, (val, name) => {
      this[name] = val
    })
  }
}

/**
 * This function must be defined in report code block.
 *
 * Inside function you must:
 *
 *  - Prepare data
 *  - Run method this.buildHTML(reportData); where reportData is data for mustache template
 *  - If need create PDF run method this.buildPdf(htmlReport); where htmlReport is HTML
 *  - If is server side function must return report as string otherwise Promise
 *
 * @cfg {function} buildReport
 * @param {Object} reportParams
 * @returns {Promise|Object|String} If code run at server, method must return report data, else - Promise, which resolves to report data
 */
UBServerReport.prototype.buildReport = function (reportParams) {
  throw new UB.UBError('Function "buildReport" not defined in report code block')
}

/**
* This function used by ReportViewer.
* If function exists and return UBS.ReportParamForm or Array ReportViewer show this panel on the top of viewer form.
* Example
*
*      onParamPanelConfig: function() {
*           var paramForm = Ext.create('UBS.ReportParamForm', {
*           items: [{
*                  xtype: 'textfield',
*                  name: 'name',
*                  fieldLabel: 'Name'
*              }, {
*                  xtype: 'datefield',
*                  name: 'birthday',
*                  fieldLabel: 'Birthday'
*              }, ],
*              getParameters: function(owner) {
*                  var frm = owner.getForm();
*                  return {
*                      name: frm.findField('name').getValue(),
*                      birthday: frm.findField('birthday').getValue()
*                  };
*              }
*          });
*          return paramForm;
*      }
*
* or
*
*      onParamPanelConfig: function() {
*           return [{
*                  xtype: 'textfield',
*                  name: 'name',
*                  fieldLabel: 'Name'
*              }, {
*                  xtype: 'datefield',
*                  name: 'birthday',
*                  fieldLabel: 'Birthday'
*              } ];
*      }
*
*
* @cfg {function} onParamPanelConfig
*/

/**
* You can edit config for pdf in this function
*
* @cfg {function} onTransformConfig
* @param {Object} config
* @returns {Object}
*/

/**
* load document
* @param {string} attribute
* @returns {string}
*/
UBServerReport.prototype.getDocument = function (attribute) {
  const cfg = JSON.parse(this.reportRW[attribute])

  return App.blobStores.getContent({
    entity: 'ubs_report',
    attribute: attribute,
    ID: this.reportRW.ID,
    isDirty: !!cfg.isDirty
  }, { encoding: 'utf8' })
}
