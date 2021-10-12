require('./UBObject.js')
/**
 * Class for visualise PDF filed
 */
Ext.define('UB.ux.PDFComponent', {
  extend: 'UB.ux.UBObject',
  alias: 'widget.ubpdf',
  type: 'application/pdf',

  constructor: function () {
    this.useBlobForData = true
    this.dataBlob = null
    this.dataUrl = null
    this.objUrl = null
    this.data = null
    this.callParent(arguments)
  },

  getElConfig: function () {
    let config = this.callParent()
    config.cn = [{
      tag: 'div',
      width: this.width,
      height: this.height
    }]

    return config
  },

  afterRender: function () {
    this.callParent(arguments)
    if (this.data) {
      this.afterSetUrl()
    }
  },

  useBlobForData: true,

  getDataBlob: function () {
    if (!this.useBlobForData) {
      Ext.Error.raise('object does not use Blob')
    }
    return this.dataBlob
  },

  updateDataBlob: function (inBlob) {
    if (!this.useBlobForData) {
      Ext.Error.raise('object does not use Blob')
    }
    if (this.dataBlob && !Ext.isEmpty(this.objUrl)) {
      window.URL.revokeObjectURL(this.objUrl)
    }
    this.data = null
    this.dataBlob = inBlob
    this.objUrl = window.URL.createObjectURL(inBlob)
    let viewerCfg = UB.connection.appConfig.uiSettings.adminUI.pdfViewer
    let urlSuffix
    if (viewerCfg) {
      if (viewerCfg.uriSuffix === undefined) {
        urlSuffix = '#view=Fit'
      } else {
        urlSuffix = viewerCfg.uriSuffix
      }
    } else {
      urlSuffix = '#view=Fit'
    }
    this.data = this.objUrl + urlSuffix
  },

  onDestroy: function () {
    var me = this
    me.dataBlob = null
    me.data = null
    if (me.useBlobForData && !Ext.isEmpty(me.objUrl)) {
      window.URL.revokeObjectURL(me.objUrl)
    }
    me.objUrl = null
    this.callParent()
  },

  updateDataUrl: function () {
    var oldUrl = this.data
    this.data = ''
    this.data = oldUrl
  },

  afterSetUrl: function () {
    const viewerCfg = UB.connection.appConfig.uiSettings.adminUI.pdfViewer
    let src
    if (viewerCfg && viewerCfg.customURI) {
      let f = this.up('form')
      src = UB.format(viewerCfg.customURI, encodeURIComponent(this.data), $App.connection.userData('lang'), (f && f.instanceID), (f && f.entityName))
    } else {
      src = this.data
    }
    let obj = {
      tag: 'iframe',
      type: this.type,
      src: src,
      width: this.width,
      height: this.height
    }

    let el = this.getEl()
    if (el) {
      el.setHTML('').appendChild(obj)
    }
  },

  /**
   *
   * @param {Object} cfg
   * @param {String} cfg.url
   * @param {String} cfg.contentType
   * @param {Blob} [cfg.blobData] (Optional) for loading data from exists blob
   * @return {Promise}
   */
  setSrc: function (cfg) {
    var
      me = this

    var data = cfg.url

    var blobData = cfg.blobData

    me.dataUrl = data

    if (me.useBlobForData) {
      if (blobData) {
        me.updateDataBlob(blobData)
        me.afterSetUrl()
      } else {
        return $App.connection.get(me.dataUrl, { responseType: 'arraybuffer' })
          .then(function (response) {
            var pdfArray = response.data
            me.updateDataBlob(new Blob(
              [pdfArray],
              { type: 'application/pdf' }
            ))
            me.afterSetUrl()
          }).catch(function (reason) {
            if (reason.status !== 401) {
              if (cfg.onContentNotFound) {
                cfg.onContentNotFound()
              } else {
                UB.showErrorWindow('<span style="color: red">' + UB.i18n('documentNotFound') + '<span/>')
              }
            }
          }).then()
      }
    } else {
      me.data = me.dataUrl
      me.afterSetUrl()
    }
    return Promise.resolve(true)
  }

})
