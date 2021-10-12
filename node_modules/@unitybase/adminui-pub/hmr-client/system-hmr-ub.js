require('systemjs-hmr')
const ReconnectingWebSocket = require('./reconnecting-websocket')

module.exports = connectHMR

/**
 * Connect to HMR server
 * @param opts
 * @param {number} [opts.hmrServer='ws://localhost:5776']
 * @param {Object} [opts._system=window.SystemJS] SystemJS instance
 */
function connectHMR (opts) {
  const hmrServer = opts.hmrServer || 'ws://localhost:5776'
  let socket = new ReconnectingWebSocket(hmrServer, null, {debug: false, reconnectInterval: 5000})
  let system = opts._system || window.SystemJS
  function doOnMessage (e) {
    let data = JSON.parse(e.data)
    if (data.event === 'change') {
      system.reload(data.path)
    }
  }

  socket.onmessage = doOnMessage
  socket.onopen = function () {
    window.__systemHmrUBConnected = true
  }
  socket.onclose = function () {
    window.__systemHmrUBConnected = false
  }
}

module.exports = connectHMR
