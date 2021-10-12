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
      { keyValue: 'UBA.passwordPolicy.maxDurationDays', execParams: { name: 'Срок действия пароля', description: 'Период(кол-во дней), по завершению которого система потребует смены пароля. 0 - не ограничивать' } },
      { keyValue: 'UBA.passwordPolicy.checkPrevPwdNum', execParams: { name: 'Не повторять ... последних паролей', description: 'Количество предыдущих паролей, которые запрещено использовать как новый пароль' } },
      { keyValue: 'UBA.passwordPolicy.minLength', execParams: { name: 'Минимальная длина пароля', description: 'Минимальное количество символов в пароле' } },
      { keyValue: 'UBA.passwordPolicy.checkCmplexity', execParams: { name: 'Сложный пароль', description: 'Обязательно наличие в пароле символа верхнего регистра, нижнего регистра, цифры, специального символа' } },
      { keyValue: 'UBA.passwordPolicy.checkDictionary', execParams: { name: 'Не позволять пароли со словаря', description: 'Запретить слабые пароли со словаря' } },
      { keyValue: 'UBA.passwordPolicy.allowMatchWithLogin', execParams: { name: 'Разрешить совпадение с логином', description: 'Разрешить установку пароля, совпадающего с логином' } },
      { keyValue: 'UBA.passwordPolicy.maxInvalidAttempts', execParams: { name: 'Количество попыток ввода', description: 'Количество неудачных попыток ввода, после чего пользователь блокируется' } }
    ]
  }
  loader.localizeEntity(session, localizationConfig, __filename)
}
