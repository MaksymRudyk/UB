const loader = require('@unitybase/base').dataLoader

/**
 * Navigation shortcuts localization to Tajik for UBA model
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
      { keyValue: 'Everyone', execParams: { description: 'Ҳама (роли дарунсохташуда)' } },
      { keyValue: 'Admin', execParams: { description: 'Маъмурӣ (роли дарунсохташуда)' } },
      { keyValue: 'Anonymous', execParams: { description: 'Истифодабарандаи беиҷозат (роли дарунсохташуда)' } },
      { keyValue: 'User', execParams: { description: 'Истифодабарандаи ваколатдор (роли дарунсохташуда)' } },
      { keyValue: 'Supervisor', execParams: { description: 'Маъмур оид ба амният (роли дарунсохт)' } },
      { keyValue: 'Developer', execParams: { description: 'Таҳиякунанда  (роли дарунсохт)' } },
      { keyValue: 'Monitor', execParams: { description: 'Мониторинг (роли дарунсохт)' } }
    ]
  })
}
