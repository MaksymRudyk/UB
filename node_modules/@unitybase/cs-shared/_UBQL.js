/* eslint-disable no-unused-vars */

// stubs for documenting a UBQL. This file is not actually evaluated

/**
 * @class UBQLItem
 */
class UBQLItem {
  constructor () {
    /**
     * Entity name
     * @type {string}
     */
    this.entity = ''
    /**
     * Method name
     * @type {string}
     */
    this.method = ''
  }
}

/**
 * @class UBQLWhere
 */
class UBQLWhere {
  constructor () {
    /**
     * Entity attribute or a valid expression
     * @type {string}
     */
    this.expression = ''
    /**
     * Where condition
     * @type {WhereCondition}
     */
    this.condition = ''
    /**
     * Left side of condition
     * @type {Object}
     */
    this.values = {}
  }
}

/**
 * @class UBQLOrderItem
 */
class UBQLOrderItem {
  constructor () {
    /**
     * Attribute name of valid expression for ordering
     * @type {string}
     */
    this.expression = ''
    /**
     * Order direction. Either 'asc' or 'desc'
     * @type {string}
     */
    this.order = ''
  }
}

/**
 * @classdesc
 * UnityBase Query Language formal definition. **Recommended way** to create a UBQL is {@link class:ClientRepository ClientRepository}.
 *
 * UBQL JSON representation can be retrieved from Repository using {@link class:ClientRepository#ubql ClientRepository.ubql()}
 * @class UBQL
 * @extends UBQLItem
 */
class UBQL extends UBQLItem {
  constructor () {
    super()
    /**
     * Optional ID. If exists then this is equal to adding a where condition `ID = IDValue` but bypass
     * cache for cached entities
     * @type {number}
     */
    this.ID = 0
    /**
     * Attributes array
     * @type {Array<string>}
     */
    this.fieldList = []
    /**
     * Optional named conditions. Object keys is condition name
     * @type {Object<string, UBQLWhere>}
     */
    this.whereList = {}
    /**
     * Optional order by
     * @type {Object.<string, UBQLOrderItem>}
     */
    this.orderBy = {}
    /**
     * Optional logical concatenation of WHERE conditions
     * @type {string}
     */
    this.logicalPredicates = ''
    /**
     * Optional array of condition names to use in join clause instead of where clause of result SQL
     * @type {Array<string>}
     */
    this.joinAs = []
    /**
     * Optional array of attributes names to use in group by clause
     * @type {Array<string>}
     */
    this.groupBy = []
    /**
     * Optional options for building SQL. See {@link CustomRepository#misc CustomRepository.misc} documentation for possible values
     * @type {Object}
     */
    this.options = {}
  }
}
