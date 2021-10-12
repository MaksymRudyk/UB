/* global sleep */
const path = require('path')
const assert = require('assert')
const fs = require('fs')
const {EOL} = require('os')

let testFilesDir = path.resolve(__dirname, 'TestFiles')
// let moduleName = path.basename(path.resolve(__dirname, '../'))
// let useTls = (moduleName !== 'mailer')
console.time('load UBMail')
const UBMail = require('../UBMail')
console.timeEnd('load UBMail')
const SLEEP_TIMEOUT = 100 // wait between send and receive

// configuration
const account1 = 'UB_AUTOTEST1'
const account1Pwd = 'BE-1vJwQAH'
const account2 = 'UB_AUTOTEST2'
const account2Pwd = 'BE-1vJwQAH'
const mailHost = 'mail.softline.main'
const rPort = '110'
const sPort = '25'
const mailSuffix = '@softline.kiev.ua'

const mailAddr1 = account1 + mailSuffix
const mailAddr2 = account2 + mailSuffix
let res

const sender1 = new UBMail.TubMailSender({
  host: mailHost,
  port: sPort,
  tls: false
})
const sender2 = new UBMail.TubMailSender({
  host: mailHost,
  port: sPort,
  tls: false
})
const receiver1 = new UBMail.TubMailReceiver({
  host: mailHost,
  port: rPort,
  tls: false,
  auth: true,
  user: account1,
  password: account1Pwd
})
const receiver2 = new UBMail.TubMailReceiver({
  host: mailHost,
  port: rPort,
  tls: false,
  auth: true,
  user: account2,
  password: account2Pwd
})
console.log('useTls=MIXED')
// Start tests

console.log('1. Cleaning the mailboxes')
emptyMailBoxes()
receiveMail(receiver1, account1, 0)
receiveMail(receiver2, account2, 0)

console.log('2. Sending message to both mailboxes with plain text body without attaches')
const message1 = {
  subject: 'subject 1',
  bodyType: UBMail.TubSendMailBodyType.Text,
  body: `body${EOL} 1`,
  fromAddr: mailAddr1,
  toAddr: [mailAddr1, mailAddr2]
}
res = sender1.sendMail(message1)
assert(res, 'Sending message1 failed: ' + sender1.lastError)
sleep(SLEEP_TIMEOUT)
let msgList = receiveMail(receiver1, account1, 1)
checkIsSameMessage(msgList[0], message1)

console.log('3. Sending message to second mailbox with html body with 2 text file attaches')
// first attach is not base64, but second is
const message2 = {
  subject: 'subject 2',
  bodyType: UBMail.TubSendMailBodyType.HTML,
  body: '<b>body</b> 2',
  fromAddr: mailAddr1,
  toAddr: [mailAddr2],
  attaches: [
    {
      kind: UBMail.TubSendMailAttachKind.Text,
      atachName: 'atach1.txt',
      data: 'atach1 text'
    },
    {
      kind: UBMail.TubSendMailAttachKind.Text,
      atachName: 'atach2.txt',
      data: Buffer.from('atach2 text').toString('base64'),
      isBase64: true
    }
  ]
}
res = sender1.sendMail(message2)
assert.ok(res, 'Sending message2 failed: ' + sender1.lastError)
sleep(SLEEP_TIMEOUT)
receiveMail(receiver1, account1, 1)
msgList = receiveMail(receiver2, account2, 2)
checkIsSameMessage(msgList[0], message1)
checkIsSameMessage(msgList[1], message2)

emptyMailBoxes()

console.log('4. Sending message to first mailbox with Unicode text body with 6 attaches')
// attach with even number s is not base64, and with odd number is base64
const message3 = {
  subject: 'тема сообщения Təşəbbüs ',
  bodyType: UBMail.TubSendMailBodyType.Text,
  body: `Cavab ${EOL} məktub Təşəbbüs məktu`,
  fromAddr: mailAddr2,
  toAddr: [mailAddr1],
  attaches: [
    {
      kind: UBMail.TubSendMailAttachKind.Text,
      atachName: 'atach1.txt',
      data: 'тест Cavab \r\n məktub \r\n  Təşəbbüs məktu '
    },
    {
      kind: UBMail.TubSendMailAttachKind.Text,
      atachName: 'atach2.txt',
      data: '0YLQtdGB0YIgQ2F2YWIgXHJcbiBtyZlrdHViIFxyXG4gIFTJmcWfyZliYsO8cyBtyZlrdHUg',
      isBase64: true
    },
    {
      kind: UBMail.TubSendMailAttachKind.File,
      data: path.resolve(testFilesDir, '1.bmp'),
      isBase64: false
    },
    {
      kind: UBMail.TubSendMailAttachKind.File,
      atachName: '1_.bmp',
      data: path.resolve(testFilesDir, '1-base64.bmp'),
      isBase64: true
    },
    {
      kind: UBMail.TubSendMailAttachKind.Buffer,
      atachName: '2.jpg',
      data: fs.readFileSync(path.resolve(testFilesDir, '1.jpg'), {encoding: 'bin'}),
      isBase64: false
    },
    {
      kind: UBMail.TubSendMailAttachKind.Buffer,
      atachName: '2_.jpg',
      data: fs.readFileSync(path.resolve(testFilesDir, '1-base64.jpg'), {encoding: 'bin'}),
      isBase64: true
    }
  ]
}
res = sender2.sendMail(message3)
assert.ok(res, 'Sending message3 failed: ' + sender2.lastError)
sleep(SLEEP_TIMEOUT)
receiveMail(receiver2, account2, 0)
msgList = receiveMail(receiver1, account1, 1)
checkIsSameMessage(msgList[0], message3)

