const loader = require('@unitybase/base').dataLoader
/**
 * @author pavel.mash
 * Enumeration localization to Ukrainian for UBS model
 * Used by `ubcli initialize` command
 * @param {ServerSession} session
 */
module.exports = function (session) {
  let localizationConfig = {
    entity: 'ubm_enum',
    keyAttribute: 'eGroup;code',
    localization: [
      // AUDIT_ACTION
      { keyValue: 'AUDIT_ACTION;INSERT', execParams: { name: 'Вставка' } },
      { keyValue: 'AUDIT_ACTION;UPDATE', execParams: { name: 'Оновлення' } },
      { keyValue: 'AUDIT_ACTION;DELETE', execParams: { name: 'Видалення' } },
      { keyValue: 'AUDIT_ACTION;LOGIN', execParams: { name: 'Успішний вхід' } },
      { keyValue: 'AUDIT_ACTION;LOGIN_FAILED', execParams: { name: 'Невдачний вхід' } },
      { keyValue: 'AUDIT_ACTION;LOGIN_LOCKED', execParams: { name: 'Користувач заблокований, спроба входу відхилена' } },
      { keyValue: 'AUDIT_ACTION;SECURITY_VIOLATION', execParams: { name: 'Порушення безпеки' } },
      { keyValue: 'AUDIT_ACTION;DOWNLOAD', execParams: { name: 'Файл скачано' } },
      { keyValue: 'AUDIT_ACTION;PRINT', execParams: { name: 'Файл роздруковано' } },
      // SOFTLOCK_TYPE
      { keyValue: 'SOFTLOCK_TYPE;None', execParams: { name: 'Відсутнє' } },
      { keyValue: 'SOFTLOCK_TYPE;Persist', execParams: { name: 'Постійне' } },
      { keyValue: 'SOFTLOCK_TYPE;Temp', execParams: { name: 'Тимчасове' } },
      // UBS_MESSAGE_TYPE
      { keyValue: 'UBS_MESSAGE_TYPE;user', execParams: { name: 'Користувацьке' } },
      { keyValue: 'UBS_MESSAGE_TYPE;system', execParams: { name: 'Система' } },
      { keyValue: 'UBS_MESSAGE_TYPE;warning', execParams: { name: 'Попереждення' } },
      { keyValue: 'UBS_MESSAGE_TYPE;information', execParams: { name: 'Інформація' } }
    ]
  }
  loader.localizeEntity(session, localizationConfig, __filename)
}
