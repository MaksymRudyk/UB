const loader = require('@unitybase/base').dataLoader
/**
 * @author
 * Password policy localization to Azeri for UBA model
 * Used by `ubcli initialize` command
 * @param {ServerSession} session
 */
module.exports = function (session) {
  let localizationConfig = {
    entity: 'ubs_settings',
    keyAttribute: 'settingKey',
    localization: [
      // UBS_MESSAGE_TYPE
      { keyValue: 'UBA.passwordPolicy.maxDurationDays', execParams: { name: 'Şifrənin qüvvədə olma müddəti', description: 'Bitdikdən sonra sistemin şifrənin dəyişdirilməsini tələb edəcəyi müddət (günlərin sayı)' } },
      { keyValue: 'UBA.passwordPolicy.checkPrevPwdNum', execParams: { name: 'Son ... şifrəni təkrar etməyin', description: 'Yeni şifrə kimi istifadəsinə icazə verilməyən əvvəlki şifrələrin sayı' } },
      { keyValue: 'UBA.passwordPolicy.minLength', execParams: { name: 'Şifrənin minimal simvol sayı', description: 'Şifrədə simvolların minimal sayı' } },
      { keyValue: 'UBA.passwordPolicy.checkCmplexity', execParams: { name: 'Mürəkəb şifrə', description: 'Şirfədə Böyük, kiçik hərflərdən və xüsusi simvoldan istifadəsi mütləqdir' } },
      { keyValue: 'UBA.passwordPolicy.checkDictionary', execParams: { name: 'Lüğət sözlərindən şifrə kimi istifadə etməyə icazə verməmək', description: 'Lüğətdən zəif şifrələri qadağan etmək' } },
      { keyValue: 'UBA.passwordPolicy.allowMatchWithLogin', execParams: { name: 'Loginlə eyniliyə icazə vermək', description: 'Loginlə eyni şifrədən istifadəyə icazə vermək' } },
      { keyValue: 'UBA.passwordPolicy.maxInvalidAttempts', execParams: { name: ' Daxiletmə cəhdlərinin sayı', description: 'Neçə uğursuz daxiletmə cəhdindən sonra istifadəçi bloka edilir' } }
    ]
  }
  loader.localizeEntity(session, localizationConfig, __filename)
}
