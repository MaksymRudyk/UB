
/**
 * Created by pavel.mash on 17.01.2017.
 */

const assert = require('assert')
const ok = assert.ok
const cmdLineOpt = require('@unitybase/base').options
const argv = require('@unitybase/base').argv
const TEST_NAME = 'clientRequire Endpoint test'

module.exports = function runTest (options) {
  let session, conn

  if (!options) {
    let opts = cmdLineOpt.describe('', TEST_NAME)
      .add(argv.establishConnectionFromCmdLineAttributes._cmdLineParams)
    options = opts.parseVerbose({}, true)
    if (!options) return
  }

  session = argv.establishConnectionFromCmdLineAttributes(options)
  // if (!session.__serverStartedByMe) {
  //   throw new Error('Shut down server before run this test')
  // }
  conn = session.connection

  try {
    console.debug('Start ' + TEST_NAME)
    testClientRequireEndpoint(conn)
  } finally {
    // session.logout()
  }

  function testClientRequireEndpoint (conn) {
    let absFile = process.platform === 'win32'
      ? process.env.windir + '/win.ini'
      : process.env.HOME + '/.profile'
    assert.throws(
      () => conn.get(`clientRequire/${absFile}`),
      /Bad Request/, 'Endpoint clientRequire must restrict access to absolute path'
    )

    assert.throws(
      () => conn.get(`clientRequire//driveRoot.txt`),
      /Bad Request/, 'Endpoint clientRequire must restrict access to ablolute path (drive root)'
    )

    assert.throws(
      () => conn.get(`clientRequire/@unitybase/ub/../../../ubConfig.json`),
      /(Not Found|Bad Request)/, 'Endpoint clientRequire must restrict access folder up from resolved'
    )

    assert.throws(
      () => conn.get(`clientRequire/@unitybase/ub/../../ubConfig.json`),
      /Not Found/, 'Endpoint clientRequire must restrict access folder up from resolved'
    )

    assert.throws(
      () => conn.get(`clientRequire/lerna`),
      /(Not Found|Bad Request)/, 'Endpoint clientRequire must restrict access to modules outside app node_modules folder'
    )

    assert.throws(
      () => conn.get(`clientRequire/@unitybase/ub/_autotest/0080_clientRequireEndpoint.js`),
      /Bad Request/, 'Endpoint clientRequire must restrict access to non-public model folders'
    )

    assert.throws(
      () => conn.get(`clientRequire/@unitybase/ub/modelUB.js`),
      /Bad Request/, 'Endpoint clientRequire must restrict access to model without public folders'
    )

    assert.throws(
      () => conn.get(`clientRequire/@unitybase/ub`),
      /Bad Request/, 'Endpoint clientRequire must restrict access to non-public root of model'
    )

    ok(conn.get(`clientRequire/@unitybase/ub/public/schemas/entity.schema.json`), 'Access to public model folder must be allowed')
    ok(conn.get(`clientRequire/@unitybase/cs-shared/LocalDataStore`), 'Access to module not defined as model must be allowed')
  }
}
