/**
 * Native messaging enables an extension to exchange
 * messages with a native application installed on the user's computer.
 * Read more in <a href="https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Native_messaging">MDN Native messaging documentation</a>
 *
 * @module UBNativeMessage
 * @memberOf module:@unitybase/ub-pub
 * @author xmax, mpv
 */
module.exports = UBNativeMessage

const ubUtils = require('./utils')
const i18n = require('./i18n').i18n
const EventEmitter = require('./events')
/**
 * Native messages feature description
 * @typedef {Object} NMFeatureConfig
 * @property {string} host NativeMessages host
 * @property {string} UIName Name showed to user for feature install/update message. Will be translated using UB.i18n
 * @property {string} minVersion Minimal supported feature version.
 * @property {string} installer URL for downloading feature installer
 * @property {string} [libraryName] In case client is a secure browser (UnityBase DE) this library is used instead of process to communicate with feature
 */

/**
 * Registered features.
 * Other models can add his own features here using script in initModel.js
 * @type {Object.<string, NMFeatureConfig>}
 */
const NM_EXTENSION_FEATURE = {
  host: 'none', UIName: 'NMUBExtension', minVersion: '1.0.0', installer: 'pgffhmifenmomiabibdpnceahangimdi' // downloads/UBBrowserNativeMessagesHostApp.exe
}

/**
 * @classdesc
 * Class for communicate with native messages plugin `content script`.
 * DOM element with `id="ubExtensionPageMessageObj"` must be present on the target page.
 *
 * If target page is loaded into iframe then parent (iframe owner) page must contains a DOM element with `id="ubExtensionPageMessageObj"`.
 *
 * The preferred way to communicate with native messages plugin feature is a  UBNativeMessage descendants, for example {@link UBNativeScanner} for scanning etc.
 *
 * @example
 // without systemJS:
 // const nmScannerModule = require('@ub-e/nm-scanner')
 // nmScannerModule.connect().then(...)

 System.import('@ub-e/nm-scanner').then(function (nmScannerModule) {
    return nmScannerModule.connect()
 }).then(function (nmScanner) {
   return nmScanner.scan()
 }).then(UB.logDebug)

 // for debugging:
 var nm = new UBNativeMessage();
 nm.onMessage = function(message){
    console.log(message);
 };
 nm.onDisconnected = function(sender){
    console.log('disconnected');
 };
 nm.connect(5000).then( function(nm){
     nm.sendMessage({text: 'Message : Hello!'});
 });

 nm.invoke('methodName', {a: 'method param'})

 * @constructor
 * @param {NMFeatureConfig} featureConfig Feature we want from plugin
 */
