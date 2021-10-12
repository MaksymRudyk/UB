// Ext.define("Ext.locale.en.ux.picker.DateTimePicker", {
//    override: "Ext.ux.DateTimePicker",
//    todayText: "Now",
//    timeLabel: 'Time'
//  });
require('./form/TimePickerField')
Ext.define('Ext.ux.DateTimePicker', {
  extend: 'Ext.picker.Date',
  alias: 'widget.datetimepicker',
  todayText: 'Today',
  timeLabel: 'Time',
  requires: ['Ext.ux.form.TimePickerField'],

  initComponent: function () {
    // keep time part for value
    var value = this.value || new Date()
    this.callParent()
    this.value = value
  },
  onRender: function (container, position) {
    if (!this.timefield) {
      this.timefield = Ext.create('Ext.ux.form.TimePickerField', {
        fieldLabel: this.timeLabel,
        useSeconds: this.useSeconds,
        labelWidth: 36,
        value: Ext.Date.format(this.value, 'H:i:s')
      })
    }
    this.timefield.ownerCt = this
    this.timefield.on('change', this.timeChange, this)
    this.callParent(arguments)

    let table = Ext.get(Ext.DomQuery.selectNode('table', this.el.dom))
    Ext.core.DomHelper.insertBefore(table, {
      tag: 'div',
      style: 'border:0px;',
      children: [{
        tag: 'div',
        cls: 'x-datepicker-footer ux-timefield'
      }]
    }, true)
    this.timefield.render(this.el.child('div div.ux-timefield'))

    let p = this.getEl().parent('div.x-layer')
    if (p) {
      p.setStyle('height', p.getHeight() + 31)
    }
  },
  timeChange: function (tf, time, rawtime) {
    this.value = this.fillDateTime(this.value)
  },
  // @private
  fillDateTime: function (value) {
    if (this.timefield) {
      let rawtime = this.timefield.getRawValue()
      value.setHours(rawtime.h)
      value.setMinutes(rawtime.m)
      value.setSeconds(rawtime.s)
    }
    return value
  },
  // @private
  changeTimeFiledValue: function (value) {
    this.timefield.un('change', this.timeChange, this)
    this.timefield.setValue(this.value)
    this.timefield.on('change', this.timeChange, this)
  },

  // overwrite
  setValue: function (value) {
    this.value = value
    this.changeTimeFiledValue(value)
    return this.update(this.value)
  },
  // overwrite
  getValue: function () {
    return this.fillDateTime(this.value)
  },

  // overwrite : fill time before setValue
  handleDateClick: function (e, t) {
    var me = this
    var handler = me.handler

    e.stopEvent()
    if (!me.disabled && t.dateValue && !Ext.fly(t.parentNode).hasCls(me.disabledCellCls)) {
      me.doCancelFocus = me.focusOnSelect === false
      me.setValue(this.fillDateTime(new Date(t.dateValue))) // overwrite: fill time before setValue
      delete me.doCancelFocus
      me.fireEvent('select', me, me.value)
      if (handler) {
        handler.call(me.scope || me, me, me.value)
      }
      me.onSelect()
    }
  },

  // overwrite : fill time before setValue
  selectToday: function () {
    var me = this
    var btn = me.todayBtn
    var handler = me.handler

    if (btn && !btn.disabled) {
      me.setValue(new Date())// overwrite: fill time before setValue
      me.fireEvent('select', me, me.value)
      if (handler) {
        handler.call(me.scope || me, me, me.value)
      }
      me.onSelect()
    }
    return me
  },

  // to show selected date on calendar
  selectedUpdate: function (date) {
    var dt = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    this.callParent([dt])
  }
})
