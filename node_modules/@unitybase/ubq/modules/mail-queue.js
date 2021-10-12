// author pavel.mash on 25.09.2016.
/**
 * Adding a EMail to queue for sending
 * @module mail-queue
 * @memberOf module:@unitybase/ubq
 */
const { App, DataStore } = require('@unitybase/ub')
const UBMail = require('@unitybase/mailer')

let ubqMessagesStore
let ubqAttachmentsStore
const MAILER_ENABLED = App.serverConfig.application.customSettings && App.serverConfig.application.customSettings.mailerConfig

/**
 * @typedef {Object} mailAttachmentReference
 * @property {String} [entity] The entity code where data is stored
 * @property {string} [attribute] Code of attribute with type `Document` from entity
 * @property {number} [id] Row ID
 * @property {string} attachName Name of attachment (as it will be displayed in EMail)
 * @property {string} [data] content
 */

/**
 * Add a mail to queue
 * @param {Object} config
 * @param {string|Array<string>} config.to Receiver EMail address (or array of addresses)
 * @param {string} config.subject A message subject
 * @param {string} config.body A message body
 * @param {string} [config.from] A optional sender EMail address. If missing - taken from ubConfig.application.customSetting.mailerConfig.fromAddr
 * @param {UBMail.TubSendMailBodyType} [config.bodyType=UBMail.TubSendMailBodyType.HTML] A mail body type
 * @param {Array<mailAttachmentReference>} [config.attachments] The references to documents, stored in the entities. Will be attached to EMail during sending
 */
module.exports.queueMail = function (config) {
  if (!MAILER_ENABLED) {
    console.warn('Mailer disabled in config. queueMail is ignored. Better to check `mailerEnabled` before put mail into queue')
    return
  }
  const msgCmd = {
    from: config.from || App.serverConfig.application.customSettings.mailerConfig.fromAddr,
    to: Array.isArray(config.to) ? config.to : [config.to],
    bodyType: config.bodyType || UBMail.TubSendMailBodyType.HTML,
    subject: config.subject
  }
  if (config.attaches) console.warn('Invalid parameter "attaches" for queueMail. Use "attachments" instead')
  if (config.attachments) {
    msgCmd.attaches = config.attachments.map(attachInfo => {
      if (attachInfo.data) {
        if (!ubqAttachmentsStore) {
          ubqAttachmentsStore = DataStore('ubq_mailAttachment')
        }
        const ID = ubqAttachmentsStore.generateID()
        const blobAttr = App.blobStores.putContent({
          ID,
          entity: 'ubq_mailAttachment',
          attribute: 'attachment',
          fileName: attachInfo.attachName
        }, attachInfo.data)
        ubqAttachmentsStore.insert({
          execParams: {
            ID,
            attachment: JSON.stringify(blobAttr)
          }
        })

        return {
          entity: 'ubq_mailAttachment',
          attribute: 'attachment',
          id: ID,
          attachName: attachInfo.attachName
        }
      }

      return attachInfo
    })
  }
  // create store here - in case of initialization entity ubq_messages may not exists
  if (!ubqMessagesStore) ubqMessagesStore = DataStore('ubq_messages')
  ubqMessagesStore.insert({
    execParams: {
      queueCode: 'mail',
      msgCmd: JSON.stringify(msgCmd),
      msgData: config.body,
      msgPriority: 0
    }
  })
}

/**
 * Indicate mailer is configured in serverConfig.application.customSettings.mailerConfig.
 *
 * In case this property is false calls to `queueMail` do nothing, so better to verify it before mail
 * creation to save a server resources
 */
module.exports.mailerEnabled = MAILER_ENABLED
