const SyncConnection = require('@unitybase/base').SyncConnection

console.log('Worker module required')
module.exports = {
  onmessage: onProcessWorker,
  onterminate: onTerminateWorker,
  onerror: onWorkerError
}

function onTerminateWorker () {
  postMessage('Worker terminated')
}

function onWorkerError (message, exception) {
  postMessage('Worker exception: ' + exception + ' during handle message ' + message)
}

function onProcessWorker (message) {
  if (message.signal !== 'start') {
    throw new Error('Worker module: Start phase. Wrong message ' + message)
  } else {
    console.log('Worker module: got a signal', JSON.stringify(message))
  }
  const serverURL = message['serverURL']
  let connection = new SyncConnection(serverURL)
  connection.onRequestAuthParams = function () {
    return {authSchema: 'UB', login: 'admin', password: 'admin'}
  }

  let startTime = Date.now()
  let result = connection.query({
    entity: 'ubs_numcounter',
    method: 'getRegnumCounter',
    execParams: {
      regkey: message.regKey
    }
  })
  postMessage({signal: 'done', thread: message.thread, timeSpend: Date.now() - startTime, numCounter: result.getRegnumCounter})
  terminate()
}
