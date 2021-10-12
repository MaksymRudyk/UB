module.exports = {
  replaceExtJSDialogs,
  replaceExtJSNavbar,
  replaceAutoForms,
  replaceExtJSMessageBarDialog,
  replaceShowList
}

/* global $App, Ext */

const UB = require('@unitybase/ub-pub')
const Vue = require('vue')
const { Notification } = require('element-ui')
const uDialogs = require('./uDialogs')
const UNavbar = require('../components/navbar/UNavbar.vue').default
const UAutoForm = require('../components/UAutoForm.vue').default
const Form = require('./Form/Form').Form
const { mountTableEntity } = require('./Form/mount')

function replaceExtJSDialogs () {
  // rename buttonText - > buttons, fn -> callback and call `dialog`
  Ext.Msg.confirm = function ({ title, msg, fn: callback, buttonText: buttons }) {
    return uDialogs.dialog({
      title,
      msg,
      buttons,
      type: 'info'
    }).then(r => {
      if (callback) callback(r)
      return r
    })
  }

  $App.dialogYesNo = uDialogs.dialogYesNo
  $App.dialogInfo = uDialogs.dialogInfo
  $App.dialogError = uDialogs.dialogError
  $App.uDialogs = uDialogs

  Ext.override(UB.view.BasePanel, {
    showValidationErrors () {
      const errors = []
      let focusCalled = false
      const me = this
      this.getForm().getFields().each(item => {
        if (!item.isValid()) {
          if (!focusCalled) {
            // in case item not rendered yet give it a chance - Ext.callback with delay
            Ext.callback(item.focus, item, [], 100)
            focusCalled = true
          }
          errors.push(item)
        }
      })
      if (errors.length) {
        const fieldLinks = errors.map(f => {
          const text = f.fieldLabel || UB.i18n(`${f.entityName}.${f.name}`)
          return `<a href="#" data-cmd-type="setFocus" data-elm-id="${f.id}">${text}</a>`
        }).join(', ')

        Notification.error({
          title: UB.i18n('error'),
          message: UB.i18n('fieldValidationError', me.domainEntity.caption) + '<br>' + fieldLinks,
          dangerouslyUseHTMLString: true,
          duration: 15000
        })
      }
    }
  })
}

function replaceExtJSNavbar () {
  const id = UB.core.UBApp.viewport.centralPanel.tabBar.id
  const styles = document.createElement('style')
  styles.innerHTML = `#${id}{display:none !important}`
  document.body.appendChild(styles)

  new Vue({
    render: (h) => h(UNavbar)
  }).$mount(`#${id}`)
}

function replaceAutoForms () {
  const { entity, instanceID, parentContext, isModal, target } = this

  Form({
    component: UAutoForm,
    props: { parentContext },
    entity,
    instanceID,
    title: UB.connection.domain.get(entity).caption,
    isModal,
    target,
    uiTag: `afm-${entity}`,
    isCopy: this.commandConfig.isCopy,
    modalClass: 'ub-dialog__reset-padding'
  })
    .processing()
    .validation()
    .mount()
}

function replaceExtJSMessageBarDialog () {
  $App.on('portal:notify:markAsReaded', (mess) => {
    UB.connection.query({
      entity: 'ubs_message_recipient',
      method: 'accept',
      execParams: {
        ID: mess['recipients.ID']
      }
    }).then(resp => {
      if (resp.resultData) {
        $App.fireEvent('portal:notify:readed', mess.ID, new Date())
      }
    })
  })

  // TODO doOnMessageRetrieved
  // UBS.MessageBar.override({
  //   async doOnMessageRetrieved (messages) {
  //     /**
  //      *  show all messages type except information
  //      *  mark as read after user accepts dialog
  //      */
  //     for (const mess of messages) {
  //       if (mess.messageType !== 'information') {
  //         const confirm = await $App.dialogInfo(mess.messageBody, getTypeLocaleString(mess.messageType))
  //         if (confirm) {
  //           $App.fireEvent('portal:notify:markAsReaded', mess)
  //         }
  //       }
  //     }
  //   }
  // })
}

// replace showList method
function replaceShowList () {
  Ext.override(UB.core.UBCommand, {
    showList () {
      const me = this
      const useVueTables = UB.connection.appConfig.uiSettings.adminUI.useVueTables
      const defaultRenderer = useVueTables ? 'vue' : 'ext'
      const renderer = me.commandConfig.renderer || defaultRenderer
      if (renderer !== 'vue') {
        this.callParent() // Ext base showList
        return
      }
      /// Vue based UTableEntity
      const cfg = me.commandConfig
      const tabId = cfg.tabId
      const title = me.title || me.entity
      /*
       * Test command cfg in old format with cfg.params as array.
       * In new format 'repository' or 'entityName' params is used
       */
      const vueCfgType = ('repository' in cfg.cmdData) || ('entityName' in cfg.cmdData)
      if (vueCfgType) {
        mountTableEntity({
          isModal: cfg.isModal,
          tabId,
          uiTag: me.uiTag,
          title,
          props: cfg.cmdData,
          shortcutCode: cfg.shortcutCode,
          scopedSlots: cfg.cmdData.scopedSlots
        })
        return
      }
      // Here we construct a UTableEntity props based on old Ext-based showList command format
      const req = cfg.cmdData.params[0]
      let props
      if ((req.fieldList.length === 1) && (req.fieldList[0] === '*')) { // fieldList: ["*"] = all attributes
        props = { entityName: req.entity } // let UTableEntity build fieldList and columns
      } else {
        const columns = []
        const fieldList = []
        for (const field of req.fieldList) {
          if (typeof field === 'object') {
            if (field.visibility !== false) {
              columns.push({
                ...field,
                id: field.name,
                label: field.description
              })
            }
            fieldList.push(field.name)
          } else {
            columns.push(field)
            fieldList.push(field)
          }
        }

        // need to clone request because UBStoreManager saves request into cache with mutated fieldList
        const clonedRequest = Object.assign({}, req)
        clonedRequest.fieldList = fieldList
        props = {
          repository () {
            return UB.Repository(clonedRequest)
          },
          columns,
          buildEditConfig: cfg.cmpInitConfig && cfg.cmpInitConfig.buildEditConfig,
          onSelectRecord: cfg.onSelectRecord,
          parentContext: cfg.parentContext,
          hideActions: cfg.hideActions
        }
      }

      // if showList command has own scopedSlots function, merge it with already created one
      const customActions = cfg.scopedSlots || function () {}

      mountTableEntity({
        isModal: cfg.isModal,
        tabId: cfg.tabId,
        uiTag: me.uiTag,
        shortcutCode: cfg.shortcutCode,
        title: me.title || me.description || me.entity,
        props,
        scopedSlots: h => ({
          ...customActions(h)
        })
      })
    }
  })
}
