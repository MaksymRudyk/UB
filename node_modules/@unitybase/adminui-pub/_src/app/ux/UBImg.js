/**
 * UnityBase image component. Able to encode/decode image in case of encrypted communications.
 */
Ext.define('UB.ux.UBImg', {
  extend: 'Ext.Img',
  alias: 'widget.ubimg',
  style: 'object-fit:contain',

  constructor: function () {
    this.useBlobForData = true
    this.dataBlob = null
    this.dataUrl = null
    this.objUrl = null
    this.callParent(arguments)
  },

  useBlobForData: true,

  updateDataBlob: function (inblob) {
    var me = this
    if (!me.useBlobForData) {
      Ext.Error.raise('object does not use Blob')
    }
    if (me.dataBlob && !Ext.isEmpty(this.objUrl)) {
      window.URL.revokeObjectURL(this.objUrl)
    }
    me.data = null
    me.dataBlob = inblob
    me.objUrl = window.URL.createObjectURL(inblob)
    me.data = me.objUrl
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
        me.callParent([me.data])
      } else {
        return $App.connection.get(me.dataUrl, { responseType: 'arraybuffer' })
          .then(function (response) {
            var byteArray = response.data
            cfg.blobData = new Blob(
              [byteArray],
              { type: cfg.contentType }
            )
            return me.setSrc(cfg)
          }).catch(function (reason) {
            if (reason.status === 404) {
              if (cfg.onContentNotFound) {
                cfg.onContentNotFound()
              } else {
                UB.showErrorWindow('<span style="color: red">' + UB.i18n('documentNotFound') + '<span/>')
              }
            }
            return reason
          })
      }
    } else {
      me.data = me.dataUrl
      me.callParent([me.data])
    }
    return Promise.resolve(true)
  }
})
