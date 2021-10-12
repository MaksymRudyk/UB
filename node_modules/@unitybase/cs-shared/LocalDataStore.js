/**
 * Helper for manipulation with data, stored locally in ({@link TubCachedData} format).
 *
 * This module shared between client & server. In case of server we use it together with {@link dataLoader},
 * in case of client - inside {@link class:SyncConnection#select SyncConnection.select} to handle operations with entity data cached in IndexedDB.
 *
 * For server-side samples see ubm_forms.doSelect method implementation.
 *
 * @example

  $App.connection.run({
    entity: 'tst_IDMapping',
    method: 'addnew',
    fieldList: ['ID', 'code']
  }).then(function(result){
    // here result in array-of-array format
    // [{"entity":"tst_IDMapping","method":"addnew","fieldList":["ID","code"],
    //   "__fieldListExternal":["ID","code"],
    //   "resultData":{"fields":["ID","code"],"rowCount": 1, "data":[[3500000016003,null]]}}]
    var objArray = UB.LocalDataStore.selectResultToArrayOfObjects(result);
    // transform array-of-array result representation to array-of-object
    console.log(objArray);
    // now result in more simple array-of-object format: [{ID: 12312312312, code: null}]
  });

 * @module LocalDataStore
 * @memberOf module:@unitybase/cs-shared
 * @author pavel.mash
 */

const _ = require('lodash')
const collationCompare = require('./formatByPattern').collationCompare

/**
 * Format for data, stored in client-side cache
 * @typedef {Object} TubCachedData
 * @property {Array<Array>} data
 * @property {Array<String>} fields
 * @property {Number} rowCount
 * @property {Number} [version] A data version in case `mi_modifyDate` is in fields
 */

/**
 * Perform local filtration and sorting of data array according to ubql whereList & order list.
 *
 * **WARNING** - sub-queries are not supported.
 *
 * @param {TubCachedData} cachedData Data, retrieved from cache
 * @param {UBQL} ubql Initial server request
 * @returns {{resultData: TubCachedData, total: number}} new filtered & sorted array
 */
module.exports.doFilterAndSort = function doFilterAndSort(cachedData, ubql) {
  let rangeStart

  let filteredData = this.doFiltration(cachedData, ubql)
  const totalLength = filteredData.length
  this.doSorting(filteredData, cachedData, ubql)
  // apply options start & limit
  if (ubql.options) {
    rangeStart = ubql.options.start || 0
    if (ubql.options.limit) {
      filteredData = filteredData.slice(rangeStart, rangeStart + ubql.options.limit)
    } else {
      filteredData = filteredData.slice(rangeStart)
    }
  }
  return {
    resultData: {
      data: filteredData,
      fields: cachedData.fields
    },
    total: totalLength
  }
}

/**
 * Just a helper for search cached data by row ID
 * @param {TubCachedData} cachedData Data, retrieved from cache
 * @param {Number} IDValue row ID.
 */
module.exports.byID = function byID(cachedData, IDValue) {
  return this.doFilterAndSort(cachedData, { ID: IDValue })
}

/**
 * Apply ubql.whereList to data array and return new array contain filtered data
 * @protected
 * @param {TubCachedData} cachedData Data, retrieved from cache
 * @param {UBQL} ubql
 * @param {boolean} [skipSubQueries=false] Skip `subquery` conditions instead of throw. Can be used
 *   to estimate record match some where conditions
 * @returns {Array.<Array>}
 */
module.exports.doFiltration = function doFiltration(cachedData, ubql, skipSubQueries) {
  let f, isAcceptable
  const rawDataArray = cachedData.data
  const byPrimaryKey = Boolean(ubql.ID)

  const filterFabric = whereListToFunctions(ubql, cachedData.fields, skipSubQueries)
  const filterCount = filterFabric.length

  if (filterCount === 0) {
    return rawDataArray
  }

  const result = []
  const l = rawDataArray.length
  let i = -1
  while (++i < l) { // for each data
    isAcceptable = true; f = -1
    while (++f < filterCount && isAcceptable === true) {
      isAcceptable = filterFabric[f](rawDataArray[i])
    }
    if (isAcceptable) {
      result.push(rawDataArray[i])
      if (byPrimaryKey) {
        return result
      }
    }
  }
  return result
}

/**
 * Apply ubRequest.orderList to inputArray (inputArray is modified)
 * @protected
 * @param {Array.<Array>} filteredArray
 * @param {TubCachedData} cachedData
 * @param {Object} ubRequest
 */
