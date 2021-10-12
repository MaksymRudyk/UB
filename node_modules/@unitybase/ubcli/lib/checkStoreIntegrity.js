/**
 * Validate blobStore consistency by checking equality of the md5 checksum stored in the database with actual file MD5
 *
 * Must be used on the same computer where UnityBase server installed ( remote server connection is not supported)
 *
 * Usage from a command line:

 ubcli checkStoreIntegrity -?

 * Usage from a script:

 const integrityChecker = require('@unitybase/ubcli/checkStoreIntegrity')
 let options = {
    user: 'admin',
    password: 'pwd',
    entity: 'tst_document',
    attribute: 'fileStoreSimple'
 }
 integrityChecker(options)

 * @author pavel.mash
 * @module checkStoreIntegrity
 * @memberOf module:@unitybase/ubcli
 */

/* global nhashFile */

const path = require('path')
const fs = require('fs')
const http = require('http')

const cmdLineOpt = require('@unitybase/base').options
const argv = require('@unitybase/base').argv

console.info('')

const errors = []
let docsCount = 0
let docsSize = 0
const started = Date.now()

module.exports = function checkStoreIntegrity (cfg) {
  // increase receive timeout - in case DB server is slow we can easy reach 30s timeout
  http.setGlobalConnectionDefaults({ receiveTimeout: 600000 })
  if (!cfg) {
    const opts = cmdLineOpt.describe('checkStoreIntegrity',
      'Validate blobStore consistency by checking equality of the md5 checksum stored in the database with actual file MD5',
      'ubcli'
    )
      .add(argv.establishConnectionFromCmdLineAttributes._cmdLineParams)
      .add({ short: 'entity', long: 'entity', param: 'entityCode', help: 'Name of entity with document attribute' })
      .add({ short: 'attribute', long: 'attribute', param: 'attributeCode', help: 'Name of BLOB attribute' })
      .add({ short: 'start', long: 'start', param: 'startFrom', defaultValue: 0, help: 'Start from row # (ordered by ID)' })
      .add({ short: 'limit', long: 'limit', param: 'limitCount', defaultValue: -1, help: 'Numbers of rows to proceed. Default -1 for no limit' })
      .add({ short: 'transLen', long: 'transLen', param: 'transactionLength', defaultValue: 1000, help: 'Batch size for atomic select operation' })
      .add({ short: 'errLimit', long: 'errLimit', param: 'maxErrCount', defaultValue: 10, help: 'Stop script after number of inconsistent files exceed this limit' })
    cfg = opts.parseVerbose({}, true)
    if (!cfg) return
  }
  console.time('CheckStoreIntegrity')
  const session = argv.establishConnectionFromCmdLineAttributes(cfg)
  const conn = session.connection
  try {
    doCheckIntegrity(conn, cfg)
  } finally {
    if (session && session.logout) {
      session.logout()
    }
  }
  if (errors.length > 0) {
    console.error('Some files MD5 check fails see CheckStoreIntegrityResult.log file for details')
  } else {
    console.info('All files MD5 check finished successfully')
  }
  console.timeEnd('CheckStoreIntegrity')
  console.info('totalDocsCount =', docsCount, 'totalDocsSize =', docsSize)
}

function doCheckIntegrity (conn, { entity, attribute, start, limit, transLen, errLimit }) {
  const blobStoresArray = argv.getServerConfiguration().application.blobStores
  const blobStores = {}
  blobStoresArray.forEach(store => { blobStores[store.name] = store })
  console.log(blobStores)
  let files = []
  do {
    files = conn.Repository(entity).attrs(['ID', attribute])
      // x100 speed up .where('[' + attribute + ']', 'isNotNull')
      .orderBy('ID').start(start).limit(transLen)
      .selectAsObject()
    files.forEach(function (file) {
      if (docsCount % 100 === 0) { process.stdout.write('.') }

      if (!file[attribute] || errors.length >= errLimit) return
      const fti = JSON.parse(file[attribute])
      if (!blobStores[fti.store]) {
        errors.push(`${file.ID} invalid FTI in database ${file[attribute]}`)
        return
      }

      const fName = fti.fName
      const fullPath = path.join(blobStores[fti.store].path, fti.relPath, fName)

      if (!fs.existsSync(fullPath)) {
        errors.push(fullPath + ' file does not exists')
        return
      }
      const stat = fs.statSync(fullPath)
      if (stat.size !== fti.size) {
        errors.push(`${fullPath} size: ${stat.size} <> DB size: ${fti.size}`)
      }
      docsSize += stat.size
      docsCount++
      // {"v":1,"store":"simple","fName":"tst_document-fileStoreSimple332717533790216239c.js","origName":"appLevelMethod.js","relPath":"108","ct":"application/javascript; charset=utf-8","size":10872,"md5":"d5d69826ae85346517dc090b4dd98989","revision":1}
      const realMD5 = nhashFile(fullPath, 'MD5')
      if (realMD5 !== fti.md5) {
        errors.push(`${fullPath} md5: ${realMD5} <> DB md5: ${fti.md5}`)
      }
    })
    process.stdout.write('*')
    start += transLen
    if (errors.length > 0) {
      fs.writeFileSync('CheckStoreIntegrityResult.log', 'time = ' + (Date.now() - started) + '\r\ntotalDocsCount = ' + docsCount + '\r\ntotalDocsSize = ' + docsSize + '\r\n' + errors.join('\r\n'))
    } else {
      fs.writeFileSync('CheckStoreIntegrityResult.log', 'time = ' + (Date.now() - started) + '\r\ntotalDocsCount = ' + docsCount + '\r\ntotalDocsSize = ' + docsSize + '\r\n No Errors Found')
    }
  } while ((files.length > 0) && ((start < limit) || (limit === -1)) && (errors.length < errLimit))

  console.info('')
}

module.exports.shortDoc =
`Validate blobStore consistency by checking equality of
\t\t\tthe md5 checksum stored in the database with actual
\t\t\tMD5 of files`
