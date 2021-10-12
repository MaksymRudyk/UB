/*
 * Ancestor for client-side & server-side repositories
 * @author pavel.mash 23.09.2014
 * documentation verified by mpv on 2018-03-18
 */

// ***********   !!!!WARNING!!!!! **********************
// Module shared between server and client code
const _ = require('lodash')
const bracketsRe = /\[.*]/
// in case values for where is null we transform condition to allowed null comparison with warning.
// If condition not in conditionInCaseValueIsNull object keys we raise error
const conditionInCaseValueIsNull = { equal: 'isNull', notEqual: 'notIsNull', custom: 'custom' }

const cNames = []
for (let i = 0; i < 100; i++) {
  cNames.push(`c${i}`)
}

const KNOWN_MISC_TAGS = new Set(['__mip_ondate', '__mip_recordhistory', '__mip_recordhistory_all',
  '__mip_disablecache', '__skipOptimisticLock', '__allowSelectSafeDeleted', '__skipSelectAfterUpdate',
  '__skipSelectAfterInsert', '__skipSelectBeforeUpdate', '__skipRls', '__skipAclRls', 'lockType'])

/**
 * Ancestor for Browser/NodeJS ClientRepository and server side ServerRepository.
 *
 * Do not use it directly, use {@link module:@unitybase/ub.Repository UB.Repository} on a server side
 * or {@link module:@unitybase/ub-pub.Repository UB.Repository} / {@link module:@unitybase/ub.LocalRepository UB.LocalRepository} on client side
 */
class CustomRepository {
  /**
   * @param {string} entityName name of Entity we create for
   */
  constructor (entityName) {
    /**
     * @private
     * @type {Array}
     */
    this.fieldList = []
    /**
     * @private
     * @type {Array}
     */
    this.groupList = []
    /**
     * @private
     * @type {{}}
     */
    this.whereList = {}
    /**
     * Used internally to avoid Object.keys(whereList) call
     * @type {number}
     * @private
     */
    this._whereLength = 0
    /**
     * @private
     * @type {Array}
     */
    this.logicalPredicates = []
    /**
     * @private
     * @type {Array}
     */
    this.joinAs = []
    /**
     * @private
     * @type {Array}
     */
    this.orderList = []
    /**
     * @private
     * @type {Object}
     */
    this.options = {}

    /**
     * Name of entity method used for data retrieve.
     * Default is 'select'. The correct way to set method is `.using('mySelect')`
     * @type {string}
     * @private
     */
    this.method = 'select'

    /**
     * Miscellaneous options
     * @property {Object} __misc
     * @private
     */
    this.__misc = {}

    this.entityName = entityName
  }

  /**
   * Retrieve a data from server using `methodName` entity method.
   * By default `select` method will be used.
   * @param {string} methodName
   * @return {CustomRepository}
   */
  using (methodName) {
    this.method = methodName
    return this
  }

  /**
   * Adds attribute(s) or expression(s).
   *
   * Can take expression as a field. In this case entity attribute name must be wrapped into [] brackets.
   * In case of client-side execution the only valid expression is one of:
   *
   * - **'SUM', 'COUNT', 'AVG', 'MAX', 'MIN', 'CAST', 'COALESCE'**
   *
   * @example

// chaining
UB.Repository('uba_user').attrs('ID').attrs('name', 'firstName').attrs('disabled').selectAsObject()

// calculate sum over some attribute
UB.Repository('uba_user').attrs('SUM([disabled])').where('disabled', '=', true).selectScalar()

// In case of server-side execution any valid SQL expression is accepted by attr:
UB.Repository('uba_user').attrs('[ID] / 100 + 1').selectAsArray()

// JOIN `uba_userrole.roleID` is a attribute of type Entity. ORM choose `left join` in case attribute is `allowNull: true`
UB.Repository('uba_userrole').attrs(['userID', 'userID.name']).selectAsObject()

// todo Define a way to join for UNITY (@)

// get values for attribute of type MANY
UB.Repository('tst_maindata')
 .attrs('ID', 'manyValue', 'manyValue.caption')
 .where('code', '=', 'Код1')
 .selectAsObject({'manyValue.caption': 'captions'})
// result is `[{"ID":331947938939292,"manyValue":"1,2","captions":"caption 10,caption 20"}]`

// Get attribute value for multilaguage ("isMultiLang": true in meta file) attribute other when current session language
UB.Repository('org_employee').attrs(['ID', 'lastName_en^']).selectAsObject()

   * @param {string|Array<string>} attrs
   * @return {CustomRepository}
   */
  attrs (...attrs) {
    const L = attrs.length
    for (let i = 0; i < L; i++) {
      if (Array.isArray(attrs[i])) {
        this.fieldList = this.fieldList.concat(attrs[i])
      } else {
        this.fieldList.push(attrs[i])
      }
    }
    return this
  }

