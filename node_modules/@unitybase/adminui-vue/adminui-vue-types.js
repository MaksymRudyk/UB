/**
 * It returns store and close params for toolbar slots,
 * or row, column, value for column slots.
 *
 * @typedef {function} TableScopedSlot
 *
 * @param cfg
 * @param {object} [cfg.store] UTableEntity store. To access store data, selected record or etc.
 * @param {function} [cfg.close] Close action just if it provided from target which opened it.
 *   $App.doCommand(showlist) already provides close action.
 * @param {object} [row] Row data
 * @param {object} [column] Column data
 * @param {*} [value] Cell value
 * @returns {VNode}
 */

/**
 * List of scoped slots. Look available slots in UTableEntity component
 *
 * @typedef {object<string, TableScopedSlot>} TableScopedSlotsConfig
 */

/**
 * Uses for inject scoped slots programmatically
 * @typedef {function} TableScopedSlotsBuilder
 *
 * @param {function} createElement For creating virtual dom nodes in slots
 *   [docs](https://vuejs.org/v2/guide/render-function.html#createElement-Arguments)
 * @returns {TableScopedSlotsConfig}
 */

/**
 * @typedef {object} UTableColumnSettings
 *
 * @property {boolean} [sortable] Allow ordering records by values of the column.
 * @property {boolean} [filterable] If set false, the column cannot be filtered. Otherwise, default and optional custom filters will be applied
 * @property {boolean} [isLookup=false] If is set true will check attribute associatedEntity
 *   and loads description attribute for displayed value
 * @property {'SUM'|'MIN'|'MAX'|'AVG'|null} [summaryAggregationOperator]
 *   Specify aggregation operator to use, when calculate a summary for a column.
 *   If not set, column default will be used.
 *   If set to `null`, then summary will be disabled for column.
 * @property {'left'|'right'|'center'} [align='left'] Align text in column
 * @property {'left'|'right'|'center'} [headerAlign='left'] Align text in column header
 * @property {number} [maxWidth] Maximum width
 * @property {number} [minWidth] Minimum width
 * @property {number} [width] Width
 * @property {boolean} [isHtml=false] If set true will render content as v-html directive
 * @property {UTableColumnFormat} [format] Function what returns a formatted cell value to be inserted as cell innerHTML. Ignored in case slot is defined for column.
 * @property {UTableColumnFormat} [exportFormat] Function what returns a formatted cell value to be used during exports. If omitted - value will be used as is.
 * @property {UTableColumnFormatXls} [exportFormatXlsColumn] Function that returns excel format depends on the column configuration
 * @property {number} [padding=16] column cells padding.
 * @property {object<string, UTableColumnFilter>} [filters={}] Filters templates
 */

/**
 * @typedef {UTableColumnSettings} UTableColumn
 *
 * @property {string} id Unique column property name
 * @property {string} label Column label which shows in header cells
 * @property {UBEntityAttribute} attribute Meta attribute info from UB entity schema
 * @property {string} [valueAttribute] Whether isLookup and has current attribute value in fieldList.
 * @property {boolean} [toValidate] To check this column in the `validateFieldList` method
 */

/**
 * @callback UTableColumnFormat
 * @param {*} value
 * @param {UTableColumn} column
 * @param {object} row
 * @returns {String}
 */

/**
 * It is comfortable to return some value of the `XLSXStyle.predefinedFormats` object since these styles are already registered by XLSX
 *
 * @callback UTableColumnFormatXls
 * @param {UTableColumn} column
 * @returns {string|number}
 */

/**
 * @typedef {object} UTableColumnFilter
 *
 * @property {Vue.Component} template Template which render filter for current column
 * @property {string} [label] Label of current filter. If unset will shows filter id by default
 */

/**
 * @typedef {object|null} UTableSort
 *
 * @property {string} column
 * @property {'asc'|'desc'} order
 */

/**
 * @typedef {object} UTableFilterDefinitionWhereListItem
 *
 * @property {string} expression
 * @property {string} condition
 * @property {string} value
 */

/**
 * @typedef {object} UTableFilterDefinition
 *
 * @property {string} columnId
 * @property {string} label
 * @property {string} description
 * @property {UTableFilterDefinitionWhereListItem[]} whereList
 */
