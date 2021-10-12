const loader = require('@unitybase/base').dataLoader
/**
 * @author
 * Password policy localization to Russian for UBA model
 * Used by `ubcli initialize` command
 * @param {ServerSession} session
 */
module.exports = function (session) {
  let localizationConfig = {
    entity: 'ubs_settings',
    keyAttribute: 'settingKey',
    localization: [
      // UBS_MESSAGE_TYPE
      { keyValue: 'UBA.passwordPolicy.maxDurationDays', execParams: { name: 'Wachtwoord duur termijn', description: 'Periode (aantal dagen), aan het einde waarvan het systeem het wachtwoord moet wijzigen. 0 voor onbeperkt' } },
      { keyValue: 'UBA.passwordPolicy.checkPrevPwdNum', execParams: { name: 'Niet herhalen... vorige wachtwoorden', description: 'Aantal eerdere wachtwoorden die niet als nieuw wachtwoord mogen worden gebruikt' } },
      { keyValue: 'UBA.passwordPolicy.minLength', execParams: { name: 'Minimale lengte van wachtwoord', description: 'Minimum aantal symbolen in wachtwoord' } },
      { keyValue: 'UBA.passwordPolicy.checkCmplexity', execParams: { name: 'Complex wachtwoord', description: 'Aanwezigheid in wachtwoord hoofdletters en kleine letters, cijfers, speciale tekens is noodzakelijk' } },
      { keyValue: 'UBA.passwordPolicy.checkDictionary', execParams: { name: 'Geen wachtwoord uit woordenboeken toestaan', description: 'Lange wachtwoorden uit woordenboek weigeren' } },
      { keyValue: 'UBA.passwordPolicy.allowMatchWithLogin', execParams: { name: 'Match met login toestaan', description: 'Toestaan om wachtwoord in te stellen dat overeenkomt met login' } },
      { keyValue: 'UBA.passwordPolicy.maxInvalidAttempts', execParams: { name: 'Aantal pogingen om wachtwoord in te voeren', description: 'Maximum aantal pogingen voordat de gebruiker wordt vergrendeld' } }
    ]
  }
  loader.localizeEntity(session, localizationConfig, __filename)
}
