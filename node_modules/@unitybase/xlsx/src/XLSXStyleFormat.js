/**
 * Created by xmax on 16.11.2017.
 */
const { XLSXBaseStyleController } = require('./XLSXBaseStyleElement')
const tools = require('./tools')
let _instance
/**
 * @class XLSXStyleControllerFormat Registered format styles
 */
class XLSXStyleControllerFormat extends XLSXBaseStyleController {
  static instance () {
    if (!_instance) _instance = new XLSXStyleControllerFormat()
    return _instance
  }

  constructor (config) {
    super(config, 164)
  }

  /**
   * add new border style info. Used for add new style.
   * @param {Object|String} info
   * @param {String} info.formatCode example  #,##0.00_ ;[Red]\-#,##0.00\
   * @return {XLSXBaseStyleElement}
   */
  add (info) {
    tools.checkParamType(info, ['object', 'string'], 'XLSXStyleControllerFormat.add')
    if (typeof info !== 'object') {
      info = { formatCode: info }
    }
    info.formatCode = tools.escapeXML(info.formatCode)
    return super.add(info, 'FORMAT')
  }

  getHash (info) {
    return tools.createHash([
      info.formatCode
    ])
  }

  compile (item) {
    const element = item.config
    if (element.formatCode) {
      return `<numFmt numFmtId="${item.id}" formatCode="${element.formatCode}"/>`
    } else {
      return ''
    }
  }
}

module.exports = {
  XLSXStyleControllerFormat
}
