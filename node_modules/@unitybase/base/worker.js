const bindings = process.binding('worker')
const { sleep } = process.binding('syNode')

/**
 * Create a worker to execute a script in a dedicated thread.
 *
 * If `onmessage` handler execution fail then worker call `onerror` handler.
 * When thread terminates and Terminate handler assigned worker thread call `onterminate` handler.
 *
 * In handlers you can use 2 methods:
 *  - `postMessage(message)` for posting messages from worker thread. You can get this message by function getMessage of worker object
 *  - `terminate()` for terminating current worker thread
 *
 * @example
 *
 * //The flow:
 * const Worker = require('@unitybase/base').Worker
 * // create a new thread in suspended state.
 * // Evaluate a body of a function runSomething into newly created JavaScript context
 * let w =  new Worker({name: 'WorkerName', onmessage: runSomething});
 * // resume the thread and call a `onmessage` function with parameter, passed to postMessage
 * w.postMessage({action: 'start', param: 'bla-bla'}); // wake up the thread and call a
 *
 * @module worker
 * @memberOf module:@unitybase/base
 * @author v.orel
 */
module.exports = Worker

/**
 * @class
 * Worker implementation.
 * All defined workers **MUST be terminated** until application shut down. In opposite case you can get AV.
 * @param {Object|Number} paramsObj Parameters object for create new Worker or WorkerID for use existing Worker
 * @param {String} [paramsObj.name='Worker'] Name of Worker for debugger
 * @param {String|Function} paramsObj.moduleName Module name. Module must export 3 function: onmessage, onterminate and onerror
 * @param {*} paramsObj.message Message. If assigned then post this message after start thread
 */
function Worker (paramsObj) {
  if (typeof (paramsObj) === 'object') {
    if (!paramsObj.name) paramsObj.name = 'Worker'
    /** @property {Number} workerID Worker ID */
    this.workerID = bindings.createThread(paramsObj)
    /** @property {string} name Worker name */
    this.name = paramsObj.name
  } else if (typeof (paramsObj) === 'number') {
    this.workerID = paramsObj
  }
  if (paramsObj.hasOwnProperty('message')) {
    this.postMessage(paramsObj.message)
  }
}

/**
 * Get message from the worker thread
 * @return {*}
 */
Worker.prototype.getMessage = function () {
  const mes = bindings.getMessage(this.workerID)
  if (mes) {
    return JSON.parse(mes)
  } else {
    return mes
  }
}

/**
 * Try get message from worker thread. Wait until message received or timeout expired
 * @param {Number} timeout Timeout in milliseconds
 * @param {Number} [checkEveryMS=10] Sleep duration before next try get message
 * @return {*}
 */
Worker.prototype.waitMessage = function (timeout, checkEveryMS) {
  let mes
  const start = Date.now()
  if (!checkEveryMS) checkEveryMS = 10
  while ((!(mes = this.getMessage())) && (Date.now() - start < timeout)) {
    sleep(checkEveryMS)
  }
  return mes
}

/**
 * Terminate worker thread
 */
Worker.prototype.terminate = function () {
  bindings.terminate(this.workerID)
}

/**
 * Post message to worker thread. Message are stringified before send
 * @param {*} message
*/
Worker.prototype.postMessage = function (message) {
  bindings.postMessage(this.workerID, JSON.stringify(message))
}
