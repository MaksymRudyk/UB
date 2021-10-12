/**
 * A reactive (in terms of Vue reactivity) entities data cache.
 * To be used for entities with small (< 2000 rows) amount of data to lookup a display value for specified ID.
 *
 * Module is injected into `Vue.prototype` as `$lookups` and exported as `@unotybase/adminui-vue`.lookups.
 *
 * The flow:
 *   - `subscribe` method loads entity data (ID, description attribute and optionally addition attributes specified in attr array)
 *   to the reactive client-side store, and adds a `UB.connection.on(${entity}:changed` listener what change a local cache data
 *   when it's edited locally
 *   - after `subscribe`  methods `lookups.get`, `lookups.getDescriptionById`, `lookups.getEnum` can be used to get a value for
 *   description attribute (ar any other attribute added during `subscribe`) by entity ID value (or by combination of entity attributes values)
 *   - when data for entity no longer needed `unsubscribe` should be called to free a resources
 *
 * **NOTE:** `lookups` subscribes to `ubm_enum` on initialization, so `lookups.getEnum` can be used without addition to `subscribe('umb_enum')`
 *
 * @module lookups
 * @memberOf module:@unitybase/adminui-vue
 */

/**
 * @typedef {object} LookupSubscription
 *
 * @property {number} subscribes Subscribe counter
 * @property {function} onEntityChanged Client local changes listener
 * @property {Set<string>} attrs Lookup attributes
 * @property {array<object>} data Lookup data
 * @property {object} mapById
 * @property {string} descriptionAttrName
 */
const Vue = require('vue')
const UB = require('@unitybase/ub-pub')
const ENUM_ENTITY = 'ubm_enum'

const instance = new Vue({
  data () {
    return {
      entities: /** @type {object<string, LookupSubscription>} */ {}
    }
  },

  methods: {
    async init () {
      const availableEntities = Object.keys(UB.connection.domain.entities)
      for (const entity of availableEntities) {
        this.$set(this.entities, entity, {
          subscribes: 0,
          onEntityChanged: async response => {
            if (response === undefined) {
              return
            }
            const { ID, method, resultData } = response

            const responseID = resultData ? resultData.ID : ID
            if (responseID === undefined) {
              console.error('Lookups: server response must contain ID')
              return
            }

            const cachedEntity = this.entities[entity]
            if (method === 'delete') {
              const lookupItemIndex = cachedEntity.data.findIndex(item => item.ID === ID)
              cachedEntity.data.splice(lookupItemIndex, 1)
              delete cachedEntity.mapById[ID]
              return
            }

            const attrs = Array.from(cachedEntity.attrs)
            const updatedItem = {}
            const hasAllDataInResponse = attrs.every(attr => attr in resultData)

            if (hasAllDataInResponse) {
              for (const attr of attrs) {
                updatedItem[attr] = resultData[attr]
              }
            } else {
              Object.assign(
                updatedItem,
                await UB.Repository(entity)
                  .attrs(attrs)
                  .selectById(resultData.ID)
              )
            }

            if (method === 'insert') {
              cachedEntity.data.push(updatedItem)
              cachedEntity.mapById[updatedItem.ID] = updatedItem
            }

            if (method === 'update') {
              const lookupItem = cachedEntity.mapById[updatedItem.ID]
              if (lookupItem) {
                Object.assign(lookupItem, updatedItem)
              }
            }
          },
          attrs: new Set(['ID']),
          pendingPromise: null,
          data: [],
          mapById: {},
          descriptionAttrName: ''
        })
      }

      await this.subscribe(ENUM_ENTITY, ['eGroup', 'code', 'name', 'sortOrder'])
    },

    async subscribe (entity, attrs = []) {
      const subscription = this.entities[entity]
      const isFirstSubscription = subscription.subscribes === 0
      const hasAdditionalAttrs = !attrs.every(attr => subscription.attrs.has(attr))

      if (isFirstSubscription) {
        UB.connection.on(`${entity}:changed`, subscription.onEntityChanged)
        subscription.descriptionAttrName = UB.connection.domain.get(entity).getDescriptionAttribute()
        subscription.attrs.add(subscription.descriptionAttrName)
      }
      if (hasAdditionalAttrs) {
        for (const attr of attrs) {
          subscription.attrs.add(attr)
        }
      }

      subscription.subscribes++

      if (subscription.pendingPromise) {
        await subscription.pendingPromise
        return
      }

      if (isFirstSubscription || hasAdditionalAttrs) {
        const loadEntries = async () => {
          const resultData = await UB.Repository(entity)
            .attrs([...subscription.attrs])
            .limit(UB.LIMITS.lookupMaxRows)
            .select()

          if (resultData.length >= UB.LIMITS.lookupMaxRows) {
            UB.logError(`Lookups: Entity "${entity}" result truncated to ${UB.LIMITS.lookupMaxRows} records to prevent performance problems. Consider to avoid lookp'ing to a huge entities`)
          } else if (resultData.length >= UB.LIMITS.lookupWarningRows) {
            UB.logWarn(`Lookups: Too many rows (${resultData.length}) returned for "${entity}" lookup. Consider to avoid lookups for huge entities to prevents performance degradation`)
          }
          subscription.data.splice(0, subscription.data.length, ...resultData)
          resultData.forEach(r => { subscription.mapById[r.ID] = r })
        }

        subscription.pendingPromise = loadEntries()
        try {
          await subscription.pendingPromise
        } finally {
          subscription.pendingPromise = null
        }
      }
    },

    unsubscribe (entity) {
      const subscription = this.entities[entity]
      subscription.subscribes--
      if (subscription.subscribes === 0) {
        UB.connection.removeListener(`${entity}:changed`, subscription.onEntityChanged)
        subscription.data.splice(0, subscription.data.length)
        // remove additional attrs
        subscription.attrs.clear()
        subscription.mapById = {}
      }
    },

    getDescriptionById (entity, ID) {
      const subscription = this.entities[entity]
      // for safe deleted record
      if (subscription.mapById[ID] === undefined) {
        return '---'
      }
      return subscription.mapById[ID][subscription.descriptionAttrName]
    },

    get (entity, predicate, resultIsRecord = false) {
      if (predicate === null) {
        return resultIsRecord ? {} : null
      }
      let founded
      if (typeof predicate === 'number') {
        founded = this.entities[entity].mapById[predicate]
      } else if (typeof predicate === 'object') {
        const pKeys = Object.keys(predicate)
        founded = this.entities[entity].data.find(
          r => pKeys.every(k => r[k] === predicate[k])
        )
      }

      if (resultIsRecord) {
        return founded || {}
      } else {
        if (founded) {
          return founded[this.entities[entity].descriptionAttrName]
        } else {
          return null
        }
      }
    },

    getMany (entity, predicate) {
      if (typeof predicate !== 'object' || predicate === null) {
        return []
      }

      const pKeys = Object.keys(predicate)
      return this.entities[entity].data.filter(
        r => pKeys.every(k => r[k] === predicate[k])
      )
    }
  }
})

