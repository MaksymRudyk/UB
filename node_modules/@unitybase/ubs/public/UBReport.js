/* global System, SystemJS */
/**
 * @class UBReport
 * Client side report builder
 *
 */
const Mustache = require('mustache')
if (!SystemJS.has('mustache')) SystemJS.set('mustache', SystemJS.newModule(Mustache))
const formatFunctions = require('./formatFunctions')
const UB = require('@unitybase/ub-pub')
const $App = require('@unitybase/adminui-pub')
const _ = require('lodash')
/**
 * @constructor
 * @param {String|Object} reportCode
 * If reportCode type is Object it is a config object { code: String, type: String, params: String|Object }
 * @param {String} [reportType='html'] Possible values: 'html'|'pdf'|'xlsx'
 * @param {{}} params
 * @param {String} [language=en]
 */
function UBReport (reportCode, reportType, params, language) {
  /**
   * Report code
   * @property {String} reportCode
   */
  this.reportCode = reportCode
  /**
  * Possible values: 'html', 'pdf'
  * @property {String} reportCode
  */
  this.reportType = reportType || 'html'
  /**
  * Report parameters
  * @property {{}} incomeParams
  */
  this.incomeParams = params || {}

  /**
  * The options of report. Known options: pageOrientation.
  *  @property {{}} reportOptions
  */
  this.reportOptions = {}
  this.lang = language

  /**
   * In case is true, `reportViewer` will always display the report parameters form,
   * otherwise, the report parameters form will be displayed only if the report option `reportParams` is empty.
   * @property {boolean} [showParamForm=false]
   */
  this.showParamForm = false

  if (typeof reportCode === 'object') {
    this.reportCode = reportCode.code
    this.reportType = reportCode.type || 'html'
    this.incomeParams = reportCode.params
    this.allowExportToExcel = reportCode.allowExportToExcel
    this.showParamForm = reportCode.showParamForm || false
    this.lang = reportCode.language
    this.debug = reportCode.debug
  }
}

/**
* @returns {Promise|String} If code run in server function return report data as String else return Promise.
* Promise.resolve function get parameter report data as String.
*/
UBReport.makeReport = function (reportCode, reportType, params) {
  const report = new UBReport(reportCode, reportType, params)
  return report.makeReport()
}

/**
* Load report template and code.
* @returns {Promise|Boolean}
*/
UBReport.prototype.init = function () {
  const me = this
  if (me.isInited) {
    return Promise.resolve(true)
  }
  const repository = $App.connection.Repository('ubs_report')
    .attrs(['ID', 'report_code', 'name', 'template', 'code', 'model'])
    .where('[report_code]', '=', me.reportCode)

  return repository.selectSingle().then(function (reportRow) {
    me.reportRW = reportRow

    const model = $App.domainInfo.models[reportRow.model]
    const reportCodePath = `${model.clientRequirePath}/reports/${me.reportCode}.js`
    const reportTplPath = `clientRequire/${model.clientRequirePath}/reports/${me.reportCode}.template`

    return Promise.all([$App.connection.get(reportTplPath), SystemJS.import(reportCodePath)])
      .then(function ([tpl, codeModule]) {
        me.reportRW.templateData = tpl.data
        me.prepareTemplate()
        me.prepareCode(codeModule)
        me.isInited = true
        return true
      })
  })
}

UBReport.prototype.prepareTemplate = function () {
  const reOptions = /(<!--%\w+?:(.+?)-->)/gi
  // <!--{{userrole}}-->
  this.reportRW.templateData = this.reportRW.templateData.replace(/<!--({{.+?}})-->/g, '$1')
  // <!--@name "123"-->
  this.reportRW.templateData = this.reportRW.templateData.replace(/<!--@\w+?[ ]*?".+?"-->/g, '')

  // parse options
  const matches = this.reportRW.templateData.match(reOptions)
  if (matches && matches.length) {
    matches.forEach((item) => {
      let itemVal = item.match(/<!--%(\w+?:.+?)-->/)[1]
      itemVal = itemVal.split(':')
      this.reportOptions[itemVal[0]] = itemVal[1]
    })
  }
}

