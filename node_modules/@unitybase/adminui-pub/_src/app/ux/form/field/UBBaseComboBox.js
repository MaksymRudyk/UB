/**
 * Base UnityBase combobox. The main purpose is
 *
 *  - implement popup menu
 *  - notify parent about loaded
 *
 */
Ext.define('UB.ux.form.field.UBBaseComboBox', {
  extend: 'Ext.form.field.ComboBox',
  alias: 'widget.ubbasebox',
  queryCaching: true,

  /**
   * return entity code
   * @pribate
   * @returns {String}
   */
  getEntity: function () {
    const request = this.ubRequest || (this.store ? this.store.ubRequest : null)
    return request ? request.entity : ''
  },

  /**
   * Field list displayed while we show dictionary for this combobox. If omitted - all entity fields will be shown.
   * @cfg {Array<String>} [gridFieldList]
   */
  initComponent: function () {
    var me = this
    var eStore = me.getStore()

    me.callParent(arguments)
    me.on('afterrender', me.onAfterRender, me)
    // me.on('focus', me.onFocus, me);
    me.on('change', me.onValueChange, me)
    if (eStore) { // we can create UBBaseComboBox w/o store (in UB.ux.UBPreFilter for example)
      eStore.on('load', function (owner, record, success) {
        if (success) {
          me.dataLoaded = true
        }
      }, me, { single: true })
    }
    // make default delay short for cached entities. For example user quickly type "Uni" and press Tab to select UnityBase from combo
    if (eStore && eStore.ubRequest && eStore.ubRequest.entity) {
      var eCacheType = $App.domainInfo.get(eStore.ubRequest.entity, true).cacheType
      if ((eCacheType === 'Session') ||
                 (eCacheType === 'SessionEntity')) {
        me.queryDelay = 200 // [UB-1737]
      }
    }
  },

  setRawValue: function (value) {
    var me = this
    me.callParent(arguments)
    if (me.inputEl && me.readOnly && value && value.length > 50) {
      me.inputEl.set({ 'data-qtip': value })
    }
  },

  onDataLoaded: function (callback, scope) {
    var me = this; var eStore = this.getStore()
    if (this.dataLoaded) {
      Ext.callback(callback, scope || me, [me])
    } else {
      eStore.on('load', function (owner, record, success) {
        me.dataLoaded = true
        if (success) {
          Ext.callback(callback, scope || me, [me])
        }
      }, me, { single: true })
    }
  },

  onAfterRender: function () {
    var me = this; var val
    if (!me.disableContextMenu) {
      me.initContextMenu()
    }
    /**
         * @cfg disableContextMenu
         */
    me.inputCell.on('contextmenu', function (e, t) {
      e.stopEvent()
      if (!me.disabled && !me.disableContextMenu && me.contextMenu) { // && !me.readOnly
        me.onShowContextMenu()
        me.contextMenu.showAt(e.getXY())
      }
    }, me)
    if (me.inputEl && me.readOnly && (val = me.inputEl.getValue()) && val.length > 50) {
      me.inputEl.set({ 'data-qtip': val })
    }
    /**
         * @cfg {Boolean} disableLimitSearchLength disable automatic set maximum input length
         */
    if (!me.disableLimitSearchLength && !!UB.appConfig.maxSearchLength) {
      me.inputEl.set({ maxlength: UB.appConfig.maxSearchLength })
    }
  },

  onShowContextMenu: function () {
    var me = this

    if (me.editItemButton) {
      if (!me.getValue()) {
        me.editItemButton.autoDisable = true
        me.editItemButton.setDisabled(true)
      } else if (me.editItemButton.autoDisable) {
        if (!me.disabled && /*! me.readOnly && */ !me.disableModifyEntity) {
          me.editItemButton.setDisabled(false)
        }
      }
    }
  },

  onValueChange: function () {
    var me = this
    var disabled = me.disabled || /* me.readOnly || */ me.disableModifyEntity || !me.getStore().getById(me.getValue())
    if (me.editItemButton) {
      me.editItemButton.setDisabled(disabled)
    }
  },

  onKeyDown: function (e) { // override
    var me = this
    if (!me.editable && (e.getKey() === e.BACKSPACE)) {
      e.stopEvent()
      me.clearValue()
    } else if (!e.ctrlKey) {
      me.callParent(arguments)
    }
  },

  onKeyUp: function (e) { // override
    var me = this

    me.editedByUser = true
    if (!me.editable && e.BACKSPACE) {
      e.stopEvent()
    } else if (!e.ctrlKey) {
      me.callParent(arguments)
    }
  },

  beforeDestroy: function (sender) {
    var me = this
    if (me.contextMenu) {
      Ext.destroy(me.contextMenu)
      me.contextMenu = null
    }
    if (me.keyMap) {
      Ext.destroy(me.keyMap)
      me.keyMap = null
    }
    this.callParent()
  },

  setReadOnly: function (readOnly) {
    var me = this
    var store = me.getStore()
    var entityName = (store.ubRequest ? store.ubRequest.entity : null) || store.entityName
    var methodNames = UB.core.UBCommand.methodName
    var val
    me.callParent(arguments)
    if (me.showLookupButton) {
      me.showLookupButton.setDisabled(readOnly)
    }
    if (me.addItemButton) {
      me.addItemButton.setDisabled(readOnly || !$App.domainInfo.isEntityMethodsAccessible(entityName, [methodNames.ADDNEW, methodNames.INSERT]))
    }
    if (me.clearValueButton) {
      me.clearValueButton.setDisabled(readOnly)
    }
    if (me.inputEl) {
      if (readOnly && (val = me.inputEl.getValue()) && val.length > 50) {
        me.inputEl.set({ 'data-qtip': val })
      } else {
        me.inputEl.set({ 'data-qtip': undefined })
      }
    }
  },

  /**
   * @cfg disableModifyEntity If true will disable editInstance and addInstance in context menu.
   */
  disableModifyEntity: false,

  /**
   * @cfg  hideEntityItemInContext If true will hide entity actions in the context menu.
   */
  hideEntityItemInContext: false,

  /**
   * Is parent BasePanel in modal state
   */
  parentIsModal: false,

  initContextMenu: function () {
    var me = this; var menuItems
    var store
    var entityName
    var methodNames = UB.core.UBCommand.methodName
    store = me.getStore()
    menuItems = []
    entityName = (store.ubRequest ? store.ubRequest.entity : null) || store.entityName
    let basePanel = this.up('basepanel')
    me.parentIsModal = (basePanel && basePanel.isModal) || false
    if ($App.domainInfo.has(entityName)) {
      menuItems.push({
        text: UB.i18n('editSelItem') + ' (Ctrl+E)',
        iconCls: 'u-icon-edit',
        itemID: 'editItem',
        handler: me.editItem,
        hidden: !!me.hideEntityItemInContext || me.disableModifyEntity,
        disabled: me.disabled || /* me.readOnly || */ me.disableModifyEntity,
        scope: me
      })
      menuItems.push({
        text: UB.i18n('selectFromDictionary') + ' (F9)',
        iconCls: 'u-icon-grid',
        itemID: 'showLookup',
        handler: me.showLookup,
        hidden: !!me.hideEntityItemInContext,
        disabled: me.disabled || me.readOnly,
        scope: me
      })
      menuItems.push({
        text: UB.i18n('addNewItem'),
        iconCls: 'u-icon-add',
        itemID: 'addItem',
        handler: me.addItem,
        hidden: !!me.hideEntityItemInContext || me.disableModifyEntity,
        disabled: me.disableModifyEntity || me.disabled || me.readOnly || !$App.domainInfo.isEntityMethodsAccessible(entityName, [methodNames.ADDNEW, methodNames.INSERT]),
        scope: me
      })
    }
    menuItems.push({
      text: UB.i18n('clearSelection') + ' (Ctrl+BackSpace)',
      iconCls: 'u-icon-eraser',
      itemID: 'clearValue',
      handler: me.clearValue,
      disabled: me.disabled || me.readOnly,
      scope: me
    })

    me.contextMenu = Ext.create('Ext.menu.Menu', { items: menuItems })

    me.editItemButton = me.contextMenu.items.getAt(0)
    me.showLookupButton = me.contextMenu.items.getAt(1)
    me.addItemButton = me.contextMenu.items.getAt(2)
    me.clearValueButton = me.contextMenu.items.getAt(3)

    me.keyMap = new Ext.util.KeyMap({
      target: me.getEl(),
      binding: [{
        ctrl: true,
        shift: false,
        alt: false,
        key: Ext.EventObject.E,
        handler: function (keyCode, e) {
          if (!me.disabled && !me.readOnly && !me.hideEntityItemInContext && !me.disableModifyEntity) {
            e.stopEvent()
            me.editItem()
          }
          return true
        }
      }, {
        ctrl: false,
        shift: false,
        alt: false,
        key: 120,
        handler: function (keyCode, e) {
          if (!me.disabled && !me.readOnly && !me.hideEntityItemInContext) {
            e.stopEvent()
            me.showLookup()
          }
          return true
        }
      }, {
        ctrl: true,
        shift: false,
        alt: false,
        key: 8,
        handler: function (keyCode, e) {
          if (!me.disabled && !me.readOnly) {
            e.stopEvent()
            me.clearValue()
          }
          return true
        }
      }, {
        ctrl: true,
        shift: false,
        alt: false,
        key: 65,
        handler: function (keyCode, e) {
          me.ctrlCDown = true
          return true
        }
      }, {
        ctrl: true,
        shift: false,
        alt: false,
        key: 67,
        handler: function (/* keyCode, e */) {
          // e.stopEvent();
          me.ctrlCDown = true
          return true
        }
      }]
    })
  },

  doRawQuery: function () {
    var me = this
    var rawValue = this.getRawValue()
    if (!me.ctrlCDown && (rawValue || !me.editedByUser) && (me.getDisplayValue() !== rawValue)) {
      me.callParent(arguments)
    }
    me.deleteWasPressed = false
    me.ctrlCDown = false
  },

  addItem: function () {
    const me = this
    const store = me.getStore()
    const entityName = store.entityName
    const displayField = me.displayField
    const val = me.getValue()
    const rec = store.getById(val)
    const cmdConfig = {
      cmdType: UB.core.UBCommand.commandType.showForm,
      entity: entityName,
      store: store,
      isModal: UB.connection.appConfig.uiSettings.adminUI.forceModalsForEditForms || me.parentIsModal,
      sender: me,
      onClose: function (itemId) {
        if (itemId && me.setValueById) {
          me.setIsActualValue = true
          me.setValueById(itemId)
        }
      }
    }
    cmdConfig.initValue = {}
    cmdConfig.initValue[displayField] = rec ? rec.get(displayField) : val

    UB.core.UBApp.doCommand(cmdConfig)
  },

  editItem: function (initValue) {
    var me = this; var store; var entityName; var instanceID; var cmdConfig
    store = me.getStore()
    entityName = store.entityName
    if (!entityName) { return }
    instanceID = me.getValue()
    cmdConfig = {
      cmdType: UB.core.UBCommand.commandType.showForm,
      entity: entityName,
      instanceID: instanceID,
      initValue: initValue,
      store: store,
      isModal: UB.connection.appConfig.uiSettings.adminUI.forceModalsForEditForms || me.parentIsModal,
      sender: me,
      onClose: function (itemID, store, formWasSaved) {
        if (!me.readOnly && formWasSaved) {
          me.setValue(null)
          me.getStore().clearData()
          me.setValueById(itemID || instanceID)
          me.enable()
        }
      }
    }
    if (instanceID) {
      UB.core.UBApp.doCommand(cmdConfig)
    }
  },

  showExtBasedLookup () {
    const me = this
    const store = me.getStore()
    const entityName = store.entityName
    if (!entityName) { return }
    const instanceID = me.getValue()
    const fieldList = me.gridFieldList ? me.gridFieldList : '*'

    const config = {
      renderer: 'ext',
      entity: entityName,
      cmdType: UB.core.UBCommand.commandType.showList,
      description: $App.domainInfo.get(entityName, true).getEntityDescription(),
      isModal: true,
      sender: me,
      selectedInstanceID: instanceID,
      onItemSelected: function (selected) {
        if (me.setValueById) {
          me.getStore().clearData()
          me.setValueById(selected.get(me.valueField || 'ID'))
        }
      },
      cmdData: {
        params: [{
          entity: entityName,
          method: 'select',
          fieldList: fieldList,
          whereList: store.ubRequest.whereList,
          logicalPredicates: store.ubRequest.logicalPredicates,
          __mip_ondate: store.ubRequest.__mip_ondate
        }]
      },
      hideActions: me.hideActions
    }
    var filters = store.filters.clone()
    filters.removeAtKey(me.userFilterId)
    config.filters = filters

    UB.core.UBApp.doCommand(config)
  },

  showLookup () {
    const me = this
    if (!UB.connection.appConfig.uiSettings.adminUI.useVueTables) {
      // Use ExtJS based grid for "Select from dictionary"
      return this.showExtBasedLookup()
    }
    const store = this.getStore()
    if (!store.entityName) { return }
    // build showList where based on ubRequest where + Ext filters
    const filters = store.filters.clone()
    filters.removeAtKey(this.userFilterId)
    const reqWhere = Ext.clone(store.ubRequest).whereList || {}
    const filtersWhere = UB.ux.data.proxy.UBProxy.ubFilterToWhereList(filters.getRange(), store.entityName)
    Ext.Object.merge(reqWhere, filtersWhere)
    const config = {
      renderer: 'vue',
      cmdType: 'showList',
      isModal: true,
      cmdData: {
        repository: () => UB.Repository({
          entity: store.entityName,
          fieldList: this.gridFieldList || UB.connection.domain.get(store.entityName).getAttributeNames({ defaultView: true }),
          whereList: reqWhere,
          logicalPredicates: store.ubRequest.logicalPredicates,
          __mip_ondate: store.ubRequest.__mip_ondate
        }),
        onSelectRecord: ({ ID, close }) => {
          if (this.setValueById) {
            this.getStore().clearData()
            this.setValueById(ID)
          }
          close()
        },
        buildEditConfig (cfg) {
          if (UB.connection.appConfig.uiSettings.adminUI.forceModalsForEditForms) cfg.isModal = true
          return cfg
        },
        buildCopyConfig (cfg) {
          if (UB.connection.appConfig.uiSettings.adminUI.forceModalsForEditForms) cfg.isModal = true
          return cfg
        },
        buildAddNewConfig (cfg) {
          if (UB.connection.appConfig.uiSettings.adminUI.forceModalsForEditForms) cfg.isModal = true
          return cfg
        },
        scopedSlots: createElement => ({
          toolbarPrepend: ({ store: dictionaryStore, close }) => {
            return createElement('u-button', {
              props: {
                icon: 'u-icon-check',
                appearance: 'inverse',
                disabled: !dictionaryStore.state.selectedRowId
              },
              on: {
                click: () => {
                  if (this.setValueById) {
                    this.getStore().clearData()
                    this.setValueById(dictionaryStore.state.selectedRowId)
                  }
                  close()
                }
              }
            }, [UB.i18n('actionSelect')])
          }
        })
      }
    }
    UB.core.UBApp.doCommand(config)
  },

  onExpand: function () {
    var me = this
    var selectOnTab = me.selectOnTab
    var picker = me.getPicker()

    me.listKeyNav = new Ext.view.BoundListKeyNav(this.inputEl, {
      boundList: picker,
      forceKeyDown: true,
      tab: function (e) {
        if (selectOnTab) {
          this.selectHighlighted(e)
          me.triggerBlur()
        }
        // Tab key event is allowed to propagate to field
        return true
      },
      enter: function (e) {
        var selModel = picker.getSelectionModel()
        var count = selModel.getCount()

        this.selectHighlighted(e)

        // Handle the case where the highlighted item is already selected
        // In this case, the change event won't fire, so just collapse
        if (!me.multiSelect && count === selModel.getCount()) {
          me.collapse()
        }
      },
      home: null,
      end: null
    })
    me.callParent(arguments)
    // keyNav = me.listKeyNav;
    // keyNav.home = function(){};
    // keyNav.end = function(){};
  },

  getErrors: function (value) {
    var me = this; var errors; var fvalue
    errors = me.callParent(arguments)
    fvalue = me.getValue()
    if (!fvalue && (fvalue !== 0) && !me.allowBlank) {
      // If we are not configured to validate blank values, there cannot be any additional errors
      if (errors.length === 0 || (errors.indexOf(me.blankText) < 0)) {
        errors.push(me.blankText)
      }
    }
    return errors
  },

  onDestroy: function () {
    if (this.contextMenu) {
      this.contextMenu.destroy()
    }
    this.callParent(arguments)
  }

})
