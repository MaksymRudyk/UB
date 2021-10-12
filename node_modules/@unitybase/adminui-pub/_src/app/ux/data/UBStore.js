/* global Ext, UB, $App */
require('../../core/UBCommand')
require('./proxy/UBProxy')
// noinspection JSUnusedGlobalSymbols
/**
 * Extend {@link Ext.data.Store} to easy use with UnityBase server:
 *
 * - add ubRequest & entity properties
 * - automatically create Model from ubRequest
 * - proxy is bounded to {@link UB.ux.data.proxy.UBProxy}
 * - refresh UBCache entry on `add` & `remove` operations
 */
Ext.define('UB.ux.data.UBStore', {
  extend: 'Ext.data.Store',
  alias: 'store.ubstore',
  totalRequired: false,

  uses: [
    'UB.core.UBStoreManager',
    'UB.core.UBEnumManager'
  ],

  /**
   * Maps of record, organized by ID's. Used to speed-up store.getById() operations
   * @type {Object<number, Record>}
   */
  indexByID: null,

  statics: {
    /**
     * Copy record dara
     * @param {Ext.data.Model} srcRecord
     * @param {Ext.data.Model} dstRecord
     */
    copyRecord: function (srcRecord, dstRecord) {
      let fields = srcRecord.getFields()
      fields.forEach(function (field) {
        dstRecord.set(field.name, srcRecord.get(field.name))
      })
    },

    /**
     * reset modified
     * @param {Ext.data.Model} record
     */
    resetRecord: function (record) {
      record.modified = []
      record.reject(true)
    },

    /**
     * update values in record from raw data of one entity.
     * @param {Object} response
     * @param {Ext.data.Model} record
     * @param {Number} [rowNum] (optional) default 0
     * @return {Ext.data.Model}
     */
    resultDataRow2Record: function (response, record, rowNum) {
      let data = response.resultData.data[ rowNum || 0 ]
      if (!data) return null

      let responseFieldList = response.resultData.fields

      let len = responseFieldList.length
      let i = -1
      while (++i < len) {
        record.set(responseFieldList[i], data[i])
      }

      return record
    },

    /**
     * create empty record
     * @param {String} entityName
     * @param {String[]} fieldList
     * @param {Boolean} [createStore=true]
     * @returns {*}
     */
    createRecord: function (entityName, fieldList, createStore) {
      let model = UB.ux.data.UBStore.getEntityModel(entityName, fieldList)
      let record = Ext.create(model)

      if (createStore !== false) {
        let store = Ext.create('Ext.data.Store', {
          model: model
        })

        store.add(record)
      }
      record.fields.eachKey(function (field) {
        record.set(field, null)
      })
      UB.ux.data.UBStore.resetRecord(record)
      return record
    },

    /**
     * Add all necessary attributes to field list:
     *
     * - check ID is inside field list. If not - add.
     * - if entity is under simpleAudit and no 'mi_modifyDate' passed - add
     *
     * @param {String|UBEntity} entityName
     * @param {Array<*|String>} fieldList
     * @returns {Array} modified fieldList
     */
    normalizeFieldList: function (entityName, fieldList) {
      let entity
      if (typeof (entityName) === 'string') {
        entity = $App.domainInfo.get(entityName)
      } else {
        entity = entityName
      }

      if (!entity) {
        throw new Error(`Entity "${entityName}" doesn't exists in domain`)
      }
      let hasID = false
      let hasMD = false
      let result = []
      fieldList.forEach(function (field) {
        result.push(field)
        hasID = hasID || field === 'ID' || field.name === 'ID'
        hasMD = hasMD || field === 'mi_modifyDate' || field.name === 'mi_modifyDate'
      })
      if (!hasID) {
        result.push('ID')
      }
      let mStorage = entity.mixins.mStorage
      if (mStorage && mStorage.simpleAudit && !hasMD) {
        result.push('mi_modifyDate')
      }
      return result
    },

    /**
     * Return "full" model class string ('UB.model." + entityName)
     * @param {String} entityName
     * @return {String}
     */
    entityModelName: function (entityName) {
      return 'UB.model.' + entityName
    },

    /**
     * Return model class for specified entity and set of attributes
     *
     * @param {String} entityName
     * @param {String[]} [fieldList] (optional)
     * @param {String} [idProperty='ID']
     * @return {String}
     */
    getEntityModel: function (entityName, fieldList, idProperty) {
      // adjust field list according to metadata
      let modelFields = this.getEntityModelFields(entityName, fieldList)
      let entityModelName = this.entityModelName(UB.core.UBUtil.getNameMd5(entityName, fieldList))

      if (!Ext.ModelManager.getModel(entityModelName)) {
        Ext.define(entityModelName, {
          extend: 'Ext.data.Model',
          entityName: entityName,
          idProperty: idProperty || 'ID',
          fields: modelFields
        })
      }
      return entityModelName
    },

    /**
     * Create model configuration ready for use with {@link Ext.data.Model}
     * The main task is to create converter function for different field types.
     * Usage sample:
     *
     *      Ext.define(entityModelName, {
     *           extend: 'Ext.data.Model',
     *           entityName: entityName,
     *           idProperty: 'ID',
     *           fields: getEntityModelFields(entityName, ['attr1', 'attr2'])
     *       });
     *
     * @param {String} entityName
     * @param {String[]} fieldList
     * @return {Array<Object>}
     */
    getEntityModelFields: function (entityName, fieldList) {
      let domainEntity = $App.domainInfo.get(entityName)
      let fields = []
      fieldList.forEach(function (fieldName, index) {
        let attribute = domainEntity.attr(fieldName)
        fields.push({
          name: fieldName,
          convert: null, // we convert all data just after server response
          type: attribute ? attribute.physicalDataType : 'auto', // for JSON attr type attribute can be undefined
          useNull: true,
          mapping: index
        })
      })
      return fields
    }
  },

  /**
   * Create store.
   *
   * **Warning - internally modify fieldList by call {normalizeFieldList}**
   * @param {Object} config Config object
   */
  constructor: function (config) {
    let me = this
    let newConfig = Ext.clone(config)
    let ubRequest = newConfig.ubRequest
    let entity = ubRequest.entity

    /**
     * @cfg {UB.ux.data.UBStore[]} linkedItemsLoadList
     * List of stores that start load with load this store. Method load waiting for all stores will be loaded.
     */

    // MPV - must be here. Better to remove this functionality at all and set correct fieldList by caller
    ubRequest.fieldList = UB.ux.data.UBStore.normalizeFieldList(entity, ubRequest.fieldList)
    Ext.apply(me, {
      /**
       * @cfg {Object} ubRequest
       */
      ubRequest: ubRequest,
      model: ubRequest.model || UB.ux.data.UBStore.getEntityModel(entity, ubRequest.fieldList, newConfig.idProperty),
      proxy: {
        type: 'ubproxy'
      },
      /**
       * @property {String} entity Entity name
       */
      entityName: entity,
      autoLoad: me.autoLoad !== false,
      remoteSort: true,
      remoteFilter: true,
      remoteGroup: true
    })

    /**
     * @cfg {String} [idProperty] Id property for model.
     */
    if (!config.disablePaging) {
      me.pageSize = !me.pageSize ? UB.appConfig.storeDefaultPageSize : me.pageSize
    } else {
      me.pageSize = 0
    }

    /**
     * Fires each times before call reload method
     * @event beforereload
     */
    me.addEvents('beforereload', 'entityModified')

    me.callParent([newConfig])

    me.on({
      beforeload: me.onBeforeLoad,
      beforeprefetch: me.onBeforePrefetch
    })
  },

  fireModifyEvent: function (request, responce) {
    this.fireEvent('entityModified', request, responce)
  },

  /**
   * Remove actual data from store proxy. Refresh cache if need;
   * @returns {Promise}
   */
  clearCache: function () {
    this.clearProxyCache()
    let cacheType = $App.domainInfo.get(this.entityName).cacheType
    return $App.connection.cacheOccurrenceRefresh(this.entityName, cacheType)
  },

  /**
   * @deprecated
   * @param {Object} whereList
   * @param {Boolean} withoutReload
   */
  setWhereList: function (whereList, withoutReload) {
    this.ubRequest.whereList = whereList

    if (!withoutReload) {
      this.reload()
    }
  },

  /**
   * Load store and all sub-stores defined in this.linkedItemsLoadList
   * @param {Object|Function} [options]
   * @returns {Promise<UBStore>} Promise resolved to this store when finished
   */
  load: function (options) {
    if (this.isDestroyed) {
      return Promise.resolve(this)
    }
    let me = this
    const optionsIsFunction = (typeof options === 'function')

    return new Promise(function (resolve, reject) {
      let doneMain = function (records, operation, success) {
        if (success) {
          if (operation.resultSet) {
            if (operation.resultSet.resultLock) {
              me.resultLock = operation.resultSet.resultLock
            }
            if (operation.resultSet.resultAls) {
              me.resultAls = operation.resultSet.resultAls
            }
          }
          resolve(me)
        } else {
          if (me.throwLoadError) {
            throw operation.getError()
          }
          reject(operation.getError())
        }
        if (options && (options.callback || optionsIsFunction)) {
          UB.logDebug('UBStore.load(callback) is DEPRECATED. Use Promise style: UBStore.load().then(...)')
          if (!success) {
            throw new Error(operation.getError())
          }
          if (optionsIsFunction) {
            Ext.callback(options, null, [records, operation, success])
          } else {
            Ext.callback(options.callback, options.scope, [records, operation, success])
          }
        }
      }
      me.indexByID = null

      me.loading = true

      let rList = []
      if (me.linkedItemsLoadList) {
        let keys = Object.keys(me.linkedItemsLoadList)
        keys.forEach(function (key) {
          let item = me.linkedItemsLoadList[key]
          if (item && (item instanceof UB.ux.data.UBStore)) {
            rList.push(item.load())
          } else if (typeof (item) === 'function') {
            rList.push(item())
          } else if (item && (typeof item.then === 'function')) {
            rList.push(item)
          }
        })
      }
      let newOptions = {}
      if (options && !optionsIsFunction) {
        UB.apply(newOptions, options)
      }
      if (me.disablePaging && !newOptions.limit) {
        newOptions.limit = -1
        newOptions.start = 0
      }
      newOptions.callback = doneMain
      delete newOptions.scope
      if (rList.length) {
        Promise.all(rList).then(function () {
          me.superclass.load.call(me, newOptions) // me._loadInternal(newOptions)
        })
      } else {
        me.superclass.load.call(me, newOptions) // me._loadInternal(newOptions) // me.callParent([newOptions])
      }
    })
  },

  /**
   * Perform reload of store. CLEAR CACHE for current entity and related entities (unity).
   * In most case store.load() is enought - it will reload store even if already loaded.
   * Return promise resolved to store itself then load is completed.
   * @param [options]
   * @returns {Promise<UBStore>}
   */
  reload: function (options) {
    if (options && options.callback) {
      throw new Error('UBStore.reload(callback) is OBSOLETE. Use Promise style: UBStore.reload().then(...)')
    }
    let me = this
    me.fireEvent('beforereload')

    me.loading = true
    me.indexByID = null
    return me.clearCache().then(function () {
      return me.load(options)
    })
  },

  clearProxyCache: function () {
    let proxy = this.getProxy()

    if (proxy) {
      delete proxy.totalRecCount
      delete proxy.data
    }
  },

  filter: function (filters, value) {
    if (this.isDestroyed) return
    this.clearProxyCache()
    try {
      /**
       * @private
       * @type {boolean}
       */
      this.throwLoadError = true
      this.callParent([filters, value])
    } finally {
      this.throwLoadError = false
    }
  },

  clearFilter: function () {
    if (this.isDestroyed) return
    this.clearProxyCache()
    this.callParent(arguments)
  },

  /**
   *
   * @param {Ext.data.Store} store
   * @param {Ext.data.Operation} operation
   * @return {Boolean}
   */
  onBeforeLoad: function (store, operation) {
    operation.ubRequest = this.ubRequest
    return true
  },

  /**
   * @param {Ext.data.Store} store
   * @param {Ext.data.Operation} operation
   * @return {Boolean}
   */
  onBeforePrefetch: function (store, operation) {
    operation.ubRequest = this.ubRequest
    return true
  },

  /**
   * @override
   * @param {Ext.data.Model|Ext.data.Model[]|Number|Number[]} records
   */
  remove: function (records) {
    let me = this
    me.clearCache().then(function () {
      if (!me.isDestroyed) { // when cache is clear user close form and store is destroyed
        // me.callParent([records]) is not right way to call callParent from callback
        // right way is below
        me.superclass.remove.call(me, records)
      }
    })
  },
  /**
   * @override
   * @param {Ext.data.Model[]} model
   * @param {Boolean} [saveCache] optional
   */
  add: function (model, saveCache) {
    let me = this
    if (saveCache) {
      return this.callParent(arguments)
    }
    // todo add method must return Ext.data.Model[]
    me.clearCache().then(function () {
      if (!me.isDestroyed) { // when cache is clear user close form and store is destroyed
        me.superclass.add.call(me, model)
      }
    })
  },

  /**
   * @cfg {Boolean} createIndexByID
   * If true will be created index by id. This index used in function getById. It will be created when first call getById method.
   * You should use it if will be often called method getById. For example in lookUp grid column.
   */

  /**
   * Get a Record with the specified id.
   *
   * @param {Number/Ext.data.Model} id The id of the Record to find.
   * @returns {Ext.data.Model}
   */
  getById: function (id) {
    let me = this
    if (id && id.getId) {
      id = id.getId()
    }
    if (!me.indexByID && me.createIndexByID) {
      me.indexByID = {}
      me.each(function (record) {
        me.indexByID[record.getId()] = record
      }, me)
    }
    if (me.indexByID) {
      return me.indexByID[id]
    } else {
      return me.callParent([id])
    }
  }

})

/* dirty hack to add implementation for method ClientRepository.prototype.selectAsStore */
UB.ClientRepository.prototype.selectAsStore = function (storeConfig) {
  storeConfig = storeConfig || {}
  storeConfig.ubRequest = this.ubql()
  return Ext.create('UB.ux.data.UBStore', storeConfig).load()
}
