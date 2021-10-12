exports.formCode = {
  initUBComponent: function () {
    var me = this
    if (!me.isEditMode) { // new form
      this.down('label[ubID="newFormTip"]').setVisible(true)
      me.record.set('ID', null) // ID will be calculated as crc32(name)
    } else {
      this.down('label[ubID="newFormTip"]').setVisible(false)
      me.getUBCmp('attrName').setReadOnly(true)
      me.getUBCmp('attrModel').setReadOnly(true)
    }
  }
}
