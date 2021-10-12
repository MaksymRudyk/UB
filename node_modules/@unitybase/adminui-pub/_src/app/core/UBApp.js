/* global Ext, $App, SystemJS */
const UB = require('@unitybase/ub-pub')
require('../../ux/window/Notification')
require('../view/Viewport')
require('../core/UBDataLoader.js')
require('./UBStoreManager')

const _ = require('lodash')

/**
 * UnityBase adminUI application.
 * Accessible via alias $App.
 *
 *  Using UB.core.UBApp developer have access to:
 *
 *  - {@link UB.core.UBApp#doCommand} method for run UnityBase client commands and {@link UB.core.UBApp#showModal} for showing forms in modal mode
 *  - instance of UBConnection {@link UB.core.UBApp#connection}
 *  - instance of UBNativePDFSign {@link UB.core.UBApp#pdfSigner} for PDF signing operations
 *  - instance of UBNativeScanner {@link UB.core.UBApp#scanService} for scan & print barcode
 *  - instance of UBNativeDocEdit {@link UB.core.UBApp#docEdit} for edit document content
 *  - number of service functions {@link UB.core.UBApp#dialogYesNo}, {@link UB.core.UBApp#dialogError}, {@link UB.core.UBApp#dialogYesNo}
 *
 * Entry point of calls is UB.core.UBApp#launch which:
 *
 *  - obtain Application information (getAppInfo server method)
 *  - create instance of {UBConnection}
 *  - obtain Domain information (getDomainInfo server method)
 *  - inject scripts with name `initModel.js` from `modelFolder\public` folder for each model
 *  - create {@link UB.view.Viewport viewport} - the main documnet DOM component
 *
 * @author UnityBase core team
 * @namespace $App
 */
