const loader = require('@unitybase/base').dataLoader
/**
 * @author pavel.mash
 * Enumeration localization to Russian for UBS model
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
      { keyValue: 'AUDIT_ACTION;UPDATE', execParams: { name: 'Обновление' } },
      { keyValue: 'AUDIT_ACTION;DELETE', execParams: { name: 'Удаление' } },
      { keyValue: 'AUDIT_ACTION;LOGIN', execParams: { name: 'Успешный вход' } },
      { keyValue: 'AUDIT_ACTION;LOGIN_FAILED', execParams: { name: 'Неудачный вход' } },
      { keyValue: 'AUDIT_ACTION;LOGIN_LOCKED', execParams: { name: 'Пользователь заблокирован, попытка входа отклонена' } },
      { keyValue: 'AUDIT_ACTION;SECURITY_VIOLATION', execParams: { name: 'Нарушение безопасности' } },
      { keyValue: 'AUDIT_ACTION;DOWNLOAD', execParams: { name: 'Файл скачан' } },
      { keyValue: 'AUDIT_ACTION;PRINT', execParams: { name: 'Файл распечатан' } },
      // SOFTLOCK_TYPE
      { keyValue: 'SOFTLOCK_TYPE;None', execParams: { name: 'Отсутствует' } },
      { keyValue: 'SOFTLOCK_TYPE;Persist', execParams: { name: 'Постоянная' } },
      { keyValue: 'SOFTLOCK_TYPE;Temp', execParams: { name: 'Временная' } },
      // UBS_MESSAGE_TYPE
      { keyValue: 'UBS_MESSAGE_TYPE;user', execParams: { name: 'Пользовательское' } },
      { keyValue: 'UBS_MESSAGE_TYPE;system', execParams: { name: 'Система' } },
      { keyValue: 'UBS_MESSAGE_TYPE;warning', execParams: { name: 'Предупреждение' } },
      { keyValue: 'UBS_MESSAGE_TYPE;information', execParams: { name: 'Информация' } }
    ]
  }
  loader.localizeEntity(session, localizationConfig, __filename)
}