function UBNativeMessage (featureConfig) {
  const me = this
  let __messageCounter = 0

  me.getMessageId = function () {
    return 'm' + (++__messageCounter)
  }

  /**
   * @type {NMFeatureConfig}
   * @private
   */
  me._cfg = Object.assign({}, featureConfig)

  ++UBNativeMessage.prototype.idCounter
  me.id = 'UBPlugin' + UBNativeMessage.prototype.idCounter

  me.pendingMessages = {}
  if (!me._cfg.host) {
    throw new Error('Host not defined in UBNativeMessage feature config')
  }

  EventEmitter.call(me)
  Object.assign(me, EventEmitter.prototype)

  /**
   * Feature version. Defined after success connect() call.
   * @property {string} featureVersion
   */
  me.featureVersion = ''
  /**
   * Default operation timeout
   * @property {number} callTimeOut
   */
  me.callTimeOut = 30000
  if (ubUtils.isSecureBrowser) {
    me.eventElm = {}
    EventEmitter.call(me.eventElm)
    Object.assign(me.eventElm, EventEmitter.prototype)
    me.eventElm.addEventListener = me.eventElm.addListener
  } else {
    me.eventElm = document.getElementById('ubExtensionPageMessageObj')

    if (!me.eventElm && (!window.parent || (window.parent === window))) {
      throw new Error('Message exchange element with id="ubExtensionPageMessageObj" not found')
    }
  }

  // must be defined inside constructor for removeEventListener work properly
  me.onContentMessage = function (event) {
    const msg = event.detail
    if (!msg || !msg.hasOwnProperty('msgType') || !msg.hasOwnProperty('messageID') || !msg.hasOwnProperty('clientID')) {
      console.error('Empty or invalid content message')
    }
    if ((msg.messageID === -1) && ((msg.clientID === '') || (msg.clientID === me._cfg.host)) && (msg.msgType = 'reject')) {
      // native host connection error. For unknown reason clientID & messageId is lost in such type of message (Chrome)
      // In FF (75 at last) clientID === me._cfg.host
      // there is slight chance what message not for this Client (in case of several UBNativeMessages instances),
      // but I (MPV) do not know how to solve this
      const lastMsgID = Object.keys(me.pendingMessages)[0]
      let message = me.pendingMessages[lastMsgID]
      if (message) {
        delete me.pendingMessages[lastMsgID]
      } else {
        message = me.__FFLastMsg
      }
      if (!message) return // this instance do not have any pending messages - try another UBNativeMessage instance
      clearTimeout(message.timerID)
      me.onMsgTimeOut(message)
      return
    }
    if (msg.clientID !== me.id) { // this is message to another UBNativeMessage instance
      return
    }

    const messageID = msg.messageID
    const msgType = msg.msgType
    let data = msg.data
    const pending = me.pendingMessages[messageID]
    if (pending) {
      clearTimeout(pending.timerID)
    }
    if (msgType === 'disconnected') {
      if (pending) {
        delete me.pendingMessages[messageID]
        pending.deffer.resolve(data)
      }
      me.doOnDisconnect(data)
    } else {
      if (msgType === 'notify') {
        if (!pending && me.onMessage) { // notification from plugin without messageID
          me.onMessage(data)
        } else { // notification to request. Increase timeout
          pending.timerID = setTimeout(function () { me.onMsgTimeOut(messageID) }, pending.timeoutValue)
          /**
           * Fired for {@link UBNativeMessage} instance when got a notify message. Event can accept 2 args (data: {], messageID: number)
           * @event notify
           */
          me.emit('notify', me, data, messageID)
        }
      } else if (!pending) {
        console.error('UBNativeMessage. unknown messageID:' + messageID)
      } else if (msgType === 'resolve') {
        if (msg.hasOwnProperty('part') && msg.hasOwnProperty('totalParts')) { // partial response
          const totalParts = msg.totalParts
          const currentPart = msg.part
          if (!pending.partials) {
            if (totalParts > 100) { // 100 Mb limit
              pending.deffer.reject(new ubUtils.UBError('unknownError', 'UBNativeMessage. Result exceed 100Mb limit'))
              delete me.pendingMessages[messageID]
              throw new Error(new ubUtils.UBError('unknownError', 'UBNativeMessage. Result exceed 100Mb limit'))
            }
            pending.partials = new Array(totalParts)
          } else {
            if ((totalParts !== pending.partials.length) || (currentPart >= totalParts)) {
              pending.deffer.reject('Invalid part count')
              delete me.pendingMessages[messageID]
              throw new Error('Invalid part count')
            }
          }
          pending.partials[currentPart] = data
          if (!pending.partials.includes(undefined)) { // all parts come - ready to resolve
            data = pending.partials.join('')
            delete me.pendingMessages[messageID]
            if ((data.charAt(0) === '{') || (data.charAt(0) === '[')) { // data is JSON
              data = JSON.parse(data)
            }
            pending.deffer.resolve(data)
          } else {
            pending.timerID = setTimeout(function () { me.onMsgTimeOut(messageID) }, pending.timeoutValue)
          }
        } else {
          delete me.pendingMessages[messageID]
          pending.deffer.resolve(data)
        }
      } else if (msgType === 'reject') {
        delete me.pendingMessages[messageID]
        let isUserMessage = false
        if (/<<<.*>>>/.test(data)) {
          data = data.match(/<<<(.*)>>>/)[1]
          isUserMessage = true
        }
        const err = isUserMessage ? new ubUtils.UBError(data) : new ubUtils.UBError('unknownError', data)
        pending.deffer.reject(err)
      } else {
        throw new Error('UBNativeMessage. Invalid msgType type in: ' + msg)
      }
    }
  }
  me.eventElm.addEventListener('UBExtensionMsg', me.onContentMessage)
  /**
   * Called when disconnecting the plugin.
   * @property {Function} onDisconnected
   */
  me.onDisconnected = null
  /**
   * Called when receive new `notify` message from host application not to invoked method.
   * @property {Function} onMessage
   */
  me.onMessage = null

  /**
   * In case instantiated inside iFrame targetOrign initialized to  parent document Origin
   * and used as targetOrign parameter for postMessage to prevent XSS attack
   * @type {string}
   */
  me.targetOrign = '*'
  /**
   * reference to the window.parent in case we are in iFrame
   * @type {undefined}
   */
  me.targetPage = undefined
}

/**
 * Convert a semantic version `x.xx.xx.xxxx` to the integer for comparision
 * @param {String} versionStr
 * @return {number}
 */
function versionToNumber (versionStr) {
  const arr = versionStr.split('.')
  if (arr.length > 4) {
    throw new Error('Invalid version number ' + versionStr)
  }
  let multiplier = 1
  let res = 0
  const L = arr.length
  for (let i = L - 1; i >= 0; i--) {
    res += parseInt(arr[i], 10) * multiplier; multiplier *= (i === L - 1) ? 10000 : 1000 // last number may be 4 digit 1.2.3.1234
  }
  return res
}