  /**
   * Helper method for {@link class:CustomRepository#attrs CustomRepository.attrs}.
   * Calls `attrs` in case addingCondition is <a href=https://developer.mozilla.org/en-US/docs/Glossary/truthy>truthy</a>
   *
   * @example

let isPessimisticLock = !!UB.connection.domain.get('uba_user').attributes.mi_modifyDate
// with whereIf
let repo = UB.Repository('uba_user').attrs('ID').attrsIf(isPessimisticLock, 'mi_modifyDate')
//without whereIf
let repo = UB.Repository('uba_user').attrs('ID')
if (isPessimisticLock) repo = repo.attrs('mi_modifyDate')

   * @param {*} addingCondition Attributes will be added only in case addingCondition is truthy
   * @param {string|Array<string>} attrs
   * @return {CustomRepository}
   */
  attrsIf (addingCondition, ...attrs) {
    return addingCondition
      ? this.attrs.apply(this, attrs)
      : this
  }

  /**
   * Adds where expression
   *
   *  - the expression may contain one of the following functions: 'SUM', 'COUNT', 'AVG', 'MAX', 'MIN', 'CAST', 'COALESCE',
   *    'LENGTH', 'LOWER', 'UPPER', 'DAY', 'MONTH', 'YEAR', 'ROUND', 'FLOOR', 'CEILING'
   *
   *  - for a Date/DateTime attributes special macros `#maxdate` or `#currentdate` can be used as a value:
   *
   *        .where('dateValue', '=', '#maxdate')
   *        .where('dateTimeValue', '<', '#currentdate')
   *
   *  - `in` and 'notIn` conditions can take a sub-repository as a value parameter value.
   *  See {@link class:CustomRepository#exists CustomRepository.exists} for sample
   *
   *  - for details how array parameters binds to DB query see array binding section in [database tuning tutorial](https://unitybase.info/api/server-v5/tutorial-database_tuning.html#array-binding)
   *
   * @example

UB.Repository('my_entity').attrs('ID')
  // code in ('1', '2', '3')
  .where('code', 'in', ['1', '2', '3'])
  // code in (select code from my_codes where id = 10)
  .where('code', 'in', UB.Repository('my_codes').attrs('code').where('ID', '<', 10))
  // name like '%homer%'
  .where('[name]', 'contains', 'Homer')
  //(birtday >= '2012-01-01') AND (birtday <= '2012-01-02')
  .where('[birtday]', 'geq', new Date()).where('birtday', 'leq', new Date() + 10)
  // (age + 10 >= 15)
  .where('[age] -10', '>=', {age: 15}, 'byAge')
  .where('LENGTH([code])', '<', 5)
  // for condition match expression not need
  .where('', 'match', 'myvalue')

   * @param {string} expression   Attribute name (with or without []) or valid expression with attributes in []
   * @param {CustomRepository.WhereCondition|String} condition  Any value from {@link CustomRepository#WhereCondition WhereCondition}
   * @param {*} [value] Condition value. If `undefined` value not passed to ubql
   * @param {object|string} [options] If string is passed it means `clauseName`, otherwise an object {clauseName, clearable}
   * @param {string} [options.clauseName] clause name to be used in {CustomRepository.logicalPredicates}
   *  - If not passed unique clause name will be generated ('_1', '_2', ..).
   *  - In case a condition with the same name exists, it will be overwritten.
   * @param {boolean} [options.clearable] if === false then clearWhereList() will skip removing this where condition
   * @return {CustomRepository}
   */
  where (expression, condition, value, options) {
    const UBQL2 = this.UBQLv2
    let clauseName = (options && (typeof options === 'object')) ? options.clauseName : options
    if (!clauseName) { // generate unique clause name
      clauseName = cNames[++this._whereLength]
      while (this.whereList[clauseName]) {
        clauseName += '_'
      }
    }
    const originalCondition = condition
    const WhereCondition = CustomRepository.prototype.WhereCondition
    condition = WhereCondition[condition]
    if (expression && condition !== 'custom' && !bracketsRe.test(expression)) {
      expression = `[${expression}]`
    }
    if (!condition) {
      throw new Error('Unknown condition ' + originalCondition)
    }
    let subQueryType
    if (((condition === 'in') || (condition === 'notIn')) && (value instanceof CustomRepository)) { // subquery
      subQueryType = condition // remember sub-query type
      condition = 'subquery'
      value = value.ubql() // get a subquery definition from a sub-repository
    } else if (condition === 'subquery') {
      subQueryType = originalCondition
      if (value instanceof CustomRepository) {
        value = value.ubql() // get a subquery definition from a sub-repository
      }
    } else if ((condition === 'in' || condition === 'notIn') && (value === null || value === undefined)) {
      // prevent ORA-00932 error - in case value is undefined instead of array
      console.warn('Condition "in" is passed to CustomRepository.where but value is null or undefined -> condition transformed to (0=1). Check where logic')
      expression = '0'
      condition = WhereCondition.equal
      value = UBQL2 ? 1 : { a: 1 }
    } else if (condition === 'in' && (!Array.isArray(value))) {
      console.debug('Condition "in" is passed to CustomRepository.where but value is not an array -> condition transformed to equal. Check where logic')
      condition = WhereCondition.equal
    } else if (condition === 'in' && (!value || !value.length)) {
      console.warn('Condition "in" is passed to CustomRepository.where but value is empty array -> condition transformed to "0=1". Check where logic')
      expression = '0'
      condition = WhereCondition.equal
      value = UBQL2 ? 1 : { a: 1 }
    } else if (condition === 'notIn' && (!value || !value.length)) {
      console.warn('Condition "notIn" is passed to CustomRepository.where but value is empty array -> condition transformed to "1=1". Check where logic')
      expression = '1'
      condition = WhereCondition.equal
      value = UBQL2 ? 1 : { a: 1 }
    } else if (value === null && (condition !== 'isNull' || condition !== 'notIsNull')) {
      const wrongCondition = condition
      value = undefined
      condition = conditionInCaseValueIsNull[wrongCondition]
      if (condition) {
        console.warn(`Condition ${wrongCondition} is passed to CustomRepository.where but value is null -> condition transformed to ${condition}. Check where logic`)
      } else {
        throw new Error(`Condition ${wrongCondition} is passed to CustomRepository.where but value is null`)
      }
    }
    if ((condition === 'in') && value && (value.length === 1)) {
      // console.warn('Condition "in" is passed to CustomRepository.where but value is an array on ONE item -> condition transformed to "equal". Check your logic')
      condition = WhereCondition.equal
      value = value[0]
    }
    if (!UBQL2 && (value !== undefined && (typeof (value) !== 'object' || Array.isArray(value) || _.isDate(value)))) {
      const obj = {}
      obj[clauseName] = value
      value = obj
    }
    const whereItem = {
      expression: expression,
      condition: condition
    }
    if (condition === 'subquery') {
      whereItem.subQueryType = subQueryType
    }
    if (value !== undefined) {
      if (UBQL2) {
        whereItem.value = value
      } else {
        whereItem.values = value
      }
    }
    this.whereList[clauseName] = whereItem
    if (options && (typeof options === 'object') && (options.clearable === false)) {
      if (!this._unclearable) this._unclearable = {}
      this._unclearable[clauseName] = true
    }
    return this
  }

