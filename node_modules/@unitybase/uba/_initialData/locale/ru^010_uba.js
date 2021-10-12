const loader = require('@unitybase/base').dataLoader

/**
 * Navigation shortcuts localization to Russian for UBA model
 * Used by `ubcli initialize` command
 * @param {ServerSession} session
 */
module.exports = function (session) {
  function localize (localizationConfig) {
    loader.localizeEntity(session, localizationConfig, __filename)
  }

  localize({
    entity: 'uba_role',
    keyAttribute: 'name',
    localization: [
      { keyValue: 'Everyone', execParams: { description: 'Кто угодно (встроенная роль)' } },
      { keyValue: 'Admin', execParams: { description: 'Администратор (встроенная роль)' } },
      { keyValue: 'Anonymous', execParams: { description: 'Неавторизированный пользователь (встроенная роль)' } },
      { keyValue: 'User', execParams: { description: 'Авторизированный пользователь (встроенная роль)' } },
      { keyValue: 'Supervisor', execParams: { description: 'Администратор безопасности (встроенная роль)' } },
      { keyValue: 'Developer', execParams: { description: 'Разработчик (встроенная роль)' } },
      { keyValue: 'Monitor', execParams: { description: 'Мониторинг (встроенная роль)' } }
    ]
  })
}
