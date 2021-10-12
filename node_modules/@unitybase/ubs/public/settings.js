const UB = require('@unitybase/ub-pub')
const $App = require('@unitybase/adminui-pub')

let __settingsData = []
const Settings = UB.ns('UBS.Settings')
/**
 * Get cached setting by key from ubs_settings
 * @param {string} key
 * @return {undefined|{ID: number, settingKey: string, name: string, description: string, type: string, settingValue: string, defaultValue: string}}
 */
Settings.findByKey = function (key) {
  const res = __settingsData.find(elm => elm.settingKey === key)
  if (res === undefined) {
    UB.logDebug(`value fom UBS.Settings[${key}] not found`)
  }
  return res
}

$App.modelLoadedPromise = $App.modelLoadedPromise.then(() => {
  return UB.Repository('ubs_settings')
    .attrs(['ID', 'settingKey', 'name', 'description', 'type', 'settingValue', 'defaultValue'])
    .selectAsObject()
    .then(function (data) {
      __settingsData = data
      return true
    })
})
