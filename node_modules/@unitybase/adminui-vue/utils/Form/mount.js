/**
 * Mount helpers for Vue components
 * @module mountUtils
 * @memberOf module:@unitybase/adminui-vue
 */
module.exports = {
  mountTab,
  mountModal,
  mountContainer,
  mountTableEntity
}

/* global $App, Ext */
const Vue = require('vue')
const UB = require('@unitybase/ub-pub')
const Dialog = require('element-ui').Dialog
const uDialogs = require('../uDialogs')

/**
 * Mount form in modal. Provide `isModal: true` to the child components, child components can inject it as `parentIsModal`
 *
 * @param {object} cfg
 * @param {Vue.Component} cfg.component Form component
 * @param {object} cfg.props Form component props
 * @param {Vuex.Store} cfg.store Store
 * @param {string} cfg.title Title
 * @param {Validator} [cfg.validator] Validator
 * @param {string} [cfg.modalClass] Modal class
 * @param {string} [cfg.modalWidth] Modal width
 * @param {object} cfg.provide Regular object which provide all props what passed in it
 */
function mountModal ({
  component,
  props,
  store,
  title: titleText,
  validator,
  modalClass = 'ub-dialog__reset-padding',
  modalWidth,
  provide,
  onClose
}) {
  modalClass += ' ub-dialog__min-width'

  if (!modalWidth) {
    modalClass += ' ub-dialog__max-width'
  }
  const instance = new Vue({
    store,
    data () {
      return {
        dialogVisible: false,
        titleText
      }
    },
    computed: {
      isDirty () {
        if (this.$store) {
          return this.$store.getters.isDirty
        } else {
          return false
        }
      },

      isNew () {
        if (this.$store) {
          return this.$store.state.isNew
        } else {
          return false
        }
      },

      title () {
        const prefix = this.isDirty ? '* ' : ''
        const suffix = this.isNew ? ` (${UB.i18n('dobavlenie')})` : ''
        return prefix + this.$ut(this.titleText) + suffix
      }
    },

    async beforeDestroy () {
      if (onClose && typeof onClose === 'function' && store) {
        await onClose(store.state.isNew ? null : store.state.data.ID, store)
      }
    },

    methods: {
      setTitle (value) {
        this.titleText = value
      }
    },
    provide () {
      return {
        $v: validator ? validator.getValidationState() : undefined,
        validator,
        $formServices: {
          setTitle: this.setTitle,
          close: () => {
            beforeClose({
              close: () => {
                this.dialogVisible = false
              },
              store
            })
          },
          forceClose: () => {
            this.dialogVisible = false
          }
        },
        isModal: true,
        ...provide
      }
    },
    render (h) {
      return h(Dialog, {
        ref: 'dialog',
        class: modalClass,
        props: {
          title: this.title,
          visible: this.dialogVisible,
          width: modalWidth,
          closeOnClickModal: false,
          beforeClose: (done) => {
            beforeClose({
              close: done,
              store
            })
          },
          ...props
        },
        on: {
          closed: () => { this.$destroy() },
          'update:visible': (val) => {
            this.dialogVisible = val
          }
        }
      }, [
        h(component, {
          props,
          on: {
            close: () => {
              this.dialogVisible = false
            }
          }
        })
      ])
    }
  })
  instance.$mount()
  document.body.appendChild(instance.$el)
  instance.dialogVisible = true
}

/**
 * Mount form in tab
 * @param {object} cfg
 * @param {Vue.Component} cfg.component Form component
 * @param {object} cfg.props Form component props
 * @param {Vuex.Store} cfg.store Store
 * @param {string} cfg.title Title
 * @param {string} cfg.tabId navbar tab ID
 * @param {Validator} [cfg.validator] Validator
 * @param {string} [cfg.uiTag] Optional UI Tag for tracking subsystem
 * @param {object} cfg.provide Regular object which provide all props what passed in it
 * @param {boolean} [cfg.openInBackgroundTab=false] If `true` - the tab with a newly opened form does not become active.
 */
