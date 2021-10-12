/* global ubm_diagram ncrc32 */
// eslint-disable-next-line camelcase
const me = ubm_diagram
me.on('insert:before', generateEmptyDiagram)

/**
 * Generate empty ER diagram content
 * @private
 * @param {ubMethodParams} ctx
 * @returns {boolean}
 */
function generateEmptyDiagram (ctx) {
  console.debug('Generating empty diagram')
  const row = ctx.mParams.execParams
  if (row.document) return true // already generated
  if (!row.name || !row.model) return true // will fails on insert with validation error
  const ID = ncrc32(0, row.name)
  const diagBlob = App.blobStores.putContent({
    entity: me.entity.name,
    attribute: 'document',
    ID: ID,
    fileName: row.name + '.xml',
    isDirty: true
  }, '<mxGraphModel><root></root></mxGraphModel>')
  row.document = JSON.stringify(diagBlob)
}