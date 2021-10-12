const UBMail = require('../UBMail')
const path = require('path')
const assert = require('assert')
const fs = require('fs')
const {EOL} = require('os')

let sender = new UBMail.TubMailSender({
  host: 'mail.softline.main',
  port: '25',
  tls: false
})

const testFilesDir = path.resolve(__dirname, 'TestFiles')
const message3 = {
  subject: 'тема сообщения Təşəbbüs ',
  bodyType: UBMail.TubSendMailBodyType.Text,
  body: `Cavab məktub Təşəbbüs məktu`,
  fromAddr: 'pavel.mash@inbase.com.ua',
  toAddr: ['pavel.mash@inbase.com.ua'],
  attaches: [
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
    }
  ]
}
res = sender.sendMail(message3)
assert.ok(res, 'Sending message3 failed: ' + sender.lastError)