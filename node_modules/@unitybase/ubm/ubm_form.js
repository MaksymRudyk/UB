const me = ubm_form
const fs = require('fs')
me.on('insert:before', generateDefaultFormDefAndJS)

const DEF_FILE_TAIL = '-fm.def'
const JS_FILE_TAIL = '-fm.js'
const VUE_FILE_TAIL = '-fm.vue'

/**
 * Generate template code for form JS and def using template from `_templates` UMB model folder
 * @private
 * @param {ubMethodParams} ctx
 * @returns {boolean}
 */
function generateDefaultFormDefAndJS (ctx) {
  const row = ctx.mParams.execParams
  if (!row.code || !row.formType || !row.model) return true // will fails on insert with validation error
  const ID = ncrc32(0, row.code)
  // form definition template
  if (!row.formDef) {
    let formDefBody
    if (row.formType === 'auto') { // ExtJS auto form
      formDefBody = getFormBodyTpl('new_autoFormDef.mustache', 'exports.formDef = {\n\titems:[\n\t\t/*put your items here*/\n\t]\n};')
    } else if (row.formType === 'custom') { // ExtJS class based form
      const codeParts = row.code.split('-')
      const className = row.modelName + '.' + (codeParts[1] ? codeParts[1] : 'BetterToSetFormCodeToEntity-ClassName')
      formDefBody = getFormBodyTpl('new_customForm.mustache', '').replace('{{className}}', className)
    }
    if (formDefBody) {
      const defBlob = App.blobStores.putContent({
        entity: me.entity.name,
        attribute: 'formDef',
        ID: ID,
        fileName: row.code + DEF_FILE_TAIL,
        isDirty: true
      }, formDefBody)
      row.formDef = JSON.stringify(defBlob)
    }
  }
  // form JS template
  if (!row.formCode) {
    let formScriptBody
    if (row.formType === 'auto') {
      formScriptBody = getFormBodyTpl('new_autoFormJS.mustache', 'exports.formCode = {\n}')
    } else if (row.formType === 'vue') {
      formScriptBody = getFormBodyTpl('new_vueFormJS.mustache', 'exports.formCode = {\n\tinitUBComponent: function () {\n\n\t}\n}')
      formScriptBody = formScriptBody.replace('{{className}}', row.code)
    } else if (row.formType === 'module') {
      formScriptBody = getFormBodyTpl('new_moduleFormJS.mustache', '')
    }
    if (formScriptBody) {
      const codeBlob = App.blobStores.putContent({
        entity: me.entity.name,
        attribute: 'formCode',
        ID: ID,
        fileName: row.code + (row.formType === 'vue' ? VUE_FILE_TAIL : JS_FILE_TAIL),
        isDirty: true
      }, formScriptBody)
      row.formCode = JSON.stringify(codeBlob)
    }
  }
  return true
}

/**
 * Return form body template from UBM/_templates/fileName if any or defaultBody
 * @private
 * @param {String} tplName
 * @param {String} [defaultBody]
 */
function getFormBodyTpl (tplName, defaultBody) {
  const filePath = path.join(App.domainInfo.models.UBM.realPath, '_templates', tplName)
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : defaultBody
}

