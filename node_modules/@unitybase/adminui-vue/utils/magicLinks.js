/**
 * Magic links module - adds onclick event to a document body and intercept clicks on hyperlink
 *
 * Hyperlink should be in form `<a href='#' data-cmd-type="commandToRun" ....>`
 * In case command specified in `cmdType` data attribute is registered using `addCommand` it will be executed.
 * Links samples:
 * @example

 <a href="#" data-cmd-type="showForm" data-entity="ubm_navshortcut", data-instance-id=332352169869385>
   Edit existed shortcut with specified ID
 </a>

 <a href="#" data-cmd-type="setFocus" data-elm-id="ubedit-11223">
   Set focus on edit
 </a>

 <a href="#"
    data-cmd-type="showReport"
    data-cmd-data='{"reportCode":"your-report-code","reportType":"html","reportParams":{"a":"b"},"reportOptions":{"allowExportToExcel":"xls"}}'
 >
   Show report `your-report-code` with parameters
 </a>

 * @module magicLinks
 * @memberOf module:@unitybase/adminui-vue
 */

module.exports = {
  addCommand,
  install
}

const commands = {}

/**
 * Adds a global onclick event listener. Called by adminui-vue.
 */
function install () {
  if (document) document.addEventListener('click', checkClickOnMagicLink, false)
}

/**
 * Register action for command. Command is passed as <a href="#' data-cmd-type="commandName">.
 * If handler for command already exists it will be overrated
 * @param {string} command
 * @param {function} handler Callback what accept (dataObject: Object;  EventTarget)
 */
function addCommand (command, handler) {
  commands[command] = handler
}

/**
 * @private
 * @param {Event} e
 */
function checkClickOnMagicLink (e) {
  const target = e.target
  if (target.nodeName !== 'A') return
  if (!target.href.endsWith('#')) return
  let intercepted = false
  const params = dataAttributesToObject(target.dataset)

  if (!params.cmdType && params.entity && params.id) { // legacy data-entity + data-id
    console.warn('Deprecated magic link format data-entity + data-id. Use <a href="#" data-cmd-type="showForm" data-entity="ubs_filter" data-instance-id=1233>')
    params.cmdType = 'showForm'
    params.instanceId = params.id
    delete params.id
  }
  if (params.cmdType) {
    if (commands[params.cmdType]) {
      intercepted = true
      commands[params.cmdType](params, target)
    } else {
      console.debug('Handler for magicLink command ', params.cmdType, ' is not registered')
    }
  }
  if (intercepted) {
    e.preventDefault()
  }
}

/**
 * Transform a dataset to the plain object.
 * Nested props can be passed as stringified array or object
 * @example
 *    // <a href='#' id="test" data-cmd-type="showList" data-id=100334 data-field-list='["ID", "code", "name']'>
 *    dataset = document.getElementById('test').dataset
 *    dataAttributesToObject(dataset) // {cmdType: 'showList', id: 100334, fieldList: ['ID', 'code', 'name']}
 *
 * @private
 * @param dataset
 */
function dataAttributesToObject (dataset) {
  const keys = Object.keys(dataset)
  const result = {}
  for (let i = 0, L = keys.length; i < L; i++) {
    const k = keys[i]
    const v = dataset[k]
    if ((v.startsWith('{') && v.endsWith('}')) ||
      (v.startsWith('[') && v.endsWith('}'))) {
      result[k] = JSON.parse(v)
    } else {
      if (/^\d+$/.test(v)) {
        result[k] = parseInt(v, 10)
      } else {
        result[k] = v
      }
    }
  }
  return result
}