module.exports = {
  /**
   * Subscribes to the local (in the current browser) entity changes. First call to `subscribe` for entity loads it data into client
   * @example
   *    const App = require('@unitybase/adminui-vue')
   *    await App.lookups.subscribe('tst_dictionary', ['code', 'userID'])
   *
   * @param {string} entity Entity name
   * @param {array<string>} [attrs] lookup attributes (in addition to ID and description attribute)
   * @returns {Promise<void>}
   */
  subscribe (entity, attrs) {
    return instance.subscribe(entity, attrs)
  },
  /**
   * Unsubscribe from entity changes. In case this is a last subscriber, data cache for entity is cleaned
   *
   * @param {string} entity Entity name
   */
  unsubscribe (entity) {
    instance.unsubscribe(entity)
  },
  /**
   * Initialize lookups reactivity by create stubs for all available domain entities.
   * Subscribes to enum entity.
   * @private
   * @returns {Promise<void>}
   */
  init: instance.init,
  /**
   * Search for cached record inside in-memory entity values cache using predicate
   * @example
   *    // get description attribute value for tst_dictionary with ID=123
   *    // since second argument is number perform O(1) lookup by ID
   *    const dictD = lookups.get('tst_dictionary', 123)
   *    // get description attribute value for tst_dictionary with code='code10'
   *    // if code is not unique - returns FIRST occurrence
   *    // complexity is O(N) where n is entity row count
   *    const dictCode10D = lookups.get('tst_dictionary', {code: 'code10'})
   *    // search predicate can be complex
   *    lookups.get('ubm_enum', {eGroup: 'AUDIT_ACTION', code: 'INSERT'})
   *    // if third parameter specified - use it as attribute name for returned value instead of description attribute
   *    const dict123UserName = lookups.get('tst_dictionary', 123, 'userID.fullName')
   *    // if third parameter is `true` - return an object with all attributes specified during `subscribe`
   *    const objWithAllSubscribedAttrs = lookups.get('tst_dictionary', 245671369782, true)
   *
   * @param {string} entity Entity name
   * @param {number|Object|null} predicate
   *   In case predicate is of type number - search by ID - O(1)
   *   In case predicate is Object - search for record what match all predicate attributes - O(N)
   * @param {boolean} [resultIsRecord=false]
   *   - if `true` then return record as a result, in other cases - value of entity `displayAttribute`
   * @returns {*}
   */
  get (entity, predicate, resultIsRecord) {
    return instance.get(entity, predicate, resultIsRecord)
  },
  /**
   * Fast O(1) lookup by ID. The same as `lookups.get('entity_code', idAsNumber)`
   * but returns '---' in case row with specified ID is not found
   *
   * @param {string} entity Entity name
   * @param {number} ID
   * @returns {string} Value if description attribute or '---' in case record not found
   */
  getDescriptionById (entity, ID) {
    return instance.getDescriptionById(entity, ID)
  },
  /**
   * Get enum description by eGroup and code. Alias for `.get('ubm_enum', { eGroup, code })`
   *
   * @param {string} eGroup
   * @param {string} code
   * @returns {string|null}
   */
  getEnum (eGroup, code) {
    return instance.get(ENUM_ENTITY, { eGroup, code })
  },
  /**
   * Get all enum items enum by eGroup.
   *
   * @param {string} eGroup
   * @returns {array}
   */
  getEnumItems (eGroup) {
    const items = instance.getMany(ENUM_ENTITY, { eGroup })
    return _.orderBy(items, 'sortOrder').map(item => ({ code: item.code, name: item.name }))
  }
}

module.exports.install = function (Vue) {
  /** @type {module:lookups} */
  Vue.prototype.$lookups = module.exports
  if (UB.core.UBApp) {
    UB.core.UBApp.on('applicationReady', () => {
      module.exports.init()
    })
  }
}
