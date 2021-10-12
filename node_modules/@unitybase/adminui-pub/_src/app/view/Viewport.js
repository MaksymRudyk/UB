const UB = require('@unitybase/ub-pub')
require('./OverflowSelect') // MPV Important for rollup'ed version
require('./UBBar')
require('../core/UBStoreManager')
require('../../ux/window/Notification')
/* global Ext */
/**
 * UnityBase Ext-based client main viewport
 */
Ext.define('UB.view.Viewport', {
  extend: 'Ext.container.Viewport',
  uses: ['UB.core.UBApp'],

  initComponent: function () {
    var me = this
    UB.view.Viewport.main = this

    me.leftPanel = Ext.create('Ext.Component', {
      width: 240,
      html: '<div id="sidebar-placeholder">Either @unitybase/adminui-vue should be added into domain or some model should replace #sidebar-placeholder by actual menu</div>',
      region: 'west',
      defaultSizes: {
        full: 240,
        collapsed: 72
      }
    })

    /**
     * Central panel instance - this is a place where other components opens
     * @property {Ext.tab.Panel} centralPanel
     */
    me.centralPanel = Ext.create('Ext.tab.Panel', {
      id: 'ubCenterViewport',
      isMainTabPanel: true,
      deferredRender: false,
      region: 'center',
      maxTabWidth: 200,
      border: false,
      margin: '1, 0, 0, 0',
      loader: { autoLoad: false },
      listeners: {
        beforetabchange: function(tabs, newTab, oldTab) {
          const uiTag = (newTab && newTab.uiTag)  || ''
          if ($App && $App.connection) $App.connection.setUiTag(uiTag) // tracking
          return true
        }
      }
    })

    Ext.apply(me, {
      layout: 'border',
      items: [
        me.leftPanel,
        me.centralPanel
      ]
    })
    this.callParent(arguments)

    this.on('destroy', function () {
      this.leftPanel = null
      UB.view.Viewport.main = null
      UB.view.Viewport.centerPanel = null
    }, this)
  },

  /**
   *
   * @deprecated Use {$App.viewport.centralPanel} instead
   */
  getCenterPanel: function () {
    return this.getLayout().centerRegion
  },

  getLeftPanel: function () {
    return this.leftPanel
  }
})