  /**
   * Helper method for {@link class:CustomRepository#where CustomRepository.where}.
   * Calls `where` in case addingCondition is <a href='https://developer.mozilla.org/en-US/docs/Glossary/truthy'>truthy</a>
   *
   * @example

let filterString = 'foundAllLikeThis' // or may be empty string
// with whereIf
let repo = UB.Repository('my_entity').attrs('ID').whereIf(filterString, 'myAttr', 'like', filterString)

//without whereIf
let repo = UB.Repository('my_entity').attrs('ID')
if (filterString) repo = repo.where('myAttr', 'like', filterString)

   * @param {*} addingCondition Where expression will be added only in case addingCondition is truthy
   * @param {string} expression   Attribute name (with or without []) or valid expression with attributes in []
   * @param {CustomRepository.WhereCondition|String} condition  Any value from {@link class:CustomRepository#WhereCondition WhereCondition}
   * @param {*} [values] Condition value. If `undefined` values not passed to ubql
   * @param {string} [clauseName] Optional clause name to be used in {CustomRepository.logicalPredicates}
   *   If not passed where will generate unique clause named 'c1', 'c2', ......
   * @return {CustomRepository}
   */
  whereIf (addingCondition, expression, condition, values, clauseName) {
    return addingCondition
      ? this.where(expression, condition, values, clauseName)
      : this
  }

  /**
   *  Adds where condition with `EXISTS` sub-query. Inside a sub-query there are two macros:
   *
   *  - `{master}` will be replaced by master entity alias
   *  - `{self}` will be replaced by sub-query entity alias
   *
   * @example

UB.Repository('uba_user').attrs(['ID', 'name']) //select users
  // who are not disabled
  .where('disabled', '=', 0)
  // which allowed access from Kiev
  .where('trustedIP', 'in',
   UB.Repository('geo_ip').attrs('IPAddr')
     .where('city', '=', 'Kiev')
  )
  // who do not login during this year
  .notExists(
   UB.Repository('uba_audit')
     .correlation('actionUser', 'name')  // here we link to uba_user.name
     .where('actionTime', '>', new Date(2016, 1, 1))
     .where('actionType', '=', 'LOGIN')
  )
  // but modify some data
  .exists(
   UB.Repository('uba_auditTrail')
     .correlation('actionUser', 'ID') // here we link to uba_user.ID
     .where('actionTime', '>', new Date(2016, 1, 1))
  )
  .select()

   * @param {CustomRepository} subRepository  Repository, what represent a sub-query to be execute inside EXISTS statement
   * @param {string} [clauseName] Optional clause name
   * @return {CustomRepository}
   */
  exists (subRepository, clauseName) {
    return this.where('', 'exists', subRepository, clauseName)
  }

