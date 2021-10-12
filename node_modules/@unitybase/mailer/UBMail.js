const dllName = process.platform === 'win32' ? 'ubmail.dll' : 'libubmail.so'
const archPath = process.arch === 'x32' ? './bin/x32' : './bin/x86_64'
const path = require('path')
const fs = require('fs')
const moduleName = path.join(__dirname, archPath, dllName)
let binding
if (!fs.existsSync(moduleName)) {
  console.warn('UBMail is not compiled')
  binding = {}
} else {
  binding = require(moduleName)
}
const UBMail = module.exports
/**
 * The module for sending and receiving mail
 * @module @unitybase/mailer
 */

/**
 * constructor for TubMailReceiver
 *
 * @method TubMailReceiver
 * @return {TubMailReceiver}
 */
UBMail.TubMailReceiver = binding.TubMailReceiver

/**
 * constructor for TubMailSender
 *
 * @method TubMailSender
 * @return {TubMailSenderBind}
 */
UBMail.TubMailSender = binding.TubMailSender

/**
 * Mail server connection using IMAP protocol
 * @example

   try {
      const folders = imap.listFolders()
      console.debug('Available folders are:', folders)

      console.log('select INBOX')
      imap.selectFolder('INBOX')

      // Messages that have the \Recent flag set but not the \Seen flag.
      // This is functionally equivalent to "(RECENT UNSEEN)"
      const newSNs = imap.search('NEW')
      console.log(`INBOX contains ${newSNs.length} new messages`)
      if (newSNs.length) {
        let msg = imap.receive(newSNs[0])
        try {
          inspectMessage(msg)
        } finally {
          msg.freeNative()
        }
      }
    } finally {
      imap.freeNative()
    }

 */
class UBMailImap {
  /**
   * @param {Object}  paramsObj                 Mail server connection parameters
   * @param {String}  paramsObj.host            mail server host
   * @param {String}  paramsObj.port mail       mail server port
   * @param {String}  [paramsObj.user = '']     mail server login
   * @param {String}  [paramsObj.password = ''] mail server password
   * @param {Boolean} [paramsObj.tls=false]     use tls on server request
   * @param {Boolean} [paramsObj.fullSSL=false] Setup TLS before any IMAP command
   * @param {Boolean} [paramsObj.auth = false]  authentication required
   */
  constructor (paramsObj) {
    this._nativeImap = new binding.TubMailImap(paramsObj)
  }

  /**
   * Select a folder by it's name. Returns true on success or throw on error
   * @param {string} folderName
   * @return {boolean}
   */
  selectFolder (folderName) {
    if (!this._nativeImap.selectFolder(folderName)) {
      throw new Error(`IMAP - '${this._nativeImap.getResultString()}'`)
    }
    return true
  }

  /**
   * Close a selected folder. (end of Selected state)
   * @return {boolean}
   */
  closeFolder () {
    if (!this._nativeImap.closeFolder()) {
      throw new Error(`IMAP - '${this._nativeImap.getResultString()}'`)
    }
    return true
  }

  /**
   * Search for message sequence numbers in the selected folder
   * @param {string} criteria A search criteria - see [rfc3501 section-6.4.4](https://tools.ietf.org/html/rfc3501#section-6.4.4)
   * @return {Array<number>}
   */
  search (criteria) {
    let str = this._nativeImap.searchMess(criteria)
    if (!str) {
      let resp = this._nativeImap.getResultString()
      if (resp.indexOf('OK ') === -1) { // SXX OK SEARCH completed
        throw new Error(`IMAP - '${resp}'`)
      } else {
        return []
      }
    }
    return str.split(',').map(sID => parseInt(sID, 10))
  }

  /**
   * Get a message count from a specified folder what match specified criteria
   * @param {string} [folderName='INBOX']
   * @param {string} [criteria='ALL']
   */
  getMessagesCount (folderName='INBOX', criteria='ALL') {
    return this._nativeImap.statusFolder(folderName, criteria)
  }

  /**
   * Receive a full message from current folder by it's sequence numbers.
   * To get s message sequence numbers use a `search()` method.
   *
   * Messages indexes are in the order they're received
   *
   * @throws Throws on error
   * @param {Number} msgSeqNum
   * @returns {TubMimeMessBind}
   */
  receive (msgSeqNum) {
    return this._nativeImap.receive(msgSeqNum)
  }

  /**
   * Mark the message with specified sequence number as `Deleted`.
   *
   * Real deleting will be done after successful `closeFolder` or `expungeFolder`.
   *
   * @throws Throws on error
   * @param {Number} msgSeqNum
   * @returns {TubMimeMessBind}
   */
  deleteMessage (msgSeqNum) {
    return this._nativeImap.deleteMessage(msgSeqNum)
  }

  /**
   * Returns size of the message with specified sequence number
   * @param {Number} msgSeqNum
   */
  getMessageSize(msgSeqNum) {
    const s = this._nativeImap.getMessageSize(msgSeqNum)
    if (s === -1) {
      throw new Error(`IMAP - '${this._nativeImap.getResultString()}'`)
    }
    return s
  }

  /**
   * List sub-folders of initialFolder. If initial folder is '' then list all available folders
   * @param {string} [initialFolderName='']
   * @return {Array<string>}
   */
  listFolders (initialFolderName = '') {
    let str = this._nativeImap.listFolders(initialFolderName)
    if (!str) throw new Error(`IMAP - '${this._nativeImap.getResultString()}`)
    return str.split(',')
  }

