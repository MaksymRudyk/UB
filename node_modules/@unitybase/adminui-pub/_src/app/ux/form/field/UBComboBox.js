/* global Ext */
require('./UBBaseComboBox')
require('./ComboExtraButtons')
const UB = require('@unitybase/ub-pub')
const _ = require('lodash')
// noinspection JSUnusedGlobalSymbols
/**
 * Combobox, based on ubRequest. If ubRequest passed - store created automatically.
 * If valueField is missing in cfg - use first attribute from ubRequest.fieldList for value
 * If displayField is missing in cfg - use second attribute from ubRequest.fieldList for displayField
 *
 * Config example:
 *
 *      @example
 *      {
 *       xtype:'ubcombobox',
 *       flex: 1,
 *       fieldLabel: UB.i18n('makerExecutor'),
 *       allowBlank: false,
 *       ubRequest: {
 *           entity: 'org_employeeonstaff',
 *           method: 'select',
 *           fieldList: ['ID','caption']
 *       }
 *      }
 *
 */
Ext.define('UB.ux.form.field.UBComboBox', {
  extend: 'UB.ux.form.field.UBBaseComboBox',
  alias: 'widget.ubcombobox',
  uses: ['Ext.grid.plugin.BufferedRenderer'],
  queryCaching: true,
  editable: true,
  // forceSelection: true,
  minChars: 0,
  grow: false,
  queryMode: 'remote',
  userFilterId: '_userInput',
  matchFieldWidth: true,
  matchCls: 'combo-search-match',
  /**
   * Highlight input value in dropDownList
   * @cfg {Boolean} highlightSearch
   */
  highlightSearch: true,
  disablePaging: false,
  /**
   * Minimum characters to start query
   * @cfg {Number} minCharsForQuery
   */
  minCharsForQuery: 0,
  /**
   * If false - value will always be equal to the value of the store
   * @cfg {Boolean} allowCustomText
   */
  allowCustomText: false,
  /**
   * If ID not found in combobox store - try to load a record by ID with `__allowSelectSafeDeleted: true`
   *   and if found - show it with strikethrough.
   *
   * This allows to see a filtered out row (probably deleted or historically not actual)
   *
   * @cfg {Boolean} allowSafeDeleted
   */
  allowFilteredOut: true,
  /**
   * true - has delay when set value
   */
  dataLoadDelay: true,
  /**
   * If true the user query will sent to the server as parameter. Param name may be set in  queryParamName.
   * If false the user query will sent as filter (whereList). Default false.
   *
   * @cfg {Boolean} sendQueryAsParam
   */
  sendQueryAsParam: false,
  /**
   * In case `sendQueryAsParam`=true name of parameter to sent typed text.
   *
   * @cfg {String} queryParamName
   */
  queryParamName: 'query',
  /**
   * Auto complete combobox text from first value of dropdown. Default - false.
   *
   * @cfg {Boolean} autoCompleteText
   */
  autoCompleteText: false,
  /**
   * Combobox items query. If passed - store is created automatically. Else caller must pass store parameter
   * @cfg {Object} [ubRequest]
   */
  initComponent: function () {
    let me = this

    /**
     * Fires before the request sent to the server.
     * @event beforeQuerySend
     * @param {Object} queryPlan An object containing details about the query to be executed.
     * @param {Ext.form.field.ComboBox} queryPlan.combo A reference to this ComboBox.
     * @param {String} queryPlan.query The query value to be used to match against the ComboBox's {@link #valueField}.
     * @param {Boolean} queryPlan.forceAll If `true`, causes the query to be executed even if the minChars threshold is not met.
     * @param {Boolean} queryPlan.cancel A boolean value which, if set to `true` upon return, causes the query not to be executed.
     * @param {Boolean} queryPlan.rawQuery If `true` indicates that the raw input field value is being used, and upon store load
     */
    me.addEvents('beforeQuerySend')

    if (!me.disablePaging) {
      if (!me.pageSize) {
        me.pageSize = UB.appConfig.comboPageSize
      }
    } else {
      delete me.pageSize
    }
    let store = me.getStore()
    if (!store && me.ubRequest) {
      store = me.store = Ext.create('UB.ux.data.UBStore', {
        ubRequest: me.ubRequest,
        autoLoad: false,
        autoDestroy: true
      })
    }
    if (me.displayField === 'text') { // this is default display field Ext apply
      me.displayField = store.ubRequest.fieldList[1]
    }
    if (!me.valueField) {
      me.valueField = store.ubRequest.fieldList[0]
    }
    store.pageSize = me.pageSize

    if (!me.tpl) {
      me.tpl = new Ext.XTemplate(
        '<ul class="' + Ext.plainListCls + '"><tpl for=".">',
        '<li role="option" unselectable="on" class="',
        'boundlist-{[xindex % 2 === 0 ? "even" : "odd"]}  ' + Ext.baseCSSPrefix + 'boundlist-item " ',
        ">{[values['" + this.displayField + "']]}</li>",
        '</tpl></ul>'
      )
    }

    let fnReplace = function (m) {
      return '<span class="' + me.matchCls + '">' + m + '</span>'
    }
    me.listConfig = Ext.apply({
      pageSize: me.pageSize,
      minWidth: me.listMinWidth,
      listeners: {
        refresh: {
          fn: function (view) {
            if (!me.highlightSearch || !me.searchRegExp) {
              return
            }
            let el = view.getEl()
            if (!el) return
            let list = el.down('.x-list-plain')
            if (!list) return

            let itmEl = list.down('.x-boundlist-item')
            while (itmEl) {
              if (itmEl.dom.innerHTML) {
                itmEl.dom.innerHTML = itmEl.dom.innerHTML.replace(me.searchRegExp, fnReplace)
              }
              itmEl = itmEl.next()
            }
          }
        }
      },

      getInnerTpl: function (displayField) {
        return "{[values['" + displayField + "']]}"
      },

      createPagingToolbar: function () {
        let pagingToolbar = Ext.create('Ext.toolbar.Toolbar', {
          id: this.id + '-paging-toolbar',
          pageSize: me.pageSize,
          border: false,
          minHeight: 0,
          ownerCt: this,
          cls: 'ub_combo-bound-toolbar',
          ownerLayout: this.getComponentLayout(),
          bindStore: Ext.emptyFn,
          items: [{
            xtype: 'tbspacer',
            flex: 1
          }, {
            xtype: 'tbseparator'
          }, {
            xtype: 'button',
            text: UB.i18n('more'),
            handler: me.readMoreData,
            scope: me
          }]
        })

        me.pagingToolbar = pagingToolbar
        return pagingToolbar
      }
    }, me.listConfig || {})

    if (me.editable) {
      me.on({
        beforequery: me.beforequery,
        scope: me
      })
    }

    me.on({beforedestroy: me.onBeforedestroy, scope: me})
    me.callParent(arguments)

    if (me.getStore()) {
      me.getStore().on('load', me.onDataLoaded, me)
    }
  },

  onBeforedestroy: function () {
    let me = this
    let store = me.getStore()
    if (store) {
      store.un('load', me.onDataLoaded, me)
    }
  },

  onDataRefreshed: function () {
    let lastRow = this.lastRowIndex
    if (!lastRow) return

    let store = this.getStore()
    let storeLen = store.getCount()
    let picker = this.getPicker()

    this.lastRowIndex = null
    if (storeLen > lastRow + 8) {
      lastRow = lastRow + 8
    }
    lastRow = store.getAt(lastRow)
    if (lastRow) {
      picker.focusNode(lastRow)
    }
  },

  readMoreData: function () {
    let store = this.getStore()
    let storeLen = store.getCount()
    this.lastRowIndex = null
    if (storeLen > 0) {
      this.lastRowIndex = storeLen - 1 // store.getAt(storeLen - 1);
    }
    this.inputEl.focus()
    store.loadPage((store.currentPage || 0) + 1, {
      params: this.getParams(this.lastQuery),
      addRecords: true
    })
  },

  createPicker: function () {
    let picker = this.callParent(arguments)
    picker.mon({blur: this.onPickerBlur, scope: this})
    // picker.on({refresh: this.onDataRefreshed, scope: this});
    return picker
  },

  onPickerBlur: function (event) {
    let el = this.inputEl
    if (!event.relatedTarget) {
      this.inputEl.focus()
    } else if (event.relatedTarget !== el.dom) {
      // focus on picker
      let picker = this.getPicker()
      if (picker && picker.el) {
        let i = 0
        let elP = event.relatedTarget
        while (i < 11 && elP) {
          if (picker.el.dom === elP) {
            return
          }
          elP = elP.parentElement
          i++
        }
      }
      this.onExitCombo()
    }
  },

  onBlur: function (event) {
    if (this.allowCustomText) return
    // focus on picker
    let me = this
    let picker = me.getPicker()
    if (picker && picker.el && event.relatedTarget) {
      let i = 0
      let el = event.relatedTarget
      while (i < 11 && el) {
        if (picker.el.dom === el) {
          el = Ext.dom.Element.get(event.relatedTarget)
          el.un({blur: this.onPickerBlur, scope: me})
          el.on({blur: this.onPickerBlur, scope: me})
          return
        }
        el = el.parentElement
        i++
      }
    }
    me.onExitCombo()
  },

  onExitCombo: function () {
    let me = this
    if ((!me.valueModels || me.valueModels.length === 0)) {
      me.setRawValue(null) // event.stopEvent();
      return
    }

    let inputText = me.getRawValue()
    let valItem = null
    let isEqualVal = false
    for (let i = 0; i < me.valueModels.length; i++) {
      valItem = me.valueModels[i]
      valItem = valItem.get(me.displayField)
      if (valItem === inputText) {
        isEqualVal = true
        break
      }
    }
    if (!isEqualVal) {
      me.setRawValue(valItem)
    }
  },

  onDataLoaded: function () {
    let me = this
    let dataLen = me.store.getCount()
    if (me.pagingToolbar) {
      if (me.pageSize > dataLen || (me.lastRowIndex && ((me.lastRowIndex + 1 + me.pageSize) > dataLen))) {
        me.pagingToolbar.setHeight(0)
      } else {
        me.pagingToolbar.setHeight(36)
      }
    }
    me.onDataRefreshed()
  },

  onKeyDown: function (e) { // override
    if (e.ctrlKey && (e.getKey() === Ext.EventObject.Q)) {
      this.stopKeyHandlers = true
    } else if (!e.ctrlKey) {
      this.callParent(arguments)
    }
  },

  onKeyUp: function (e) { // override
    if (e.ctrlKey && (e.getKey() === Ext.EventObject.Q)) {
      this.stopKeyHandlers = false
    } else if (!e.ctrlKey) {
      this.callParent(arguments)
    }
  },

  onKeyPress: function (e) { // override
    if (this.stopKeyHandlers) {
      this.up('form').switchTabs(this, e.shiftKey)
    } else if (!e.ctrlKey) {
      this.callParent(arguments)
    }
  },

  /**
   * Show message when too little chars in query.
   */
  showToolTipMinQuery: function () {
    let picker = this.getPicker()
    this.expand()
    this.pagingToolbar.setHeight(0)
    // noinspection JSAccessibilityCheck
    let targetEl = picker.getTargetEl()
    picker.clearViewEl()
    Ext.core.DomHelper.insertHtml('beforeEnd', targetEl.dom,
      UB.format(UB.i18n('startSearchMinCharacters'), this.minCharsForQuery)
    )
  },

  afterQuery: function (queryPlan) {
    let me = this
    if (me.autoCompleteText) {
      if (me.store.getCount()) {
        let record = me.store.getAt(0)
        let txtUser = me.inputEl.dom.value
        me.userInputText = txtUser
        let txtAll = record.get(me.displayField)
        me.inputEl.dom.value = txtAll
        me.inputEl.dom.setSelectionRange(txtUser.length, txtAll.length)
      }
    }
    me.callParent(arguments)
  },

  beforequery: function (queryEvent) {
    let me = this

    if (me.minCharsForQuery && me.minCharsForQuery > 0 && me.minCharsForQuery > (queryEvent.query || '').length) {
      queryEvent.cancel = true
      me.showToolTipMinQuery()
      return
    }
    let escapedQuery = UB.Utils.escapeForRegexp(queryEvent.query)
    me.searchRegExp = null
    if (escapedQuery) {
      me.searchRegExp = new RegExp(escapedQuery, 'gi')
    }

    me.fireEvent('beforeQuerySend', queryEvent)

    if (queryEvent.combo.queryMode !== 'local') {
      let queryString = queryEvent.query || ''

      let store = me.getStore()
      if (me.sendQueryAsParam) {
        if (!store.ubRequest) {
          store.ubRequest = {}
        }
        store.ubRequest[me.queryParamName] = queryString
        return
      }
      if (queryString) {
        let displayField = me.displayField
        store.filters.add(new Ext.util.Filter({
          id: me.userFilterId,
          root: 'data',
          property: displayField,
          caseSensitive: false,
          anyMatch: true,
          value: queryString
        }))
      } else {
        store.filters.removeAtKey(me.userFilterId)
        if (me.useForGridEdit && store.totalCount <= 1) {
          store.reload()
        }
        queryEvent.forceAll = true
      }
    }
  },

  setValue: function (value) {
    let me = this

    let fValue = Ext.Array.from(value, false)
    // check has changes value
    if (!me.allowCustomText && me.valueModels && me.valueModels.length > 0 && fValue.length === me.valueModels.length) {
      let isEqualVal = true
      for (let i = 0; i < me.valueModels.length; i++) {
        let valItem = me.valueModels[i]
        valItem = valItem.get(me.valueField)
        let valIn = fValue[i]
        if (Ext.isObject(valIn) && valIn.isModel) {
          valIn = valIn.get(me.valueField)
        }
        if (valItem !== valIn) {
          isEqualVal = false
          break
        }
      }
      if (isEqualVal) {
        return
      }
    }
    me.clearIsPhantom()
    me.callParent(arguments)
    let store = me.getStore()
    if (me.useForGridEdit && value && !_.isArray(value) && !_.isObject(value) &&
      (!store.filters.get(me.userFilterId) || store.filters.get(me.userFilterId).value !== value)) {
      store.suspendEvent('clear')
      store.filter(new Ext.util.Filter({
        id: me.userFilterId,
        root: 'data',
        property: this.valueField || 'ID',
        condition: value && _.isArray(value) ? 'in' : 'equal',
        value: value
      }))
    }
  },

  getValue: function (field) {
    let value = this.callParent(arguments)
    return value === this.value ? value : null
  },

  getVal: function (field) {
    let val = this.getValue()

    if (!val || !field) {
      return null
    }
    let store = this.getStore()
    let item
    if (store) {
      item = store.getById(val)
    }
    return item ? item.get(field) : null
  },

  clearValue: function () {
    let store = this.store
    this.callParent(arguments)
    this.rawValue = null
    if (store) {
      store.filters.removeAtKey(this.userFilterId)
    }
  },

  /**
   * return entity code
   * @pribate
   * @returns {String}
   */
  getEntity: function () {
    let request = this.ubRequest || (this.store ? this.store.ubRequest : null)
    return request ? request.entity : ''
  },

  getSubTplData: function () {
    return this.callParent(arguments)
  },

  setRawValue: function (value) {
    this.callParent(arguments)
    this.clearIsPhantom()
  },

  /**
   * @protected
   */
  clearIsPhantom: function () {
    let me = this
    if (me.rendered && me.phantomSelectedElement) {
      let input = Ext.get(me.getInputId())
      input.removeCls('ub-combo-deleted')
    }
    me.phantomSelectedElement = false
    if (me.tipPhantomElement) {
      me.tipPhantomElement.setDisabled(true)
      me.tipPhantomElement = null
    }
  },

  /**
   * Set combo value by recordId
   * @param {Number} id  id of chosen value
   * @param {Boolean} [isDefault]  (optional) true - to set initial value of combo. Used in {@link UB.view.BasePanel} Default: false
   * @param {Function} [onLoadValue] (optional) raised when data loaded
   * @param {Object} [scope] (optional) scope to onLoadValue
   *
   */
  setValueById: function (id, isDefault, onLoadValue, scope) {
    let me = this
    if (Ext.isEmpty(id)) {
      me.setValue(id)
      // me.clearValue();
      if (isDefault) {
        me.resetOriginalValue()
      }
      if (onLoadValue) {
        Ext.callback(onLoadValue, scope || me, [me])
      }
      return
    }
    let store = me.getStore()
    function doSetValue (record, setNull) {
      if (setNull || record || me.store.getById(id)) {
        me.setValue(setNull ? null : record || id)
      }
      if (isDefault) {
        me.resetOriginalValue()
      }
      store.resumeEvent('clear')
      me.lastQuery = null // reset query caching
      if (onLoadValue) {
        Ext.callback(onLoadValue, scope || me, [me])
      }
    }
    store.on({
      load: {
        fn: function () {
          if (store.getCount() === 0) {
            if (!me.allowFilteredOut) return // do not show filtered out row
            // Trying to load a filtered out row (probably deleted or historically not actual)
            UB.xhr.allowRequestReiteration() // prevent a monkeyRequestsDetected in case 2 combobox are on the same form with the same filters
            UB.connection.select({
              entity: me.getEntity(),
              method: store.ubRequest.method || 'select',
              fieldList: store.ubRequest.fieldList, // [me.valueField, me.displayField ],
              __allowSelectSafeDeleted: true,
              ID: id
            }).then(function (result) {
              if (store.isDestroyed) {
                return
              }
              let record = Ext.create(store.model)
              if (!UB.ux.data.UBStore.resultDataRow2Record(result, record)) {
                doSetValue(null, true)
                return
              }
              UB.ux.data.UBStore.resetRecord(record)
              store.add(record, true) // we MUST save cache here! Otherwise clearCache makes its deal and formDataReady fires BEFORE store was actually loaded
              doSetValue(record)
              me.fieldCls += ' ub-combo-deleted'
              if (me.rendered) {
                let input = Ext.get(me.getInputId())
                input.addCls('ub-combo-deleted')
              }
              me.phantomSelectedElement = true
              me.tipPhantomElement = Ext.create('Ext.tip.ToolTip', {
                target: me.getInputId(),
                html: UB.i18n('elementIsNotActual')
              })
            })
          } else if (store.getCount() === 1) {
            doSetValue(store.getAt(0))
            me.clearIsPhantom()
          } else {
            doSetValue()
            me.clearIsPhantom() // ?? not sure if we need this here
          }
        },
        single: true
      }
    })
    store.suspendEvent('clear')
    store.filter(new Ext.util.Filter({
      id: me.userFilterId,
      root: 'data',
      property: this.valueField || 'ID',
      condition: id && Array.isArray(id) ? 'in' : 'equal',
      value: id
    }))
  },

  /**
   * Get field value by name from fieldList
   * @param fieldName
   * @returns {*}
   */
  getFieldValue: function (fieldName) {
    return this.getValue() && this.lastSelection.length ? this.lastSelection[0].get(fieldName) : null
  }
})