  /**
   * Adds where condition with `NOT EXISTS` sub-query. See CustomRepository.exists for sample
   *
   * @param {CustomRepository} subRepository  Repository, what represent a sub-query to be execute inside EXISTS statement
   * @param {string} [clauseName] Optional clause name
   * @return {CustomRepository}
   */
  notExists (subRepository, clauseName) {
    return this.where('', 'notExists', subRepository, clauseName)
  }

  /**
   * If current repository is used as a sub-query for `exists`, `notExists`, `in` or `notIn` conditions
   * [correlation](https://en.wikipedia.org/wiki/Correlated_subquery) with a master repository will added
   *
   * @param {string} subQueryAttribute
   * @param {string} masterAttribute
   * @param {WhereCondition|String} [condition=eq] A subset from WhereCondition list applicable for correlation join
   * @param {string} [clauseName] Optional clause name to be used in {@link class:CustomRepository#logic logic}.
   *   If not passed unique clause names ('c1', 'c2', ...) where will be generated
   * @return {CustomRepository}
   */
  correlation (subQueryAttribute, masterAttribute, condition, clauseName) {
    if (!bracketsRe.test(subQueryAttribute)) {
      subQueryAttribute = '[' + subQueryAttribute + ']'
    }
    if (!condition) condition = '='
    return this.where(subQueryAttribute + condition + '[{master}.' + masterAttribute + ']', 'custom', undefined, clauseName)
  }

  /**
   * Arrange named `where expressions` in logical order. By default `where expressions` are joined by AND logical predicate.
   * It is possible to join it in custom order using `logic`.
   * Pay attention to condition name we pass as a 4-th parameter to `.where()`
   *
   * @example

UB.Repository('my_entity').attrs('ID')
 // code in ('1', '2', '3')
 .where('code', 'in', ['1', '2', '3'], 'byCode')
 // name like '%homer%'
 .where('name', 'contains', 'Homer', 'byName')
 //(birtday >= '2012-01-01') AND (birtday <= '2012-01-02')
 .where('birtday', 'geq', new Date()).where('birtday', 'leq', new Date() + 10)
 // (age + 10 >= 15)
 .where('[age] -10', '>=', {age: 15}, 'byAge')
 // (byCode OR byName) AND (all where items, not included in logic)
 .logic('(([byCode]) OR ([byName]))')

   * @param {string} predicate logical predicate.
   * @return {CustomRepository}
   */
  logic (predicate) {
    this.logicalPredicates.push(predicate)
    return this
  }