function mountTab ({
  component,
  props,
  store,
  validator,
  title: titleText,
  titleTooltip: titleTooltipText,
  tabId,
  uiTag,
  provide,
  openInBackgroundTab,
  onClose
}) {
  const tab = $App.viewport.centralPanel.add({
    title: titleText,
    titleTooltip: titleTooltipText,
    id: tabId,
    closable: true,
    uiTag
  })

  const instance = new Vue({
    data () {
      return {
        titleText,
        titleTooltipText
      }
    },
    computed: {
      isDirty () {
        if (this.$store) {
          return this.$store.getters.isDirty
        } else {
          return false
        }
      },

      isNew () {
        if (this.$store) {
          return this.$store.state.isNew
        } else {
          return false
        }
      },

      title () {
        const prefix = this.isDirty ? '* ' : ''
        const suffix = this.isNew ? ` (${UB.i18n('dobavlenie')})` : ''
        return prefix + this.$ut(this.titleText) + suffix
      },

      titleTooltip () {
        return this.$ut(this.titleTooltipText) || this.title
      }
    },
    watch: {
      title: {
        immediate: true,
        handler (title) {
          tab.setTitle(title)
        }
      }
    },

    async beforeDestroy () {
      if (onClose && typeof onClose === 'function' && store) {
        await onClose(store.state.isNew ? null : store.state.data.ID, store)
      }
    },

    methods: {
      setTitle (title) {
        this.titleText = title
      },

      setTooltip (tooltip) {
        this.titleTooltipText = tooltip
        tab._formFullTitle = tooltip
      }
    },
    render: (h) => h(component, { props }),
    provide () {
      return {
        $v: validator ? validator.getValidationState() : undefined,
        validator,
        $formServices: {
          setTitle: this.setTitle,
          setTooltip: this.setTooltip,
          close: tab.close.bind(tab),
          forceClose () {
            tab.forceClose = true
            tab.close()
          }
        },
        ...provide
      }
    },
    store
  })

  instance.$mount(`#${tab.getId()}-outerCt`) // simplify layouts by replacing Ext Panel inned content
  tab.on('close', () => {
    instance.$destroy()
  })

  tab.on('beforeClose', (currentTab) => {
    if (currentTab.forceClose) return true

    beforeClose({
      store,
      close: () => {
        tab.forceClose = true
        tab.close()
      }
    })

    return false
  })
  if (!openInBackgroundTab) {
    $App.viewport.centralPanel.setActiveTab(tab)
  }
}

/**
 * Check form isDirty, and is so - ask user to save od discard changes or continue to edit
 * @param {Store} store Store
 * @param {Function} close Callback for close
 */
function beforeClose ({ store, close }) {
  if (store) {
    if (store.getters.isDirty) {
      uDialogs.dialog({
        title: UB.i18n('unsavedData'),
        msg: UB.i18n('confirmSave'),
        type: 'warning',
        buttons: {
          yes: UB.i18n('save'),
          no: UB.i18n('doNotSave'),
          cancel: UB.i18n('cancel')
        }
      }).then(answer => {
        if (answer === 'yes') {
          if ('save' in store._actions) {
            store.dispatch('save').then(close)
          } else {
            close()
          }
        }
        if (answer === 'no') {
          close()
        }
      })
    } else {
      close()
    }
  } else {
    close()
  }
}

/**
 * Mount form directly into html container
 * @param {object} cfg
 * @param {Vue.Component} cfg.component Form component
 * @param {object} cfg.props Form component props
 * @param {Vuex.Store} cfg.store Store
 * @param {object} cfg.provide Regular object which provide all props what passed in it
 * @param {Ext.component|String} cfg.target Either id of html element or Ext component
 * @param {Validator} [cfg.validator] Validator
 */
function mountContainer ({
  component,
  props,
  store,
  provide,
  target,
  validator,
  onClose
}) {
  const instance = new Vue({
    store,
    data () {
      return {}
    },
    provide () {
      return {
        $v: validator ? validator.getValidationState() : undefined,
        validator,
        // for UToolbar
        $formServices: {
          setTitle () {},
          close () {},
          forceClose () { }
        },
        ...provide
      }
    },
    async beforeDestroy () {
      if (onClose && typeof onClose === 'function' && store) {
        await onClose(store.state.isNew ? null : store.state.data.ID, store)
      }
    },
    render: (h) => h(component, { props })
  })

  if (typeof target === 'string') {
    const el = document.querySelector(`#${target}`)
    if (!el) {
      instance.$notify({
        type: 'error',
        message: `Can't find html element with ${target} id`,
        duration: 3000
      })
      return
    }
    // on destroy parent vue component child form must be destroyed
    const vueOptions = el.parentNode.__vue__.$options
    if (!vueOptions.destroyed) vueOptions.destroyed = []
    vueOptions.destroyed.push(function () {
      instance.$destroy()
    })
    instance.$mount(`#${target}`)
  } else if ('getId' in target) { // Ext component
    if (document.getElementById(`${target.getId()}-outerCt`)) {
      instance.$mount(`#${target.getId()}-outerCt`)
    } else if (document.getElementById(`${target.getId()}-innerCt`)) {
      instance.$mount(`#${target.getId()}-innerCt`)
    } else { // tab panel without fake element inside - use -body
      instance.$mount(`#${target.getId()}-body`)
    }

    // adding vue instance to basepanel
    const basePanel = target.up('basepanel')
    if (!basePanel.vueChilds) basePanel.vueChilds = []
    basePanel.vueChilds.push(instance)
    // this watcher helps parent ExtJS form to see vue form is dirty
    const unWatch = instance.$store
      ? instance.$store.watch(
        (state, getters) => getters.isDirty,
        () => basePanel.updateActions(),
        { immediate: true }
      )
      : null
    target.on('destroy', () => {
      if (unWatch) unWatch()
      instance.$destroy()
    })
  } else if (target instanceof HTMLElement) {
    instance.$mount(target)
  }
}

