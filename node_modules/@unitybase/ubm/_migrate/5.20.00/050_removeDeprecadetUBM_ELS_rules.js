module.exports = removeOldUbmEls

/**
 * Remove UBM_READ_USERS & UBM_READ_EVERYONE ELS rules inserted by _initialData script
 * @param {object} params
 * @param {SyncConnection} params.conn
 */
function removeOldUbmEls ({ conn }) {
  ['UBM_READ_USERS', 'UBM_READ_EVERYONE'].forEach(r => {
    const existed = conn.Repository('uba_els')
      .attrs('ID', 'mi_modifyDate')
      .where('code', '=', r)
      .selectSingle()
    if (!existed) return
    console.log('Remove a deprecated ELS rule', r)
    conn.query({
      entity: 'uba_els',
      method: 'delete',
      execParams: {
        ID: existed.ID,
        mi_modifyDate: existed.mi_modifyDate
      }
    })
  })
}
