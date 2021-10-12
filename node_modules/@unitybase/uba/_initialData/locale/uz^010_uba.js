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
      { keyValue: 'Everyone', execParams: { description: 'Hamma (o`rnatilgan rol)' } },
      { keyValue: 'Admin', execParams: { description: 'Administrator (o`rnatilgan rol)' } },
      { keyValue: 'Anonymous', execParams: { description: 'Ruxsatsiz foydalanuvchi (o`rnatilgan rol)' } },
      { keyValue: 'User', execParams: { description: 'Vakolatli foydalanuvchi (o`rnatilgan rol)' } },
      { keyValue: 'Supervisor', execParams: { description: 'Xavfsizlik ma`muri (o`rnatilgan rol)' } },
      { keyValue: 'Developer', execParams: { description: 'Ishlab chiquvchi (o`rnatilgan rol)' } },
      { keyValue: 'Monitor', execParams: { description: 'Monitoring (o`rnatilgan rol)' } }
    ]
  })
}
