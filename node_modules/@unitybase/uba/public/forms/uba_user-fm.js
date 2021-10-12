function showPasswordChangeDialog () {
  UB.core.UBApp.doCommand({
    cmdType: 'showForm',
    formCode: 'uba_user-changeUserPassword',
    entity: 'uba_user',
    title: 'changePassword',
    isModal: true,
    props: {
      parentContext: {
        userID: this.instanceID,
        userLogin: this.getField('name').getValue()
      }
    }
  })
}

exports.formCode = {
  dataBind: {
    fullName: {
      value: '({lastName} || "?") + " " + ({firstName} || "?")'
    }
  },

  initUBComponent: function () {
    UBS.dataBinder.applyBinding(this)
  },

  addBaseActions: function () {
    this.callParent(arguments)
    this.actions.ActionChangePasswordID = new Ext.Action({
      actionId: 'ActionChangePasswordID',
      actionText: UB.i18n('changePassword'),
      handler: showPasswordChangeDialog.bind(this),
      disabled: !$App.domainInfo.isEntityMethodsAccessible('uba_user', 'changeOtherUserPassword')
    })
  }
}
