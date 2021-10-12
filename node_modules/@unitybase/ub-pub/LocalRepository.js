const LocalDataStore = require('@unitybase/cs-shared').LocalDataStore
const ClientRepository = require('./ClientRepository')

/**
 * @classdesc
 * A CustomRepository descendant to be used with local data
 *
 * Usually created using UB.LocalRepository fabric function
 *
 * @example
 const UB = require('@unitybase/ub-pub')
 const localData = {data: [[1, 'Jon'], [2, 'Bob']], fields: ['ID', 'name'], rowCount: 2}

 await UB.LocalRepository(localData, 'uba_user').attrs('ID', 'name').selectAsArray()
 // {"resultData":{"data":[[1,"Jon"],[2,"Bob"]],"fields":["ID","name"]},"total":2}

 await UB.LocalRepository(localData, 'uba_user').attrs('ID').selectAsArrayOfValues()
 // [1, 2]

 await UB.LocalRepository(localData, 'uba_user').attrs('name').where('ID', '=', 2).selectScalar()
 // "Bob"

 * @class LocalRepository
 * @extends ClientRepository
 */
class LocalRepository extends ClientRepository {
  /**
   * Do not create directly - use UB.LocalRepository instead:
   * @example

   const UB = require('@unitybase/ub-pub')
   const localData = {data: [[1, 'Jon'], [2, 'Bob']], fields: ['ID', 'name'], rowCount: 2}

   await UB.LocalRepository(localData, 'uba_user').attrs('ID', 'name').selectAsArray()

   * @override
   * @privare
   * @param {TubCachedData} localData
   * @param {string} entityName
   */
  constructor (localData, entityName) {
    super(null, entityName) // connection is null
    /**
     * @private
     * @property {TubCachedData} _localData
     */
    Object.defineProperty(this, '_localData', { enumerable: false, writable: false, value: localData })
  }

  /**
   * @return {Promise<{resultData: TubCachedData, total: number}>}
   */
  selectAsArray () {
    const _ubql = this.ubql()
    const filtered = LocalDataStore.doFilterAndSort(this._localData, _ubql)
    // transform a result according to passed fieldList (if needed)
    const rd = filtered.resultData // ref
    if (
      !_ubql.fieldList.length ||
      (_ubql.fieldList.length === 1 && _ubql.fieldList[0] === '*') ||
      !rd.data.length ||
      _.isEqual(_ubql.fieldList, rd.fields)
    ) {
      // Repository attributes list is equal to localData fields list -  no additional transformation required
      return Promise.resolve(filtered)
    } else {
      const localFl = rd.fields
      const idxMap = _ubql.fieldList.map(f => localFl.indexOf(f)) // map of requested fieldList to localData field list
      const dataAsInFieldList = rd.data.map(r => {
        return idxMap.map(i => r[i])
      })
      return Promise.resolve({
        resultData: { data: dataAsInFieldList, fields: _ubql.fieldList, rowCount: dataAsInFieldList.length },
        total: rd.total
      })
    }
  }

  /**
   * @override
   * @returns {LocalRepository}
   */
  clone () {
    const cloned = super.clone()

    // copy _localData by hand since it is private property
    Object.defineProperty(cloned, '_localData', { enumerable: false, writable: false, value: this._localData })
    return cloned
  }
}

module.exports = LocalRepository
