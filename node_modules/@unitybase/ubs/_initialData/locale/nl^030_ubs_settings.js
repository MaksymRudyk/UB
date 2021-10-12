const loader = require('@unitybase/base').dataLoader
/**
 * @author pavel.mash
 * Settings localization to English for UBS model
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
          name: 'Automatisch registreren binnen verwijderd nummer',
          description: 'Bij het registreren in de eerste plaats neemt het systeem het nummer uit het woordenboek `Verwijderde en gereserveerde nummers` voor deze sleutel' }
	    }
    ]
  }

  loader.localizeEntity(session, localizationConfig, __filename)
}
