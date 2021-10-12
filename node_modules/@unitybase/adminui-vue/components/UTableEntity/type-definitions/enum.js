const lookups = require('../../../utils/lookups')

function enumFormatter ({ value, column }) {
  if (column.isLookup && value !== null) {
    const eGroup = column.attribute.enumGroup
    return lookups.get('ubm_enum', { eGroup, code: value })
  } else {
    return value
  }
}
/**
 * @type {UTableColumnSettings}
 */
module.exports = {
  isLookup: true,
  sortable: true,
  format: enumFormatter,
  exportFormat: enumFormatter
}
