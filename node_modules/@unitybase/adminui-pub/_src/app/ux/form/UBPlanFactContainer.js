/**
 * Container for display one of two attributes depending on it values. For example we may have two attributes in `tasks` entity:
 *
 *  - `staffUnit` - Here we store a position for which assigned the task
 *  - `employee`  - Here we store employee who actually completed the task
 *
 *  If no one began to perform the task we want  staffUnit to be visible in form, but if someone complete the task,
 *  we want to display actual task executor. In this case configuration is:
 *
 *          { xtype: 'ubplanfactcontainer',
 *             items:[
 *               { attributeName: 'staffUnit', controlType: 'plan'},
 *               { attributeName: 'employee', controlType: 'fact'}
 *             ]
 *           },
 *
 */
Ext.define('UB.ux.form.UBPlanFactContainer', {
  extend: 'Ext.container.Container',
  alias: 'widget.ubplanfactcontainer',

  layout: {
    type: 'vbox',
    align: 'left'
  },

  initComponent: function () {
    const me = this

    me.callParent(arguments)

    /**
     * @property {Ext.form.field.Base} planControl
     */
    /**
     * @property {Ext.form.field.Base} factControl
     */
    me.items.each(function (item) {
      switch (item.controlType) {
        case 'plan':
          me.planControl = item
          break
        case 'fact':
          me.factControl = item
          break
        default:
          throw new Error('You must set value property "controlType" for UBPlanFactContainer. The value must be "plan" "fact".')
      }
      if (item.controlType === 'plan') {
        me.planControl = item
      }
      if (item.controlType === 'fact') {
        me.factControl = item
      }
    })
    if (!me.factControl) {
      throw new Error('You must specify "fact" control for UBPlanFactContainer. To do this, a value of "fact" for the property controlType.')
    }
    if (!me.planControl) {
      throw new Error('You must specify "plan" control for for UBPlanFactContainer. To do this, a value of "fact" for the property controlType.')
    }
    me.factControl.hide()
    me.on('afterrender', me.onAfterRender, me, { single: true })
  },

  initContextMenu: function () {
    const me = this
    const menuItems = []
    menuItems.push({
      text: UB.i18n('showPlanAndFact'),
      // iconCls: 'ub-icon-table-edit',
      itemID: 'editItem',
      handler: function () {
        me.planControl.show()
        me.factControl.show()
      },
      scope: me
    })
    me.contextMenu = Ext.create('Ext.menu.Menu', { items: menuItems })
  },

  /**
   * @cfg {String} adminRoles Comma separated roles list. For users with this both plan and fact component is always visible. Default - `admins`
   */
  adminRoles: 'admins',

  onAfterRender: function () {
    const me = this
    const roles = ($App.connection.userData('roles') || '').split(',')
    const rRoles = (me.adminRoles || '').split(',')
    let isAdmin = false
    me.onDataBind()
    me.setEventBind()
    for (let i = 0; i < roles.length; i++) {
      if (rRoles.indexOf(roles[i]) >= 0) {
        isAdmin = true
        break
      }
    }
    if (!isAdmin) {
      return
    }
    me.initContextMenu()
    me.getEl().on('contextmenu', function (e, t) {
      e.stopEvent()
      me.contextMenu.showAt(e.getXY())
    }, me)
  },

  setEventBind: function () {
    const me = this
    const panel = me.up('basepanel')
    if (!panel) {
      console.error(' The UB.ux.form.field.UBCompositeComboBox must be in the UB.view.BasePanel')
    }
    if (panel.binder) {
      panel.binder.updateFormFields()
    }
    panel.on('formDataReady', me.onDataBind, me)
  },

  onDataBind: function () {
    const me = this
    let showFact
    const planValue = me.planControl.getValue()
    const factValue = me.factControl.getValue()

    if (me.planControl.xtype === 'ubboxselect') {
      const planValuesCount = planValue ? ('' + planValue).split(',').length : 0
      const factValuesCount = factValue ? ('' + factValue).split(',').length : 0
      showFact = factValuesCount && factValuesCount >= planValuesCount
    } else showFact = !!factValue

    if (showFact) {
      me.planControl.hide()
      me.factControl.show()
    } else {
      me.planControl.show()
      me.factControl.hide()
    }
  }
})
