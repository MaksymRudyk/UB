/* global SystemJS, Ext, Blob */
const UB = require('@unitybase/ub-pub')

module.exports = {
  exportExcel,
  exportCsv,
  exportHtml
}

/**
 * Generates excel and download it
 *
 * @param {CustomRepository} repository
 * @param {array<UTableColumn>} columns
 * @param {string} fileName
 * @param {Array<UTableFilterDefinition>} filters
 * @returns {Promise<void>}
 */
async function exportExcel ({ repository, columns, fileName, filters }) {
  const XLSX = await loadXLSX()
  const workbook = new XLSX.XLSXWorkbook()
  workbook.useSharedString = true
  let dataRowStartNum = 1
  const { font, border } = enrichStyles(workbook.style)
  const getStyle = createStyleGetter({ border, font, styles: workbook.style, XLSX })
  const sheet = workbook.addWorkSheet({ caption: fileName, name: fileName })
  sheet.addMerge({ colFrom: 1, colTo: columns.length })
  sheet.addRow({ value: fileName, column: 1, style: getStyle('header') }, {}, { height: 40 })
  dataRowStartNum++
  if (filters && filters.length) {
    const allFiltersDescr = filters.map(f => f.label + ' ' + f.description).join('; ')
    if (allFiltersDescr) {
      sheet.addMerge({ colFrom: 1, colTo: columns.length })
      sheet.addRow({ value: allFiltersDescr, column: 1, style: getStyle('header') }, {}, { height: 40 })
      dataRowStartNum++
    }
  }
  const rowStyles = []
  enrichSheetHeader({ sheet, columns, rowStyles, getStyle })
  dataRowStartNum++
  let dataRowEndNum = dataRowStartNum

  const response = await repository.selectAsArray()
  response.resultData.fields = repository.fieldList
  const data = UB.LocalDataStore.selectResultToArrayOfObjects(response)

  for (const row of data) {
    const rowCells = columns.map((column) => {
      const value = typeof column.exportFormat === 'function'
        ? column.exportFormat({ value: row[column.id], row, column })
        : typeof column.format === 'function'
          ? column.format({ value: row[column.id], row, column })
          : row[column.id]
      return { value }
    })
    sheet.addRow(rowCells, rowStyles)
    dataRowEndNum++
  }
  dataRowEndNum-- // last data row

  // summary row
  if (dataRowEndNum > dataRowStartNum) {
    let cIdx = 0
    const rowCells = []
    for (const column of columns) {
      cIdx++
      if (column.summaryAggregationOperator) {
        const colChar = String.fromCharCode('A'.charCodeAt(0) + cIdx)
        rowCells.push({ column: cIdx, formula: `${column.summaryAggregationOperator}(${colChar}${dataRowStartNum}:${colChar}${dataRowEndNum})` })
      }
    }
    if (rowCells.length) {
      sheet.addRow(rowCells, rowStyles)
    }
  }
  const file = new Blob(
    [workbook.render()],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
  )
  window.saveAs(file, fileName + '.xlsx')
}

/**
 * Generates csv and download it
 *
 * @param {ClientRepository} repository
 * @param {string} fileName
 * @returns {Promise<void>}
 */
async function exportCsv ({ repository, fileName }) {
  // TODO: replace with client side rendering
  const request = repository.clone().withTotal(false).start(0).limit(0)
  const { data } = await request.connection.xhr({
    method: 'POST',
    url: 'ubql',
    data: [request.ubql()],
    responseType: 'blob',
    headers: { 'Content-Type': 'text/csv; charset=UTF-8' }
  })
  window.saveAs(data, `${fileName}.csv`)
}

/**
* Generates html and download it
*
* @param {CustomRepository} repository
* @param {array<UTableColumn>} columns
* @param {string} fileName
* @param {Array<UTableFilterDefinition>} filters
* @returns {Promise<void>}
*/
async function exportHtml ({ repository, columns, fileName, filters }) {
  // server can generate an HTML output as such
  //   const request = repository.clone().withTotal(false).start(0).limit(0)
  //   const { data } = await request.connection.xhr({
  //     method: 'POST',
  //     url: 'ubql',
  //     data: [request.ubql()],
  //     responseType: 'blob',
  //     headers: { 'Content-Type': 'text/html; charset=UTF-8' }
  //   })
  //   window.saveAs(data, `${fileName}.html`)

  let res = '<html><head><style>table,th,td{border: 1px solid black;border-collapse: collapse;}th,td{padding: 5px;}</style></head><body><table>'
  res += `<thead><tr><th colspan="${columns.length}">${fileName}</th></tr>`
  if (filters && filters.length) {
    const allFiltersDescr = filters.map(f => f.label + ' ' + f.description).join('; ')
    if (allFiltersDescr) {
      res += `<tr><th colspan="${columns.length}">${allFiltersDescr}</th></tr>`
    }
  }
  res += '<tr>'
  for (const column of columns) {
    res += `<th>${UB.i18n(column.label)}</th>`
  }
  res += '</tr></thead><tbody>'

  const response = await repository.selectAsArray()
  response.resultData.fields = repository.fieldList
  const data = UB.LocalDataStore.selectResultToArrayOfObjects(response)

  for (const row of data) {
    const rowCells = columns.map((column) => {
      const value = typeof column.exportFormat === 'function'
        ? column.exportFormat({ value: row[column.id], row, column })
        : typeof column.format === 'function'
          ? column.format({ value: row[column.id], row, column })
          : row[column.id]
      return { value }
    })
    res += '<tr>'
    rowCells.forEach(c => {
      res += `<td>${c.value}</td>`
    })
    res += '</tr>'
  }
  res += '</table></body></html>'

  const file = new Blob(
    [res],
    { type: 'text/html; charset=UTF-8' }
  )
  window.saveAs(file, `${fileName}.html`)
}

