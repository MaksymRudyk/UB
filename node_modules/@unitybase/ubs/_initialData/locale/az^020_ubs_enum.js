const loader = require('@unitybase/base').dataLoader
/**
 * @author pavel.mash
 * Enumeration localization to Azeri for UBS model
 * Used by `ubcli initialize` command
 * @param {ServerSession} session
 */
module.exports = function (session) {
  let localizationConfig = {
    entity: 'ubm_enum',
    keyAttribute: 'eGroup;code',
    localization: [
      // UBS_MESSAGE_TYPE
      { keyValue: 'UBS_MESSAGE_TYPE;user', execParams: { name: 'İstifadəçi' } },
      { keyValue: 'UBS_MESSAGE_TYPE;system', execParams: { name: 'Sistem' } },
      { keyValue: 'UBS_MESSAGE_TYPE;warning', execParams: { name: 'Xəbərdarlıq' } },
      { keyValue: 'UBS_MESSAGE_TYPE;information', execParams: { name: 'Məlumat' } }
    ]
  }
  loader.localizeEntity(session, localizationConfig, __filename)
}
