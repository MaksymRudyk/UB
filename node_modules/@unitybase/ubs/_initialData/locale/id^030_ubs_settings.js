const loader = require('@unitybase/base').dataLoader
/**
 * @author pavel.mash
 * Settings localization to Indonesian for UBS model
 * Used by `ubcli initialize` command
 * @param {ServerSession} session
 */
module.exports = function (session) {
  let localizationConfig = {
    entity: 'ubs_settings',
    keyAttribute: 'settingKey',
    localization: [
      { keyValue: 'ubs.numcounter.autoRegWithDeletedNumber',
        execParams: {
          name: 'Automatically register within deleted number',
          description: 'When registering in the first place system takes the number from dictionary `Deleted and reserved numbers` for this key' }
      }
    ]
  }

  loader.localizeEntity(session, localizationConfig, __filename)
}
