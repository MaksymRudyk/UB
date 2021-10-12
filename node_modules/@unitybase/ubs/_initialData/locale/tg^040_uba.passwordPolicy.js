const loader = require('@unitybase/base').dataLoader
/**
 * @author
 * Password policy localization to Tajik for UBA model
 * Used by `ubcli initialize` command
 * @param {ServerSession} session
 */
module.exports = function (session) {
  let localizationConfig = {
    entity: 'ubs_settings',
    keyAttribute: 'settingKey',
    localization: [
      // UBS_MESSAGE_TYPE
      { keyValue: 'UBA.passwordPolicy.maxDurationDays', execParams: { name: 'Мӯҳлати амали гузарвожа', description: 'Давраи (шумораи рӯзҳо), ки пас аз он система ивваз кардани гузарвожаро талаб мекунад. 0 - маҳдуд накунед' } },
      { keyValue: 'UBA.passwordPolicy.checkPrevPwdNum', execParams: { name: 'Такрор накунед ... гузарвожаҳои охиринро', description: 'Шумораи гузарвожаҳои қаблӣ, ки истифодаи онҳо ҳамчун гузарвожаи нав манъ карда шудааст' } },
      { keyValue: 'UBA.passwordPolicy.minLength', execParams: { name: 'Ҳадди ақали дарозии гузарвожа', description: 'Ҳадди ақали аломатҳои гузарвожа' } },
      { keyValue: 'UBA.passwordPolicy.checkCmplexity', execParams: { name: 'Гузарвожаи мураккаб', description: 'Гузарвожа бояд ҳуруфи калон, хурд, рақам ва аломатҳои махсусро дошта бошад' } },
      { keyValue: 'UBA.passwordPolicy.checkDictionary', execParams: { name: 'Гузарвожаҳои луғатро иҷозат надиҳед', description: 'Гузарвожаҳои сусти луғатро рад кунед' } },
      { keyValue: 'UBA.passwordPolicy.allowMatchWithLogin', execParams: { name: 'Барои мувофиқати рамз иҷозат диҳед', description: 'Иҷозат додани насби гузарвожае, ки бо рамз мутобиқ аст' } },
      { keyValue: 'UBA.passwordPolicy.maxInvalidAttempts', execParams: { name: 'Шумораи кӯшишҳои вуруд', description: 'Миқдори кӯшиши вуруд, ки пас аз он истифодабаранда масдуд мешавад' } }
    ]
  }
  loader.localizeEntity(session, localizationConfig, __filename)
}
