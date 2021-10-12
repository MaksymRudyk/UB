/**
 * @type {UTableColumnSettings}
 */
module.exports = {
  sortable: true,
  align: 'center',
  isHtml: true,
  format ({ value }) {
    switch (value) {
      case true:
        return '<i class="u-icon-add"/>'
      case false:
        return '<i class="u-icon-minus"/>'
      default:
        return null
    }
  },
  exportFormat({ value }) {
    return value
  }
}
