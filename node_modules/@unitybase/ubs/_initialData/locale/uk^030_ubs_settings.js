const loader = require('@unitybase/base').dataLoader
/**
 * @author pavel.mash
 * Settings localization to Ukrainian for UBS model
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
          name: 'Автоматично використовувати видалені номери',
          description: 'При генерації номеру в першу чергу береться значення з довідника `Видалені/зарезервовані номери` для даного ключа' }
	    }
    ]
  }

  loader.localizeEntity(session, localizationConfig, __filename)
}
