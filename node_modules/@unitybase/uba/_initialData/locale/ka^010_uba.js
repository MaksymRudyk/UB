const loader = require('@unitybase/base').dataLoader

/**
 * @author pavel.mash
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
      { keyValue: 'Everyone', execParams: { description: 'ნებისმიერ მსურველს (ჩაშენებული როლი)' } },
      { keyValue: 'Admin', execParams: { description: 'ადმინისტრატორი (ჩაშენებული როლი)' } },
      { keyValue: 'Anonymous', execParams: { description: 'უნებართვო მომხმარებელი (ჩაშენებული როლი)' } },
      { keyValue: 'User', execParams: { description: 'ავტორიზებული მომხმარებელი (ჩაშენებული როლი)' } },
      { keyValue: 'Supervisor', execParams: { description: 'უსაფრთხოების ადმინისტრატორი (ჩაშენებული როლი)' } },
      { keyValue: 'Developer', execParams: { description: 'დეველოპერი (ჩაშენებული როლი)' } },
      { keyValue: 'Monitor', execParams: { description: 'მონიტორინგი (ჩაშენებული როლი)' } }
    ]
  })
}
