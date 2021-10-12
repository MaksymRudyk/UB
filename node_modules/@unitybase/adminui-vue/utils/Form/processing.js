module.exports = createProcessingModule

const UB = require('@unitybase/ub-pub')
const uDialogs = require('../uDialogs')
const Vue = require('vue')
// eslint-disable-next-line no-unused-vars
const Vuex = require('vuex') // required to see a Vuex.d.ts
const { Notification: $notify } = require('element-ui')
const {
  buildExecParams,
  buildDeleteRequest,
  enrichFieldList,
  SET,
  isEmpty,
  change,
  prepareCopyAddNewExecParams
} = require('./helpers')

/**
 * @callback UbVuexStoreCollectionRequestBuilder
 * @param {Object} state
 * @param {UbVuexStoreCollectionInfo} collection
 * @param {Object} execParams
 * @param {Array<string>} fieldList
 * @param {VuexTrackedObject} item
 * @returns {Object}
 */

/**
 * @callback UbVuexStoreCollectionDeleteRequestBuilder
 * @param {Object} state
 * @param {UbVuexStoreCollectionInfo} collection
 * @param {VuexTrackedObject} item
 * @returns {Object}
 */

/**
 * @callback UbVuexStoreRepositoryBuilder
 * @param {Vuex} store
 * @returns {ClientRepository}
 */

/**
 * @typedef {object} UbVuexStoreCollectionInfo
 *
 * Metadata what describes a detail collection what edited on the form.
 *
 * @property {UbVuexStoreRepositoryBuilder} repository
 * @property {boolean} [lazy]
 *   An optional flag, indicating that collection shall not be loaded right away, but on demand
 * @property {UbVuexStoreCollectionRequestBuilder} buildRequest
 * @property {UbVuexStoreCollectionDeleteRequestBuilder} buildDeleteRequest
 */

/**
 * Create an unified object for tracking edited object state.
 *
 * The state consists of the following properties:
 * - data: it is an object with actual (to be shown on UI) data values, regardless if values are untouched by user
 *     or already edited.
 * - originalData: this object is initially empty, but as user starts editing, it is filled by original values, as
 *     they loaded from DB, so that it would be always possible to say if a certain attribute was changed or not.
 *     If after some editing, value returned to its original state, value is deleted from this object.
 *     When this object is has no attributes, we know there is nothing to save.
 * - collections: this is a property for complex object, objects which consist of one master record and collection or
 *     multiple collections of detail records.
 *     Each collection tracks added, changed and deleted items, so that we know if there is any change to save
 *     in the collection.
 *     Collection item is tracked just like the master record, using the same technique -
 *     "data" and "originalData" properties for item.  Item also has "isNew" property, indicating if item was added
 *     after original loading of collection or not.
 *     The "deleted"
 *
 * Also creates Vuex store object with basic processing actions:
 *  - isNew status for master record
 *  - list of pending loadings
 *  - master record entity information (name, fieldList, schema etc.)
 *  - canDelete, canSave, canRefresh getters
 *  - CRUD actions
 *
 * @param {string} masterEntityName Name of entity for master record
 * @param {array<string>} masterFieldList Master request fieldList. If unset will set all fields in an entity
 * @param {object<string, UbVuexStoreCollectionInfo|UbVuexStoreRepositoryBuilder>} initCollectionsRequests Collections requests map
 * @param {Validator} [validator] Validator
 * @param {number} instanceID instanceID
 * @param {Object} [parentContext] Optional values for main instance attributes passed to addNew method
 * @param {UBEntity} entitySchema Entity schema
 * @param {function} [beforeInit] Callback that emits before init
 * @param {function} [inited] Callback that emits when data is inited
 * @param {function} [beforeSave] Callback that emits before save
 * @param {function} [saved] Callback that emits when data was saved, receive a method name `insert/update` as a second argument
 * @param {function} [beforeDelete] Callback that emits before delete
 * @param {function} [deleted] Callback that emits when data was deleted
 * @param {function} [beforeCopy] Callback that emits before copy of existing record
 * @param {function} [copied] Callback that emits when data was copied from existing record
 * @param {function} [saveNotification] Callback that overrides default save notification
 * @param {function} [errorNotification] Callback that overrides default error notification
 * @param {boolean} [isCopy] Flag that used for create new record with data of existing record
 * @param {boolean} [isModal] Is parent opened from modal. Used to provide modal state to the child
 * @return {object} Vue store cfg
 */