/**
 * Imports XLSX library
 *
 * @returns {Promise<XLSX>}
 */
async function loadXLSX () {
  if (window && !window.isserver && !Ext.ux.exporter.xlsxFormatter.XlsxFormatter.libsLoaded) {
    const injectedXLSX = await SystemJS.import('@unitybase/xlsx/dist/xlsx-all.min.js')
    Ext.ux.exporter.xlsxFormatter.XlsxFormatter.libsLoaded = true
    window.XLSX = injectedXLSX
  }

  return window.XLSX
}

/**
 * Setup basic styles to workbook
 *
 * @param {XLSXStyleController} styles
 * @returns {{border: XLSXStyleControllerBorder, font: XLSXStyleControllerFont}}
 */
function enrichStyles (styles) {
  const font = styles.fonts.add({ code: 'def', name: 'Calibri', fontSize: 11, scheme: 'minor' })
  const border = styles.borders.add({ left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' } })

  // add fonts
  styles.fonts.add({ code: 'defBold', name: 'Calibri', fontSize: 11, scheme: 'minor', bold: true })

  // add alignments
  styles.alignments.add({ code: 'Hright', horizontal: 'right' })
  styles.alignments.add({ code: 'Hcenter', horizontal: 'center', wrapText: '1' })
  styles.alignments.add({ code: 'HVcenter', horizontal: 'center', vertical: 'center', wrapText: '1' })
  styles.alignments.add({ code: 'wrapText', wrapText: '1' })

  // add formats
  styles.formats.add({ code: 'floatFormat', formatCode: '#,##0.0000_ ;[Red]\\-#,##0.0000\\ ' })
  styles.formats.add({ code: 'sumFormat', formatCode: '#,##0.00_ ;[Red]\\-#,##0.00\\ ' })
  styles.formats.add({ code: 'intFormat', formatCode: '#,##0_ ;[Red]\\-#,##0\\ ' })

  return { font, border }
}

/**
 * Enrich header row and rowStyles which used for style data cells
 *
 * @param {XLSXWorksheet} sheet Excel sheet
 * @param {array<UTableColumn>} columns Columns
 * @param {function} getStyle Style getter
 * @param {array} rowStyles Excel row styles
 */
function enrichSheetHeader ({ sheet, columns, getStyle, rowStyles }) {
  const properties = []
  const rowData = []
  properties.push({ column: 0, width: 1 })

  let index = 0
  for (const column of columns) {
    index++
    const dataType = column.attribute && column.attribute.dataType
    properties.push({ column: index, width: getWide(column.attribute) })
    const predefinedFormat = typeof column.exportFormatXlsColumn === 'function'
      ? column.exportFormatXlsColumn({ column })
      : undefined
    rowStyles.push({ column: index, style: getStyle(dataType, predefinedFormat) })
    rowData.push({ column: index, value: UB.i18n(column.label), style: getStyle('headerRow') })
  }

  sheet.setColsProperties(properties)
  sheet.addRow(rowData, null, { height: 30 })
}

/**
 * Generates style getter
 *
 * @param {XLSXStyleController} styles Workbook styles
 * @param {XLSXStyleControllerFont} font Font style in excel workbook
 * @param {XLSXStyleControllerBorder} border Border style in excel workbook
 * @param {XLSX} XLSX XLSX library
 * @returns {function(string, string?):XLSXStyle} Style getter
 */
function createStyleGetter ({ styles, font, border, XLSX }) {
  return (dataType, predefinedFormat) => {
    let styleConfig = { font, border }
    switch (dataType) {
      case 'Date':
      case 'DateTime':
        styleConfig = { font, border, format: XLSX.XLSXStyle.indexDefFormateDate, code: 'DefDateStyle' }
        break
      case 'Float':
        styleConfig = { font, border, alignment: styles.alignments.named.Hright, format: styles.formats.named.floatFormat }
        break
      case 'Currency':
        styleConfig = { font, border, alignment: styles.alignments.named.Hright, format: styles.formats.named.sumFormat }
        break
      case 'Int':
        styleConfig = { font, border, alignment: styles.alignments.named.Hright, format: styles.formats.named.intFormat }
        break
      case 'String':
      case 'Text':
        styleConfig = { font, border, alignment: styles.alignments.named.wrapText }
        break
      case 'header':
        styleConfig = { font: styles.fonts.named.defBold, alignment: styles.alignments.named.HVcenter }
        break
      case 'headerRow':
        styleConfig = { border, font: styles.fonts.named.defBold, fill: 'EBEDED', alignment: styles.alignments.named.HVcenter}
        break
    }

    if (predefinedFormat) {
      styleConfig.format = predefinedFormat
    }

    return styles.getStyle(styleConfig)
  }
}

/**
 * @param {UBEntityAttribute} attribute
 * @returns {number} Cell width in excel
 */
function getWide (attribute) {
  if (!attribute) return 18

  switch (attribute.dataType) {
    case 'Date': return 12
    case 'DateTime': return 12
    case 'Float': return 13
    case 'Currency': return 13
    case 'Int': return 10
    case 'Boolean': return 10
    case 'String': return ((attribute.size < 11) ? 10 : (attribute.size < 17) ? 16 : (attribute.size < 26) ? 25 : 30)
    case 'Text': return 50
    default: return 18
  }
}