Ext.define('UB.core.UBApp', {
  singleton: true,

  uses: [
    'UB.core.UBCommand'
  ],

  mixins: {
    observable: 'Ext.util.Observable'
  },

  /**
   * The core instance. Initialized after launch()
   * @type Core
   */
  core: null,

  /** nm-scaner interface
   * @type {Promise<UBNativeScanner>}
   */
  __scanService: null,

  constructor: function () {
    this.requireEncription = false
    this.credeltionalRequireCount = 0
    this.mixins.observable.constructor.call(this)

    /**
     * Connection for authorized and (optionally) encrypted communication with UnityBase server
     * @property {UBConnection} connection
     * @type {UBConnection}
     * @readonly
     */
    this.connection = null

    /**
     * Instance of ubNotifier WebSocket connection to server
     * @deprecated In UB>=4 use a $App.connection.ubNotifier instead
     * @property  {UBNotifierWSProtocol} ubNotifier
     * @type {UBNotifierWSProtocol}
     */
    this.ubNotifier = null

    /**
     * Deprecated. Use $App.domainInfo or $App.connection.domain instead of this one.
     * @deprecated
     */
    this.domain = null

    /**
     * Instance of UBDomain. It will be defined on launch application and before emit event appInitialize.
     * @property {UBDomain} domainInfo
     */
    this.domainInfo = null
    /**
     * Main application window. Initialised after $App.launch()
     * @property {UB.view.Viewport} viewport
     */
    this.viewport = null
    /**
     * UnityBase application instance short alias reference. Use it instead of UB.core.UBApp singleton
     * @property {UB.core.UBApp} $App
     * @type {UB.core.UBApp}
     * @member window
     * @global
     */
    window.$App = this

    /**
     * In case model require asynchronous operation during loading it
     * should add a chain to this promise. Next model will await chain resolving
     * @example
     *    $App.modelLoadedPromise = $App.modelLoadedPromise.then(...)
     *
     * @type {Promise<boolean>}
     */
    this.modelLoadedPromise = Promise.resolve(true)

    this.addEvents(
      /**
       * Fires then user change active desktop
       * @event portal:sidebar:desktopChanged
       */
      'portal:sidebar:desktopChanged',
      /**
       * Fires then application start initialization.
       * @event appInitialize
       */
      'appInitialize',
      /**
       * Fires then application initialization finished. This mean:
       *
       *  - user is logged in
       *  - all user locales are loaded
       *  - entities data for UI (ubm_*) are loaded
       *  - Viewport are created
       *  - active desktop is changed
       *
       * @event applicationReady
       */
      'applicationReady',
      /**
       * Fires then Domain information loaded from server.
       * @event getDomainInfo
       * @deprecated
       */
      'getDomainInfo',
      'updateCenterPanel',
      /**
       * Fires then window ( descendants of UB.view.BaseWindow ) activated (not tab)
       * @event windowActivated
       * @param {Ext.window.Window} win
       */
      'windowActivated',
      /**
       * Fires then window ( descendants of UB.view.BaseWindow ) destroyed
       * @event windowDestroyed
       * @param {Ext.window.Window} win
       */
      'windowDestroyed',
      /**
       * Fires when application ready to build main menu
       * For example in initModels.js you can write:
       *
       *        $App.on('buildMainMenu', function(items){
       *            items.push(
       *                Ext.create('UB.view.ToolbarMenu'),
       *                "->",
       *                Ext.create('UB.view.ToolbarUser')
       *            );
       *       });
       *
       * @event buildMainMenu
       * @param {*} items Collection of {@link UB.view.ToolbarWidget}.
       */
      'buildMainMenu'
    )
    return this
  },

  onPasswordChange: function (connection) {
    // password changed on login form
    $App.dialogInfo('Your password is expired. Please change password').then(function () { $App.logout() })
  },

  /**
   * The main entry point of UnityBase Ext-based application.
   * @returns {Promise} resolved then viewport is created
   */
  launch: function () {
    const me = this
    const isExternalLogin = typeof window.redirectToLogin === 'function'
    return UB.connect({
      host: window.location.origin,
      path: window.UB_API_PATH || window.location.pathname,
      onCredentialRequired: (conn, isRepeat) => {
        if (isRepeat) {
          window.localStorage.setItem(UB.LDS_KEYS.USER_DID_LOGOUT, 'true')
          throw new UB.UBAbortError('Invalid credential (isRepeat === true)')
        }
        const silenceKerberos = (window.localStorage.getItem(UB.LDS_KEYS.SILENCE_KERBEROS_LOGIN) === 'true')
        me.credeltionalRequireCount++
        const HAS_NEGOTIATE = (conn.authMethods.indexOf('Negotiate') >= 0)
        if (silenceKerberos && (me.credeltionalRequireCount > 16) && HAS_NEGOTIATE) {
          // in case negotiate auth response is cached somewhere on network we can got invalid session number but auth is success
          // then next request (getDomainInfo for example) got 401 and AsynConnection repeat auth. As a result we circling
          // Here we remove SILENCE_KERBEROS_LOGIN after 16 kerberos auth repeats (16 is to allow normal relogons during 8 houts of work with 30min timeout for session)
          window.localStorage.removeItem(UB.LDS_KEYS.SILENCE_KERBEROS_LOGIN)
          me.credeltionalRequireCount = 0
          throw new UB.UBError('To many Negotiate authentication attempts. Most likely this is invalid network configuration. Try to reload page')
        }
        if (silenceKerberos && HAS_NEGOTIATE) {
          return Promise.resolve({
            authSchema: 'Negotiate',
            login: '',
            password: '',
            registration: 0
          })
        } else {
          window.localStorage.setItem(UB.LDS_KEYS.USER_DID_LOGOUT, 'true')
          throw new UB.UBAbortError('UB.connection.setRequestAuthParamsFunction() not called')
        }
      },
      allowSessionPersistent: isExternalLogin, // see uiSettings.adminUI.loginURL
      onAuthorized: function (conn) {
        if (isExternalLogin) { // external login page
          window.localStorage.removeItem(conn.__sessionPersistKey)
        }
        window.localStorage.setItem(UB.LDS_KEYS.USER_DID_LOGOUT, 'false')
      },

      onAuthorizationFail: function (reason, conn) {
        if (isExternalLogin) {
          const storedSession = window.localStorage.getItem(conn.__sessionPersistKey)
          if (storedSession) { // invalid session is created by external login page
            window.redirectToLogin(reason)
          } else {
            UB.showErrorWindow(reason)
          }
        } else {
          UB.showErrorWindow(reason)
        }
      },

      onNeedChangePassword: $App.onPasswordChange.bind($App),
      onGotApplicationConfig: function (/** @type {UBConnection} */connection) {
        _.defaultsDeep(connection.appConfig, {
          comboPageSize: 30,
          maxMainWindowTabOpened: 40,
          storeDefaultPageSize: 100,

          gridHeightDefault: 400,
          gridWidthDefault: 600,
          gridParentChangeEventTimeout: 200,
          gridDefaultDetailViewHeight: 150,

          formMinHeight: 100,
          formMinWidth: 300,
          formDefaultAutoFormWidth: 300,
          formSaveMaskDelay: 100,

          scanRecognizeProgressInterval: 1000,
          maxSearchLength: 62,
          // MPV - deprecated browserExtensionNMHostAppKey: 'com.inbase.ubmessagehost',
          uiSettings: {
            adminUI: {
              defaultPasswordForDebugOnly: ''
            }
          }
        })

        // UB 1.12 compatibility
        UB.appConfig = connection.appConfig
      }
    }).then(function (connection) {
      me.connection = connection
      me.ubNotifier = connection.ubNotifier
      const myLocale = connection.preferredLocale
      me.domainInfo = connection.domain
      const orderedModels = me.domainInfo.orderedModels

      // for each model configure Ext.loader
      orderedModels.forEach(function (model) {
        if (model.path && model.name !== 'UB') {
          Ext.Loader.setPath(model.name, model.path)
        }
      })
      // load localization script (bundled from all models on the server side)
      // load models initialization script in order they passed
      return UB.inject('allLocales?lang=' + myLocale).then(function () {
        let promise = Promise.resolve(true)
        // inject models initialization scripts
        window.__modelInit.forEach(function (script) {
          promise = promise.then(function () {
            return window.System.import(script)
          }).then(() => {
            // model can resolve $App.modelLoadedPromise later. See settings.js in UBS model
            return $App.modelLoadedPromise
          })
        })
        return promise
      })
    }).then(function () {
      me.fireEvent('appInitialize', me)
    }).then(function () {
      return UB.core.UBDataLoader.loadStores({
        ubRequests: [
          UB.Repository('ubm_form')
            .attrs(UB.core.UBStoreManager.formAttributes)
            .ubql(),
          UB.Repository('ubm_enum')
            .attrs(UB.core.UBStoreManager.enumAttributes)
            .ubql()
        ],
        setStoreId: true
      }).then(function () {
        return UB.core.UBDataLoader.loadStores({
          ubRequests: [
            UB.Repository('ubm_navshortcut')
              .attrs(UB.core.UBStoreManager.shortcutAttributes)
              .orderBy('desktopID').orderBy('parentID')
              .orderBy('displayOrder').orderBy('caption')
              .ubql()
          ],
          setStoreId: true
        })
      })
    }).then(function () {
      me.setLocalStorageProviderPrefix(me.connection.userLogin())
      me.viewport = Ext.create('UB.view.Viewport')
      me.viewport.show()
      me.fireEvent('applicationReady')
      me.locationHashChanged()
      me.hideLogo()
    }).catch(function (reason) {
      me.hideLogo()
      UB.logError('Got error from getAppInfo %o', reason)
      throw reason // global window.onerror handler show error to user
    })
  },

  /**
   * Return images path for current UI theme
   * @param {string} imageName
   * @returns {string}
   */
  getImagePath: function (imageName) {
    // apply a default here to prevent unknown reason of models/adminui-pub/themes/undefined/ubimages/scan-to-pdf.png
    return 'models/adminui-pub/themes/' + (UB.connection.appConfig.uiSettings.adminUI.themeName || 'UBGrayTheme') + '/ubimages/' + imageName
  },

  /**
   * Show confirmation dialog. Title & message are translated using UB.i18n
   * @example

$App.dialog('makeChangesSuccessfulTitle', 'makeChangesSuccessfullyBody')
  .then(function(btn){
    if (btn === 'yes'){
      me.openDocument()
      me.closeWindow(true)
    }
  });

   * @param {String} title
   * @param {String} msg
   * @param {Object} [config]
   * @param {Number} [config.buttons] OK: 1, YES: 2, NO: 4, CANCEL: 8.  Default YESNOCANCEL: 14
   * @param {String} [config.icon] Possible values: QUESTION, ERROR, WARNING, INFO. Default QUESTION
   * @returns {Promise} resolved pressed button name ['ok', 'yes', 'no', 'cancel']
   */
  dialog: function (title, msg, config) {
    let icon
    config = config || {}
    switch (config.icon || 'QUESTION') {
      case 'QUESTION':
        icon = Ext.window.MessageBox.QUESTION
        break
      case 'ERROR':
        icon = Ext.window.MessageBox.ERROR
        break
      case 'WARNING':
        icon = Ext.window.MessageBox.WARNING
        break
      case 'INFO':
        icon = Ext.window.MessageBox.INFO
        break
    }
    return new Promise(function (resolve) {
      Ext.MessageBox.show({
        modal: true,
        title: UB.i18n(title),
        msg: UB.i18n(msg),
        buttons: config.buttons || Ext.MessageBox.YESNOCANCEL,
        icon: icon,
        fn: function (buttonId) {
          resolve(buttonId)
        }
      })
    })
  },

  /**
   * Show confirmation dialog. Title & message are translated using UB.i18n
   * Example:
   *
   *      $App.dialogYesNo('makeChangesSuccessfullTitle', 'makeChangesSuccessfullBody')
   *      .then(function(choice){
   *           if (choice){
   *               me.openDocument();
   *               me.closeWindow(true);
   *           }
   *       });
   *
   * @param {String} title
   * @param {String} msg
   * @returns {Promise<boolean>} resolved to true | false depending on user choice
   */
  dialogYesNo: function (title, msg) {
    return new Promise(function (resolve) {
      Ext.MessageBox.show({
        modal: true,
        title: UB.i18n(title),
        msg: UB.i18n(msg),
        buttons: Ext.MessageBox.YESNO,
        icon: Ext.MessageBox.QUESTION,
        fn: function (buttonId) {
          resolve(buttonId === 'yes')
        }
      })
    })
  },

  /**
   * Show information dialog. msg is translated using UB.i18n
   * Example:
   *
   *      $App.connection.post('myAction', {myData: ...})
   *      .then(function(response){
   *          //do something here ....
   *          ....
   *          // notify user
   *          return $App.dialogInfo('documentWasSuccessfullyApproved');
   *      }).then(function(){
   *         // we reach this code after user read information dialog and press OK
   *      });
   *
   * @param {string} msg
   * @param {String} [title] Optional title
   * @returns {Promise} resolved to true then user click OK
   */
  dialogInfo: function (msg, title) {
    return new Promise(function (resolve) {
      Ext.MessageBox.show({
        modal: true,
        title: UB.i18n(title || 'info'),
        msg: UB.i18n(msg),
        icon: Ext.MessageBox.INFO,
        buttons: Ext.MessageBox.OK,
        fn: function (buttonId) {
          resolve(buttonId === 'ok')
        }
      })
    })
  },

  /**
   * Display notification message
   * @param {String} msg message
   * @param {String} [title]
   * @param {Number} [slideInDuration] Animate time in ms. by default 800 ms
   */
  notify: function (msg, title, slideInDuration) {
    Ext.create('widget.uxNotification', {
      title: UB.i18n(title),
      position: 't',
      slideInDuration: slideInDuration || 800,
      useXAxis: true,
      autoShow: true,
      cls: 'ux-notification-light',
      // iconCls: 'ux-notification-icon-error',
      bodyPadding: 5,
      items: [{
        xtype: 'component',
        autoEl: {
          tag: 'div',
          html: UB.i18n(msg)
        }
      }]
    })
  },

  /**
   * Show error dialog. msg is translated using UB.i18n
   * Example:
   *
   *      $App.dialogError('recordNotExistsOrDontHaveRights')
   *          .then(me.closeWindow.bind(me));
   *
   * @param {String} msg
   * @param {String} [title] Default is 'error'
   */
  dialogError: function (msg, title) {
    return new Promise(function (resolve) {
      Ext.MessageBox.show({
        modal: true,
        title: UB.i18n(title || 'error'),
        msg: UB.i18n(msg),
        icon: Ext.MessageBox.ERROR,
        buttons: Ext.MessageBox.OK,
        fn: function () { resolve(true) }
      })
    })
  },

  /**
   * Return instance of {@link UBNativePDFSign} for PDF signing operations
   * @returns {Promise<UBNativePDFSign>}
   */
  pdfSigner: function () {
    const i = 'import'
    const moduleName = '@ub-e/nm-pdfsign' + (window.isDeveloperMode ? '' : '/dist/nm-pdfsign.min.js')
    // System[i] is required for preventing webpack to include a ub-e/nm-pdfsigner to the bundle
    return SystemJS[i](moduleName).then(function (nmPDFSignerModule) {
      return nmPDFSignerModule.connect()
    })
  },

  /**
   * Return instance of {@link UBNativeDocEdit} for pen document using WebDav
   * @returns {Promise<UBNativeDocEdit>} resolved to initialized UBNativeDocEdit instance
   */
  docEdit: function () {
    const i = 'import'
    const moduleName = '@ub-e/nm-docedit' + (window.isDeveloperMode ? '' : '/dist/nm-docedit.min.js')
    // System[i] is required for preventing webpack to include a ub-e/nm-docedit to the bundle
    return SystemJS[i](moduleName).then(function (nmDocEditModule) {
      return nmDocEditModule.connect()
    })
  },

  /**
   * Do edit office document
   * @param {String} path Path to document
   * @returns {Promise} resolved to true or rejected if error or incorrect path.
   */
  editDocument: function (path) {
    return this.docEdit().then(function (docedit) {
      return docedit.editDocument(path)
    })
  },

  /**
   * Return promise, resolved to instance of {@link UBNativeScanner} for direct manipulation with scanner
   * `@ub-e/nm-scanner must be in application packages list (run `npm i @ub-e/nm-scanner` in the shell)
   * @method
   * @return {Promise<UBNativeScanner>}
   */
  scanService: function () {
    const i = 'import'
    const moduleName = '@ub-e/nm-scanner' + (window.isDeveloperMode ? '' : '/dist/nm-scanner.min.js')
    // System[i] is required for preventing webpack to include a ub-e/nm-scanner to the bundle
    return SystemJS[i](moduleName).then(function (nmScannerModule) {
      return nmScannerModule.connect()
    })
  },

  /**
   * Show scanner settings
   */
  scannerSettings: function () {
    $App.scanService().then(function (scanner) {
      return scanner.getDefaultSettings()
    }).then(function (settings) {
      $App.showModal({
        formCode: 'ubm_desktop-scanerSettings',
        description: UB.i18n('scannerSettings'),
        isClosable: true,
        customParams: settings
      }).then(function (result) {
        if (result.action === 'ok') {
          $App.scanService().then(function (scanService) {
            scanService.setDefaultSettings(result.params)
          })
        }
      })
    })
  },

  /**
   * Run scan process.
   * @param {String} header Caption of the scanning progress window
   * @param {Object} [config={}] Scanner settings. If passed - will merge config with UBNativeScanner.getDefaultSettings() result
   * @param {String} [documentMIME] Mime type of scanned image. If passed will override scanSettings.UBScan.OutputFormat.
   *  One of 'image/jpeg', 'application/jpg', 'JPEG', 'PDF', 'TIFF', 'PDF/A'.
   * @returns {Promise} resolved to base64 data or false in case user press cancel.
   */
  scan: function (header, config, documentMIME) {
    const mimeToOutputFormat = {
      'image/jpeg': 'JPEG',
      'application/jpg': 'JPEG',
      JPEG: 'JPEG',
      PDF: 'PDF',
      TIFF: 'TIFF',
      'PDF/A': 'PDF/A'
    }
    const outputFormat = mimeToOutputFormat[documentMIME] || documentMIME
    return $App.scanService().then(function (scanner) {
      $App.__scanService = scanner
      let allowAddPages = false
      const statusWindow = Ext.create('UB.view.StatusWindow', {
        title: header
      })

      function onNotify (progress) {
        if (progress && (progress.action === 'scan') && (progress.pageNum >= 0)) {
          statusWindow.setStatus(UB.format(UB.i18n('doScanPages'), progress.pageNum + 1))
        } else if (progress && (progress.action === 'recognize') && (progress.pageNum >= 0)) {
          statusWindow.setStatus(UB.format(UB.i18n('doRecognizePages'), progress.pageNum + 1))
        }
      }

      function onScan (pageCount) {
        if (pageCount > 0) {
          statusWindow.setStatus(UB.format(UB.i18n('doScanPages'), pageCount))
          if (allowAddPages) {
            return checkContinue()
          } else {
            statusWindow.setStatus(UB.i18n('doFinishScan'))
            return scanner.finishScan().then(null, null, onNotify)
          }
        } else {
          return askInsertPaper()
        }
      }

      function doContinue () {
        statusWindow.setStatus(UB.i18n('doStartScan'))
        return scanner.continueScan().then(onScan, null, onNotify)
      }

      function askInsertPaper () {
        return $App.dialog('scan', 'noPaperInScanner', { buttons: 9, icon: 'INFO' }).then(function (btn) {
          if (btn === 'ok') {
            return doContinue()
          } else if (btn === 'cancel') {
            throw new UB.UBAbortError()
          }
        })
      }

      function checkContinue () {
        return $App.dialog('scan', 'doYouWantResume', { buttons: 14 }).then(function (btn) {
          if (btn === 'yes') {
            return doContinue()
          }
          if (btn === 'no') {
            statusWindow.setStatus(UB.i18n('doFinishScan'))
            return scanner.finishScan().then(null, null, onNotify)
          }
          if (btn === 'cancel') {
            throw new UB.UBAbortError()
          }
        })
      }

      return scanner.getDefaultSettings().then(function (defaultParams) {
        const scanSettings = _.merge(defaultParams, config || {})
        if (!scanSettings?.UBScan?.ScanSettings?.length) {
          throw new UB.UBError(UB.format(UB.i18n('setScannerSettings'), '$App.scannerSettings(); '))
        }

        if (scanSettings.CurrentScanType !== 'UnityBase' && scanSettings.FRScan && scanSettings.FRScan.LastUsedScanner) {
          if (outputFormat) {
            scanSettings.CurrentScanType = 'UnityBase'
            scanSettings.UBScan.LastUsedScanner = scanSettings.FRScan.LastUsedScanner
          } else {
            _.forEach(scanSettings.FRScan.ScanSettings, function (setting) {
              if (setting.Source === scanSettings.FRScan.LastUsedScanner) {
                allowAddPages = !!setting.AllowAddPages
              }
            })
          }
        }
        if (scanSettings.CurrentScanType === 'UnityBase' && scanSettings.UBScan && scanSettings.UBScan.LastUsedScanner) {
          _.forEach(scanSettings.UBScan.ScanSettings, function (setting) {
            if (setting.Source === scanSettings.UBScan.LastUsedScanner) {
              allowAddPages = !!setting.AllowAddPages
            }
          })
          if (outputFormat) {
            scanSettings.UBScan.OutputFormat = outputFormat
          }
        }

        statusWindow.setStatus(UB.i18n('doStartScan'))
        scanner.lastScanedFormat = scanSettings.UBScan?.OutputFormat
        return scanner.startScan(scanSettings)
      }).then(onScan, null, onNotify)
        .finally(function () {
          statusWindow.close()
        }).catch(function (error) {
          return scanner.cancelScan().then(function () {
            statusWindow.close()
            throw error
          })
        })
    }).then(function (scannedResult) {
      const recognitionEndpoint = $App.connection.appConfig.uiSettings.adminUI.recognitionEndpoint

      /**
       * Converts scanned images to PDF and recognizes it.
       * @param {string} scannedResult - scanned file, received from `nm-scanner` as base64 string
       * @return {Promise<ArrayBuffer>} - PDF-file recognized by ocr service, defined in ubConfig
       * (`uiSettings.adminUI['recognitionServer']`)
       */
      function transformToPdf (scannedResult) {
        let uploadItemID = null
        const scannedArrayB = UB.base64toArrayBuffer(scannedResult)
        const statusWindow = Ext.create('UB.view.StatusWindow', {
          title: header
        })
        statusWindow.setStatus(UB.i18n('doRecognizeDocument'))
        return $App.connection.post(`${recognitionEndpoint}upload`, scannedArrayB, {
          headers: { 'Content-Type': 'application/octet-stream' }
        }).then(response => {
          uploadItemID = response && response.data && response.data.item
          if (uploadItemID) {
            return $App.connection.post(`${recognitionEndpoint}transform`, {
              item: uploadItemID,
              to: 'pdf',
              blobInResponse: true
            }, {
              responseType: 'arraybuffer',
              headers: { 'Content-Type': 'application/json' },
              timeout: 600000 // MPV - ocr service is slow for big or complex documents
            })
          } else {
            throw new UB.UBError('Error upload data to recognition server.')
          }
        }).then(transformResult => {
          $App.__scanService.lastScanedFormat = 'PDF'
          return $App.connection.post(`${recognitionEndpoint}clean`, {
            item: uploadItemID
          }).then(() => {
            return transformResult.data
          })
        }).finally(() => {
          statusWindow.close()
        })
      }

      if (recognitionEndpoint && $App.__scanService.lastScanedFormat === 'TIFF') {
        return transformToPdf(scannedResult)
      } else return scannedResult
    })
  },

  /**
   * Application viewport
   * @return {UB.view.Viewport}
   */
  getViewport: function () {
    return this.viewport
  },

  /**
   * Return last user login name
   * @deprecated 1.7 Use {@link UB.core.UBApp.connection#userLogin $App.connection.userLogin()} instead
   * @returns {String}
   */
  getLogin: function () {
    UB.logDebug('UB.core.UBApp.getLogin is deprecated. Use $App.connection.userLogin() instead)')
    return this.connection.userLogin()
  },

  checkQueryString: function () {
    this.runLink(window.location.search)
  },

  runLink: function (link) {
    const query = Ext.isString(link) ? Ext.Object.fromQueryString(link.toLowerCase()) : link

    if (query && ((query.command && query.command.length) || query.cmdData)) {
      this.doCommand({
        commandCode: query.command,
        cmdData: query.cmdData,
        instanceID: parseInt(query.id, 10),
        onDesktop: query.ondesktop,
        parent: query.parent,
        parentID: query.parentid
      })
    }
  },

  /**
   * Can run any client-side command (showForm/showList/showReport).
   *
   *      @example
   *      // show City dictionary with all attributes in dedicated window
   *      $App.doCommand({
   *           cmdType: 'showList',
   *           cmdData: { params: [
   *               { entity: 'cdn_city', method: 'select', fieldList: '*'}
   *           ]}
   *       });
   *
   *       // show City name and region name inside main viewport tab
   *      $App.doCommand({
   *           cmdType: 'showList',
   *           cmdData: { params: [
   *               { entity: 'cdn_city', method: 'select', fieldList: ['name', 'parentAdminUnitID.name']}
   *           ]},
   *           target: $App.getViewport().getCenterPanel(),
   *           tabId: 'city_name_parent'
   *       });
   *
   *       // show default edit form for currency with code='USD'
   *       $App.connection.select({
   *          entity: 'cdn_currency',
   *          fieldList: ['ID', 'code3'],
   *          whereList: {byCode3: {
   *              expression: '[code3]', condition: 'equal', values: {code3: 'USD'}
   *          }}
   *       }).then(function(result){
   *          if (result.resultData.data.length === 1){
   *             $App.doCommand({
   *                 cmdType: 'showForm',
   *                 entity: 'cdn_currency',
   *                 instanceID: result.resultData.data[0][0]
   *             });
   *          } else {
   *              $App.dialogError('USD currency not found');
   *          }
   *       });
   *
   *       // show report
   *       $App.doCommand({
               cmdType: 'showReport',
               cmdData: {
                  reportCode: 'test',
                  reportType: 'html', // must be one of 'html'/'pdf'
                  reportParams: {'reportParam1': 1}
               }
           });
   *
   * @param {String/Object} config
   * @param {Object} [config.cmpInitConfig] Configuration, applied to Component created by command
   * @param {Boolean} [config.openInBackgroundTab] true if you want to set form/list to tab without setActiveTab. Default undefined.
   */
  doCommand: function (config) {
    if (Ext.isString(config)) {
      config = Ext.JSON.decode(config)
    }

    if (!Ext.isObject(config)) {
      throw new Error('invalid config passed to UBApp.doCommand')
    }

    Ext.create('UB.core.UBCommand', config)
  },
  /**
   * Load a shortcut command by given shortcut ID (or code) and run it
   *
   *    $App.runShortcutCommand('tst_document')
   *    //or
   *    $App.runShortcutCommand(30000012312)
   *
   * @param {Number|String} shortcutIDOrCode Either shortcut ID or shortcut code to run
   * @param {Boolean} inWindow Show a command result in window instead of tab
   *
   * @returns {Promise}
   */
  async runShortcutCommand (shortcutIDOrCode, inWindow) {
    let shortcutID = shortcutIDOrCode
    if (typeof shortcutIDOrCode !== 'number') {
      const store = UB.core.UBStoreManager.getNavigationShortcutStore()
      const rowNum = store.findExact('code', shortcutIDOrCode)
      if (rowNum !== -1) {
        shortcutID = store.getAt(rowNum).get('ID')
      } else {
        throw new Error(`Shortcut with code ${shortcutIDOrCode} not found`)
      }
    }
    const parsedCmdCode = await UB.core.UBStoreManager.getNavshortcutCommandText(shortcutID)
    if (!parsedCmdCode) {
      console.error(`Command for shortcut ${shortcutIDOrCode} is empty or this is empty folder`)
      return
    }
    const commandConfig = _.clone(parsedCmdCode)
    if (inWindow) {
      commandConfig.isModal = true
    } else {
      commandConfig.tabId = 'navigator' + shortcutID
      commandConfig.target = $App.viewport.centralPanel
    }
    $App.doCommand(commandConfig)
  },

  /**
   * Show form in "modal" mode. Return Promise.
   * The task of form is to resolve or reject `deferred`, passed to form config.
   *
   * @param {Object} config
   * @param {String} config.formCode code of form from ubm_form
   * @param {String} [config.description] form caption
   * @param {Boolean} [config.isClosable] if true she form show close button
   * @param {*} [config.customParams] Any parameters passed to executed form
   *
   * @returns {Promise}
   */
  showModal: function (config) {
    return new Promise((resolve, reject) => {
      const cmdConfig = {
        cmdType: 'showForm',
        isModal: true,
        isResizable: false,
        isMaximizable: false,
        isMinimizable: false,
        isClosable: !!config.isClosable,
        description: config.description,
        formCode: config.formCode,
        customParams: config.customParams,
        deferred: { resolve: resolve, reject: reject } // result form MUST resolve or reject this deffer
      }
      if (!cmdConfig.formCode) {
        reject(new Error('invalid config for showModal. formCode if undefined'))
      }
      this.doCommand(cmdConfig)
    })
  },

  /**
   * Show audit trail list for specified instanceID
   * @param {object} cfg
   * @param {number} cfg.instanceID
   * @param {strong} [cfg.entityCode]
   * @param {boolean} [cfg.isModal=false]
   */
  showAuditTrail ({ entityCode, instanceID, isModal }) {
    $App.doCommand({
      renderer: 'vue',
      isModal: isModal || false,
      tabId: isModal ? undefined : `${entityCode}${instanceID}-auditTrail`,
      title: `${UB.i18n('Audit')} (${UB.i18n(entityCode)})`,
      cmdType: 'showList',
      cmdData: {
        repository () {
          return UB.Repository('uba_auditTrail')
            .attrs(['ID', 'actionTime', 'actionType', 'actionUserName', 'remoteIP', 'entity', 'parentEntity', 'request_id'])
            .where('parentEntityInfo_id', '=', instanceID, 'parent')
            .where('entityinfo_id', '=', instanceID, 'instance')
            .logic('([parent] OR [instance])')
            .orderByDesc('actionTime')
        },
        columns: [{
          id: 'actionTime',
          format: ({ value }) => UB.formatter.formatDate(value, 'dateTimeFull')
        },
        'actionType', 'actionUserName', 'remoteIP', 'entity', 'parentEntity', 'request_id'
        ]
      },
      shortcutCode: `audit-${entityCode}`
    })
  },

  /**
   *
   * @param {String} prefix
   */
  setLocalStorageProviderPrefix: function (prefix) {
    const provider = Ext.state.Manager.getProvider()

    prefix += UB.core.UBLocalStorageManager.separator

    if (provider && provider.prefix !== prefix) {
      provider.prefix = prefix
      provider.state = provider.readLocalStorage()
    }
  },

  /**
   * @deprecated 1.7.0 Use {@link UB.core.UBApp.connection#userData $App.connection.userData()} instead
   * @return {Object}
   */
  getUserData: function () {
    UB.logDebug('UB.core.UBApp.getUserData is deprecated. Use connection.userData() instead')
    return this.connection.userData()
  },

  /**
   * @deprecated 1.7.0 Use {@link UB.core.UBApp.connection#userLang $App.connection.userLang()} instead
   * @return {String}
   */
  getUiLanguage: function () {
    UB.logDebug('$App.getUiLanguage is DEPRECATED. Use $App.connection.userLang()')
    return this.connection.userLang()
  },

  /**
   * Logout active user. Reload page.
   */
  logout: function () {
    const p = this.connection ? this.connection.logout() : Promise.resolve(true)
    p.catch(() => true).then(function () {
      // MPV TODO Secure browser
      // if (UB.isSecureBrowser) {
      //     var remote = require('electron').remote;
      //     var window = remote.getCurrentWindow();
      //     window.destroy();
      // } else {
      if (document.location && document.location.href && document.location.href.indexOf('#') > 0) {
        document.location.href = document.location.href.split('#')[0]
      } else {
        document.location.reload(true)
      }
    })
  },

  locationHashChanged: function () {
    if (window.location.href && window.location.href.indexOf('#') > 0) {
      if (!window.location.href.split('#')[1]) {
        return
      }
      const commandConfig = UB.core.UBCommand.getCommandByUrl(window.location.href, $App.getViewport().centralPanel)

      if (commandConfig.instanceID) {
        commandConfig.tabId = commandConfig.entity + commandConfig.instanceID
        commandConfig.instanceID = +commandConfig.instanceID
      } else {
        commandConfig.tabId = 'navigator' + getShortcutID(commandConfig.entity)
      }

      UB.core.UBApp.doCommand(commandConfig)
    }
  },

  hideLogo: function () {
    document.getElementById('UBLogo').style.display = 'none'
  },

  /**
   * Generate tabId from showForm command parameters
   * @param {Object} cfg
   * @param {string} cfg.entity
   * @param {number} [cfg.instanceID]
   * @param {string} [cfg.formCode]
   * @return {string}
   */
  generateTabId: function (cfg) {
    let formCode
    if (cfg.formCode === undefined) {
      formCode = '-'
    } else if (typeof cfg.formCode === 'function') {
      formCode = 'func'
    } else {
      formCode = cfg.formCode
    }
    return cfg.entity +
      formCode +
      (cfg.instanceID ? cfg.instanceID : 'ext' + Ext.id(null, 'addNew'))
  },

  /**
   * Download a document from BLOB store directly into file (without loading it into memory as with getDocument)
   *
   * To get a document data use `UBApp.connection.getDocument` method what returns Blob
   *
   * @param {object} instanceInfo Instance information
   * @param {string} instanceInfo.entity    Code of entity to retrieve from
   * @param {string} instanceInfo.attribute Code of `document` type attribute for specified entity
   * @param {string} instanceInfo.ID        Instance ID
   *
   * @param {object} [blobMetadata]   BLOB metadata JSON as it stored in the entity attribute
   * @param {object} [blobMetadata.revision=1]
   * @param {object} [blobMetadata.isDirty=false]
   */
  downloadDocument: async function (instanceInfo, blobMetadata) {
    const getDocumentParams = Object.assign({ revision: 1 }, instanceInfo)
    if (blobMetadata) {
      if (blobMetadata.isDirty) {
        getDocumentParams.isDirty = blobMetadata.isDirty
        getDocumentParams.fileName = blobMetadata.origName
      }
      if (blobMetadata.revision) getDocumentParams.revision = blobMetadata.revision
    }
    // validate what file is accessible (and re-auth if session is expire)
    const available = await this.connection.xhr({
      url: 'checkDocument',
      method: 'GET',
      params: getDocumentParams
    })
    // TODO throw new UB.UBError(UB.i18n('documentNotFound'))
    const oneTimeURL = await this.connection.getDocumentURL(getDocumentParams)
    const a = document.createElement('A')
    a.href = oneTimeURL
    // important to set a download attribute to prevent open href
    // Actual fileName will be taken from Content-Disposition header
    if (blobMetadata) {
      a.download = blobMetadata.origName || blobMetadata.fName || 'downloadedFile'
    } else {
      a.download = 'downloadedFile'
    }
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
})

module.exports = UB.core.UBApp

function getShortcutID (code /* , instanceID */) {
  const store = UB.core.UBStoreManager.getNavigationShortcutStore()
  const rowNum = store.findExact('code', code)

  return rowNum !== -1
    ? store.getAt(rowNum).get('ID')
    : Ext.id()
}