function createProcessingModule ({
  entity: masterEntityName,
  fieldList,
  collections: initCollectionsRequests,
  validator,
  instanceID,
  parentContext,
  entitySchema,
  beforeInit,
  inited,
  beforeCreate,
  created,
  beforeLoad,
  loaded,
  beforeSave,
  saved,
  beforeDelete,
  deleted,
  beforeCopy,
  copied,
  saveNotification,
  errorNotification,
  isCopy,
  isModal
}) {
  const autoLoadedCollections = Object.entries(initCollectionsRequests)
    .filter(([, collData]) => !collData.lazy)
    .map(([coll]) => coll)

  const isLockable = function () { return entitySchema.hasMixin('softLock') }

  return {
    /**
     * @type {VuexTrackedInstance}
     */
    state: {
      /**
       * Whether master instance was loaded or it is newly created
       */
      isNew: false,
      /**
       * Properties as they are in DB.
       */
      data: {},

      /**
       * This contains old (originally loaded) values of updated properties.
       */
      originalData: {},

      /**
       * Detailed collections (if any)
       */
      collections: {},

      /**
       * result of previous lock() operation (in case softLock mixin assigned to entity)
       */
      lockInfo: {},

      /**
       * result of needAls misc operation (in case als mixin assigned to entity)
       */
      alsInfo: {},

      pendings: [],

      /**
       * Whether master instance was copy of existing record
       */
      isCopy,

      isModal
    },

    getters: {
      /**
       * @param {VuexTrackedInstance} state
       * @return {boolean}
       */
      isDirty (state) {
        if (!isEmpty(state.originalData)) {
          return true
        }
        for (const collection of Object.values(state.collections)) {
          if (collection.deleted.length) {
            return true
          }
          for (const item of collection.items) {
            if (item.isNew || !isEmpty(item.originalData)) {
              return true
            }
          }
        }
        return false
      },
      /**
       * loading status
       * @return {Boolean}
       */
      loading (state) {
        return state.pendings.length > 0
      },

      canDelete (state) {
        return !state.isNew && entitySchema.haveAccessToMethod('delete')
      },

      canSave (state, getters) {
        return (getters.isDirty || state.isCopy) && entitySchema.haveAccessToAnyMethods(['insert', 'update'])
      },

      canRefresh (state, getters) {
        return !state.isNew
      },

      isLocked (state) {
        return !!state.lockInfo.lockExists
      },

      isLockedByMe (state) {
        return state.lockInfo.lockExists && (state.lockInfo.lockUser === UB.connection.userLogin())
      },

      lockInfoMessage (state) {
        if (!state.lockInfo.lockExists) {
          return UB.i18n('recordNotLocked')
        } else if ((state.lockInfo.lockUser === UB.connection.userLogin())) {
          if (state.lockInfo.lockType === 'Temp') {
            return UB.i18n('recordLockedThisUserByTempLock')
          } else {
            return UB.i18n('entityLockedOwn')
          }
        } else { // locked by another user
          if (state.lockInfo.lockType === 'Temp') {
            return UB.i18n('tempSoftLockInfo', state.lockInfo.lockUser)
          } else {
            return UB.i18n('softLockInfo', state.lockInfo.lockUser, UB.formatter.formatDate(state.lockInfo.lockTime, 'dateTimeFull'))
          }
        }
      }
    },

    mutations: {
      SET,

      /**
       * Load initial state of tracked master entity, all at once.
       * @param {VuexTrackedInstance} state
       * @param {object} loadedState
       */
      LOAD_DATA (state, loadedState) {
        if (!loadedState) {
          throw new UB.UBAbortError('documentNotFound')
        }
        state.data = loadedState
        Vue.set(state, 'originalData', {})
      },

      /**
       * After insert, update or other server calls, which update entity, need to inform module about new server state.
       * @param {VuexTrackedInstance} state
       * @param {object} loadedState
       */
      LOAD_DATA_PARTIAL (state, loadedState) {
        for (const [key, value] of Object.entries(loadedState)) {
          change(state, key, value)
          Vue.delete(state.originalData, key)
        }
      },

      /**
       * Update value of attribute for master record or a record of a details collection item.
       * The mutation uses "data" and "originalData" object to correctly track object state.
       *
       * @param {VuexTrackedInstance} state
       * @param {object} payload
       * @param {string} [payload.collection]  Name of collection, optional
       * @param {number} [payload.index]       Index of item, optional, shall only be specified, if collection is specified.
       * @param {string} payload.key           Key of changed attribute
       * @param {string} [payload.path]        Path (for JSON attributes) of the value
       * @param {*}      payload.value         Value attribute is changed to.
       */
      SET_DATA (state, { collection, index, key, value, path }) {
        if (typeof collection !== 'string') {
          // Change the Master record
          change(state, key, value, path)
          return
        }

        // Item of a detail collection
        if (!(collection in state.collections)) {
          throw new Error(`Collection "${collection}" was not loaded or created!`)
        }
        const collectionInstance = state.collections[collection]
        if (!(index in collectionInstance.items)) {
          throw new Error(`Collection "${collection}" does not have index: ${index}!`)
        }
        change(collectionInstance.items[index], key, value, path)
      },

      /**
       * Just like "SET_DATA", but assign multiple values at once passed as an object.
       * @param {VuexTrackedInstance} state
       * @param {object} payload
       * @param {object} [payload.collection] optional collection (if not passed update master store)
       * @param {object} [payload.index] optional collection item index. required in case collection is passed
       * @param {object} payload.loadedState
       */
      ASSIGN_DATA (state, { collection, index, loadedState }) {
        let stateToChange
        if (collection) {
          if (!(collection in state.collections)) {
            throw new Error(`Collection "${collection}" was not loaded or created!`)
          }
          const collectionInstance = state.collections[collection]
          if (!(index in collectionInstance.items)) {
            throw new Error(`Collection "${collection}" does not have index: ${index}!`)
          }
          stateToChange = collectionInstance.items[index]
        } else {
          stateToChange = state
        }

        for (const [key, value] of Object.entries(loadedState)) {
          change(stateToChange, key, value)
        }
      },

      /**
       * Set original state of collection items
       * @param {VuexTrackedInstance} state
       * @param {object} payload
       * @param {string} payload.collection
       * @param {VuexTrackedObject[]} payload.items
       * @param {string} payload.entity
       */
      LOAD_COLLECTION (state, { collection, items: itemStates, entity }) {
        if (!itemStates) {
          throw new UB.UBAbortError('documentNotFound')
        }
        const items = itemStates.map(item => ({
          data: item,
          originalData: {}
        }))
        const collectionObj = { items, deleted: [], key: collection, entity }
        Vue.set(state.collections, collection, collectionObj)
      },

      /**
       * Update collection data.
       * Removed originalData for props which updated
       * Remove isNew status.
       * @param {VuexTrackedInstance} state
       * @param {object} payload
       * @param {string} payload.collection  collection
       * @param {number} payload.index       index in collection
       * @param {object} payload.loadedState loaded state
       */
      LOAD_COLLECTION_PARTIAL (state, { collection, index, loadedState }) {
        const collectionInstance = state.collections[collection]

        for (const [key, value] of Object.entries(loadedState)) {
          change(collectionInstance.items[index], key, value)
          Vue.delete(collectionInstance.items[index].originalData, key)
          collectionInstance.items[index].isNew = false
        }
      },

      /**
       * Add a new item to a collection. Added item is marked as "isNew".
       * @param {VuexTrackedInstance} state
       * @param {object} payload
       * @param {string} payload.collection Collection name
       * @param {object} payload.item       Item state (a regular JS object)
       */
      ADD_COLLECTION_ITEM (state, { collection, item: itemState }) {
        if (!(collection in state.collections)) {
          // Lazy create collection
          Vue.set(state.collections, collection, { items: [], deleted: [] })
        }
        state.collections[collection].items.push({ data: itemState, originalData: {}, isNew: true })
      },

      /**
       * Remove an item from a collection.
       * If remove an added item, no need to track the deletion.
       * If remove originally loaded record, remember the
       * deletion to track it as a change.
       * @param {VuexTrackedInstance} state
       * @param {object} payload
       * @param {string} payload.collection  Collection name
       * @param {number} payload.index       Index of item inside a collection to remove
       */
      DELETE_COLLECTION_ITEM (state, { collection, index }) {
        if (collection in state.collections) {
          const removedItem = state.collections[collection].items.splice(index, 1)[0]
          if (removedItem && !removedItem.isNew) {
            state.collections[collection].deleted.push(removedItem)
          }
        }
      },

      /**
       * Remove an item from a collection and do NOT track its deletion.
       * Could be useful for entities deleted by cascade
       * @param {VuexTrackedInstance} state
       * @param {object} payload
       * @param {string} payload.collection  Collection name
       * @param {number} payload.index       Index of item inside a collection to remove
       */
      DELETE_COLLECTION_ITEM_WITHOUT_TRACKING (state, { collection, index }) {
        if (collection in state.collections) {
          state.collections[collection].items.splice(index, 1)
        }
      },

      /**
       * Clear deleted items in all collections, after sending removal requests
       * @param {VuexTrackedInstance} state
       */
      CLEAR_ALL_DELETED_ITEMS (state) {
        for (const collection of Object.keys(state.collections)) {
          Vue.set(state.collections[collection], 'deleted', [])
        }
      },

      /**
       * Remove all items from a collection.
       * If remove an added item, no need to track the deletion.
       * If remove originally loaded record, remember the
       * deletion to track it as a change.
       * @param state
       * @param {string} collectionName Name of collection
       */
      DELETE_ALL_COLLECTION_ITEMS (state, collectionName) {
        if (collectionName in state.collections) {
          const collection = state.collections[collectionName]
          const deleted = collection.items
            .splice(0, collection.items.length)
            .filter(i => !i.isNew)
          collection.deleted.push(...deleted)
        }
      },

      /**
       * Set "IsNew" flag for the master record.
       * @param {Vuex.state} state
       * @param {boolean} isNew
       */
      IS_NEW (state, isNew) {
        state.isNew = isNew
      },

      /**
       * Set "IsCopy" flag.
       * @param {Vuex.state} state
       * @param {boolean} isCopy
       */
      IS_COPY (state, isCopy) {
        state.isCopy = isCopy
      },

      /**
       * add or delete loading pending for some action
       * @param {object} state
       * @param {object}  payload
       * @param {Boolean} payload.isLoading  add/remove action from pending
       * @param {String}  payload.target     name of pending action
       */
      LOADING (state, { isLoading, target }) {
        const index = state.pendings.indexOf(target)
        if (isLoading) {
          if (index === -1) {
            state.pendings.push(target)
          }
        } else {
          if (index !== -1) {
            state.pendings.splice(index, 1)
          }
        }
      },

      /**
       * add info about als to store state
       * @param {object} state
       * @param {object} resultAls - result of `alsNeed` misc in repository
       */
      SET_ALS_INFO (state, resultAls) {
        state.alsInfo = resultAls
      }
    },

    actions: {
      /**
       * Initialize store:
       *  - sets isNew
       *  - creates empty collections which passed on init processing module
       *  - dispatch `create` or `load` action
       * @param {Vuex.Store} store
       */
      async init (store) {
        for (const [key, collection] of Object.entries(initCollectionsRequests)) {
          store.commit('LOAD_COLLECTION', {
            collection: key,
            items: [],
            entity: collection.repository(store).entityName
          })
        }
        if (beforeInit) {
          await beforeInit(store)
        }
        store.commit('IS_NEW', !instanceID || store.state.isCopy)

        if (store.state.isCopy) {
          await store.dispatch('copyExisting')
        } else if (store.state.isNew) {
          await store.dispatch('create')
        } else {
          await store.dispatch('loadWithCollections', {
            collectionKeys: autoLoadedCollections
          })
        }
        if (inited) {
          await inited(store)
        }
      },

      /**
       * Send add new request and load to instance props
       * that are response by the server
       * @param {Vuex.Store} store
       */
      async create ({ commit }) {
        if (beforeCreate) {
          await beforeCreate()
        }
        commit('LOADING', {
          isLoading: true,
          target: 'create'
        })

        const data = await UB.connection.addNewAsObject({
          entity: masterEntityName,
          fieldList,
          execParams: parentContext
        })
        commit('LOAD_DATA', data)
        if (created) {
          await created()
        }
        commit('LOADING', {
          isLoading: false,
          target: 'create'
        })
      },

      /**
       * Load instance data by record ID or newInstanceID in case this record is just created
       *
       * @param {Vuex.Store} store
       * @param {number} [newInstanceID] optional row id to load. If omitted instanceID will be used
       */
      async load ({ commit }, newInstanceID) {
        commit('LOADING', {
          isLoading: true,
          target: 'loadMaster'
        })

        const repo = UB.connection
          .Repository(masterEntityName)
          .attrs(fieldList)
          .misc({ ID: instanceID || newInstanceID }) // Add top level ID to bypass caching, soft deletion and history

          .miscIf(isLockable(), { lockType: 'None' }) // get lock info
          .miscIf(entitySchema.hasMixin('als'), { alsNeed: true }) // get als info
        const data = await repo.selectById(instanceID || newInstanceID)

        commit('LOAD_DATA', data)

        if (isLockable()) {
          const rl = repo.rawResult.resultLock
          commit('SET', { // TODO - create mutation SET_LOCK_RESULT
            key: 'lockInfo',
            value: rl.success
              ? rl.lockInfo
              : { // normalize response - ub api is ugly here
                  lockExists: true,
                  lockType: rl.lockType,
                  lockUser: rl.lockUser,
                  lockTime: rl.lockTime,
                  lockValue: rl.lockInfo.lockValue
                }
          })
        }

        if (entitySchema.hasMixin('als')) {
          commit('SET_ALS_INFO', repo.rawResult.resultAls)
        }

        commit('LOADING', {
          isLoading: false,
          target: 'loadMaster'
        })
      },

      /**
       * Check if record not new
       * then check if collections inited when processing module is created
       * then fetch data from server for each collection
       *
       * @param {Vuex.Store} store
       * @param {string[]} collectionKeys Collections keys
       */
      async loadCollections (store, collectionKeys) {
        if (store.state.isNew) {
          return
        }
        for (const key of collectionKeys) {
          const inCollection = key in initCollectionsRequests
          if (!inCollection) {
            console.error(`${key} not included in the collections, please check initCollectionsRequests param`)
            return
          }
        }
        store.commit('LOADING', {
          isLoading: true,
          target: 'loadCollections'
        })

        const collectionsData = await Promise.all(
          collectionKeys.map(key => {
            const req = initCollectionsRequests[key].repository(store)
            req.fieldList = enrichFieldList(
              UB.connection.domain.get(req.entityName),
              req.fieldList,
              ['ID', 'mi_modifyDate', 'mi_createDate']
            )
            return req.select()
          })
        )
        collectionsData.forEach((collectionData, index) => {
          const collection = collectionKeys[index]
          store.commit('LOAD_COLLECTION', {
            collection,
            items: collectionData,
            entity: initCollectionsRequests[collection].repository(store).entityName
          })
        })
        store.commit('LOADING', {
          isLoading: false,
          target: 'loadCollections'
        })
      },

      /**
       * Load instance data by record ID or newInstanceID and load collections by collectionKeys
       *
       * @param {Vuex.Store} store
       * @param {object} payload
       * @param {object} payload.collectionKeys Collections keys
       * @param {string} [payload.newInstanceID] optional row id to load. If omitted instanceID will be used
       */
      async loadWithCollections ({ dispatch }, payload) {
        const { collectionKeys, newInstanceID } = payload

        if (beforeLoad) {
          await beforeLoad()
        }

        await dispatch('load', newInstanceID)
        await dispatch('loadCollections', collectionKeys)

        if (loaded) {
          await loaded()
        }
      },

      /**
       * Create copy of master record and all collections
       *
       * @param {Vuex.Store} store
       * @returns {Promise<void>}
       */
      async copyExisting (store) {
        const collections = Object.keys(initCollectionsRequests)

        store.commit('LOADING', {
          isLoading: true,
          target: 'createCopy'
        })
        if (beforeCopy) {
          await beforeCopy()
        }

        // load master record
        const copiedRecord = await UB.connection
          .Repository(masterEntityName)
          .attrs(
            fieldList
              .filter(attrCode => {
                // exclude UB attributes with dataType 'Document'
                const attr = entitySchema.getEntityAttribute(attrCode)
                if (attr) {
                  return attr.dataType !== UB.connection.domain.ubDataTypes.Document
                }

                return true
              })
          )
          .selectById(instanceID)
        store.commit('LOAD_DATA', copiedRecord) // need for load collections because collections maps to data of master record

        // load collections
        const collectionsResponse = await Promise.all(
          collections.map(collectionKey => {
            const collectionDefinition = initCollectionsRequests[collectionKey]
            const req = collectionDefinition.repository(store)
            req.fieldList = enrichFieldList(
              UB.connection.domain.get(req.entityName),
              req.fieldList,
              ['ID', 'mi_modifyDate', 'mi_createDate']
            )
            return req.select()
          })
        )

        const newRecord = await UB.connection.addNewAsObject({
          entity: masterEntityName,
          fieldList,
          execParams: prepareCopyAddNewExecParams(copiedRecord, masterEntityName)
        })
        store.commit('LOAD_DATA', newRecord)

        await Promise.all(
          collectionsResponse.flatMap((collectionData, index) => {
            const collection = collections[index]
            const collectionDefinition = initCollectionsRequests[collection]
            const entityName = collectionDefinition.repository(store).entityName

            return collectionData.map(collectionItem => {
              // get attributes that point to the master entity record
              UB.connection.domain.get(entityName)
                .eachAttribute(attr => {
                  if ((attr.associatedEntity === masterEntityName) &&
                     (collectionItem[attr.code] === copiedRecord.ID)) {
                    // replace associated attributes for current entity
                    collectionItem[attr.code] = newRecord.ID
                  }
                })
              delete collectionItem.ID
              return store.dispatch('addCollectionItem', {
                collection,
                execParams: collectionItem
              })
            })
          })
        )

        if (copied) {
          await copied()
        }
        store.commit('LOADING', {
          isLoading: false,
          target: 'createCopy'
        })
      },

      /**
       * Check validation then
       * build requests for master and collections records
       *
       * @param {Vuex.Store} store
       * @param {function} [closeForm]
       *   For using action in the "Save and Close" actions, pass the function, which will close the form
       * @returns {Promise<void>}
       */
      async save (store, closeForm) {
        if (beforeSave) {
          const answer = await beforeSave()
          if (answer === false) {
            return -1
          }
        }

        if (validator()) {
          validator().validateForm()
        }

        store.commit('LOADING', {
          isLoading: true,
          target: 'save'
        })

        const requests = []
        const responseHandlers = []

        const masterExecParams = buildExecParams(store.state, masterEntityName)
        const method = store.state.isNew ? 'insert' : 'update'
        if (masterExecParams) {
          requests.push({
            entity: masterEntityName,
            method: method,
            execParams: masterExecParams,
            fieldList
          })
          responseHandlers.push(response => store.commit('LOAD_DATA', response.resultData))
        }

        for (const [collectionKey, collectionInfo] of Object.entries(initCollectionsRequests)) {
          const collection = store.state.collections[collectionKey]
          if (!collection) continue

          const req = collectionInfo.repository(store)
          const collectionEntityName = req.entityName

          for (const deletedItem of collection.deleted || []) {
            const request = typeof collectionInfo.buildDeleteRequest === 'function'
              ? collectionInfo.buildDeleteRequest({ ...store, collection, item: deletedItem })
              : buildDeleteRequest(collectionEntityName, deletedItem.data.ID)
            requests.push(request)

            // Deleted items are cleared all at once using CLEAR_ALL_DELETED_ITEMS mutation
            responseHandlers.push(() => {})
          }

          const collectionFieldList = enrichFieldList(
            UB.connection.domain.get(collectionEntityName),
            req.fieldList,
            ['ID', 'mi_modifyDate', 'mi_createDate']
          )

          for (const item of collection.items || []) {
            const execParams = buildExecParams(item, collectionEntityName)
            if (execParams) {
              const request = typeof collectionInfo.buildRequest === 'function'
                ? collectionInfo.buildRequest({ ...store, collection, execParams, fieldList: collectionFieldList, item })
                : {
                    entity: collectionEntityName,
                    method: item.isNew ? 'insert' : 'update',
                    execParams,
                    fieldList: collectionFieldList
                  }
              requests.push(request)

              responseHandlers.push(response => {
                const loadedState = response.resultData
                if (loadedState) {
                  if (typeof collectionInfo.handleResponse === 'function') {
                    collectionInfo.handleResponse({ ...store, collection, response })
                  } else if (Number.isInteger(loadedState.ID)) {
                    const index = collection.items.findIndex(i => i.data.ID === loadedState.ID)
                    if (index !== -1) {
                      store.commit('LOAD_COLLECTION_PARTIAL', {
                        collection: collectionKey,
                        index,
                        loadedState
                      })
                    }
                  }
                }
              })
            }
          }
        }

        try {
          const responses = await UB.connection.runTransAsObject(requests)
          for (let i = 0, count = Math.min(responses.length, responseHandlers.length); i < count; i++) {
            const response = responses[i]
            const responseHandler = responseHandlers[i]
            responseHandler(response)
          }

          store.commit('CLEAR_ALL_DELETED_ITEMS')

          for (const response of responses) {
            UB.connection.emitEntityChanged(response.entity, response)
          }

          if (store.state.isNew) {
            store.commit('IS_NEW', false)
          }
          if (store.state.isCopy) {
            store.commit('IS_COPY', false)
          }
          if (typeof saveNotification === 'function') {
            saveNotification()
          } else {
            $notify.success(UB.i18n('successfullySaved'))
          }
          if (saved) {
            await saved(method)
          }

          if (closeForm) {
            closeForm()
          }
        } catch (err) {
          if (typeof errorNotification === 'function') {
            errorNotification(err)
          } else {
            UB.showErrorWindow(err)
            throw new UB.UBAbortError(err)
          }
        } finally {
          store.commit('LOADING', {
            isLoading: false,
            target: 'save'
          })
        }
      },

      /**
       * Send reload request for master record and all collections record that already loaded by `loadCollections` action
       *
       * In case form dirty - show confirmation dialog for loosing changes
       * @fires entity_name:refresh
       */
      async refresh ({ state, getters, commit, dispatch }) {
        if (getters.isDirty) {
          const result = await uDialogs.dialogYesNo('refresh', 'formWasChanged')

          if (!result) return
        }
        commit('LOADING', {
          isLoading: true,
          target: 'master'
        })
        await dispatch('loadWithCollections', {
          newInstanceID: state.data.ID,
          collectionKeys: Object.keys(state.collections)
        })
        commit('LOADING', {
          isLoading: false,
          target: 'master'
        })

        if (validator()) {
          validator().reset()
        }

        /**
         * Fires just after form is refreshed using `processing.refresh()`
          * @example

// @param {THTTPRequest} req
UB.connection.on('uba_user:refresh', function (data) {
  console.log(`Someone call refresh for User with ID ${data.ID}`
})

         * @event entity_name:refresh
         * @memberOf module:@unitybase/ub-pub.module:AsyncConnection~UBConnection
         * @param {object} payload
         * @param {number} payload.ID and ID of entity_name instance what refreshed
         */
        UB.connection.emit(`${masterEntityName}:refresh`, { ID: state.data.ID })

        $notify.success(UB.i18n('formWasRefreshed'))
      },

      /**
       * Asks for user confirmation and sends delete request for master record
       *
       * @param {Vuex.Store} store
       * @param  {Function} closeForm Close form without confirmation
       */
      async deleteInstance ({ state, getters, commit }, closeForm = () => {}) {
        if (beforeDelete) {
          const answer = await beforeDelete()
          if (answer === false) {
            return
          }
        }
        const answer = await uDialogs.dialogDeleteRecord(masterEntityName, state.data)

        if (answer) {
          commit('LOADING', {
            isLoading: true,
            target: 'delete'
          })
          try {
            await UB.connection.doDelete({
              entity: masterEntityName,
              execParams: { ID: state.data.ID }
            })
            UB.connection.emitEntityChanged(masterEntityName, {
              entity: masterEntityName,
              method: 'delete',
              resultData: { ID: state.data.ID }
            })

            closeForm()

            $notify.success(UB.i18n('recordDeletedSuccessfully'))
            if (deleted) {
              await deleted()
            }
          } catch (err) {
            UB.showErrorWindow(err)
          } finally {
            commit('LOADING', {
              isLoading: false,
              target: 'delete'
            })
          }
        }
      },

      /**
       * Sends addNew request then fetch default params and push it in collection
       *
       * @param {Vuex.Store} store
       * @param {object} payload
       * @param {string} payload.collection Collection name
       * @param {object} payload.execParams if we need to create new item with specified params
       */
      async addCollectionItem (store, { collection, execParams }) {
        const repo = initCollectionsRequests[collection].repository(store)
        const entity = repo.entityName
        const fieldList = repo.fieldList
        const item = await UB.connection.addNewAsObject({
          entity,
          fieldList,
          execParams
        })

        store.commit('ADD_COLLECTION_ITEM', { collection, item })
      },

      /**
       * Sends addNew request without fetching default params and push it in collection
       *
       * @param {Store} store
       * @param {object} payload
       * @param {string} payload.collection Collection name
       * @param {object} payload.execParams if we need to create new item with specified params
       */
      async addCollectionItemWithoutDefaultValues (store, { collection, execParams }) {
        const { commit } = store
        const repo = initCollectionsRequests[collection].repository(store)
        const entity = repo.entityName
        const { ID } = await UB.connection.addNewAsObject({
          entity,
          fieldList: ['ID']
        })

        commit('ADD_COLLECTION_ITEM', { collection, item: { ID, ...execParams } })
      },

      /**
       * Lock entity. Applicable for entities with "softLock" mixin
       * @param {Vuex.Store} store
       * @param {boolean} [persistentLock=false] Lock with persistent locking type
       * @return {Promise<void>}
       */
      lockEntity ({ state, commit }, persistentLock = false) {
        return UB.connection.query({
          entity: masterEntityName,
          method: 'lock',
          lockType: persistentLock ? 'Persist' : 'Temp',
          ID: state.data.ID
        }).then(resp => {
          const resultLock = resp.resultLock
          if (resultLock.success) {
            commit('SET', { // TODO - create mutation SET_LOCK_RESULT
              key: 'lockInfo',
              value: { ...resultLock.lockInfo, ownLock: resultLock.ownLock }
            })
            $notify.success(UB.i18n('lockSuccessCreated'))
          } else {
            return uDialogs.dialogError(UB.i18n('softLockInfo', resultLock.lockUser, UB.formatter.formatDate(resultLock.lockTime, 'dateTimeFull')))
          }
        }).catch(e => {
          UB.showErrorWindow(e)
        })
      },

      /**
       * Unlock entity. Applicable for entities with "softLock" mixin
       * @param {Vuex.Store} store
       * @return {Promise<void>}
       */
      unlockEntity ({ state, commit }) {
        return UB.connection.query({
          entity: masterEntityName,
          method: 'unlock',
          lockType: state.lockInfo.lockType,
          lockID: state.lockInfo.lockValue // MPV - why not lockID ?
        }).then(resp => {
          if (resp.resultLock.success) {
            commit('SET', { // TODO - create mutation SET_LOCK_RESULT
              key: 'lockInfo',
              value: {}
            })
            $notify.success(UB.i18n('lockSuccessDeleted'))
          }
        }).catch(e => {
          UB.showErrorWindow(e)
        })
      },

      /**
       * Get lock information. Applicable for entities with "softLock" mixin
       * @param {Vuex.Store} store
       * @return {Promise<void>}
       */
      retrieveLockInfo ({ state, commit }) {
        return UB.connection.query({
          entity: masterEntityName,
          method: 'isLocked',
          ID: state.data.ID
        }).then(resp => {
          commit('SET', { // TODO - create mutation SET_LOCK_RESULT
            key: 'lockInfo',
            value: resp.lockInfo.isLocked ? resp.lockInfo : {}
          })
        }).catch(e => {
          UB.showErrorWindow(e)
        })
      }
    }
  }
}