module.exports.doSorting = function doSorting(filteredArray, cachedData, ubRequest) {
  const preparedOrder = []
  if (ubRequest.orderList) {
    _.each(ubRequest.orderList, function (orderItem) {
      const attrIdx = cachedData.fields.indexOf(orderItem.expression)
      if (attrIdx < 0) {
        throw new Error(`Ordering by "${orderItem.expression}" attribute that not in fieldList is not allowed`)
      }
      preparedOrder.push({
        idx: attrIdx,
        modifier: (orderItem.order === 'desc') ? -1 : 1
      })
    })
    const orderLen = preparedOrder.length
    if (orderLen) {
      const compareFn = function (v1, v2) {
        let res = 0
        let idx = -1
        while (++idx < orderLen && res === 0) {
          const colNum = preparedOrder[idx].idx
          if (v1[colNum] !== v2[colNum]) {
            res = collationCompare(v1[colNum], v2[colNum]) * preparedOrder[idx].modifier
          }
        }
        return res
      }
      filteredArray.sort(compareFn)
    }
  }
}

/**
 * Transform whereList to array of function
 * @private
 * @param {UBQL} ubql
 * @param {Array.<String>} fieldList
 * @param {boolean} [skipSubQueries=false] Skip `subquery` conditions instead of throw. Can be used
 *   to estimate record match some where conditions
 * @returns {Array}
 */
function whereListToFunctions (ubql, fieldList, skipSubQueries) {
  Object.keys(ubql) // FIX BUG WITH TubList TODO - rewrite to native
  const whereList = ubql.whereList
  if (!whereList && !ubql.ID) return [] // top level ID adds a primary key filter

  const filters = []
  const escapeForRegexp = function (text) {
    // convert text to string
    return text ? ('' + text).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') : ''
  }

  const filterFabricFn = function (propertyIdx, condition, value) {
    let regExpFilter
    const valIsStr = typeof value === 'string'
    let valUpperIfStr = valIsStr ? value.toUpperCase() : value
    if (skipSubQueries && (condition === 'subquery')) {
      return null // skip subquery
    }
    switch (condition) {
      case 'like':
        regExpFilter = new RegExp(escapeForRegexp(value), 'i')
        return function (record) {
          const val = record[propertyIdx]
          return val && regExpFilter.test(val)
        }
      case 'equal':
        return function (record) {
          return record[propertyIdx] === value
        }
      case 'notEqual':
        return function (record) {
          return record[propertyIdx] !== value
        }
      case 'more':
        if (valIsStr) {
          return function (record) {
            return collationCompare(record[propertyIdx], value) === 1
          }
        } else {
          return function (record) {
            return record[propertyIdx] > value
          }
        }
      case 'moreEqual':
        if (valIsStr) {
          return function (record) {
            return collationCompare(record[propertyIdx], value) >= 0
          }
        } else {
          return function (record) {
            return record[propertyIdx] >= value
          }
        }
      case 'less':
        if (valIsStr) {
          return function (record) {
            return collationCompare(record[propertyIdx], value) === -1
          }
        } else {
          return function (record) {
            return record[propertyIdx] < value
          }
        }
      case 'lessEqual':
        if (valIsStr) {
          return function (record) {
            return collationCompare(record[propertyIdx], value) <= 0
          }
        } else {
          return function (record) {
            return record[propertyIdx] <= value
          }
        }
      case 'isNull':
        return function (record) {
          return record[propertyIdx] === null
        }
      case 'notIsNull':
        return function (record) {
          return record[propertyIdx] !== null
        }
      case 'notLike':
        regExpFilter = new RegExp(escapeForRegexp(value), 'i')
        return function (record) {
          const val = record[propertyIdx]
          return val && !regExpFilter.test(val)
        }
      case 'startWith':
        return function (record) {
          const str = record[propertyIdx]
          if (!str) return false
          return (str.toUpperCase().indexOf(valUpperIfStr) === 0)
        }
      case 'notStartWith':
        return function (record) {
          const str = record[propertyIdx]
          if (!str) return true
          return str.toUpperCase().indexOf(valUpperIfStr) !== 0
        }
      case 'in':
        return function (record) {
          const str = record[propertyIdx]
          return str && value.indexOf(str) >= 0
        }
      case 'notIn':
        return function (record) {
          const str = record[propertyIdx]
          return str && value.indexOf(str) < 0
        }
      default:
        throw new Error('Unknown whereList condition')
    }
  }

  function transformClause (clause) {
    let property = clause.expression || ''

    if (clause.condition === 'custom') {
      throw new Error('Condition "custom" is not supported for cached entities')
    }
    property = (property.replace(/(\[)|(])/ig, '') || '').trim()
    const propIdx = fieldList.indexOf(property)
    if (propIdx === -1) {
      throw new Error(`Filtering by attribute "${property}" which is not in fieldList is not allowed for cached entity "${ubql.entity}"`)
    }
    let fValue
    // support for future (UB 5.10) where with "value" instead of "values"
    if (clause.value !== undefined) {
      fValue = clause.value
    } else if (clause.values !== undefined) {
      fValue = clause.values[Object.keys(clause.values)[0]]
    }
    const fn = filterFabricFn(propIdx, clause.condition, fValue)
    if (fn) filters.push(fn)
  }
  // check for top level ID  - in this case add condition for filter by ID
  const reqID = ubql.ID
  if (reqID) {
    transformClause({ expression: '[ID]', condition: 'equal', values: { ID: reqID } })
  }
  for (const cName in whereList) {
    if (whereList.hasOwnProperty(cName)) {
      transformClause(whereList[cName])
    }
  }
  return filters
}

