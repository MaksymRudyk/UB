/* global Ext */
/**
 * Файл: UB.ux.UBObject.js
 * Автор: Игорь Ноженко
 *
 * Расширение Ext.Component для отображения документа
 */
Ext.define('UB.ux.UBObject', {
  extend: 'Ext.Component',
  alias: 'widget.ubobject',
  type: '',
  width: '100%',
  height: '100%',

  getElConfig: function () {
    var
      config = this.callParent()

    var obj

    if (this.autoEl === 'object') {
      obj = config
    } else {
      config.cn = [obj = {
        tag: 'object',
        id: this.id + '-object'
      }]
    }

    obj.type = this.type
    obj.data = this.data

    obj.width = this.width
    obj.height = this.height

    return config
  },

  onRender: function () {
    this.callParent(arguments)
    this.objEl = (this.autoEl === 'object') ? this.el : this.el.getById(this.id + '-object')
  },

  onDestroy: function () {
    Ext.destroy(this.objEl)
    this.objEl = null
    this.callParent()
  },

  /**
   * @param cfg
   * @returns {Promise}
   */
  setSrc: function (cfg) {
    this.type = cfg.contentType
    this.data = cfg.url + (this.forceMIME ? '&forceMIME=' + encodeURIComponent(this.forceMIME) : '')

    if (this.objEl) {
      this.objEl.dom.type = this.type
      this.objEl.dom.data = this.data
    }
    return Promise.resolve(true)
  },

  setXSize: function (prm) {
    this.width = prm.width
    this.height = prm.height
    if (this.objEl) {
      this.objEl.dom.width = '100%'// this.width;
      this.objEl.dom.height = '100%'// this.height;
    }
  }
})
