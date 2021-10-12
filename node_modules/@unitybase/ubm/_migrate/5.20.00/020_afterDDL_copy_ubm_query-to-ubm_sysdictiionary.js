module.exports = copyUbmQueryToUbmSysdictionary
const argv = require('@unitybase/base').argv
/**
 * Migrate a ubm_query into ubm_sysdictionary
 * @param {object} params
 * @param {Object<string, DBConnection>} params.dbConnections
 */
function copyUbmQueryToUbmSysdictionary ({ dbConnections }) {
  const cfg = argv.getServerConfiguration()
  const defaultLang = cfg.application.defaultLang
  const otherLangs = dbConnections.main.config.supportLang.filter(l => l !== defaultLang)
  const namesArr = otherLangs.map(l => 'name_' + l)
  namesArr.push('name')
  const namesForSQL = namesArr.join(',') // name_en, name_rum name
  const SQL = `INSERT INTO ubm_sysdictionary (
  ID, code, ${namesForSQL}, ubql, mi_owner, mi_createdate,  mi_createuser, mi_modifydate, mi_modifyuser, mi_deletedate, mi_deleteuser)
SELECT
  ID, code, ${namesForSQL}, ubql, mi_owner, mi_createdate,  mi_createuser, mi_modifydate, mi_modifyuser, mi_deletedate, mi_deleteuser
FROM ubm_query query
WHERE NOT EXISTS ( SELECT ID  FROM ubm_sysdictionary sysdict WHERE sysdict.ID = query.ID )`
  try {
    dbConnections.main.execParsed(SQL)
  } catch (e) {
    // in case of migration from very old version ubm_sysdictionary may not exists
  }
}