module.exports.whereListToFunctions = whereListToFunctions

/**
 * Transform result of {@link class:SyncConnection#select SyncConnection.select} response
 * from Array of Array representation to Array of Object.
 * @example
 *
 * LocalDataStore.selectResultToArrayOfObjects({resultData: {
 *     data: [['row1_attr1Val', 1], ['row2_attr2Val', 22]],
 *     fields: ['attrID.name', 'attr2']}
 * });
 * // result is:
 * // [{"attrID.name": "row1_attr1Val", attr2: 1},
 * //  {"attrID.name": "row2_attr2Val", attr2: 22}
 * // ]
 *
 * // object keys simplify by passing fieldAliases
 * LocalDataStore.selectResultToArrayOfObjects({resultData: {
 *     data: [['row1_attr1Val', 1], ['row2_attr2Val', 22]],
 *     fields: ['attrID.name', 'attr2']}
 * }, {'attrID.name': 'attr1Name'});
 * // result is:
 * // [{attr1Name: "row1_attr1Val", attr2: 1},
 * //  {attr1Name: "row2_attr2Val", attr2: 22}
 * // ]
 *
 * @param {{resultData: TubCachedData}} selectResult
 * @param {Object<string, string>} [fieldAlias] Optional object to change attribute names during transform array to object. Keys are original names, values - new names
 * @returns {Array<object>}
 */
module.exports.selectResultToArrayOfObjects = function selectResultToArrayOfObjects(selectResult, fieldAlias) {
  const inData = selectResult.resultData.data
  const inAttributes = selectResult.resultData.fields
  const inDataLength = inData.length
  const result = inDataLength ? new Array(inDataLength) : []
  if (fieldAlias) {
    _.forEach(fieldAlias, function (alias, field) {
      const idx = inAttributes.indexOf(field)
      if (idx >= 0) {
        inAttributes[idx] = alias
      }
    })
  }
  for (let i = 0; i < inDataLength; i++) {
    result[i] = _.zipObject(inAttributes, inData[i])
  }
  return result
}

/**
 * Flatten cached data (or result of {@link module:LocalDataStore#doFilterAndSort LocalDataStore.doFilterAndSort}.resultData )
 * to Object expected by TubDataStore.initialize Flatten format (faster than [{}..] format).
 * CachedData may contain more field or field in order not in requestedFieldList - in this case we use expectedFieldList.
 *
 * @example
 * // consider we have cached data in variable filteredData.resultData
 * // to initialize dataStore with cached data:
 * mySelectMethod = function(ctxt){
 *     var fieldList = ctxt.mParams.fieldList;
 *     resp = LocalDataStore.flatten(fieldList, filteredData.resultData);
 *     ctxt.dataStore.initFromJSON(resp);
 * }
 *
 *
 * @param {Array.<string>} requestedFieldList Array of attributes to transform to. Can be ['*'] - in this case we return all cached attributes
 * @param {TubCachedData} cachedData
 * @result {{fieldCount: number, rowCount: number, values: array.<*>}}
 */
