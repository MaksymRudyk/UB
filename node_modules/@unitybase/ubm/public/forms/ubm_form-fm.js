/* global SystemJS, $App */
const UB = require('@unitybase/ub-pub')
exports.formCode = {
  propTree: null,
  codeTabs: null,

  initUBComponent: function () {
    const me = this

    // remove document-menu buttons
    let tbar = this.query('[ubID=mainToolbar]')[0]
    tbar.remove(tbar.items.getAt(2))
    tbar.remove(tbar.items.getAt(2))

    me.down('label[ubID="newFormTip"]').setVisible(me.isNewInstance)
    me.getField('code').addListener('change', me.onCodeChanged, me)
    me.getField('entity').addListener('change', me.onEntityChanged, me)

    me.entityCode = me.record.get('entity')
    me.propTree = me.down('commandbuilderentitytreepanel[cbID="1"]')
    me.propTree.addListener('itemdblclick', me.onEntityTreePanelItemDblClick, me)

    me.propTree1 = me.down('commandbuilderentitytreepanel[cbID="2"]')
    me.propTree1.addListener('itemdblclick', me.onEntityTreePanelItemDblClick, me)

    me.propTree1.setEntity(me.entityCode)
    me.propTree.setEntity(me.entityCode)

    me.formDefEditor = me.down('ubcodemirror[name="formDef"]')

    me.codeTabs = me.down('tabpanel')
    me.designer = me.down('UBVDesigner')
    me.designer.setEntityCode(me.entityCode)
    me.codeTabs.on('tabchange', function () {
      if (me.codeTabs.getActiveTab().isDesigner) {
        if (me.record.get('formType') === 'auto') {
          me.designer.setVisible(true)
          me.designer.setValue(me.formDefEditor.getValue())
        } else {
          me.designer.setVisible(false)
        }
      }
    })
    if (!me.isEditMode) { // new form
      me.record.set('ID', null) // ID will be calculated as crc32(code)
    } else {
      me.getUBCmp('attrCode').setReadOnly(true)
      me.getUBCmp('attrModel').setReadOnly(true)
      me.getUBCmp('attrEntity').setReadOnly(true)
    }
    $App.connection.authorize().then(function (session) { me.CRC32 = session.crc32 })
  },

  onCodeChanged: function (field, newValue) {
    if (this.isEditMode) {
      throw new UB.UBError('To change form code rename *-fm.js, *-fm.def and *.ubrow files in the folder "yourModel/public/forms"')
    }
    this.record.set('ID', this.CRC32(newValue))
    this.getUBCmp('attrFormDef').setOrigName(newValue.length > 0 ? newValue + '.def' : newValue)
    this.getUBCmp('attrFormCode').setOrigName(newValue.length > 0 ? newValue + '.js' : newValue)
  },

  onAfterSave: function () {
    if (SystemJS.reload && !window.__systemHmrUBConnected) {
      let formModelName = this.record.get('model')
      let model = $App.domainInfo.models[formModelName]
      let formCode = this.record.get('code')
      let defImportPath = `${model.clientRequirePath}/forms/${formCode}-fm.def`
      let jsImportPath = `${model.clientRequirePath}/forms/${formCode}-fm.js`
      SystemJS.reload(defImportPath)
      SystemJS.reload(jsImportPath)
    } else {
      $App.dialogInfo(`You are in PRODUCTION mode. Reload page to apply changes. Or use ${window.location.href}-dev URL for developer mode with hot module replacement`)
    }
    UB.core.UBStoreManager.getFormStore().reload()
  },

  onEntityChanged: function (field, newValue) {
    const me = this

    if ($App.connection.domain.entities[newValue]) {
      me.entityCode = newValue
      me.propTree.setEntity(newValue)
      me.propTree1.setEntity(newValue)
      if (me.record.get('formType') === 'auto') {
        me.designer.setEntityCode(newValue)
      }
      let codeParts = me.getField('code').getValue().split('-')
      codeParts[0] = newValue
      let newCode = codeParts.join('-')
      if (newCode !== me.getField('code').getValue()) {
        me.getField('code').setValue(newCode)
      }
      me.record.set('model', $App.connection.domain.entities[newValue].modelName)
    }
  },

  onEntityTreePanelItemDblClick: function (tree, record) {
    let aTab = this.codeTabs.getActiveTab()
    let textToInsert = ''
    if (record) {
      if (aTab.isDefifnition) { // definition === this.codeTabs.items.getAt(1)
        textToInsert = '{ attributeName: "' + record.get('id') + '"}'
      } else { // module
        if (this.record.get('formType') === 'vue') {
          textToInsert = `<u-auto-field attribute-name="${record.get('id')}" />`
        } else {
          textToInsert = "this.getField('" + record.get('id') + "')"
        }
      }
      let aCodeMirror = aTab.down('ubcodemirror').codeMirrorInstance
      aCodeMirror.replaceSelection(textToInsert)
      aCodeMirror.getInputField().focus()
    }
  },

  doOnGetSnipped: function (type, multilinePrefix) {
    if (type === 'formDef') {
      return this.doOnGetFormDefSnippets(multilinePrefix)
    } else {
      return this.doOnGetFormScriptSnippets(multilinePrefix)
    }
  },
  doOnGetFormDefSnippets: function (multilinePrefix) {
    return [{
      displayText: 'parent:configure \t Configure a BasePanel we created in',
      text: [
        'parentConfig: {',
        '  postOnlySimpleAttributes: true,',
        '  layout: {',
        '    type: "vbox",',
        '    align: "stretch"',
        '  }',
        '}'
      ].join('\n' + multilinePrefix)
    }, {
      displayText: 'layout:vertical \t layout a set of components vertiacally',
      text: [
        '{',
        "  layout: {type: 'vbox', align: 'stretch'},",
        '  items: [',
        '    // place your items here',
        '  ]',
        '}'
      ].join('\n' + multilinePrefix)
    }, {
      displayText: 'layout:horizontal \t layout a set of components horisintally',
      text: [
        '{',
        "  layout: {type: 'hbox'},",
        '  items: [',
        '    // place your items here',
        '  ]',
        '}'
      ].join('\n' + multilinePrefix)
    }, {
      displayText: 'components:fieldset \t A container for grouping sets of fields with optional title & collapse button',
      text: [
        '{',
        "  xtype: 'ubfieldset',",
        "  title: UB.i18n('optional title'),",
        '  collapsible: false,',
        '  items: [{',
        '     // place your items here',
        '  }]',
        '}'
      ].join('\n' + multilinePrefix)
    }, {
      displayText: 'components:label \t Just a static text ',
      text: [
        '{',
        "  xtype: 'ublabel',",
        "  text: UB.i18n('label text')",
        '}'
      ].join('\n' + multilinePrefix)
    }, {
      displayText: 'components:detailGrid \t Master-detail grid',
      text: [
        '{',
        "  xtype: 'ubdetailgrid',",
        '  entityConfig: {',
        "    entity: 'REPLACE-BY-DETAIL-ENTITY-CODE',",
        "    fieldList: ['REPLACE-BY-DETAIL-ENTITY-ATTRIBUTES']",
        '  },',
        "  masterFields: ['ID'],",
        "  detailFields: ['REPLACE-BY-DETAIL-ENTITY-ATTRIBUTE-WHAT-REF-TO-THIS-ENTITY']",
        '}'
      ].join('\n' + multilinePrefix)
    }, {
      displayText: 'components:tabs \t Tab panels',
      text: [
        '{',
        "  xtype: 'tabpanel',",
        "  layout: 'fit',",
        '  flex: 1,',
        '  items: [{',
        "    title: UB.i18n('1stTabTitle'),",
        "    layout: {type: 'vbox', align: 'stretch'},",
        '    items: [',
        '      // place 1-st tab items here',
        '    ]',
        '  }, {',
        "    title: UB.i18n('2ndTabTitle'),",
        "    layout: {type: 'vbox', align: 'stretch'},",
        '    items: [',
        '      // place 2-nd tab items here',
        '    ]',
        '  }]',
        '}'
      ].join('\n' + multilinePrefix)
    }]
  },

  doOnGetFormScriptSnippets: function (multilinePrefix) {
    return [{
      displayText: 'base:getValue \t Get a value from a entity attribute', text: "this.record.get(/*'ARRTIBUTE-CODE'*/)"
    }, {
      displayText: 'base:setValue \t Set a value for entity attribute', text: "this.record.set(/*'ARRTIBUTE-CODE'*/, /*value*/)"
    }, {
      displayText: 'cmp:onChange \t Component onChange event handler', text: "this.getField('attribute name').addListener('change', /*yourHandler*/, this)"
    }, {
      displayText: 'lifecircle:beforeInit \t Here is possible to change form config',
      text: [
        '  initComponentStart: function() {',
        '    var me = this',
        '    // replace this comment by a real code',
        '  }'
      ].join('\n' + multilinePrefix)
    }, {
      displayText: 'lifecircle:init \t All controls are ready here',
      text: [
        '  initUBComponent: function() {',
        '    var me = this',
        '    // replace this comment by a real code',
        '  }'
      ].join('\n' + multilinePrefix)
    }]
  }
}
