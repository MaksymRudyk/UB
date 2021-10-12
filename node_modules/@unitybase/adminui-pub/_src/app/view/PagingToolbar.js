/* global Ext */
const UB = require('@unitybase/ub-pub')
/**
 *  Paging tool bar for Grid.
 */
Ext.define('UB.view.PagingToolbar', {
  extend: 'Ext.container.Container',
  alias: 'widget.pagingtb',
  requires: [
    'Ext.data.Store'
  ],

  baseWidth: 130,
  width: 160,

  layout: {
    type: 'hbox'
  },
  itemCls: 'x-btn-default-toolbar-small',
  baseCls: Ext.baseCSSPrefix + 'toolbar',
  initComponent: function () {
    var me = this
    me.beforePageText = ''
    me.lastTotalCount = null

    me.buttonCount = Ext.create('Ext.Button', {
      focusOnToFront: false,
      iconCls: 'ub-sum-row-icon',
      tooltip: UB.i18n('calcRowCount'),
      handler: me.calcTotalRow,
      scope: me,
      height: 32,
      margin: '0 0 0 0'
    })

    function requestChanged () {
      me.lastTotalCount = null
      if (!me.store.ubRequest.options) {
        me.store.ubRequest.options = {}
      }
    }

    me.store.on('beforereload', requestChanged, me)
    me.store.filters.on('add', requestChanged, me)
    me.store.filters.on('clear', requestChanged, me)
    me.store.filters.on('remove', requestChanged, me)
    me.store.filters.on('replace', requestChanged, me)

    me.buttonPage = Ext.create('Ext.Button', {
      focusOnToFront: false,
      tooltip: UB.i18n('currentPageNumber'),
      text: '1',
      handler: function () { me.selectPage() },
      scope: me,
      cls: 'UB-paging-toolbar-page',
      height: 32,
      margin: '0 0 0 0'
    })

    me.items = [
      {
        itemId: 'prev',
        xtype: 'button',
        tooltip: Ext.PagingToolbar.prototype.prevText,
        iconCls: Ext.baseCSSPrefix + 'tbar-page-prev',
        width: 34,
        height: 32,
        border: 0,
        disabled: false,
        handler: me.movePrevious,
        scope: me
      },
      me.buttonPage,
      {
        itemId: 'next',
        xtype: 'button',
        tooltip: Ext.PagingToolbar.prototype.nextText,
        iconCls: Ext.baseCSSPrefix + 'tbar-page-next',
        width: 34,
        height: 32,
        disabled: false,
        handler: me.moveNext,
        scope: me
      },
      me.buttonCount
    ]
    me.callParent()
    if (me.store) {
      me.store.on('load', me.onStoreLoad, me)
    }

    /**
     * Fires each times when the total count was changed
     * @event totalChanged
     * @param {number} Total rows count.
     */
    me.addEvents('totalChanged')
  },

  destroy: function () {
    if (this.contextMenu) this.contextMenu.destroy()
    this.callParent(arguments)
  },

  /**
   * Move to the previous page, has the same effect as clicking the 'previous' button.
   * Fires the {@link #beforechange} event. If the event returns `false`, then
   * the load will not be attempted.
   * @return {Boolean} `true` if the load was passed to the store.
   */
  movePrevious: function () {
    let me = this
    let prev = me.store.currentPage - 1

    if (prev > 0) {
      if (me.fireEvent('beforechange', me, prev) !== false) {
        me.store.previousPage()
        return true
      }
    }
    return false
  },

  onStoreLoad: function () {
    let me = this
    me.suspendLayouts()

    let itemCount = me.store.getCount()

    me.buttonPage.setText(parseInt(me.store.currentPage, 10).toLocaleString())
    if (me.store.currentPage <= 1 && itemCount < me.store.pageSize) {
      me.setTotal(itemCount)
      return
    }
    if (me.store.totalCount !== undefined && me.store.totalCount >= 0) {
      me.setTotal(me.store.totalCount)
      me.lastTotalCount = me.store.totalCount
    }
    if (!me.autoCalcTotal) {
      // change total to undefined
      me.fireEvent('totalChanged', null)
    }
    me.resumeLayouts()
  },

  selectPage: function (basePage) {
    let me = this
    let menuItems = []
    let startItem, maxPage, endPage, totalCount
    let isLastPage = false
    let itemCount = 7
    let itemBefore = 3

    function onItemClick (item) {
      me.store.loadPage(item.itemNum)
    }

    startItem = basePage || (me.store.currentPage - itemBefore > 0 ? me.store.currentPage - itemBefore : 1)
    maxPage = startItem + itemCount

    totalCount = me.lastTotalCount !== null ? me.lastTotalCount : me.store.totalCount

    if (totalCount !== undefined && totalCount > 0) {
      endPage = totalCount / me.store.pageSize
      if (Math.floor(endPage) !== endPage) {
        endPage = endPage + 1
      }
      endPage = Math.floor(endPage)
      maxPage = endPage
      if (startItem > maxPage) {
        startItem = maxPage - itemCount > 0 ? maxPage - itemCount : 1
      }
      if (maxPage > startItem + itemCount - 1) {
        maxPage = startItem + itemCount - 1
      } else {
        isLastPage = true
      }
    }
    if (startItem > 1) {
      menuItems.push({
        text: 1,
        itemNum: 1,
        handler: onItemClick
      })
      if (startItem > 2) {
        menuItems.push({
          text: '...',
          handler: function () {
            // me.contextMenu.close();
            me.selectPage(startItem - itemCount <= 0 ? 1 : startItem - itemCount)
          }
        })
      }
    }
    for (let i = startItem; i <= maxPage; i++) {
      menuItems.push({
        // xtype: 'button',
        text: i,
        itemNum: i,
        disabled: me.store.currentPage === i,
        handler: onItemClick
      })
    }
    if (!isLastPage) {
      menuItems.push({
        text: '...',
        handler: function () {
          // me.contextMenu.close();
          me.selectPage(maxPage)
        }
      })
      if (endPage) {
        menuItems.push({
          xtype: 'label',
          text: endPage,
          disabled: true
        })
      }
    }

    if (!me.contextMenu) {
      me.contextMenu = Ext.create('Ext.menu.Menu', {
        width: 60,
        minWidth: 60,
        cls: 'ub-paging-tb-menu',
        plain: true,
        margin: '0 0 5 0',
        items: menuItems
      })
    } else {
      me.contextMenu.removeAll()
      me.contextMenu.add(menuItems)
    }
    if (menuItems.length > 0) {
      me.contextMenu.showBy(me.buttonPage)
    }
  },

  calcTotalRow: function () {
    if (this.autoCalcTotal) return // already calculated
    let store = this.store
    if (!store.ubRequest.options) {
      store.ubRequest.options = {}
    }
    store.ubRequest.options.totalRequired = true
    this.autoCalcTotal = true
    store.load()
  },

  decreaseTotal: function () {
    if (typeof (this.lastTotal) === 'number') {
      this.setTotal(this.lastTotal - 1)
    }
  },

  updateTotal: function () {
    this.setTotal(this.lastTotal || 0)
  },

  setTotal: function (totalCount) {
    let me = this
    let oldText = me.buttonCount.text || '   '
    let totalText = totalCount || totalCount === 0 ? Ext.util.Format.number(parseInt(totalCount, 10), '0,000') : '-'
    me.buttonCount.setText(totalText)
    me.buttonCount.setIconCls('')
    me.buttonCount.setTooltip(UB.i18n('totalRowCount'))

    if (totalText.length > oldText.length) { // prevent re-render
      me.setWidth(me.baseWidth + (me.buttonCount.rendered ? me.buttonCount.getWidth() : 0))
    }
    me.fireEvent('totalChanged', totalCount)
    me.lastTotal = totalCount
  },

  // @private
  getPageData: function () {
    let store = this.store
    let totalCount = store.getTotalCount()

    return {
      total: totalCount,
      currentPage: store.currentPage,
      pageCount: totalCount < 0 ? store.currentPage + 1 : Math.ceil(totalCount / store.pageSize),
      fromRecord: ((store.currentPage - 1) * store.pageSize) + 1,
      toRecord: Math.min(store.currentPage * store.pageSize, totalCount)
    }
  },

  /**
   * Move to the next page, has the same effect as clicking the 'next' button.
   */
  moveNext: function () {
    let me = this
    let pageData = me.getPageData()
    let total = pageData.pageCount
    let next = me.store.currentPage + 1

    if (pageData.total < 0 || next <= total) {
      if (me.fireEvent('beforechange', me, next) !== false) {
        me.store.nextPage()
      }
    }
  }
})
