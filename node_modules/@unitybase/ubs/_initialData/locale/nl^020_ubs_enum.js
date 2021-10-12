const loader = require('@unitybase/base').dataLoader
/**
 * @author pavel.mash
 * Enumeration localization to English for UBS model
 * Used by `ubcli initialize` command
 * @param {ServerSession} session
 */
module.exports = function (session) {
  let localizationConfig = {
    entity: 'ubm_enum',
    keyAttribute: 'eGroup;code',
    localization: [
      // AUDIT_ACTION
      { keyValue: 'AUDIT_ACTION;INSERT', execParams: { name: 'Invoeging' } },
      { keyValue: 'AUDIT_ACTION;UPDATE', execParams: { name: 'Vernieuwing' } },
      { keyValue: 'AUDIT_ACTION;DELETE', execParams: { name: 'Verwijdering' } },
      { keyValue: 'AUDIT_ACTION;LOGIN', execParams: { name: 'Succesvol inloggen' } },
      { keyValue: 'AUDIT_ACTION;LOGIN_FAILED', execParams: { name: 'Onsuccesvol inloggen' } },
      { keyValue: 'AUDIT_ACTION;LOGIN_LOCKED', execParams: { name: 'Gebruiker werd geblokkeerd, inlogpoging afgewezen' } },
      { keyValue: 'AUDIT_ACTION;SECURITY_VIOLATION', execParams: { name: 'Beveiligingsinbreuk' } },
      { keyValue: 'AUDIT_ACTION;DOWNLOAD', execParams: { name: 'Bestand gedownload' } },
      { keyValue: 'AUDIT_ACTION;PRINT', execParams: { name: 'Bestand uitgedrukt' } },
      // SOFTLOCK_TYPE
      { keyValue: 'SOFTLOCK_TYPE;None', execParams: { name: 'Afwezig' } },
      { keyValue: 'SOFTLOCK_TYPE;Persist', execParams: { name: 'Constant' } },
      { keyValue: 'SOFTLOCK_TYPE;Temp', execParams: { name: 'Tijdelijk' } },
      // UBS_MESSAGE_TYPE
      { keyValue: 'UBS_MESSAGE_TYPE;user', execParams: { name: 'Door gebruikers' } },
      { keyValue: 'UBS_MESSAGE_TYPE;system', execParams: { name: 'Systeem' } },
      { keyValue: 'UBS_MESSAGE_TYPE;warning', execParams: { name: 'Waarschuwing' } },
      { keyValue: 'UBS_MESSAGE_TYPE;information', execParams: { name: 'Informatie' } }
    ]
  }
  loader.localizeEntity(session, localizationConfig, __filename)
}