  /**
   * Close IMAP connection and release all resources ASAP
   */
  freeNative () {
    if (this._nativeImap) {
      this.closeFolder()
      this._nativeImap.freeNative()
      this._nativeImap = undefined
    }
  }
}
UBMail.UBMailImap = UBMailImap

/**
 * IMAP based mail receiver. API is compatible with TubMailReceiver, so can be used as direct replacement.
 * For LEGACY code only. In new code UBMailImap should be used
 */
class TubMailReceiverImap extends UBMailImap {
  /**
   * @param {Object}  paramsObj                 Mail server connection parameters
   * @param {String}  paramsObj.host            mail server host
   * @param {String}  paramsObj.port mail       mail server port
   * @param {String}  [paramsObj.user = '']     mail server login
   * @param {String}  [paramsObj.password = ''] mail server password
   * @param {Boolean} [paramsObj.tls=false]     use tls on server request
   * @param {Boolean} [paramsObj.fullSSL=false] Setup TLS before any IMAP command
   * @param {Boolean} [paramsObj.auth = false]  authentication required
   */
  constructor (paramsObj) {
    super(paramsObj)
    /**
     * Message IDs for receive iteration
     * @type {undefined}
     * @private
     */
    this._messagesIDs = undefined
  }

  /**
   * Method for TubMailReceiver POP3 compatibility.
   *
   * Receive a full message from ALL 'INBOX' messages by it's index.
   *
   * Messages indexes are in the order they're received
   *
   * @throws Throws on error
   * @param {Number} msgIndex
   * @returns {TubMimeMessBind}
   */
  receive (msgIndex) {
    this._checkIDsLoaded(msgIndex)
    return this._nativeImap.receive(this._messagesIDs[msgIndex])
  }

  /**
   * Method for TubMailReceiver POP3 compatibility.
   *
   * Mark message from ALL 'INBOX' messages by it's index as `Deleted`.
   *
   * Real deleting will be done after successful `closeFolder` or `expungeFolder`.
   * For compatibility with TubMailReceiver UBMailImap.expungeFolder is called inside freeNative() method.
   *
   * @throws Throws on error
   * @param {Number} msgIndex
   * @returns {TubMimeMessBind}
   */
  deleteMessage (msgIndex) {
    this._checkIDsLoaded(msgIndex)
    return this._nativeImap.deleteMessage(this._messagesIDs[msgIndex])
  }

  /**
   * Method for TubMailReceiver POP3 compatibility.
   *
   * Returns size of ALL message from 'INBOX' by it's index
   * @param {Number} msgIndex
   */
  getMessageSize(msgIndex) {
    this._checkIDsLoaded(msgIndex)
    const s = this._nativeImap.getMessageSize(this._messagesIDs[msgIndex])
    if (s === -1) {
      throw new Error(`IMAP - '${this._nativeImap.getResultString()}'`)
    }
    return s
  }

  /**
   * Method for TubMailReceiver POP3 compatibility. Do nothing.
   * @return {Boolean}
   */
  reconnect () {
    return true
  }


  /**
   * Load ALL message IDs from INBOX for POP3 compatibility functions
   * @private
   */
  _checkIDsLoaded(msgIndex) {
    if (!this._messagesIDs) { // initialize message IDs array on first call to receive
      this.selectFolder('INBOX')
      this._messagesIDs = this.search('ALL')
    }
    if (msgIndex >= this._messagesIDs.length ) throw new Error(`IMAP - message index ${msgIndex} is out of bounds [0..${this._messagesIDs.length}]`)
  }

  /**
   * Close IMAP connection and release all resources ASAP
   */
  freeNative () {
    this._messagesIDs = undefined
    super.freeNative()
  }
}
UBMail.TubMailReceiverImap = TubMailReceiverImap


const _bt = binding.TubSendMailBodyType || {}
/**
 * Mail body type
 * @enum
 */
UBMail.TubSendMailBodyType = {
  Text: _bt.Text,
  HTML: _bt.HTML,
  Calendar: _bt.Calendar
}

const _ac = binding.TubSendMailAttachKind || {}
/**
 * Mail attach kind
 * @enum
 */
UBMail.TubSendMailAttachKind = {
  File: _ac.File,
  Text: _ac.Text,
  Buffer: _ac.Buffer
}

/**
 * Get body from message
 *
 * @deprecated Use UBMail.getBodyPart(mimeMsg).read() instead
 */
UBMail.getBodyFromMessage = function () {
  throw new Error('UBMail.getBodyFromMessage is obsolete. Use UBMail.getBodyPart(mimeMsg).read() instead')
}

/**
 * Return a mime part what represents the e-mail body
 * @param {TubMimeMessBind} message
 * @return {TMimePartBind}
 */
UBMail.getBodyPart = function (message) {
  function bodyPartDeep (part) {
    const subPart = part.subPart
    const L = subPart.length
    if (L === 0) {
      return part
    } else {
      for (let i = 0; i < L; i++) {
        const pi = subPart[i]
        if (pi.disposition !== 'ATTACHMENT') {
          return bodyPartDeep(pi)
        }
      }
    }
  }
  return bodyPartDeep(message.messagePart)
}
