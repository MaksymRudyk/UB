/**
 * Fake SMS provider implementation. Wrote message to console
 */

// const http = require('http')
module.exports.send = function (phoneNumber, message) {
  console.log(`Message ${JSON.stringify(message)} sends to ${phoneNumber}`)
  return true
  // real implementation example below
  // let request = http.request({
  //   URL: `https://smsc.ua/sys/send.php?login=${process.env.SMS_LOGIN}&psw=${process.env.SMS_PWD}&phones=${phoneNumber}&mes=${encodeURIComponent(message)}`,
  //   method: 'POST',
  //   sendTimeout: 5000,
  //   receiveTimeout: 5000,
  //   keepAlive: true,
  //   compressionEnable: true
  // })
  // const resp = request.writeEnd('')
  // return resp.status === 200
}
