require('./Workbook')
/**
 * Specialised Format class for outputting .xls files
 * @class Ext.ux.Exporter.ExcelFormatter
 * @extends Ext.ux.Exporter.Formatter
 */
Ext.define('Ext.ux.exporter.excelFormatter.ExcelFormatter', {
  extend: 'Ext.ux.exporter.Formatter',
  uses: [
    'Ext.ux.exporter.excelFormatter.Cell',
    'Ext.ux.exporter.excelFormatter.Style',
    'Ext.ux.exporter.excelFormatter.Worksheet',
    'Ext.ux.exporter.excelFormatter.Workbook'
  ],
  contentType: 'data:application/vnd.ms-excel;base64,',
  extension: 'xls',

  format: function (store, config) {
    const workbook = Ext.create('Ext.ux.exporter.excelFormatter.Workbook', config)
    workbook.addWorksheet(store, config || {})

    return workbook.render()
  }
})
