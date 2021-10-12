const lookups = require('../../../utils/lookups')

function manyFormatter ({ value, column }) {
  if (column.isLookup && value) {
    return value.toString()
      .split(',')
      .map(id => {
        const entity = column.attribute.associatedEntity
        const associatedAttr = column.attribute.associatedAttr || 'ID'
        if (associatedAttr === 'ID') {
          return lookups.getDescriptionById(entity, id)
        } else {
          return lookups.get(entity, {
            [associatedAttr]: id
          })
        }
      })
      .join(', ')
  } else {
    return value
  }
}
/**
 * @type {UTableColumnSettings}
 */
module.exports = {
  isLookup: true,
  format: manyFormatter,
  exportFormat: manyFormatter
}
