const loader = require('@unitybase/base').dataLoader
/**
 * @author pavel.mash
 * Settings localization to Russian for UBS model
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
          name: 'Автоматически регистрировать удаленным номером',
          description: 'При регистрации в первую очередь берется номер из справочника `Удаленные/зарезервированные номера` для данного ключа' }
	    }
    ]
  }

  loader.localizeEntity(session, localizationConfig, __filename)
}
