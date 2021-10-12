const loader = require('@unitybase/base').dataLoader
/**
 * @author pavel.mash
 * Settings localization to Tajik for UBS model
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
          name: 'Ба таври худкор ба қайд гирифтан бо рақами дурдаст',
          description: 'Ҳангоми бақайдгирӣ, пеш аз ҳама, рақам аз маълумотнома гирифта мешавад. Рақамҳои дурдаст/ҳифз шуда барои ин калид' }
	    }
    ]
  }

  loader.localizeEntity(session, localizationConfig, __filename)
}
