# @unitybase/mailer
The module for sending and receiving mail.

## SSL/TLS notes
For SSL support OpenSSL libraries version >= 0.9.7 must be installed:
 - Windows: `libssl32.dll`, `libeay32.dll`, (optional `ssleay32.dll`) must be in the PATH
 - Linux: libssl.so libcrypto.so must be in LD_LIBRARY_PATH. On Debian:
 ```
  // debian
 sudo apt install libssl-dev

  //Oracle Enterprise linux
 sudo dnf install openssl-libs
 sudo ln -s /usr/lib64/libcrypto.so.1.1 /usr/lib64/libcrypto.so
 sudo ln -s /usr/lib64/libssl.so.1.1 /usr/lib64/libssl.so
```

There is 2 property for SSL configuration:
 - if `tls: true`: initial TCP connection established without a TLS.
   In case server protocol request to upgrade (usually after first handshake command) - connection upgraded to TLS;
 - if `fullSSL: true`: initial TCP connection established with TLS (TSL/SSL tunnel), so any protocol commands send over TLS  

## Mailer availability warning
**WARNING** - do not send the mail directly from the HTTP thread.
Mail server can fail or work slowly.
The right way is to **put the mail messages in the queue** and send them via the scheduler.

{@link module:@unitybase/ubq @unitybase/ubq} module already has:
  - a module 'modules/mail-queue` for adding e-mails to the queue
  - a `mail` scheduler job for sending mails from the queue (once a minute by default)

## Usage sample
```js
  const UBMail = require('@unitybase/mailer')
  // send e-mail
  let sender = new UBMail.TubMailSender({
    host: 'mail.host.name',
    port: '25',
    tls: false
  })
  sender.sendMail({
    subject: 'subject 1',
    bodyType: UBMail.TubSendMailBodyType.Text,
    body: 'body\r\n 1',
    fromAddr: mailAddr1,
    toAddr: [mailAddr1, mailAddr2]
  })

  // Receive e-mails
  let receiver = new UBMail.TubMailReceiver({
    host: mailHost,
    port: '110',
    tls: false,
    auth: true,
    user: 'mpv',
    password: 'myPassword'
  })
  receiver.reconnect();
  let cnt = r.getMessagesCount()
  let res = []
  for (let i = 1; i <= cnt; i++ ) {
      res.push(r.receive(i))
  }
```