module.exports.flatten = function flatten(requestedFieldList, cachedData) {
  const fldIdxArr = []
  const cachedFields = cachedData.fields
  let rowIdx = -1
  let col = -1
  let pos = 0
  const resultData = []
  const rowCount = cachedData.data.length

  if (!requestedFieldList || !requestedFieldList.length) {
    throw new Error('fieldList not exist or empty')
  }

  // client ask for all attributes
  if (requestedFieldList.length === 1 && requestedFieldList[0] === '*') {
    requestedFieldList = cachedData.fields
  }

  requestedFieldList.forEach(function (field) {
    const idx = cachedFields.indexOf(field)
    if (idx !== -1) {
      fldIdxArr.push(idx)
    } else {
      throw new Error('Invalid field list. Attribute ' + field + ' not found in local data store')
    }
  })
  const fieldCount = requestedFieldList.length
  resultData.length = rowCount * (fieldCount + 1) // reserve fieldCount for field names
  while (++col < fieldCount) {
    resultData[pos] = requestedFieldList[pos]; pos++
  }
  while (++rowIdx < rowCount) {
    col = -1
    const row = cachedData.data[rowIdx]
    while (++col < fieldCount) {
      resultData[pos++] = row[fldIdxArr[col]]
    }
  }
  return { fieldCount: fieldCount, rowCount: rowCount, values: resultData }
}

/**
 * Reverse conversion to {@link module:LocalDataStore#selectResultToArrayOfObjects LocalDataStore.selectResultToArrayOfObjects}.
 *
 *
 * @example
 * //Transform array of object to array of array using passed attributes array
 * LocalDataStore.arrayOfObjectsToSelectResult([{a: 1, b: 'as'}, {b: 'other', a: 12}], ['a', 'b']);
 * // result is: [[1, "as"], [12, "other"]]
 *
 * @param {Array.<Object>} arrayOfObject
 * @param {Array.<String>} attributeNames
 * @returns {Array.<Array>}
 */
module.exports.arrayOfObjectsToSelectResult = function arrayOfObjectsToSelectResult(arrayOfObject, attributeNames) {
  const result = []
  arrayOfObject.forEach(function (obj) {
    const row = []
    attributeNames.forEach(function (attribute) {
      row.push(obj[attribute])
    })
    result.push(row)
  })
  return result
}

/**
 * Convert a local DateTime to Date with zero time in UTC0 timezone as expected by UB server for Date attributes
 * @param {Date} v
 * @returns {Date}
 */
module.exports.truncTimeToUtcNull = function truncTimeToUtcNull(v) {
  if (!v) return v
  let m = v.getMonth() + 1
  m = m < 10 ? '0' + m : '' + m
  let d = v.getDate()
  d = d < 10 ? '0' + d : '' + d
  return new Date(`${v.getFullYear()}-${m}-${d}T00:00:00Z`)
  // code below fails for 1988-03-27
  // var result = new Date(v.getFullYear(), v.getMonth(), v.getDate())
  // result.setMinutes(-v.getTimezoneOffset())
  // return result
}

/**
 * Convert UnityBase server date response to Date object.
 * Date response is a day with 00 time (2015-07-17T00:00Z), to get a real date we must add current timezone shift
 * @param value
 * @returns {Date}
 */
module.exports.iso8601ParseAsDate = function iso8601ParseAsDate(value) {
  const res = value ? new Date(value) : null
  if (res) {
    return new Date(res.getFullYear(), res.getMonth(), res.getDate())
    // code below fails for 1988-03-27T00:00Z
    // res.setTime(res.getTime() + res.getTimezoneOffset() * 60 * 1000)
  }
  return res
}

/**
 * Convert raw server response data to javaScript data according to attribute types
 * @param {UBDomain} domain
 * @param serverResponse
 * @return {*}
 */
module.exports.convertResponseDataToJsTypes = function convertResponseDataToJsTypes(domain, serverResponse) {
  if (serverResponse.entity && // fieldList &&  serverResponse.fieldList
    serverResponse.resultData &&
    !serverResponse.resultData.notModified &&
    serverResponse.resultData.fields &&
    serverResponse.resultData.data && serverResponse.resultData.data.length
  ) {
    const convertRules = domain.get(serverResponse.entity).getConvertRules(serverResponse.resultData.fields)
    const rulesLen = convertRules.length
    const data = serverResponse.resultData.data
    if (rulesLen) {
      for (let d = 0, dataLen = data.length; d < dataLen; d++) {
        for (let r = 0; r < rulesLen; r++) {
          const column = convertRules[r].index
          data[d][column] = convertRules[r].convertFn(data[d][column])
        }
      }
    }
  }
  if (serverResponse.resultLock && serverResponse.resultLock.lockTime) {
    serverResponse.resultLock.lockTime = serverResponse.resultLock.lockTime ? new Date(serverResponse.resultLock.lockTime) : null
  }
  return serverResponse
}