/**
 * @param {{key: value}} [params]
 * @returns {Promise}
 * Promise what resolves to object {reportCode: {String}, reportType: {String}, incomeParams: {Object}, reportOptions: {Object}, reportData: {String|ArrayBuffer}}
 */
UBReport.prototype.makeReport = function (params) {
  const me = this

  let prm = _.clone(me.incomeParams)
  if (params) {
    prm = _.assign(prm, params)
  }

  return me.init().then(function () {
    return me.buildReport(prm)
  }).then(function (data) {
    return me.makeResult(data)
  })
}

/**
 * Create new XLSX file by template
 * @param {Object} reportData
 * @param {Object} config
 * @param {Boolean} [config.disableOptimization=false]
 * @param {Boolean} [config.minLenOptimization=10] Minimal length of data Array to start optimization {@link XLSXWorkbook.addWorkSheet}
 * @param {Boolean} [config.useSharedString=false] For detail information open {@link XLSXWorkbook#constructor}
 * @param {Boolean} [config.sheetConfig=[{name: 'Sheet'}]] For detail information open {@link XLSXfromHTML#constructor} and {@link XLSXWorkbook.addWorkSheet}
 * @return {Promise.<ArrayBuffer>}
 */
UBReport.prototype.buildXLSX = function (reportData, config) {
  if (!reportData || typeof (reportData) !== 'object' || reportData instanceof Array) {
    throw new Error('reportData must be of type Object')
  }

  formatFunctions.addBaseMustacheSysFunction(reportData)
  formatFunctions.addMustacheSysFunction(reportData, this.lang)
  const xlsxPromise = System.import('@unitybase/xlsx')
  return xlsxPromise.then((xlsx) => {
    config = config || {}
    let html
    if (config.disableOptimization) {
      xlsx.XLSXfromHTML.addMustacheSysFunction(reportData)
      html = Mustache.render(this.reportRW.templateData, reportData)
    } else {
      html = xlsx.XLSXfromHTML.mustacheRenderOptimization(this.reportRW.templateData, reportData, config.minLenOptimization)
    }
    const wb = new xlsx.XLSXWorkbook({ useSharedString: !!config.useSharedString })
    const converter = new xlsx.XLSXfromHTML(global.DOMParser, wb, config.sheetConfig || [{ name: 'Sheet' }])
    converter.writeHtml({ html: html, sourceData: reportData })
    return wb.render()
  })
}

/**
* build HTML report
* @param {Object} reportData
* @returns {String}
*/
UBReport.prototype.buildHTML = function (reportData) {
  if (!reportData || typeof (reportData) !== 'object' || reportData instanceof Array) {
    throw new Error('reportData must be of type Object')
  }

  formatFunctions.addBaseMustacheSysFunction(reportData)
  const lang = $App.connection.userLang()
  formatFunctions.addMustacheSysFunction(reportData, lang)
  return Mustache.render(this.reportRW.templateData, reportData)
}

