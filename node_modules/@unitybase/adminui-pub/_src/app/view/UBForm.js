/* global Ext */
/*
 * MPV: This is a hack to correctly determinate form fields. TODO - do it via override of Ext.form.Basic?
 */
Ext.define('UB.view.UBForm', {
  extend: 'Ext.form.Basic',

  constructor: function (owner, config) {
    this.callParent([owner, config])
    this.getFields()
  },

  getFields: function () {
    let me = this
    if (!me.formFields) {
      let excluded = []
      me.formFields = new Ext.util.MixedCollection()
      let forms = me.owner.query('form')
      Ext.each(forms, function (dform) {
        if (dform !== me.owner) {
          Ext.each(dform.query('[isFormField]'), function (detIiem) {
            excluded.push(detIiem)
          }, me)
        }
      }, me)
      let items = me.owner.query(me.monitor.selector)
      Ext.each(excluded, function (eitem) {
        var delItem = items.indexOf(eitem)
        if (delItem >= 0) {
          items.splice(delItem, 1)
        }
      }, me)

      me.formFields.addAll(items)
    }
    return me.formFields
  },

  onFieldAdd: function (field) {
    let me = this
    if (me.owner === field.up('form')) {
      me.callParent(arguments)
      if (me.formFields) {
        me.formFields.addAll([field])
      }
    }
  },

  onFieldRemove: function (field) {
    let me = this
    if (me.owner === field.up('form')) {
      me.callParent(arguments)
      if (me.formFields) {
        me.formFields.push(field)
      }
    }
  }
})