/**
 * Invoke feature method with optional params
 * @param {String} methodName
 * @param {Object} [methodParams] Do not pass empty object {} here!
 * @param {Number} [timeout] operation timeout. Default to {@link UBNativeMessage#callTimeOut}
 * @return {Promise}
 */
UBNativeMessage.prototype.invoke = function (methodName, methodParams, timeout) {
  const me = this
  if (!me.connected && methodName.substr(0, 2) !== '__') { // allow pseudo methods
    return Promise.reject(new ubUtils.UBError('unknownError', 'UBNativeMessage. Not connected. call connect() first'))
  }
  // methodParams = methodParams || null;
  timeout = timeout || me.callTimeOut
  const msgID = me.getMessageId()
  const messageToSend = { clientID: me.id, messageID: msgID, method: methodName, params: methodParams }
  return new Promise((resolve, reject) => {
    me.pendingMessages[msgID] = {
      request: null, // MPV - do not store - we do not need it!  messageToSend,
      deffer: { resolve, reject },
      timerID: setTimeout(function () { me.onMsgTimeOut(msgID) }, timeout),
      partials: null,
      timeoutValue: timeout || me.callTimeOut,
      stTime: Date.now()
    }
    // FF 75 in case of connect error me.pendingMessages became {}
    me.__FFLastMsg = me.pendingMessages[msgID]
    // if (UB.isSecureBrowser) {
    //     if (methodName === '__extensionVersion') {
    //         me.eventElm.emit('UBExtensionMsg', {
    //             detail: {
    //                 clientID: me.id,
    //                 messageID: msgID,
    //                 msgType: 'resolve',
    //                 data: NM_EXTENSION_FEATURE.minVersion
    //             }
    //         });
    //     } else if (methodName === '__connect') {
    //         var path = require('path'),
    //             ffi =require(path.join(path.parse(process.execPath).dir, '..', 'ffi')),
    //             Library = ffi.Library;
    //
    //         me.doInvoke = new Library(
    //             path.join(path.parse(process.execPath).dir, me._cfg.libraryName),
    //             {'invoke': ['void', ['string', 'pointer'], { async: true }]}
    //         ).invoke;
    //         me.funcPtr = ffi.Callback('void', [ 'string' ],
    //             function(param) {
    //                 var detail = JSON.parse(param);
    //                 me.eventElm.emit('UBExtensionMsg', {
    //                     detail: detail
    //                 });
    //             }
    //         );
    //         messageToSend.method = 'getVersion';
    //         me.doInvoke(JSON.stringify(messageToSend), me.funcPtr, function(){});
    //     } else {
    //         me.doInvoke(JSON.stringify(messageToSend), me.funcPtr, function(){});
    //     }
    // } else
    if (me.iFarmeMode) {
      me.targetPage.postMessage({ detail: messageToSend, messageType: 'UBPageMsg' }, me.targetOrign)
    } else {
      // eslint-disable-next-line no-undef
      me.eventElm.dispatchEvent(new CustomEvent('UBPageMsg', { detail: messageToSend }))
    }
  })
}

/**
 * Return true if browser extension was installed
 * @returns {boolean}
 */
UBNativeMessage.extensionExists = function () {
  if (ubUtils.isSecureBrowser) return true

  const e = document.getElementById('ubExtensionPageMessageObj')
  if (window.parent && (window.parent !== window)) {
    return true // check in connect
  }

  return !!e && (e.getAttribute('data-extensionAttached') === 'YES')
}

UBNativeMessage.prototype.doOnDisconnect = function (reason) {
  const me = this
  const rejections = me.pendingMessages
  me.pendingMessages = {} // prevent several rejection
  me.connected = false
  if (rejections) {
    Object.keys(rejections).forEach(function (pendingRequest) {
      if (pendingRequest && pendingRequest.deffer) {
        pendingRequest.deffer.reject(reason)
      }
    })
  }
}

UBNativeMessage.prototype.onParentWinMessage = function (event) {
  if (!event.data || (event.data.messageType !== 'UBExtensionMsg')) {
    return
  }
  this.onContentMessage(event.data)
}

/**
 * Connect to native messages host. Check extension & host is installed and up to date (according to feature config passed to constructor).
 * @param {Number} [timeOut] Connection timeOut in millisecond. Default to UBNativeMessage.callTimeOut
 * @returns {Promise<UBNativeMessage>} resolved to UBNativeMessage or rejected to installation/upgrade message
 */
