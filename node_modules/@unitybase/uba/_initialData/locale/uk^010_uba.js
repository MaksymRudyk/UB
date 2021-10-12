const loader = require('@unitybase/base').dataLoader

/**
 * Navigation shortcuts localization to Ukrainian for UBA model
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
      { keyValue: 'Everyone', execParams: { description: 'Будь хто (вбудована роль)' } },
      { keyValue: 'Admin', execParams: { description: 'Адміністратор (вбудована роль)' } },
      { keyValue: 'Anonymous', execParams: { description: 'Неавторизований користувач (вбудована роль)' } },
      { keyValue: 'User', execParams: { description: 'Авторизований користувач (вбудована роль)' } },
      { keyValue: 'Supervisor', execParams: { description: 'Адміністратор безпеки (вбудована роль)' } },
      { keyValue: 'Developer', execParams: { description: 'Розробник (вбудована роль)' } },
      { keyValue: 'Monitor', execParams: { description: 'Моніторинг (вбудована роль)' } }
    ]
  })
}
