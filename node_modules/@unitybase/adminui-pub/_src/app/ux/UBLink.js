/* global saveAs, Ext, $App, Blob, UB  */
/**
 * @class  UB.ux.UBLink
 * Show content of UnityBase `document` type attribute as a HTML link
 */
Ext.define('UB.ux.UBLink', {
  extend: 'Ext.Component',
  alias: 'widget.ublink',

  autoEl: 'a',
  href: 'javascript:;',
  html: '',
  target: '_blank',

  getElConfig: function () {
    let config = this.callParent()

    let a

    if (this.autoEl === 'a') {
      a = config
    } else {
      config.cn = [a = {
        tag: 'a',
        target: '_blank',
        id: this.id + '-a'
      }]
    }

    a.href = 'javascript:;'// 'javascript:void(0)';
    a.target = a.target || this.target
    a.style = a.style || {}
    a.style.wordBreak = 'break-all'
    return config
  },

  onRender: function () {
    var
      el; var me = this

    this.callParent(arguments)

    el = this.el
    el.on('click', function () {
      if (!me.useBlobForData) {
        $App.connection.authorize().then(function (session) {
          me.dom.href = Ext.String.urlAppend(me.href, 'session_signature=' + session.signature())
        })
      } else {
        $App.connection.get(me.dataUrl, { responseType: 'arraybuffer' })
          .then(function (response) {
            var blobData

            var byteArray = response.data
            blobData = new Blob(
              [byteArray],
              { type: me.srcConfig.contentType }
            )
            saveAs(blobData, me.srcConfig.html || (me.srcConfig.params ? me.srcConfig.params.origName : ''))
          }).catch(function (reason) {
            if (reason.status === 404) {
              me.html = '<span style="color: red">' + UB.i18n('documentNotFound') + '<span/>'
              if (me.aEl) {
                me.aEl.dom.innerHTML = me.html
                me.aEl.dom.href = '_blank'
              }
            }
          })
      }
    })
    this.aEl = (this.autoEl === 'a') ? el : el.getById(this.id + '-a')
  },

  setSrc: function (cfg) {
    var
      aEl = this.aEl

    var me = this

    me.dataUrl = cfg.url
    me.srcConfig = cfg

    me.html = cfg.html
    if (me.aEl && cfg) {
      me.aEl.dom.download = cfg.html || (cfg.params ? cfg.params.origName : '')
    }
    if (aEl) {
      aEl.dom.innerHTML = cfg.html
    }
    return Promise.resolve(true)
  },

  onDestroy: function () {
    var me = this
    Ext.destroy(me.aEl)
    me.aEl = null
    this.callParent()
  }

})