UBNativeMessage.prototype.connect = function (timeOut) {
  const me = this
  let promise
  if (me.connected) {
    return Promise.resolve(me)
  } else {
    if (!UBNativeMessage.extensionExists()) {
      return Promise.reject(new ubUtils.UBError(createFeatureUpdateMsg(NM_EXTENSION_FEATURE, '-', false)))
    } else {
      if (window.parent && (window.parent !== window)) { // in iframe
        me.targetOrign = new URL(document.referrer).origin
        me.targetPage = window.parent
        promise = new Promise((resolve, reject) => {
          let timeId
          const onMessage = function (event) {
            if (!event.data || (event.data.messageType !== 'initUbExtensionParent')) {
              return event
            }
            clearTimeout(timeId)
            if (event.data.detail !== 'initUbExtensionReady') {
              reject(new ubUtils.UBError(createFeatureUpdateMsg(NM_EXTENSION_FEATURE, '-', false)))
              return event
            }
            me.iFarmeMode = true
            window.removeEventListener('message', onMessage)
            window.addEventListener('message', me.onParentWinMessage.bind(me), false)
            resolve(true)
          }
          window.addEventListener('message', onMessage, false)
          me.targetPage.postMessage({ messageType: 'initUbExtension' }, me.targetOrign)
          timeId = setTimeout(function () {
            reject(new ubUtils.UBError(createFeatureUpdateMsg(NM_EXTENSION_FEATURE, '-', false)))
          }, 1500)
        })
      } else {
        promise = Promise.resolve(true)
      }
      return promise.then(function () {
        return me.invoke('__extensionVersion')
      }).then(function (extensionVersion) {
        const versionNum = versionToNumber(extensionVersion)
        if (versionNum < versionToNumber(NM_EXTENSION_FEATURE.minVersion)) {
          ubUtils.logDebug('browser extension version', extensionVersion, 'smaller than required', NM_EXTENSION_FEATURE.minVersion)
          throw new ubUtils.UBError(createFeatureUpdateMsg('extension', extensionVersion, true))
        } else {
          if (versionNum !== versionToNumber(NM_EXTENSION_FEATURE.minVersion)) {
            ubUtils.logDebug('Current extension version', extensionVersion, 'higher than required', NM_EXTENSION_FEATURE.minVersion)
          }
          return true
        }
      }).then(function () {
        return me.invoke('__connect', { hostAppName: me._cfg.host }, timeOut).then(function (featureVersion) {
          const requiredVersion = me._cfg.minVersion
          me.connected = true
          me.featureVersion = featureVersion
          if (versionToNumber(featureVersion) < versionToNumber(requiredVersion)) {
            throw new ubUtils.UBError(createFeatureUpdateMsg(me._cfg, featureVersion, true))
          } else if (featureVersion !== requiredVersion) {
            ubUtils.logDebug('Current feature version', me._cfg.host, featureVersion, 'higher than required', requiredVersion)
          }
          return me
        }, function (reason) {
          ubUtils.logError(reason)
          throw new ubUtils.UBError(createFeatureUpdateMsg(me._cfg, '-', false))
        })
      }).catch(function (reason) {
        me.disconnect()
        throw reason
      })
    }
  }
}

/**
 * Disconnect from native
 * @return {*}
 */
UBNativeMessage.prototype.disconnect = function () {
  const me = this
  if (!me.connected) {
    return Promise.resolve(true)
  }
  return me.invoke('__disconnect').then(function (message) {
    ubUtils.logDebug('UBNativeMessage. Disconnected with message', message)
    me.connected = false
    if (me.eventElm) {
      me.eventElm.removeEventListener('UBExtensionMsg', me.onContentMessage)
    }
    return true
  })
}

/**
 * Timeout (eitres called from setTimeout with msgIDOrMsg === [messageID]
 * or from connection error with msgIDOrMsg === [message object]
 * @param {string|object} msgIDOrMsg
 */
UBNativeMessage.prototype.onMsgTimeOut = function (msgIDOrMsg) {
  let pending
  if (typeof msgIDOrMsg === 'string') {
    pending = this.pendingMessages[msgIDOrMsg]
    if (pending) {
      delete this.pendingMessages[msgIDOrMsg]
    }
  } else {
    pending = msgIDOrMsg
  }
  if (pending) {
    pending.timerID = null
    pending.deffer.reject(new ubUtils.UBError('unknownError', 'pluginMethodCallTimedOut'))
  }
}

/**
 * @private
 * @type {number}
 */
UBNativeMessage.prototype.idCounter = 0

function createFeatureUpdateMsg (featureConfig, currentVersion, isUpdate) {
  const installer = ubUtils.format(featureConfig.installer, featureConfig.minVersion /* .replace(/\./g, '_') */)
  const browserName = ubUtils.isOpera ? 'Opera'
    : ubUtils.isChrome ? 'Chrome' : 'Firefox'
  const msg = 'NM' + (isUpdate ? 'Update' : 'Install') + ((featureConfig.host === 'none') ? 'Extension' + browserName : 'Feature')
  return ubUtils.format(i18n(msg), i18n(featureConfig.UIName), featureConfig.minVersion, currentVersion, installer)
}