const UMasterDetailView = require('../../components/UMasterDetailView/UMasterDetailView.vue').default

/**
 * Mount UMasterDetailView
 *
 * @param {object} cfg Command config
 * @param {object} cfg.props Props data
 * @param {object} cfg.tabId Tab id
 * @param {string} [cfg.uiTag] Optional UI Tag for tracking subsystem
 * @param {object} [cfg.title] Tab title
 * @param {object} cfg.props UMasterDetailView props
 * @param {function} [cfg.props.repository] Function which returns ClientRepository.
 *   Can be empty in case `props.entityName` is defined - it this case repository constructed automatically
 *   based on attributes with `defaultView: true`
 * @param {string} [cfg.props.entityName] Name of entity. Ignored in case `props.repository` is defined
 * @param {array<string|UTableColumn>} [cfg.props.columns] Columns config.
 *   If empty will be constructed based on repository attributes.
 * @param {TableScopedSlotsBuilder} [cfg.scopedSlots] Scoped slots
 * @param {boolean} [cfg.isModal] Is modal
 * @param {string} [cfg.shortcutCode] Shortcut code
 */
function mountTableEntity (cfg) {
  if (!cfg.props.entityName && !cfg.props.repository) {
    throw new Error('One of "props.entityName" or "props.repository" is required')
  }

  function getEntityName () {
    switch (typeof cfg.props.repository) {
      case 'function':
        return cfg.props.repository().entityName
      case 'object':
        return cfg.props.repository.entity
      default:
        return cfg.props.entityName
    }
  }

  const title = cfg.title || getEntityName()
  const tableRender = h => {
    const scopedSlots = cfg.scopedSlots && cfg.scopedSlots(h)
    return h(UMasterDetailView, {
      attrs: {
        ...cfg.props,
        shortcutCode: cfg.shortcutCode,
        isModal: cfg.isModal
      },
      style: { height: '100%' },
      scopedSlots
    })
  }

  if (cfg.isModal) {
    mountTableEntityAsModal({
      title: UB.i18n(title),
      tableRender
    })
  } else {
    mountTableEntityAsTab({
      title,
      tabId: cfg.tabId,
      uiTag: cfg.uiTag,
      tableRender
    })
  }
}

/**
 * Run UMasterDetailView as modal
 *
 * @param {object} cfg
 * @param {string} cfg.title Modal title
 * @param {function} cfg.tableRender UMasterDetailView render function
 * @param {string} [cfg.modalClass] Modal class
 * @param {string} [cfg.modalWidth] Modal width
 */
function mountTableEntityAsModal ({
  title,
  tableRender,
  modalClass = 'ub-dialog__reset-padding',
  modalWidth
}) {
  modalClass += ' ub-dialog__min-width ub-dialog__table-entity'

  if (!modalWidth) {
    modalClass += ' ub-dialog__max-width'
  }
  const instance = new Vue({
    data () {
      return {
        dialogVisible: false
      }
    },

    provide () {
      return {
        close: () => { this.dialogVisible = false }
      }
    },

    render (h) {
      return h(Dialog, {
        ref: 'dialog',
        class: modalClass,
        props: {
          title,
          visible: this.dialogVisible,
          width: modalWidth,
          closeOnClickModal: false
        },
        on: {
          closed: () => { this.$destroy() },
          'update:visible': (val) => {
            this.dialogVisible = val
          }
        }
      }, [tableRender(h)])
    }
  })
  instance.$mount()
  document.body.appendChild(instance.$el)
  instance.dialogVisible = true

  return instance
}

/**
 * Run UMasterDetailView as tab
 *
 * @param {object} cfg
 * @param {string} cfg.title Tab title
 * @param {string} cfg.tabId Navbar tab ID
 * @param {string} [cfg.uiTag] UI Tag for tracking subsystem
 * @param {function} cfg.tableRender UMasterDetailView render function
 */
function mountTableEntityAsTab ({
  title,
  tabId,
  uiTag,
  tableRender
}) {
  const existedTab = Ext.getCmp(tabId) || $App.viewport.centralPanel.down(`panel[tabID=${tabId}]`)
  if (existedTab) {
    $App.viewport.centralPanel.setActiveTab(existedTab)
  } else {
    const tab = $App.viewport.centralPanel.add({
      title: UB.i18n(title),
      id: tabId,
      closable: true,
      uiTag
    })

    const instance = new Vue({
      render: tableRender,
      provide: {
        close () {
          tab.forceClose = true
          tab.close()
        }
      }
    })

    tab.on('destroy', () => instance.$destroy())
    instance.$mount(`#${tab.getId()}-outerCt`)
    $App.viewport.centralPanel.setActiveTab(tab)
  }
}
