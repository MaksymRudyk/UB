/**
 * Will test NunCounter generation.
 *
 * Unity base must be running in -c mode
 *
 * UB ./models/UBS/_autotest/010_testUBSNumCounter.js -cfg ubConfig.json -app autotest -u admin -p admin  -t 5
 *
 * @author mpv
 * @created 04.11.2015
 */
const _ = require('lodash')
const Worker = require('@unitybase/base').Worker
const argv = require('@unitybase/base').argv
const options = require('@unitybase/base').options

const session = argv.establishConnectionFromCmdLineAttributes()
const connection = session.connection
const numThreads = parseInt(options.switchValue('t') || '2', 10)
const regKey = options.switchValue('regkey') || 'tst_regkey'

const serverURL = argv.serverURLFromConfig(argv.getServerConfiguration())
try {
  console.log('start ', numThreads, 'thread')
  let fullPath = require.resolve('./_numCounterWorker.js')
  fullPath = fullPath.replace(/\\/g, '/')
  console.log(`Load worker module from ${fullPath}`)
  // create threads
  const workers = []
  for (let i = 0; i < numThreads; i++) {
    workers.push(new Worker({
      name: 'numCounter' + i,
      moduleName: fullPath // '@unitybase/ubs/_autotest/_numCounterWorker.js'
    }))
    console.log(`Create worker #${i}`)
  }
  // create record in ubs_numcounter
  connection.query({
    entity: 'ubs_numcounter',
    method: 'getRegnumCounter',
    execParams: {
      regkey: regKey
    }
  })
  let i = 0
  workers.forEach(function (worker) {
    worker.postMessage({signal: 'start', thread: i, serverURL: serverURL, regKey: regKey})
    console.log(`Worker #${i} started`)
    i++
  })
  let resultsCounters = []
  // wait for done
  workers.forEach(function (worker) {
    worker.result = worker.waitMessage(100000)
    resultsCounters.push(worker.result.numCounter)
  })
  if (resultsCounters.length !== _.uniq(resultsCounters).length) {
    throw new Error('Method ubs_numcounter.getRegnumCounter generate duplicates values for regKey:' + regKey + '#' + resultsCounters)
  } else {
    console.log('Test successfull(./models/UBS/_autotest/010_testUBSNumCounter.js):' + resultsCounters)
  }
} finally {
  session.logout()
}
