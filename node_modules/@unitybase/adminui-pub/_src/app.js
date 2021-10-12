/* global SystemJS, Ext */
const UB = require('@unitybase/ub-pub')
const $App = require('./app/core/UBApp')
require('./app/view/UBDropZone')
require('./app/view/ErrorWindow')
require('./app/core/UBUtilTree')

/**
 * Main UnityBase Ext-based client file
 */

function launchApp () {
  // disable shadow for all floating window
  Ext.Window.prototype.floating = { shadow: false }
  Ext.util.Floating.prototype.shadow = false
  Ext.tip.QuickTip.prototype.shadow = false
  Ext.tip.Tip.prototype.shadow = false
  Ext.LoadMask.prototype.floating.shadow = false
  Ext.menu.Menu.prototype.shadow = false
  Ext.Editor.prototype.shadow = false
  Ext.form.field.ComboBox.prototype.defaultListConfig.shadow = false
  Ext.picker.Date.prototype.shadow = false

  const addResourceVersion = UB.addResourceVersion
  Ext.Loader.loadScriptBase = Ext.Loader.loadScript
  Ext.Loader.loadScript = function (options) {
    const config = this.getConfig()
    let opt = options
    if (!config.disableCaching) {
      const isString = typeof options === 'string'
      if (!isString) {
        opt = Ext.clone(options)
        opt.url = addResourceVersion(opt.url)
      } else {
        opt = addResourceVersion(opt)
      }
    }
    this.loadScriptBase(opt)
  }

  Ext.Loader.loadScriptFileBase = Ext.Loader.loadScriptFile
  Ext.Loader.loadScriptFile = function (url, onLoad, onError, scope, synchronous) {
    try {
      // throw below required to log a stack trace to console
      // noinspection ExceptionCaughtLocallyJS
      throw new Error('Component "' + url + '" is loaded directly using Ext.require or inderectly by one of Ext.create({"requires":.., "extend": ..., "mixins": ...}) directive) - in UB>=4 use require() instead')
    } catch (e) {
      console.warn(e)
    }
    Ext.Loader.isLoading = true
    SystemJS.import(url).then(
      function () {
        return onLoad.call(scope)
      },
      function () {
        return onError.call(scope)
      }
    )
  }

  Ext.onReady(extLoaded)
  /**
   * !!!
   * Patch for correct work with timezones
   * !!!
   * */
  Ext.JSON.encodeDate = JSON.stringify

  /**
   * Wrapper in global scope, that allows to use toLog() function on client in the same way
   * as on server. It forwards message to console.debug().
   * @param {String} message text, which you want to log
   * @param {String} [param] text which will replace '%' char in message
   */
  window.toLog = function (message, param) {
    if (console && console.debug) {
      if (param) {
        console.debug(message.replace('%', '%s'), param)
      } else {
        console.debug(message)
      }
    }
  }

  // Ext.onReady(function () {
  function extLoaded () {
    Ext.tip.QuickTipManager.init()
    // this override is just for set separate mask for modal windows & loading mask
    // one line of code changed compared to original: cls: Ext.baseCSSPrefix + 'modal-mask', //mpv
    Ext.override(Ext.ZIndexManager, {
      _showModalMask: function (comp) {
        const me = this
        const zIndex = comp.el.getStyle('zIndex') - 4
        const maskTarget = comp.floatParent ? comp.floatParent.getTargetEl() : comp.container
        let mask = me.mask

        if (!mask) {
          // Create the mask at zero size so that it does not affect upcoming target measurements.
          mask = me.mask = Ext.getBody().createChild({
            role: 'presentation',
            cls: 'ub-mask'// Ext.baseCSSPrefix + 'modal-mask', //mpv
            // style: 'height:0;width:0'
          })
          mask.setVisibilityMode(Ext.Element.DISPLAY)
          mask.on('click', me._onMaskClick, me)
        }

        mask.maskTarget = maskTarget

        mask.setStyle('zIndex', zIndex)

        // setting mask box before showing it in an IE7 strict iframe within a quirks page
        // can cause body scrolling [EXTJSIV-6219]
        mask.show()
      }
    })

    /**
     * Patch for HUGE speed-up of all ext component destruction
     */
    Ext.override(Ext.AbstractManager, {
      unregister: function (item) {
        if (item.id) {
          this.all.removeAtKey(item.id)
        } else {
          this.all.remove(item)
        }
      }
    })

    // Patch for "skip" form. When "Ext.LoadMask" use "visibility" for hide mask element and element extends beyond the screen the "viewPort" is expanding.
    Ext.override(Ext.LoadMask, {
      getMaskEl: function () {
        if (this.maskEl || this.el) {
          (this.maskEl || this.el).setVisibilityMode(Ext.Element.DISPLAY)
        }
        return this.callParent(arguments)
      }
    })

    // fix hide submenu (in chrome 43)
    Ext.override(Ext.menu.Menu, {
      onMouseLeave: function (e) {
        // BEGIN FIX
        let visibleSubmenu = false
        this.items.each(function (item) {
          if (item.menu && item.menu.isVisible()) {
            visibleSubmenu = true
          }
        })
        if (visibleSubmenu) {
          // console.log('apply fix hide submenu');
          return
        }
        // END FIX

        this.deactivateActiveItem()
        if (this.disabled) return

        this.fireEvent('mouseleave', this, e)
      }
    })

    /* solutions for problems with a narrow field of chromium */
    Ext.override(Ext.layout.component.field.Field, {
      beginLayoutFixed: function (ownerContext, width, suffix) {
        const owner = ownerContext.target
        const inputEl = owner.inputEl
        const inputWidth = owner.inputWidth

        owner.el.setStyle('table-layout', 'fixed')
        if (width !== 100 && suffix !== '%') {
          owner.bodyEl.setStyle('width', width + suffix)
        }
        if (inputEl) {
          if (inputWidth) {
            inputEl.setStyle('width', inputWidth + 'px')
          }
        }
        ownerContext.isFixed = true
      }
    })

    /**
     * It is override Ext.form.field.Text for visually select required field
     */
    Ext.override(Ext.form.field.Text, {
      initComponent: function () {
        this.requiredCls = 'ub-require-control-u'
        this.callParent(arguments)
      },

      afterRender: function () {
        this.callParent(arguments)
        if (!this.allowBlank) {
          this.setAllowBlank(this.allowBlank)
        }
      },

      fieldSubTpl: [ // note: {id} here is really {inputId}, but {cmpId} is available
        '<input id="{id}" type="{type}" role="{role}" {inputAttrTpl}',
        // ' size="1"', /* solutions for problems with a narrow field of chromium */ // allows inputs to fully respect CSS widths across all browsers
        '<tpl if="name"> name="{name}"</tpl>',
        '<tpl if="value"> value="{[Ext.util.Format.htmlEncode(values.value)]}"</tpl>',
        '<tpl if="placeholder"> placeholder="{placeholder}"</tpl>',
        '{%if (values.maxLength !== undefined){%} maxlength="{maxLength}"{%}%}',
        '<tpl if="readOnly"> readonly="readonly"</tpl>',
        '<tpl if="disabled"> disabled="disabled"</tpl>',
        '<tpl if="tabIdx"> tabIndex="{tabIdx}"</tpl>',
        '<tpl if="fieldStyle"> style="{fieldStyle}"</tpl>',
        ' class="{fieldCls} {typeCls} {editableCls} {inputCls} x-form-field-text" />', // autocomplete="off"
        {
          disableFormats: true
        }
      ],

      /**
       *  @cfg {String} requireText Text for placeHolder. Default value 'pleaseInputValueToThisField'.
       */
      requireText: '',
      /**
       * This method allow change the allowBlank property dynamically
       * @param allowBlank
       */
      setAllowBlank: function (allowBlank) {
        this.allowBlank = allowBlank

        if (this.labelEl) {
          if (allowBlank) {
            this.labelEl.removeCls('x-label-required')
          } else {
            this.labelEl.addCls('x-label-required')
          }
        }

        if (!this.inputEl) {
          return
        }
        if (allowBlank) {
          this.inputEl.removeCls(this.requiredCls)
          this.inputEl.dom.removeAttribute('placeholder')
        } else {
          // do not allow to enter a string with all whitespaces
          this.allowOnlyWhitespace = false
          this.inputEl.addCls(this.requiredCls)
          if (this.requireText) {
            this.inputEl.dom.setAttribute('placeholder', UB.i18n(this.requireText))
          }
        }
      }
    })
    Ext.override(Ext.grid.plugin.RowEditing, {
      validateEdit: function () {
        const me = this
        const context = me.context
        return me.fireEvent('validateedit', me, context) !== false && !context.cancel && this.getEditor().completeEdit()
      }
    })
    Ext.override(Ext.form.field.Base, {
      /**
       * @cfg leftIndent Width in pixels of left field indent. Default 15.
       */
      leftIndent: 15,
      /**
       * @cfg rightIndent Width in pixels of right field indent. Default 15.
       */
      rightIndent: 15,
      /**
       * @cfg withoutIndent Disable all field indent when true. Default true.
       */
      margin: '3 15 2 15',
      withoutIndent: true,
      getLabelableRenderData: function () {
        const data = this.callParent(arguments)
        if (!this.withoutIndent) {
          data.leftIndent = this.leftIndent
          data.rightIndent = this.rightIndent
        }
        return data
      },

      labelableRenderTpl: [
        // body row. If a heighted Field (eg TextArea, HtmlEditor, this must greedily consume height.
        '<tr role="presentation" id="{id}-inputRow" <tpl if="inFormLayout">id="{id}"</tpl> class="{inputRowCls}">',
        '<tpl if="leftIndent">',
        '<td class="labelable-left-indent" style="width: {leftIndent}px;" ></td>',
        '</tpl>',

        // Label cell
        '<tpl if="labelOnLeft">',
        '<td role="presentation" id="{id}-labelCell" style="{labelCellStyle}" {labelCellAttrs}>',
        '{beforeLabelTpl}',
        '<label id="{id}-labelEl" {labelAttrTpl}',
        '<tpl if="inputId && !(boxLabel && !fieldLabel)"> for="{inputId}"</tpl>',
        ' class="{labelCls}',
        // do not add required to checkobox
        '<tpl if="allowBlank !== undefined && !allowBlank && (extraFieldBodyCls !== \'x-form-cb-wrap\')"> x-label-required</tpl>',
        '"',
        '<tpl if="labelStyle"> style="{labelStyle}"</tpl>',
        // Required for Opera
        ' unselectable="on"',
        '>',
        '{beforeLabelTextTpl}',
        '<tpl if="fieldLabel">{fieldLabel}',
        '<tpl if="labelSeparator">',
        '<span role="separator">{labelSeparator}</span>',
        '</tpl>',
        '</tpl>',
        '{afterLabelTextTpl}',
        '</label>',
        '{afterLabelTpl}',
        '</td>',
        '</tpl>',

        // Body of the input. That will be an input element, or, from a TriggerField, a table containing an input cell and trigger cell(s)
        '<td role="presentation" class="{baseBodyCls} {fieldBodyCls} {extraFieldBodyCls}" id="{id}-bodyEl" colspan="{bodyColspan}">',
        '{beforeBodyEl}',

        // Label just sits on top of the input field if labelAlign === 'top'
        '<tpl if="labelAlign==\'top\'">',
        '{beforeLabelTpl}',
        '<div role="presentation" id="{id}-labelCell" style="{labelCellStyle}">',
        '<label id="{id}-labelEl" {labelAttrTpl}<tpl if="inputId"> for="{inputId}"</tpl> class="{labelCls}',
        '<tpl if="allowBlank !== undefined && !allowBlank && (extraFieldBodyCls !== \'x-form-cb-wrap\')"> x-label-required</tpl>',
        '"',
        '<tpl if="labelStyle"> style="{labelStyle}"</tpl>',
        // Required for Opera
        ' unselectable="on"',
        '>',
        '{beforeLabelTextTpl}',
        '<tpl if="fieldLabel">{fieldLabel}',
        '<tpl if="labelSeparator">',
        '<span role="separator">{labelSeparator}</span>',
        '</tpl>',
        '</tpl>',
        '{afterLabelTextTpl}',
        '</label>',
        '</div>',
        '{afterLabelTpl}',
        '</tpl>',

        '{beforeSubTpl}',
        '{[values.$comp.getSubTplMarkup(values)]}',
        '{afterSubTpl}',

        // Final TD. It's a side error element unless there's a floating external one
        '<tpl if="msgTarget===\'side\'">',
        '{afterBodyEl}',
        '</td>',
        '<td role="presentation" id="{id}-sideErrorCell" vAlign="{[values.labelAlign===\'top\' && !values.hideLabel ? \'bottom\' : \'middle\']}" style="{[values.autoFitErrors ? \'display:none\' : \'\']}" width="{errorIconWidth}">',
        '<div role="alert" aria-live="polite" id="{id}-errorEl" class="{errorMsgCls}" style="display:none"></div>',
        '</td>',
        '<tpl elseif="msgTarget==\'under\'">',
        '<div role="alert" aria-live="polite" id="{id}-errorEl" class="{errorMsgClass}" colspan="2" style="display:none"></div>',
        '{afterBodyEl}',
        '</td>',
        '</tpl>',
        '<tpl if="rightIndent">',
        '<td class="labelable-right-indent" style="width: {rightIndent}px;" ></td>',
        '</tpl>',
        '</tr>',
        {
          disableFormats: true
        }
      ]
    })

    Ext.override(Ext.form.FieldContainer, {
      margin: '0 15 0 15'
    })

    Ext.override(Ext.layout.container.Accordion, {
      beforeRenderItems: function (items) {
        for (let i = 0, l = items.length; i < l; i++) {
          items[i].simpleCollapse = true
        }
        this.callParent([items])
      }
    })

    /**
     * Fix ext bug - On error no red border.
     */
    Ext.define('Ext.ux.form.CheckboxGroupFix', {
      override: 'Ext.form.CheckboxGroup',
      initComponent: function () {
        const me = this
        me.invalidCls = me.invalidCls ? me.invalidCls : Ext.baseCSSPrefix + 'form-invalid'
        me.callParent(arguments)
      }
    })

    /**
     * patch for target control rendered in bottom of screen.
     */
    Ext.define('UB.ux.UBToolTipOverride', {
      override: 'Ext.tip.ToolTip',
      getTargetXY: function () {
        const
          me = this
        const resXY = this.callParent(arguments)
        const constr = Ext.getBody().getViewSize()
        if (me.targetXY) {
          if (resXY[1] + me.getHeight() > constr.height) {
            resXY[1] = me.targetXY[1] - 15 - me.getHeight()
          }
        }
        return resXY
      }
    })

    Ext.override(Ext.panel.Panel, {
      initTools: function () {
        const me = this
        if (me.simpleCollapse) {
          me.tools = []

          me.toggleCmp = Ext.widget({
            xtype: 'component',
            autoEl: {
              tag: 'div'
            },
            height: 15,
            width: 35,
            isHeader: true,
            id: me.id + '-legendToggle',
            style: 'float: left; font-size: 1.4em; padding-left: 12px; cursor: pointer;',
            scope: me
          })
          me.toggleCmp.on('boxready', function () {
            // me.toggleCmp.getEl().on('click', me.toggle, me);
          })
          if (!me.collapsed) {
            me.toggleCmp.addCls(['fa', 'fa-angle-down'])
          } else {
            me.toggleCmp.addCls(['fa', 'fa-angle-right'])
          }

          const vertical = me.headerPosition === 'left' || me.headerPosition === 'right'
          me.header = Ext.widget(Ext.apply({
            xtype: 'header',
            title: me.title,
            titleAlign: me.titleAlign,
            orientation: vertical ? 'vertical' : 'horizontal',
            dock: me.headerPosition || 'top',
            textCls: me.headerTextCls,
            iconCls: me.iconCls,
            icon: me.icon,
            glyph: me.glyph,
            baseCls: me.baseCls + '-header',
            tools: [me.toggleCmp],
            ui: me.ui,
            id: me.id + '_header',
            overCls: me.headerOverCls,
            indicateDrag: me.draggable,
            frame: (me.frame || me.alwaysFramed) && me.frameHeader,
            ignoreParentFrame: me.frame || me.overlapHeader,
            ignoreBorderManagement: me.frame || me.ignoreHeaderBorderManagement,
            headerRole: me.headerRole,
            ownerCt: me,
            listeners: me.collapsible && me.titleCollapse
              ? {
                  click: me.toggleCollapse,
                  scope: me
                }
              : null
          }, me.header))

          me.header.titleCmp.flex = undefined
          me.header.addCls(['accordion-header'])

          me.addDocked(me.header, 0)
        } else {
          me.callParent(arguments)
        }
      },

      toggleC: function () {
        if (!this.toggleCmp) {
          return
        }
        if (!this.collapsed) {
          this.toggleCmp.removeCls('fa-angle-right')
          this.toggleCmp.addCls('fa-angle-down')
        } else {
          this.toggleCmp.removeCls('fa-angle-down')
          this.toggleCmp.addCls('fa-angle-right')
        }
      },

      expand: function (animate) {
        this.callParent(arguments)
        this.toggleC()
      },

      collapse: function (direction, animate) {
        this.callParent(arguments)
        this.toggleC()
      },

      updateCollapseTool: function () {
        if (!this.simpleCollapse) {
          this.callParent(arguments)
        }
      }
    })

    delete Ext.tip.Tip.prototype.minWidth

    Ext.Ajax.timeout = 120000

    if ('onHashChange' in window) {
      window.addEventListener('hashchange', UB.core.UBApp.locationHashChanged, false)
    } else {
      window.onhashchange = UB.core.UBApp.locationHashChanged
    }

    // not need for FontAwesome5 Ext.setGlyphFontFamily('FontAwesome')

    Ext.state.Manager.setProvider(Ext.create('Ext.state.LocalStorageProvider'))
    // Ext.FocusManager.enable({focusFrame: true});
    $App.launch().finally(function () {
      Ext.get(Ext.query('html.loading')).removeCls('loading')
    })

    // Cancel the default behavior Ctrl+R to of the user input is not lost

    // eslint-disable-next-line
    new Ext.util.KeyMap({
      target: window.document.body,
      binding: [{
        ctrl: true,
        shift: false,
        key: Ext.EventObject.R,
        fn: function (keyCode, e) {
          e.stopEvent()
          return false
        }
      }]
    })

    // Stop the backspace key from going to the previous page in your extjs app
    Ext.EventManager.addListener(Ext.getBody(), 'keydown', function (e) {
      const type = (e.getTarget().tagName || '').toLocaleLowerCase()
      const eKey = e.getKey()
      if (eKey === Ext.EventObject.BACKSPACE && 'textarea|input'.indexOf(type) < 0) {
        e.preventDefault()
      }
    })

    // init dropzone
    UB.view.UBDropZone.init()

    window.onbeforeunload = function () {
      const LDS = ((typeof window !== 'undefined') && window.localStorage) ? window.localStorage : false
      if (LDS && LDS.getItem(UB.LDS_KEYS.PREVENT_CALL_LOGOUT_ON_UNLOAD) === 'true') {
        // prevent call logout in case document.location.href is set to WebDaw URI Schema (ms-word....)
        LDS.setItem(UB.LDS_KEYS.PREVENT_CALL_LOGOUT_ON_UNLOAD, 'false')
        return
      }
      window.onbeforeunload = null
      window.toLog = null
      window.onerror = null
      if ($App.connection) {
        $App.connection.logout()
      }
    }
    // totally disable context menu for cases we do not handle it on application logic layer
    document.addEventListener('contextmenu', function (e) {
      e.preventDefault()
    }, false)
  }
}

module.exports = {
  launchApp,
  /** @type {UB.core.UBApp} */
  $App
}
