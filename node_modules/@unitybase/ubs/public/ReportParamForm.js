/**
 * Base panel to show report parameters.
 * Example:
 *     onParamForm: function(){
 *          var paramForm = Ext.create('UBS.ReportParamForm', {
 *               items: [
 *                  {xtype: 'textfield', name: 'name', fieldLabel: 'Name' },
 *                  {xtype: 'datefield', name: 'birthday', fieldLabel: 'Birthday' },
 *               ],
 *               getParameters: function(owner){
 *                   return {
 *                      name: owner.findField('name').getValue(),
 *                      birthday: owner.findField('birthday').getValue()
 *                   };
 *               }
 *          });
 *          return paramForm;
 *     }
 */
Ext.define('UBS.ReportParamForm', {
  extend: 'Ext.form.Panel',
  xtype: 'reportparamform',
  layout: {
    type: 'vbox',
    align: 'stretch'
  },
  title: UB.i18n('reportParametersHeader'),
  collapsible: true,

  /**
   *  @cfg {function} validateForm This function called when validate form. If function return false the buildReport event will not called.
   *
   */
  initComponent: function () {
    var me = this

    me.buttons = [{
      text: UB.i18n('BuildReport'),
      handler: function () {
        var params, form, isValid
        form = me.up('form')
        isValid = form.isValid()
        if (me.validateForm) {
          isValid = me.validateForm()
        }
        if (!isValid) {
          return
        }
        if (me.getParameters) {
          params = me.getParameters(me)
        }
        me.collapse(Ext.Component.DIRECTION_TOP, false)
        me.fireEvent('buildReport', params, me)
      }
    }]

    /**
     * Callback must return parameters for report
     * @callback getParameters
     * @param {UBS.ReportParamForm}
     */

    /**
     * @event buildReport
     * @param {Array}  params
     * @param {Ext.panel.Panel} owner
     * Fires when user press button "build report".
     * Function will be called to order specified in orderNumber. Each function can return promise. when run for last promise form start savind.
     */
    me.addEvents('buildReport')
    me.callParent(arguments)
  }
})
