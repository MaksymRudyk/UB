exports.reportCode = {
  /**
  * This function must be defined in report code block.
  *
  * Inside function you must:
  * 1) Prepare data
  * 2) Run method this.buildHTML(reportData); where reportData is data for mustache template
  * 3) If need create PDF run method this.transformToPdf(htmlReport); where htmlReport is HTML
  * 4) If is server side function must return report as string otherwise Promise or string
  *
  * @cfg {function} buildReport
  * @params {[]|{}} reportParams
  * @returns {Promise|Object} If code run on server method must return report data.
  * Promise object must be resolved report code
  */
  buildReport: function (reportParams) {
    const me = this
    return UB.Repository('cdn_country').attrs(['ID', 'name', 'mi_owner', 'mi_owner.name', 'mi_modifyDate']).selectAsObject({'mi_owner.name': 'ownerName'})
      .then(function (countries) {
        let result
        const data = {
          countries: countries,
          date: new Date(),
          num: 1234567.89,
          negNum: -1234567.89,
          dateObj: {
            dInner: new Date()
          }
        }
        switch (me.reportType) {
          case 'pdf':
            result = me.buildHTML(data)
            result = me.transformToPdf(result)
            break
          case 'html':
            result = me.buildHTML(data)
            break
          case 'xlsx':
            result = me.buildXLSX(data)
            break
        }
        return result
      })
  },
  onReportClick: function (e) {
    // prevent default action
    e.preventDefault()
    // get table/cell/row based on event target
    let cellInfo = UBS.UBReport.cellInfo(e)
    // get entity from a table header dataset (in HTML templete <th> element contains data-entity="entityCode"
    let entity = cellInfo.table.rows[0].cells[cellInfo.colIndex].dataset.entity
    // get ID from clicked <a>. (in HTML template <a> element contains data-id="id value"
    let ID = parseInt(e.target.dataset.id, 10)
    // to get data from clicked row
    // let dataFromRow = cellInfo.row.dataset.yourAttrName
    // to get data from clicked cell
    // let cellInfo.cell.dataset.yourAttributeName
    if (cellInfo.colIndex === 1) {
      // for first column there is only one action - execute it
      $App.doCommand({cmdType: 'showForm', entity: entity, instanceID: ID})
    } else {
      // for second column show context menu and let user choose action
      this.contextMenu.removeAll()
      const menuItems = [{
        text: `Action1 for row: ${cellInfo.rowIndex} col: ${cellInfo.colIndex}, ID: ${ID}`,
        handler: () => $App.doCommand({cmdType: 'showForm', entity: entity, instanceID: ID})
      }, {
        text: `Another action`,
        handler: () => $App.doCommand({cmdType: 'showForm', entity: entity, instanceID: ID})
      }, {
        xtype: 'menuseparator'
      }, {
        text: `And one more`,
        handler: () => $App.doCommand({cmdType: 'showForm', entity: entity, instanceID: ID})
      }]
      this.contextMenu.add(menuItems)
      this.contextMenu.showAt([e.x + this.el.getX(), e.y + this.el.getY()])
    }
  },
  onAfterRender: function (iFrame) {
    // prevent content menu for all tr elements
    function onTrContextmenu(e) {
      e.preventDefault()
    }
    const trList = iFrame.contentDocument.getElementsByTagName('tr')
    for (let i = 0, L = trList.length; i < L; i++) {
      trList[i].addEventListener('contextmenu', onTrContextmenu)
    }
  }
}
