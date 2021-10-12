/**
 * @author pavel.mash
 * Create roles users / powerUsers / supervisors
 */

const csvLoader = require('@unitybase/base').dataLoader
const path = require('path')

/**
 * Initial script for fill UnityBase Administration Entity Level Security
 * Used by ubcli initialize command
 * @param {ServerSession} session
 */
module.exports = function (session) {
  let conn = session.connection

  console.info('\tFill ELS for UBA model')
  csvLoader.loadSimpleCSVData(conn, path.join(__dirname, 'uba_els.csv'), 'uba_els', 'code;entityMask;methodMask;ruleType;ruleRole;description'.split(';'), [
    0, 1, 2, 3,
    function (row) {
      if (typeof row[4] === 'number') {
        return row[4]
      } else {
        return conn.lookup('uba_role', 'ID', { expression: 'name', condition: 'equal', values: { name: row[4] } })
      }
    },
    5], 1)
}
