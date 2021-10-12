Ext.define('UB.ux.tree.Column', {
  extend: 'Ext.grid.column.Column',
  alias: 'widget.ubtreecolumn',

  tdCls: Ext.baseCSSPrefix + 'grid-cell-treecolumn',

  autoLock: true,
  lockable: false,
  draggable: false,
  hideable: false,

  textCls: '', // Ext.baseCSSPrefix + 'tree-node-text',
  innerCls: 'ub_tree_inner-col', // Ext.baseCSSPrefix + 'grid-cell-inner-treecolumn',
  isTreeColumn: true,

  cellTpl: [
    '<tpl for="lines">',
    '<span class="{parent.lineCLS}{#}" ></span>',
    '</tpl>',
    '<tpl if="iconCls">',
    '<span class="ub_tree_icon ub_tree_depth ub_tree_depth_{depth} {iconCls}"></span>',
    '</tpl>',
    '<span class="ub_tree_text ub_tree_depth ub_tree_depth_{depth} ',
    '<tpl if="isNode">ub_tree_text_group</tpl>',
    ' {textCls}">{value}</span>',
    '<tpl if="isNode"><span class=',
    '"ub_tree_group ub_tree_depth ub_tree_depth_{depth} fa <tpl if="expanded">fa-caret-down<tpl else>fa-caret-right</tpl>"',
    '></span>',
    '<tpl else><span class="ub_tree_group ub_tree_depth ub_tree_depth_{depth}"></tpl>'
  ],

  initComponent: function () {
    const me = this
    let renderer = me.renderer

    if (typeof renderer === 'string') {
      renderer = Ext.util.Format[renderer]
    }
    me.origRenderer = renderer
    me.origScope = me.scope || window

    me.renderer = me.treeRenderer
    me.scope = me

    me.callParent()
  },

  treeRenderer: function (value, metaData, record, rowIdx, colIdx, store, view) {
    const me = this
    const cls = record.get('cls')

    if (cls) {
      metaData.tdCls += ' ' + cls
    }

    const rendererData = me.initTemplateRendererData(value, metaData, record, rowIdx, colIdx, store, view)

    return me.getTpl('cellTpl').apply(rendererData)
  },

  initTemplateRendererData: function (value, metaData, record, rowIdx, colIdx, store, view) {
    const me = this
    const renderer = me.origRenderer
    const data = record.data
    let parent = record.parentNode
    const rootVisible = view.rootVisible
    const showLines = view.showTreeLines
    // levelOffset = view.levelOffset || 10,
    // lineOffset = 0,
    const lines = []
    let parentData

    while (parent && (parent.data.depth > 0)) {
      parentData = parent.data
      lines[rootVisible
        ? parentData.depth
        : parentData.depth - 1] = parentData.isLast ? 0 : 1
      parent = parent.parentNode
    }

    return {
      record: record,
      baseIconCls: me.iconCls,
      iconCls: data.iconCls, // ? data.iconCls : 'fa fa-columns', // data.iconCls,
      icon: data.icon,
      checkboxCls: me.checkboxCls,
      checked: data.checked,
      elbowCls: me.elbowCls,
      expanderCls: me.expanderCls,
      textCls: me.textCls,
      leaf: data.leaf,
      expanded: data.expanded,
      isNode: record.hasChildNodes(), // isLeaf()
      depth: record.getDepth(),
      expandable: record.isExpandable(),
      isLast: data.isLast,
      blankUrl: Ext.BLANK_IMAGE_URL,
      href: data.href,
      hrefTarget: data.hrefTarget,
      lines: lines,
      metaData: metaData,
      // subclasses or overrides can implement a getChildCls() method, which can
      // return an extra class to add to all of the cell's child elements (icon,
      // expander, elbow, checkbox).  This is used by the rtl override to add the
      // "x-rtl" class to these elements.
      childCls: me.getChildCls ? me.getChildCls() + ' ' : '',
      lineCLS: showLines ? 'ub_tree_line_visible ub_tree_line_visible' : 'ub_tree_line ub_tree_line',
      // lineCLS: 'ub_tree_line',
      value: renderer ? renderer.apply(me.origScope, arguments) : value
    }
  }
})