/**
* Prepare PDF report from html
* @param {String} html
* @param {Object} options
* @param {Array|Object} [options.fonts]
* [{ fontName: "TimesNewRoman", fontStyle: "Normal" }, ..]
* @param {Boolean} [options.outputPdf] If it is not False build PDF output at end. By default it is True.
* @returns {Promise} A promise that resolves with an ArrayBuffer with PDF or instance of PDF.csPrintToPdf with rendered HTML on it when options.outputPdf is false.
*/
UBReport.prototype.transformToPdf = function (html, options) {
  options = options || {}

  // pdfPromise = new Promise((resolve, reject) => {
  //   if (window.PDF) {
  //     resolve(PDF)
  //     return
  //   }
  //   window.BOUNDLED_BY_WEBPACK = false
  //   if (!BOUNDLED_BY_WEBPACK) {
  //     //PDF = require('@unitybase/pdf/dist/pdf.min.js')
  //     PDF = require('@unitybase/pdf')
  //     resolve(PDF)
  //   }
  //   if (BOUNDLED_BY_WEBPACK) {
  //     require.ensure(['@unitybase/pdf/dist/pdf.min.js'], function () {
  //       let re = require
  //       PDF = re('@unitybase/pdf/dist/pdf.min.js')
  //       resolve(PDF)
  //     })
  //   }
  // })
  // let pdfPromise = window.isDeveloperMode ? System.import('@unitybase/pdf') : System.import('@unitybase/pdf/dist/pdf.min.js')
  // window.BOUNDLED_BY_WEBPACK = false
  const pdfPromise = System.import('@unitybase/pdf')

  return pdfPromise.then((PDF) => {
    return PDF.PrintToPdf.requireFonts({
      fonts: options.fonts
        ? options.fonts
        : [{ fontName: 'TimesNewRoman', fontStyle: 'Normal' },
            { fontName: 'TimesNewRoman', fontStyle: 'Bold' },
            { fontName: 'TimesNewRoman', fontStyle: 'Italic' },
            { fontName: 'TimesNewRoman', fontStyle: 'BoldItalic' }]
    }).then(() => PDF)
  }).then((PDF) => {
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
  })
}

/**
*  @private
* @param {ArrayBuffer|String} reportData
* @returns {Object}
*/
UBReport.prototype.makeResult = function (reportData) {
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
 * @param {Module} codeModule
 * @private
 */
UBReport.prototype.prepareCode = function (codeModule) {
  const me = this
  if (codeModule.reportCode) {
    _.forEach(codeModule.reportCode, function (item, name) {
      me[name] = item
    })
  } else {
    throw new Error('Report code is invalid or empty. You should use code like: exports.reportCode={ prepareData:function }; ')
  }
}

/**
* This function should be defined in the report code block.
*
* Implementation should:
*
*  - Prepare data
*  - Run method this.buildHTML(reportData); where reportData is data for mustache template
*  - If need create PDF run method this.buildPdf(htmlReport); where htmlReport is HTML
*  - If is server side function should return report as string otherwise Promise
*
* @cfg {function} buildReport
* @param {Object} reportParams
* @returns {Promise|Object|String} If code run at server, method should return report data, else - Promise, which resolves to report data
*/
UBReport.prototype.buildReport = function (reportParams) {
  throw new UB.UBError('Function "buildReport" not defined in the report code block')
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
* Config for pdf can be edited in this function
*
* @cfg {function} onTransformConfig
* @param {Object} config
* @returns {Object}
*/

/**
* load document
* @param {String} attribute
* @returns {Promise<string|Buffer>}
*/
UBReport.prototype.getDocument = function (attribute) {
  const cfg = JSON.parse(this.reportRW[attribute])

  const params = {
    entity: 'ubs_report',
    attribute: attribute,
    id: this.reportRW.ID,
    isDirty: cfg.isDirty === true
  }
  return $App.connection.getDocument(params, { resultIsBinary: false })
}

/**
 * Return a table, cell col and row index for event occurred inside table cell
 * @param {Event} e
 * @return {{table: HTMLTableElement, row: HTMLTableRowElement, cell: HTMLTableCellElement, colIndex: number, rowIndex: number}}
 */
UBReport.cellInfo = function (e) {
  let td = e.target
  while (td && td.tagName !== 'TD') {
    td = td.parentNode
  }
  const colIndex = td.cellIndex
  let tr = td
  while (tr && tr.tagName !== 'TR') {
    tr = tr.parentNode
  }
  const rowIndex = tr.rowIndex
  let tbl = tr
  while (tbl && tbl.tagName !== 'TABLE') {
    tbl = tbl.parentNode
  }
  return {
    table: tbl,
    row: tr,
    cell: td,
    colIndex: colIndex,
    rowIndex: rowIndex
  }
}
window.UBS = window.UBS || {}
window.UBS.UBReport = UBReport
module.exports = UBReport
