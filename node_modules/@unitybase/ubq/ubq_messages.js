const UB = require('@unitybase/ub')
const App = UB.App
const Session = require('@unitybase/ub').Session
const { uba_common, GC_KEYS } = require('@unitybase/base')
/* global ubq_messages */
// eslint-disable-next-line camelcase
const me = ubq_messages

const os = require('os')
const HOST_NAME = os.hostname() || 'unknown'

me.entity.addMethod('executeSchedulerTask')
me.entity.addMethod('addqueue')
me.entity.addMethod('success')

const statInst = UB.DataStore('ubq_runstat')

/**
 * Mark queue task as successfully executed
 * @method success
 * @param {ubMethodParams} ctxt
 * @param {Number} ctxt.mParams.ID
 * @published
 * @memberOf ubq_messages_ns.prototype
 * @memberOfModule @unitybase/ubq
 */
me.success = function (ctxt) {
  ctxt.dataStore.execSQL('update ubq_messages set completeDate = :completeDate: where ID = :ID:', { completeDate: new Date(), ID: ctxt.mParams.ID })
  return true
}

const UBQ_STORE = UB.DataStore('ubq_messages')
/**
 * Add item to queue.
 *
 * Used by server FTS mixin - do not remove
 * @method addqueue
 * @param {ubMethodParams} ctxt
 * @param {String} ctxt.mParams.queueCode Queue code to add a item to
 * @param {String} ctxt.mParams.msgCmd Command
 * @param {String} ctxt.mParams.msgData Additional command data
 * @param {Number} [ctxt.mParams.msgPriority=0] Priority
 * @published
 * @memberOf ubq_messages_ns.prototype
 * @memberOfModule @unitybase/ubq
 * @return {Boolean}
 */
me.addqueue = function (ctxt) {
  console.debug('JS: ubq_messages.addqueue')
  const mParams = ctxt.mParams
  const fMethod = 'insert'
  const fexecParams = {
    queueCode: mParams.queueCode,
    msgCmd: mParams.msgCmd,
    msgData: mParams.msgData
  }
  if (!mParams.msgPriority) {
    fexecParams.msgPriority = 0
  }

  const runobj = {
    entity: 'ubq_messages',
    method: fMethod,
    execParams: fexecParams
  }
  UBQ_STORE.run(fMethod, runobj)
  return true
}

/**
 * Take a `.` separated string and return a function it points to (starting from global)
 * Think about it as about safe eval
 * @private
 * @param {String} path
 * @return {Function|undefined}
 */
function getFnFromNS (path) {
  let root = global
  if (typeof path !== 'string') {
    return undefined
  }

  const parts = path.split('.')

  for (let j = 0, subLn = parts.length; j < subLn; j++) {
    const part = parts[j]

    if (root[part]) {
      root = root[part]
    } else {
      return undefined
    }
  }
  return typeof root === 'function' ? root : undefined
}

/**
 * REST endpoint for executing a scheduler task.
 * Queue worker will sent the tasks in async mode to this endpoint according to a schedulers.
 * Endpoint wait a POST requests from a local IP with JSON in body:
 *
 *      {
 *        schedulerName: cfg.name, command: cfg.command, module: cfg.module,
 *        singleton: cfg.singleton !== false, logSuccessful: cfg.logSuccessful
 *      }
 *
 * `command` must be a function name (may including namespace), for example `UB.UBQ.sendQueueMail` or `ubs_message_edit.notifyAllRecipients`
 * in case `command` not passed `module` must be a module what export default a function, for example module: '@unitybase/myModule/schedTask'
 * and  in schedTask.js `module exports = function() {...}`
 *
 * In case `singleton` parameter is missing or === false scheduler can run a multiple instances of the same task,
 * otherwise - if previous task with the same name not finished yet current task will not be executed
 *
 * - If command executed success, record with resultError===0 will be written to `ubq_runstat` entity.
 * - If command executed **with exception**, record with resultError===1 will be written to `ubq_runstat` entity,
 * Exception text will be written written to `ubq_runstat.resultErrorMsg`.
 *
 * @method executeSchedulerTask
 * @param {null} nullCtxt
 * @param {THTTPRequest} req Name of a scheduler item
 * @param {THTTPResponse} resp Command to execute
 * @memberOf ubq_messages_ns.prototype
 * @memberOfModule @unitybase/ubq
 * @published
 * @return {Boolean}
 */
me.executeSchedulerTask = function executeSchedulerTask (nullCtxt, req, resp) {
  let logText, err
  let statParams

  if ((Session.userID !== uba_common.USERS.ROOT.ID) || (App.localIPs.indexOf(Session.callerIP) === -1)) {
    throw new Error('SCHEDULER: remote or non root execution is not allowed')
  }

  const task = JSON.parse(req.read())
  const taskName = task.schedulerName || 'unknownTask'
  const isSingleton = (task.singleton !== false)
  const runAsID = task.runAsID
  if (isSingleton && (App.globalCacheGet(`${GC_KEYS.UBQ_TASK_RUNNING_}${taskName}`) === '1')) {
    console.warn('SCHEDULER: task %s is already running', taskName)
    return false
  }
  if (isSingleton) {
    App.globalCachePut(`${GC_KEYS.UBQ_TASK_RUNNING_}${taskName}`, '1')
  }
  err = ''
  try {
    console.debug('SCHEDULER: got a task %j', task)
    const startTime = new Date()
    let entryPoint
    if (task.command) {
      entryPoint = getFnFromNS(task.command)
    } else if (task.module) {
      entryPoint = require(task.module)
    }

    if (!entryPoint) {
      err = `SCHEDULER: invalid command (function ${task.command || task.module} not found)`
    } else {
      try {
        if (runAsID === uba_common.USERS.ADMIN.ID) {
          logText = Session.runAsAdmin(entryPoint)
        } else {
          logText = Session.runAsUser(runAsID, entryPoint)
        }
        App.dbCommit()
      } catch (e) {
        err = e.toString()
        App.dbRollback()
      }
    }
    const endTime = new Date()
    if (task.logSuccessful || err !== '') {
      statParams = {
        appName: HOST_NAME,
        schedulerName: taskName,
        startTime: startTime,
        endTime: endTime,
        resultError: err === '' ? 0 : 1
      }
      if (err !== '') {
        statParams.resultErrorMsg = err
      }
      if (logText) {
        statParams.logText = logText
      }
      statInst.run('insert', {
        execParams: statParams
      })
    }
  } finally {
    if (isSingleton) {
      App.globalCachePut(`${GC_KEYS.UBQ_TASK_RUNNING_}${taskName}`, '0')
    }
  }
  resp.statusCode = 200
  console.debug('SCHEDULER: end a task %j with result %j', task, statParams)
  App.logout()
}
