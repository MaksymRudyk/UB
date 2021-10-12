const fs = require('fs')
const UB = require('@unitybase/ub')
const App = UB.App
const mailerParams = App.serverConfig.application.customSettings.mailerConfig
const UBMail = require('@unitybase/mailer')

/**
 * Mail sender for Scheduler
 * Read queue with code **mail** and send mails to recipient(s)
 * to attach files into the mail, use queue like this:

 msgCmd.attaches = [{entity: <entity>, attribute: 'document', id: <id>, attachName: <file name>}, ...]

 * for document image:

 {
   entity: 'doc_document',
   attribute: 'document',
   id: <doc_document ID>,
   attachName: "document.pdf"
 }

 * for attached files:
 *
 {
   entity: "doc_attachment",
   attribute: 'document',
   id: <attachment ID>,
   attachName: <attachment caption>
 }

 *
 * @module ubqMailJob
 * @memberOf module:@unitybase/ubq
 */
module.exports = function () {
  let eMsg
  const mailData = {}
  let sentCount = 0

  console.log('Call JS method: UB.UBQ.sendQueueMail')
  if (!mailerParams.targetHost) {
    throw new Error('Invalid mailer configuration. Define ubConfig.YourApp.customSettings.mailerConfig object')
  }

  const inst = UB.Repository('ubq_messages')
    .attrs(['ID', 'queueCode', 'msgCmd', 'msgData'])
    .where('[queueCode]', '=', 'mail')
    .where('[completeDate]', 'isNull')
    .limit(100)
    // handle messages In the order of their arrival
    .orderBy('[ID]')
    .select()

  if (inst.eof) {
    return 'No emails sent'
  }
  console.debug('Mailer: before new TubMailSender')
  let mailSender = new UBMail.TubMailSender({
    host: mailerParams.targetHost,
    port: mailerParams.targetPort || '25',
    user: mailerParams.user || '',
    password: mailerParams.password || '',
    tls: Boolean(mailerParams.autoTLS),
    fullSSL: Boolean(mailerParams.fullSSL),
    auth: mailerParams.auth || false,
    deferLogin: true
  })
  try {
    console.debug('Mailer: before mailSender.Login')
    mailSender.login()
    console.debug('Mailer: after mailSender.Login')

    while (!inst.eof) {
      mailData.ID = inst.get('ID')
      mailData.msgCmd = inst.get('msgCmd')
      mailData.msgData = inst.get('msgData')
      const cmd = JSON.parse(mailData.msgCmd)
      mailData.attaches = []
      if (cmd.attaches && cmd.attaches.length) {
        for (let i = 0, L = cmd.attaches.length; i < L; i++) {
          try {
            const attachFN = App.blobStores.getContentPath({
              entity: cmd.attaches[i].entity,
              attribute: cmd.attaches[i].attribute,
              ID: cmd.attaches[i].id
            })
            if (!fs.existsSync(attachFN)) {
              mailData.attaches.push({
                kind: UBMail.TubSendMailAttachKind.Text,
                attachName: cmd.attaches[i].attachName + '.txt',
                data: `File not exists, please forward this message to administrator.
  Entity: ${cmd.attaches[i].entity}, attribute: ${cmd.attaches[i].attribute}, ID: ${cmd.attaches[i].id}`
              })
            } else {
              mailData.attaches.push({
                kind: UBMail.TubSendMailAttachKind.File,
                attachName: cmd.attaches[i].attachName,
                data: attachFN,
                isBase64: false
              })
            }

            if (cmd.attaches[i].entity === 'ubq_mailAttachment') {
              UB.DataStore('ubq_mailAttachment').run('delete', {
                execParams: {
                  ID: cmd.attaches[i].id
                }
              })
            }
          } catch (e) {
            eMsg = (e && e.stack) ? e.message + ' - ' + e.stack : e
            console.error('loadContent', eMsg)
          }
        }
      }
      /* this. */
      internalSendMail(mailData, mailSender)
      sentCount++
      inst.run('success', {
        ID: mailData.ID
      })
      App.dbCommit(App.domainInfo.entities.ubq_messages.connectionName)
      inst.next()
    }
  } finally {
    console.debug('!!!!!!!!! mailSender.freeNative !!!!!!!!!')
    mailSender.freeNative() // release a connection to mail server
    mailSender = null
  }
  return `Send ${sentCount} emails`
}

/**
 * @private
 * @param {object} data
 * @param {String} data.msgCmd Stringified JSON of mail
 * @param {String} data.msgData mail body (used if data.msgCmd.body is empty or not defined)
 * @param {UBMail} mailer Mailer instance
 * @return {Boolean}
 */
function internalSendMail (data, mailer) {
  const fMailData = JSON.parse(data.msgCmd)

  console.log('UB.UBQ.internalSendMail. Trying send mail to:', fMailData.to)

  const fRes = mailer.sendMail({
    fromAddr: fMailData.from || mailerParams.fromAddr || ('no-reply@' + mailerParams.targetHost),
    subject: fMailData.subject,
    bodyType: fMailData.bodyType || UBMail.TubSendMailBodyType.Text,
    body: fMailData.body ? fMailData.body : data.msgData,
    toAddr: Array.isArray(fMailData.to) ? fMailData.to : [fMailData.to],
    attaches: data.attaches
  })

  if (!fRes) {
    console.error('UB.UBQ.internalSendMail. Error when sending mail:', mailer.lastError)
  } else {
    console.info('UB.UBQ.internalSendMail. Mail sent successfully')
  }
  return fRes
}
