const lookups = require('../../../utils/lookups')

function lookupFormatter ({ value, column }) {
  if (!column.isLookup) return value

  const entity = column.attribute.associatedEntity
  const associatedAttr = column.attribute.associatedAttr || 'ID'
  if (associatedAttr === 'ID') {
    return value ? lookups.getDescriptionById(entity, value) : value
  } else {
    return lookups.get(entity, {
      [associatedAttr]: value
    })
  }
}

/**
 * @type {UTableColumnSettings}
 */
module.exports = {
  isLookup: true,
  sortable: true,
  format: lookupFormatter,
  exportFormat: lookupFormatter
}
