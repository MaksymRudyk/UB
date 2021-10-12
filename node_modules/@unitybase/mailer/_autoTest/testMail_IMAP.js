/* global sleep */
// configuration
const UBMail = require('../UBMail')

const account1 = 'pavel.mash'
const account1Pwd = process.env.UB_MAIL_PWD
const mailHost = 'mail.softline.main'
const rPort = '110'
//const rPort = '995'

// POP3 via TLS
const receiver1 = new UBMail.TubMailReceiver({
  host: mailHost,
  port: rPort,
  tls: true, fullSSL: false,
  auth: true,
  user: account1,
  password: account1Pwd
})
console.log('POP(s)', receiver1.getMessagesCount())


// IMAP fia SSL tunnel
const imap = new UBMail.UBMailImap({
  host: mailHost,
  //port: '143', tls: false,
  port: '993', fullSSL: true,
  auth: true,
  user: account1,
  password: account1Pwd
})

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


// LEGACY compatibility mode with POP3 based TubMailReceiver
const imapInPop3Mode = new UBMail.TubMailReceiverImap({
  host: mailHost,
  //port: '143', tls: false,
  port: '993', tls: true, fullSSL: true,
  auth: true,
  user: account1,
  password: account1Pwd
})

const cnt = imapInPop3Mode.getMessagesCount()
console.log('IMAP(s) ALL message count in INBOX:', cnt)
if (cnt) {
  console.log('First message size is:', imapInPop3Mode.getMessageSize(0))
  const msg = imapInPop3Mode.receive(0)
  try {
    // console.debug(imap._messagesIDs)
    console.log('First message is:\n')
    inspectMessage(msg)
  } finally {
    msg.freeNative()
  }
  console.log('DELETE MESSAGE 0')
  imapInPop3Mode.deleteMessage(0)
}
imapInPop3Mode.freeNative() // close folder, close IMAP connection and release resources


function inspectMessage(msg) {
  console.debug('From:', msg.header.from)
  console.debug('Subject:', msg.header.subject)
  // TODO console.debug('Date:', new Date(msg.header.date))

  console.log('--BEGIN BODY--')
  console.log(UBMail.getBodyPart(msg).read()) // service method what find a mail body part
  console.log('--END BODY--')

  const compositeMessage = msg.messagePart && msg.messagePart.subPart
  if (compositeMessage) {
    console.log(`message contains ${compositeMessage.length} parts`)
    for (let i = 0, L = compositeMessage.length; i < L; i++) {
      const subPart = compositeMessage[i]
      if (subPart.disposition === 'ATTACHMENT') {
        const attachBin = subPart.read('bin')
        console.log (`Detected attachment with file name ${subPart.fileName} of size ${attachBin.byteLength} bytes`)
      }
    }
  }
}

//const msgSize = imap.getMessageSize(1)
//console.log('Size of first message is', msgSize)