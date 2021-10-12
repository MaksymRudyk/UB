const loader = require('@unitybase/base').dataLoader
/**
 * @author pavel.mash
 * Enumeration localization to Tajik for UBS model
 * Used by `ubcli initialize` command
 * @param {ServerSession} session
 */
module.exports = function (session) {
  let localizationConfig = {
    entity: 'ubm_enum',
    keyAttribute: 'eGroup;code',
    localization: [
      // AUDIT_ACTION
      { keyValue: 'AUDIT_ACTION;INSERT', execParams: { name: 'Воридкунӣ' } },
      { keyValue: 'AUDIT_ACTION;UPDATE', execParams: { name: 'Азнавкунӣ' } },
      { keyValue: 'AUDIT_ACTION;DELETE', execParams: { name: 'Несткунӣ' } },
      { keyValue: 'AUDIT_ACTION;LOGIN', execParams: { name: 'Даромади бомуваффақият' } },
      { keyValue: 'AUDIT_ACTION;LOGIN_FAILED', execParams: { name: 'Даромади бемуваффақият' } },
      { keyValue: 'AUDIT_ACTION;LOGIN_LOCKED', execParams: { name: 'Истифодабар баста шудааст, кӯшиши воридшавӣ рад карда шуд' } },
      { keyValue: 'AUDIT_ACTION;SECURITY_VIOLATION', execParams: { name: 'Вайронкунии амният' } },
      { keyValue: 'AUDIT_ACTION;DOWNLOAD', execParams: { name: 'Файл зеркашӣ карда шуд' } },
      { keyValue: 'AUDIT_ACTION;PRINT', execParams: { name: 'Файл чоп шудааст' } },
      // SOFTLOCK_TYPE
      { keyValue: 'SOFTLOCK_TYPE;None', execParams: { name: 'Вуҷуд надорад' } },
      { keyValue: 'SOFTLOCK_TYPE;Persist', execParams: { name: 'Доимӣ' } },
      { keyValue: 'SOFTLOCK_TYPE;Temp', execParams: { name: 'Муваққатӣ' } },
      // UBS_MESSAGE_TYPE
      { keyValue: 'UBS_MESSAGE_TYPE;user', execParams: { name: 'Истифодабар' } },
      { keyValue: 'UBS_MESSAGE_TYPE;system', execParams: { name: 'Система' } },
      { keyValue: 'UBS_MESSAGE_TYPE;warning', execParams: { name: 'Огоҳӣ' } },
      { keyValue: 'UBS_MESSAGE_TYPE;information', execParams: { name: 'Маълумот' } }
    ]
  }
  loader.localizeEntity(session, localizationConfig, __filename)
}
