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
      { keyValue: 'Everyone', execParams: { description: 'Iedereen (ingebouwde rol)' } },
      { keyValue: 'Admin', execParams: { description: 'Admin (ingebouwde rol)' } },
      { keyValue: 'Anonymous', execParams: { description: 'Ongeautoriseerde gebruiker (ingebouwde rol)' } },
      { keyValue: 'User', execParams: { description: 'Geautoriseerde gebruiker (ingebouwde rol)' } },
      { keyValue: 'Supervisor', execParams: { description: 'Beveiligingsbeheerder (ingebouwde rol)' } },
      { keyValue: 'Developer', execParams: { description: 'Ontwikkelaar (ingebouwde rol)' } },
      { keyValue: 'Monitor', execParams: { description: 'Monitoring (ingebouwde rol)' } }
    ]
  })
}
