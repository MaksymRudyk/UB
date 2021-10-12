const loader = require('@unitybase/base').dataLoader
/**
 * @author pavel.mash
 * Enumeration localization to Indonesian for UBS model
 * Used by `ubcli initialize` command
 * @param {ServerSession} session
 */
module.exports = function (session) {
  let localizationConfig = {
    entity: 'ubm_enum',
    keyAttribute: 'eGroup;code',
    localization: [
      // UBS_MESSAGE_TYPE
      { keyValue: 'UBS_MESSAGE_TYPE;user', execParams: { name: 'By users' } },
      { keyValue: 'UBS_MESSAGE_TYPE;system', execParams: { name: 'System' } },
      { keyValue: 'UBS_MESSAGE_TYPE;warning', execParams: { name: 'Warning' } },
      { keyValue: 'UBS_MESSAGE_TYPE;information', execParams: { name: 'Information' } }
    ]
  }
  loader.localizeEntity(session, localizationConfig, __filename)
}
