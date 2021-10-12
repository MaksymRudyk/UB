/*
 * author: Nozhenko
 */
UB.core.UBUtilTree = {
  arrayToTreeRootNode,
  addToParent
}

function arrayToTreeRootNode (data) {
  let root = {
    leaf: false,
    id: 0,
    expanded: true
  }

  let items = { 0: root }

  for (let i = 0, len = data.length; i < len; ++i) {
    let row = data[i]

    let item = items[row.id]
    if (!item) {
      item = items[row.id] = row
    } else {
      Ext.applyIf(item, row)
    }
    let parent = items[row.parentId || 0]
    if (!parent) {
      parent = items[row.parentId] = { id: row.parentId }
    }
    if (!parent.children) {
      parent.children = []
    }
    parent.children.push(item)
  }

  return root
}

/**
 *
 * @param {Ext.data.NodeInterface} parent
 * @param {Array<object>} childNodes
 */
function addToParent (parent, childNodes) {
  childNodes.forEach(function (node) {
    let elm = parent.appendChild(node)
    if (node.children && node.children.length) {
      UB.core.UBUtilTree.addToParent(elm, node.children)
    }
  })
}
