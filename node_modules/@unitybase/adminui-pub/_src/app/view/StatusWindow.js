/**
 * Реализует функционал status window при сканировании. Используется в модуле сканирования и сторонними проектами
 *
 * @private
 */
Ext.define('UB.view.StatusWindow', {
  extend: 'Ext.window.Window',
  alias: 'widget.statuswindow',

  autoShow: true,
  height: 70,
  width: 400,
  modal: true,
  closable: false,

  initComponent: function () {
    this.items = [Ext.create('Ext.Img', {
      src: $App.getImagePath('scan-to-pdf.png'),
      margin: 3,
      style: {
        verticalAlign: 'middle'
      }
    }),
    this.statusLabel = Ext.create('Ext.form.Label')
    ]

    this.callParent()
  },

  setStatus: function (text) {
    if (!this.statusLabelEl) { this.statusLabelEl = this.statusLabel.getEl() }

    if (this.statusLabelEl &&
            this.statusLabelEl.dom.innerHTML === text) { return }

    this.statusLabel.setText(text)
  }
})
