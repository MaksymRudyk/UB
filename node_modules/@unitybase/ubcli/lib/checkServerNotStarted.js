/**
 * Command line module. Throw error in case server is started.
 *
 * @module checkServerNotStarted
 * @memberOf module:@unitybase/ubcli
 * @author pavel.mash
 */
const options = require('@unitybase/base').options
const argv = require('@unitybase/base').argv

module.exports = function initialize (cfg) {
  if (!cfg) {
    const opts = options.describe('checkServerNotStarted', 'This command throw error in case server is started', 'ubcli')
      .add({ short: 'host', long: 'host', param: 'fullServerURL', defaultValue: 'auto', searchInEnv: true, help: 'Server URL to connect, including protocol' })
    cfg = opts.parseVerbose({}, true)
    if (!cfg) return
  }
  if (argv.checkServerStarted(cfg.host)) {
    throw new Error(`Somebody listen on ${cfg.host}. If this is UnityBase server - please, shut down it`)
  }
}
module.exports.shortDoc = 'Throw error in case server is started'
