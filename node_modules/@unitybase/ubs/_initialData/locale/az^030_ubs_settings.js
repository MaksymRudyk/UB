const loader = require('@unitybase/base').dataLoader
/**
 * @author pavel.mash
 * Settings localization to Azeri for UBS model
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
          name: 'Silinmiş nömrə ilə avtomatik qeydiyyata almaq',
          description: 'Qeydiyyat zamanı ilk növbədə bu açar üçün "silinmiş/ehtiyata salınmış nömrələr" sorğu kitabçasından nömrə götürülür' }
	    }
    ]
  }

  loader.localizeEntity(session, localizationConfig, __filename)
}