  /**
   * Force `where expressions` to be used in join part of SQL statement instead of where part. Applicable only for not cached entities
   * @exapmle

// will generate
// SELECT A.ID, B.code FROM tst_document A LEFT JOIN tst_category B
//    ON (B.instanceID = A.ID and B.ubUser = 10)
// instead of
// SELECT A.ID, B.code FROM tst_document A LEFT JOIN tst_category B
//    ON B.instanceID = A.ID
//    WHERE B.ubUser = 10
UB.Repository('tst_document').attrs(['ID', '[caregory.code]'])
 .where('[caregory.ubUser]', '=', 10, 'wantInJoin')
 .join('wantInJoin')
 .selectAsObject().then(UB.logDebug)

   * @param {string} whereItemName name of where item to use in join.
   * @return {CustomRepository}
   */
  join (whereItemName) {
    this.joinAs.push(whereItemName)
    return this
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Adds join condition
   *
   * @param {string} expression   Attribute name (with or without []) or valid expression with attributes in [].
   * @param {CustomRepository.WhereCondition} condition    Any value from WhereCondition list.
   * @param {*} [values] Condition value. In case expression is complex can take {Object} as value.
   *   In case values === undefined no values property passed to where list
   * @param {string} [clauseName] Optional clause name to be used in {CustomRepository.logicalPredicates}.
   *   If not passed where will generate unique clause named 'c1', 'c2', ......
   * @return {CustomRepository}
   */
  joinCondition (expression, condition, values, clauseName) {
    if (!clauseName) { // generate unique clause name
      clauseName = cNames[++this._whereLength]
      while (this.whereList[clauseName]) {
        clauseName += '_'
      }
    }
    if (this.joinAs.includes(clauseName)) {
      throw new Error(`Join condition with clause name ${clauseName} already exists`)
    }
    this.where(expression, condition, values, clauseName)
    this.joinAs.push(clauseName)
    return this
  }

  /**
   * Sorting. If expression already exists in order list it direction will be changed or, in case direction === null it will be removed
   *
   * @example

let repo = UB.Repository('my_entity').attrs('ID').orderBy('code')
let orderedData = await repo.selectAsObject() // ordered. await is for client-side only
repo.orderBy('code', null) // remove order by code
let unorderedData = await repo.selectAsObject() // NOT ordered

   * @param {string} attr Sorted attribute
   * @param {string|null} [direction='asc'] Sort direction ('asc'|'desc'). If `null` - remove sorting by this attr
   * @return {CustomRepository}
   */
  orderBy (attr, direction) {
    const i = this.orderList.findIndex(oi => oi.expression === attr)
    if (direction === null) {
      if (i !== -1) this.orderList.splice(i, 1)
    } else {
      direction = direction || 'asc'
      if (i === -1) {
        this.orderList.push({
          expression: attr,
          order: direction
        })
      } else { //
        this.orderList[i].order = direction
      }
    }
    return this
  }

  /**
   * Adds descend sorting. The same as orderBy(attr, 'desc')
   *
   * To remove such sorting call orderBy(attr, null)
   *
   * @example

UB.Repository('my_entity').attrs('ID')
  // ORDER BY code, date_create DESC
  .orderBy('code').orderByDesc('date_create')

   * @param {string} attr
   * @return {CustomRepository}
   */
  orderByDesc (attr) {
    this.orderList.push({
      expression: attr,
      order: 'desc'
    })
    return this
  }

  /**
   * Adds grouping
   * @example

UB.Repository('my_entity').attrs('ID')
 .groupBy('code')
UB.Repository('uba_user').attrs('disabled')
 .groupBy('disabled').select()
UB.Repository('uba_user').attrs(['disabled','uPassword','COUNT([ID])'])
 .groupBy(['disabled','uPassword']).select()

   * @param {string|Array<string>} attr Grouped attribute(s)
   * @return {CustomRepository}
   */
  groupBy (attr) {
    if (Array.isArray(attr)) {
      this.groupList = this.groupList.concat(attr)
    } else if (typeof attr === 'string') {
      this.groupList.push(attr)
    }
    return this
  }

  /**
   * Retrieve first `start` rows
   * @example

let store = UB.Repository('my_entity').attrs('ID')
 //will return ID's from 15 to 25
 .start(15).limit(10).select()

   * @param {Number} start
   * @return {CustomRepository}
   */
  start (start) {
    this.options.start = start
    return this
  }

  /**
   * How many rows to select. If 0 - select all rows started from .start()
   * @example

// will return first two ID's from my_entity
let store = UB.Repository('my_entity').attrs('ID').limit(2).selectAsObject()

   * @param {number} rowsLimit
   * @return {CustomRepository}
   */
  limit (rowsLimit) {
    if (rowsLimit === 0) {
      delete this.options.limit
    } else {
      this.options.limit = rowsLimit
    }
    return this
  }

  /**
   * Construct a UBQL JSON
   * @example

let repo = UB.Repository('my_entity').attrs('ID').where('code', '=', 'a')
let inst = UB.DataStore(my_entity)
inst.run('select', repo.ubql())

   * @return {UBQL}
   */
  ubql () {
    const req = {
      entity: this.entityName,
      method: this.method,
      fieldList: this.fieldList
    }
    if (this.groupList.length > 0) {
      req.groupList = this.groupList
    }
    if (Object.keys(this.whereList).length) {
      req.whereList = this.whereList
    }
    const orderCnt = this.orderList.length
    if (orderCnt > 0) {
      req.orderList = {}
      for (let i = 0; i < orderCnt; i++) {
        req.orderList[i] = this.orderList[i]
      }
    }
    if (Object.keys(this.options).length) { // .limit || .start .totalRequired
      req.options = this.options
    }
    if (this.logicalPredicates.length) {
      req.logicalPredicates = this.logicalPredicates
    }
    if (this.joinAs.length) {
      req.joinAs = this.joinAs
    }
    Object.assign(req, this.__misc) // apply misc - faster than _.defaults
    return req
  }

  /**
   * Private method for construct a Repository from UBQL. Please, use UB.Repository(ubqlJson) instead of call this private method
   * @param {Object} ubqlJson
   * @private
   * @example

// serialize Repository into plain java script object (UBQL)
const ubql = UB.Repository('my_entity').attrs('ID').where('code', '=', 'a').ubql()
// restore Repository from plain java script object (UBQL)
const repo = UB.Repository(ubql)

   * @return {UBQL}
   */
  fromUbql (ubqlJson) {
    const u = _.cloneDeep(ubqlJson)
    this.entityName = u.entity
    if (u.method) this.method = u.method
    this.fieldList = u.fieldList
    this.groupList = u.groupList || []
    this.whereList = u.whereList || {}
    if (u.orderList) {
      // orderList in UBQL is object with keys === order position. Keys can be strings
      const orderKeys = Object.keys(u.orderList)
      this.orderList = []
      orderKeys.forEach(k => {
        this.orderList.push(u.orderList[k])
      })
    }
    this.options = u.options || {}
    this.logicalPredicates = u.logicalPredicates || []
    this.joinAs = u.joinAs || []
    this.__misc = {}
    const m = Object.keys(u)
    m.forEach(mt => {
      if ((u[mt] === true) && KNOWN_MISC_TAGS.has(mt)) this.__misc[mt] = true
    })
    return this
  }

  // noinspection JSMethodCanBeStatic
  /**
   * Must be implemented in descendants and return (or resolved for async clients)
   * to `array of object` representation of result, like this
   *
   *      [{"ID":3000000000004,"code":"uba_user"},{"ID":3000000000039,"code":"uba_auditTrail"}]
   *
   * @abstract
   * @param {Object<string, string>} [fieldAliases] Optional object to change attribute
   *  names during transform array to object
   * @return {Array<object>}
   */
  selectAsObject (fieldAliases) {
    throw new Error('abstract')
  }

  // noinspection JSMethodCanBeStatic
  /**
   * Must be implemented in descendants and return (or resolved for async clients)
   * to `array of array` representation of result, like this
   *
   *      {"resultData":{"fields":["ID","name","ID.name"],"rowCount":1,"data":[[10,"admin","admin"]]},"total":1,"__totalRecCount": totalRecCountIfWithTotalRequest}
   *
   * @abstract
   */
  selectAsArray () {
    throw new Error('abstract')
  }

  /**
   * For repository with ONE attribute returns a flat array of attribute values
   *
   * @example
// get first 100 all ID's of tst_dictionary entity
UB.Repository('tst_dictionary').attrs('ID').limit(100).selectAsArrayOfValues()
// returns array of IDs: [1, 2, 3, 4]

   * @return {Array<string|number>}
   * @abstract
   */
  selectAsArrayOfValues () {
    throw new Error('abstract')
  }

  // noinspection JSMethodCanBeStatic
  /**
   * Must be implemented in descendants and return (or resolved for async clients)
   * to `DataSet` class instance, implemented in caller level. It can be:
   *
   *  - {TubDataStore} for in-server context
   *  - {UB.ux.data.UBStore} for UnityBase `adminUI` client
   *  - `array of array` data representation for UnityBase remote connection
   *  - etc.
   *
   * @abstract
   * @param {Object} [storeConfig] optional config passed to store constructor
   */
  selectAsStore (storeConfig) {
    throw new Error('abstract')
  }

  // noinspection JSMethodCanBeStatic
  /**
   * Must be implemented in descendants as a alias to the most appropriate method
   *
   * @abstract
   * @param {Object} [storeConfig] optional config passed to store constructor
   */
  select (storeConfig) {
    throw new Error('abstract')
  }

  // noinspection JSMethodCanBeStatic
  /**
   * Select a single row. If ubql result is empty - return `undefined`
   * @example

  UB.Repository('uba_user').attrs('name', 'ID').where('ID', '=', 10)
   .selectSingle().then(UB.logDebug)
  // will output: {name: "admin", ID: 10}

   * **WARNING** method does not check if result contains the single row and always returns a first row from result
   * @abstract
   * @param {Object<string, string>} [fieldAliases] Optional object to change attribute names
   *   during transform array to object. See {@link selectAsObject}
   * @return {*|undefined}
   */
  selectSingle (fieldAliases) {
    throw new Error('abstract')
  }

  // noinspection JSMethodCanBeStatic
  /**
   * Execute select and returns a value of the first attribute from the first row
   * @example

UB.Repository('uba_user')
  .attrs('name')
  .where('ID', '=', 10)
  .selectScalar().then(UB.logDebug) // will output `admin`

   * **WARNING** does not check if result contains the single row
   * @abstract
   * @return {Number|String|undefined}
   */
  selectScalar () {
    throw new Error('abstract')
  }

  // noinspection JSMethodCanBeStatic
  /**
   * Select a single row by ID. If result is empty - returns `undefined`
   * If result is not empty - returns a object
   * @example

  UB.Repository('uba_user').attrs('name', 'ID').selectById(10).then(UB.logDebug)
  // will output: {name: "admin", ID: 10}

   * @abstract
   * @param {Number} ID Row identifier
   * @param {Object<string, string>} [fieldAliases] Optional object to change attribute names
   *   during transform array to object. See {@link selectAsObject}
   * @return {Object|undefined}
   */
  selectById (ID, fieldAliases) {
    throw new Error('abstract')
  }

  /**
   * Apply miscellaneous options to resulting UBQL
   * @example

// this server-side call will select all currency, including deleted
UB.Repository('cdn_currency').attrs(['ID'])
  .misc({__allowSelectSafeDeleted: true}).selectAsArray();

   * @param {Object} flags
   * @param {Date} [flags.__mip_ondate] Specify date on which to select data for entities with `dataHistory` mixin. Default to Now()
   * @param {Boolean} [flags.__mip_recordhistory=false] Select only record history data for specified ID (for entities with `dataHistory` mixin)
   * @param {Boolean} [flags.__mip_recordhistory_all=false] Ignore __mip_ondate and select all data (acts as select for entities without `dataHistory` mixin)
   * @param {Boolean} [flags.__mip_disablecache=false] For entities with cacheType in ["Session", "SessionEntity"] not check is data modified and always return result
   * @param {Boolean} [flags.__skipOptimisticLock=false] Skip optimistic lock for entities with `mStorage.simpleAudit = true`
   * @param {Boolean} [flags.__allowSelectSafeDeleted=false] Include softly deleted rows to the result
   * @param {Boolean} [flags.__skipSelectAfterUpdate=false] **Server-side only.**
   * @param {Boolean} [flags.__skipSelectAfterInsert=false] **Server-side only.**
   * @param {Boolean} [flags.__skipSelectBeforeUpdate=false] **Server-side only.** if added then `mStorage` mixin don't execute `select` before execution of `update`.
   *   As a **UNSAFE** side effect `update` won't check record is accessible to user.
   *   **UNSAFE** If `Audit` mixin is implemented for entity empty OldValue in inserted into `uba_auditTrail` in case this flag is enabled, so better to think twice before skip select before update
   * @param {Boolean} [flags.__skipRls=false] **Server-side only.**
   * @param {Boolean} [flags.__skipAclRls=false] **Server-side only.**
   * @param {string} [flags.lockType] For entities with `softLock` mixin retrieve/set a lock during method execution.
   *   Possible values:
   *   - 'None': get a lock info during select* execution (for a results with a single row)
   *   - `Temp` or `Persist`: set a lock (temp or persistent) together with select* execution (for a results with a single row)
   * @return {CustomRepository}
   */
  misc (flags) {
    for (const key in flags) {
      if (flags.hasOwnProperty(key)) {
        if (!flags[key]) {
          delete this.__misc[key]
        } else {
          this.__misc[key] = flags[key]
        }
      }
    }
    return this
  }

  /**
   * Helper method for {@link class:CustomRepository#misc CustomRepository.misc}.
   * Calls `misc` in case addingCondition is <a href=https://developer.mozilla.org/en-US/docs/Glossary/truthy>truthy</a>
   *
   * @param {*} addingCondition flags will be applied only in case addingCondition is truthy
   * @param {Object} flags
   * @return {CustomRepository}
   */
  miscIf (addingCondition, flags) {
    if (addingCondition) {
      return this.misc(flags)
    } else {
      return this
    }
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * Calculate total row number. WARNING!! This is VERY slow operation on DB level in case of many record
   *
   * Result of calculation is returned in __totalRecCount parameter value in case `selectAsArray()` client call:
   *
   * @example
let result = UB.Repository('uba_user')
   .attrs(['ID', 'description'])
   .withTotal().selectAsArray();
console.log('Total count is:', result.__totalRecCount)

// Or into TubDataStore.totalRowCount in case of server side `selectAsStore()` call:
 let store = UB.Repository('uba_user')
   .attrs(['ID', 'description'])
   .withTotal().selectAsStore();
 console.log('Total count is:', store.totalRowCount);
   *
   * @param {boolean} [value=true] If `false` will remove total requirements
   * @return {CustomRepository}
   */
  withTotal (value = true) {
    if (value === false) {
      delete this.options.totalRequired
    } else {
      this.options.totalRequired = true
    }
    return this
  }

  /**
   * Creates a clone of this repository
   * @example

let repo1 = UB.Repository('uba_user').attrs('ID', 'code').where('ID', '>', 15, 'byID')
let repo2 = repo1.clone()
repo1.orderBy('code')
repo2.attrs('name').where('ID', '>', 100, 'byID')
repo1.selectAsObject() // return ordered users with ID > 15
repo2.selectAsObject() // return unordered users with their names and ID > 100

   * @return {CustomRepository}
   */
  clone () {
    const cloned = _.cloneDeep(this)
    // prevent deep clone of connection property
    Object.defineProperty(cloned, 'connection', { enumerable: false, writable: false, value: this.connection })
    return cloned
  }

  /**
   * Remove all where conditions (except ones using in joinAs). This function mutates current Repository
   * @example

let repo1 = UB.Repository('uba_user').attrs('ID', 'code').where('ID', '>', 15, 'byID')
let repoWithoutWheres = repo1.clone().clearWhereList()

   * @return {CustomRepository}
   */
  clearWhereList () {
    this.logicalPredicates = []
    if (this.joinAs.length || this._unclearable) {
      const wNames = Object.keys(this.whereList)
      wNames.forEach(wName => {
        if ((this._unclearable && !this._unclearable[wName]) && (this.joinAs.indexOf(wName) === -1)) {
          delete this.whereList[wName]
        }
      })
    } else {
      this.whereList = {}
    }
    return this
  }
}

/**
 * Alias to {@link CustomRepository#ubql CustomRepository.ubql}
 * @memberOf CustomRepository
 * @private
 * @deprecated Will be removed in UB 5.1. Use .ubql() instead
 */
CustomRepository.prototype.getRunListItem = CustomRepository.prototype.ubql
/**
 * Alias to {@link CustomRepository#ubql CustomRepository.ubql}
 * @method
 * @memberOf CustomRepository
 * @private
 * @deprecated Will be removed in UB 5.1. Use .ubql() instead
 */
CustomRepository.prototype.ubRequest = CustomRepository.prototype.ubql

/**
 * Enumeration of all condition types. This enumeration defines a set of String values.
 * It exists primarily for documentation purposes - in code use the actual string values like '>', don't reference them through this class like WhereCondition.more.
 *
 * We define several aliases for the same condition. In case of direct HTTP request (without Repository) use only non-aliased values (i.e. `more` instead of '>' or 'gt')
 * @memberOf CustomRepository
 * @enum {string}
 */
CustomRepository.prototype.WhereCondition = {
  /** @description Alias for `more` */
  gt: 'more',
  /** @description Alias for `more` */
  '>': 'more',
  /** @description Greater than */
  more: 'more',
  /** @description Alias for `less` */
  lt: 'less',
  /** @description Alias for `less` */
  '<': 'less',
  /** @description Less than */
  less: 'less',

  /** @description Alias for `equal` */
  eq: 'equal',
  /** @description Alias for `equal` */
  '=': 'equal',
  /** @description Equal to */
  equal: 'equal',

  /** @description Alias for `moreEqual` */
  ge: 'moreEqual',
  /** @description  Alias for `moreEqual` */
  geq: 'moreEqual',
  /** @description  Alias for `moreEqual` */
  '>=': 'moreEqual',
  /** @description  Greater than or equal */
  moreEqual: 'moreEqual',

  /** @description Alias for `lessEqual` */
  le: 'lessEqual',
  /** @description Alias for `lessEqual` */
  leq: 'lessEqual',
  /** @description Alias for `lessEqual` */
  '<=': 'lessEqual',
  /** @description Less than or equal */
  lessEqual: 'lessEqual',

  /** @description Alias for `notEqual` */
  ne: 'notEqual',
  /** @description Alias for `notEqual` */
  neq: 'notEqual',
  /** @description Alias for `notEqual` */
  '<>': 'notEqual',
  /** @description Alias for `notEqual` */
  '!=': 'notEqual',
  /** @description Alias for `notEqual` */
  '!==': 'notEqual',
  /** @description Not equal */
  notEqual: 'notEqual',

  /** @description Alias for `like` */
  contains: 'like',
  /** @description Like condition. For attributes of type `String` only */
  like: 'like',

  /** @description Alias for `notLike` */
  notContains: 'notLike',
  /** @description Not like condition. For attributes of type `String` only */
  notLike: 'notLike',

  /** @description Is null */
  isNull: 'isNull',
  /** @description Alias for `isNull` */
  null: 'isNull',

  /** @description Alias for `notIsNull` */
  notNull: 'notIsNull',
  /** @description Not is null */
  notIsNull: 'notIsNull',
  /** @description Alias for `notIsNull` */
  isNotNull: 'notIsNull',

  /** @description Alias for `startWith` */
  beginWith: 'startWith',
  /** @description Start with. For attributes of type `String` only */
  startWith: 'startWith',
  /** @description Alias for `startWith` */
  startsWith: 'startWith',
  /** @description Alias for `startWith` */
  startswith: 'startWith',

  /** @description Alias for `notStartWith` */
  notBeginWith: 'notStartWith',
  /** @description Not start with. For attributes of type `String` only */
  notStartWith: 'notStartWith',
  /** @description Alias for `notStartWith` */
  notStartsWith: 'notStartWith',

  /** @description Alias for `in` */
  includes: 'in',
  /** @description One of. Can accept array of string on array of Int/Int64 as values depending on attribute type. */
  in: 'in',

  /** @description Alias for `notIn` */
  notIncludes: 'notIn',
  /** @description Not one of. See WhereCondition.in for details */
  notIn: 'notIn',

  /** @description For entities with FTS mixin enabled. TODO - expand */
  match: 'match',

  /** @description Execute a sub-query passed in values. Better to use 'in' condition with Repository as a values parameter or a CustomRepository.exists method */
  subquery: 'subquery',
  /** @description Execute a exists(sub-query) passed in values. Better to use CustomRepository.exists method */
  exists: 'subquery',
  /** @description Execute a not exists(sub-query) passed in values. Better to use CustomRepository.notExists method */
  notExists: 'subquery',

  /** @description Custom condition. For Server-side call only. For this condition `expression` can be any SQL statement */
  custom: 'custom'
}

/**
 * Server side support UBQL v2 version (value in whereList)
 * @type {boolean}
 */
CustomRepository.prototype.UBQLv2 = true

CustomRepository.prototype.CONSTANTS = {
  selectSingleMoreThanOneRow: 'Query for selectSingle returns more than 1 row. MUST be fixed by adding a correct where clause',
  selectScalarMoreThanOneRow: 'Query for selectScalar returns more than 1 row. MUST be fixed by adding a correct where clause'
}

/**
 * Abstract Custom repository (extended by serverRepository & ClientRepository)
 * @type {CustomRepository}
 */
module.exports = CustomRepository