emptyMailBoxes()

console.log('5. Sending message to second mailbox with UTF8 html body without attach')
const message4 = {
  subject: 'subject 4',
  bodyType: UBMail.TubSendMailBodyType.HTML,
  body: `<b>body</b> 4 <i>тест Cavab ${EOL} məktub ${EOL}  Təşəbbüs məktu </i>`,
  fromAddr: mailAddr1,
  toAddr: [mailAddr2]
}
res = sender1.sendMail(message4)
assert.ok(res, 'Sending message4 failed: ' + sender1.lastError)
sleep(SLEEP_TIMEOUT)
msgList = receiveMail(receiver2, account2, 1)
checkIsSameMessage(msgList[0], message4)

emptyMailBoxes()
/**
 * Delete all messages from both mailboxes
 */
function emptyMailBoxes () {
  /**
   * Delete all messages from custom mailbox
   * @param {UBMail.TubMailReceiver} r
   */
  function emptyMail (r) {
    let cnt = r.getMessagesCount()
    for (let i = 1; i <= cnt; i++) {
      r.deleteMessage(i)
    }
    r.reconnect()
  }
  emptyMail(receiver1)
  emptyMail(receiver2)
}

/**
 * Receive mail
 * @param {UBMail.TubMailReceiver} r
 * @param {String} account
 * @param {Number} cntExpected expected count of messages
 * @returns {Array.<UBMail.TUBMimeMess>}
 */
function receiveMail (r, account, cntExpected) {
  r.reconnect()
  let cnt = r.getMessagesCount()
  let res = []
  for (let i = 1; i <= cnt; i++) {
    res.push(r.receive(i))
  }
  assert.strictEqual(res.length, cntExpected, 'receiveMail ' + account + ' expected ' + cntExpected + ' message actually: ' + res.length)

  return res
}

function checkIsSameMessage (mimeMsg, sendingMsg) {
  assert.strictEqual(mimeMsg.header.subject, sendingMsg.subject, `Invalid message subject. Got "${mimeMsg.header.subject}" must be "${sendingMsg.subject}"`)
  assert.strictEqual(mimeMsg.header.from, '<' + sendingMsg.fromAddr + '>', 'Invalid message from field')
  for (let i = 0; i < sendingMsg.toAddr.length; i++) {
    assert.strictEqual(mimeMsg.header.toList.readLn(i), '<' + sendingMsg.toAddr[i] + '>', 'Invalid message to field')
  }
  assert.strictEqual(mimeMsg.header.cCList.read(), '', 'Invalid message CC field')
  if (sendingMsg.bodyType === UBMail.TubSendMailBodyType.HTML) {
    let receivedBody = UBMail.getBodyPart(mimeMsg).read()
    assert.strictEqual(
      receivedBody,
      '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">' + sendingMsg.body,
      `Invalid HTML message body "${receivedBody}"`
    )
  } else {
    let receivedBody = UBMail.getBodyPart(mimeMsg).read()
    assert.strictEqual(receivedBody, sendingMsg.body, `Invalid ${sendingMsg.bodyType} message body "${receivedBody}"`)
  }

  if ((sendingMsg.attaches) && (sendingMsg.attaches.length > 0)) {
    assert.strictEqual(mimeMsg.messagePart.subPart.length, 1 + sendingMsg.attaches.length, 'Incorrect subparts count')
    for (let i = 1; i < mimeMsg.messagePart.subPart.length; i++) {
      let subPart = mimeMsg.messagePart.subPart[i]
      let attach = sendingMsg.attaches[i - 1]
      assert.strictEqual(subPart.disposition, 'ATTACHMENT', 'Invalid attachment disposition')
      if ((attach.kind === UBMail.TubSendMailAttachKind.File) && (!attach.atachName)) {
        assert.strictEqual(subPart.fileName, attach.data.substr(-subPart.fileName.length), 'Invalid attachment file name')
      } else {
        assert.strictEqual(subPart.fileName, attach.atachName, 'Invalid attachment file name')
      }
      let body
      switch (attach.kind) {
        case UBMail.TubSendMailAttachKind.Text:
          // if content is base64 encoded during send it will be decoded automatically
          body = subPart.read()
          if (attach.isBase64) {
            // transform body to base64 and compare with origin
            body = Buffer.from(body).toString('base64')
          }
          assert.strictEqual(body, attach.data, `Invalid text data in attachment ${i}`)
          break
        case UBMail.TubSendMailAttachKind.Buffer:
          if (attach.isBase64) {
            body = subPart.read('bin') // binary data
            body = Buffer.from(body).toString('base64') // transform if to base64 string
            assert.deepEqual(body, Buffer.from(attach.data).toString(), `Invalid buffer data in attachment ${i}`)
          } else {
            body = subPart.read('bin') // partBody.read('base64')
            assert.deepEqual(body, attach.data, `Invalid buffer data in attachment ${i}`)
          }
          break
        case UBMail.TubSendMailAttachKind.File:
          body = subPart.read('bin') // partBody.read('bin')
          if (attach.isBase64) {
            body = Buffer.from(body).toString('base64') // subPart.partBody.read('bin')
            assert.deepEqual(body, fs.readFileSync(attach.data, {encoding: 'utf-8'}), `Invalid file data in attachment ${i}`)
          } else {
            body = subPart.read('bin') // partBody.read('base64')
            assert.deepEqual(body, fs.readFileSync(attach.data, {encoding: 'bin'}), `Invalid file data in attachment ${i}`)
          }
          break
      }
    }
  }
}
