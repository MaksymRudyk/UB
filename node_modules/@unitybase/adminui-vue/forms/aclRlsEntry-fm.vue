<template>
  <div class="u-form-layout">
    <u-toolbar :show-dropdown="false" />

    <u-form-container
      v-loading="loading"
      label-position="top"
    >
      <u-form-row
        label="aclRlsInfo.subject"
        class="u-acl-rls-input-overflow"
      >
        <el-select
          v-model="selectedEntity"
          class="u-select"
        >
          <el-option
            v-for="{ associatedEntity } in aclAttributes"
            :key="associatedEntity"
            :value="associatedEntity"
            :label="$ut(associatedEntity)"
          />
        </el-select>
      </u-form-row>

      <template v-if="selectedEntity">
        <u-form-row
          v-if="mappedEntitiesBySelectedEntity.length === 0"
          :label="selectedEntity"
          class="u-acl-rls-input-overflow"
        >
          <u-select-multiple
            v-model="aclRlsEntries[selectedEntity]"
            :repository="getRepoForSelectionByEntity(selectedEntity)"
            clearable
          />
        </u-form-row>

        <template v-else>
          <u-form-row
            v-for="childEntity in mappedEntitiesBySelectedEntity"
            :key="childEntity"
            :label="childEntity"
            class="u-acl-rls-input-overflow"
          >
            <u-select-multiple
              v-model="aclRlsEntries[selectedEntity][childEntity]"
              :repository="getRepoForSelectionByEntity(selectedEntity, childEntity)"
              clearable
            />
          </u-form-row>
        </template>
      </template>
    </u-form-container>
  </div>
</template>

<script>
const { Form } = require('@unitybase/adminui-vue')
const { Repository, connection } = require('@unitybase/ub-pub')
const { mapMutations, mapActions, mapGetters } = require('vuex')
const { UBDomain } = require('@unitybase/cs-shared')
const _ = require('lodash')

const ACL_RLS_COLLECTION = 'aclRlsEntries'

/**
 * The form loads entry of master entity for which user configures aclRls access.
 * This entry NEVER be changed and updated. AclRls entries are loaded and managed
 * as a collection since the user can add several items from the one form
 */
module.exports.mount = cfg => {
  const { aclEntityName, aclAttributes, instanceID } = cfg.props

  Form(cfg)
    .store({
      getters: {
        canDelete () {
          return false
        }
      }
    })
    .processing({
      masterFieldList: ['ID'], // not load all attributes to not overload server

      collections: {
        [ACL_RLS_COLLECTION] () {
          return Repository(aclEntityName)
            .attrs('ID', 'instanceID', aclAttributes.map(attr => attr.code))
            .where('instanceID', '=', instanceID)
        }
      }
    })
    .mount()
}

export default {
  name: 'AclRlsEntry',

  props: {
    /** @type {UBEntityAttribute[]} */
    aclAttributes: {
      type: Array,
      required: true
    },

    instanceID: {
      type: Number,
      required: true
    }
  },

  data () {
    return {
      selectedEntity: null,
      aclRlsEntries: null
    }
  },

  computed: {
    ...mapGetters([
      'loading'
    ]),

    collectionItems () {
      return this.$store.state.collections[ACL_RLS_COLLECTION].items.map(item => item.data)
    },

    mappedEntitiesForAclAttrs () {
      return Object.fromEntries(
        this.aclAttributes.map(({ associatedEntity }) => {
          return [associatedEntity, this.getSortedMappedEntities(associatedEntity)]
        })
      )
    },

    mappedEntitiesBySelectedEntity () {
      return this.mappedEntitiesForAclAttrs[this.selectedEntity] ?? []
    },

    aclRlsEntriesKey () {
      return JSON.stringify(this.aclRlsEntries)
    }
  },

  watch: {
    selectedEntity: 'resetSelectedItems',

    aclRlsEntriesKey (value, prevValue) {
      if (prevValue !== 'null') {
        this.syncAclRlsEntriesWithCollection(value, prevValue)
      }
    }
  },

  mounted () {
    this.selectedEntity = this.aclAttributes[0].associatedEntity
  },

  methods: {
    ...mapMutations([
      'DELETE_COLLECTION_ITEM_WITHOUT_TRACKING'
    ]),

    ...mapActions([
      'addCollectionItemWithoutDefaultValues'
    ]),

    getSortedMappedEntities (unityEntity) {
      const entities = connection.domain
        .filterEntities(entityDef => entityDef.mixin('unity')?.entity === unityEntity)
        .map(entityDef => entityDef.code)

      const getUnityDefaults = entity => connection.domain.get(entity).mixin('unity').defaults
      const getUnityDefaultsKey = entity => Object.keys(getUnityDefaults(entity))
      const arraysIntersaction = (a1, a2) => a1.filter(key => a2.includes(key))

      let commonAttributes = getUnityDefaultsKey(entities[0])
      for (let i = 1; i < entities.length; i++) {
        commonAttributes = arraysIntersaction(commonAttributes, getUnityDefaultsKey(entities[i]))
      }

      if (commonAttributes.length !== 1) {
        throw new Error(
          'You should define only one default value that will be mapped to the unity entity as it defines an order for displaying in UI'
        )
      }

      // set order of controls for unity entities based on values of ONE common attribute
      const [orderAttrName] = commonAttributes

      const orderAttrDef = connection.domain.get(unityEntity).attributes[orderAttrName]
      const isEnumDataType = orderAttrDef.dataType === UBDomain.ubDataTypes.Enum

      if (isEnumDataType) { // compare by sortOrder of enums
        const valuesOrder = this.$lookups.getEnumItems(orderAttrDef.enumGroup).map(item => item.code)
        return _.sortBy(entities, [entity => {
          const sortValue = getUnityDefaults(entity)[orderAttrName]
          return valuesOrder.indexOf(sortValue)
        }])
      } else { // compare by chars
        return _.sortBy(entities, [entity => getUnityDefaults(entity)[orderAttrName]])
      }
    },

    resetSelectedItems () {
      this.aclRlsEntries = Object.fromEntries(
        this.aclAttributes.map(attr => {
          const mappedEntities = this.mappedEntitiesForAclAttrs[attr.associatedEntity]
          const defaultValue = mappedEntities.length > 0
            ? Object.fromEntries(mappedEntities.map(entity => [entity, []]))
            : []
          return [attr.associatedEntity, defaultValue]
        })
      )
    },

    /**
     * @param {object} params
     * @param {object[]} [params.source] array of aclRls entries
     * @param {object[]} params.unityEntity associated entity for acl attribute, values of which we want to load
     * @param {object[]} [params.entity] subentity if the associtaed entity is a unity for several ones
     * @returns {number[]}
     */
    pickAclAttributeValues ({
      source = this.aclRlsEntries,
      unityEntity,
      entity
    }) {
      const selectedSource = source[unityEntity]

      if (entity) {
        return selectedSource[entity]
      }

      return Array.isArray(selectedSource)
        ? selectedSource
        : Object.values(selectedSource).flat()
    },

    getRepoForSelectionByEntity (unityEntity, entity) {
      const repoEntityName = entity || unityEntity
      const descriptionAttribute = connection.domain.get(repoEntityName).getDescriptionAttribute()

      const selectedIds = this.pickAclAttributeValues({ unityEntity, entity })
      const attrDef = this.aclAttributes.find(attr => attr.associatedEntity === unityEntity)
      const collectionIds = this.collectionItems.map(item => item[attrDef.code]).filter(Boolean)
      const allSelectedIds = [...selectedIds, ...collectionIds]

      const repo = Repository(repoEntityName)
        .attrs('ID', descriptionAttribute)
        // not show in the select control already selected items
        .whereIf(allSelectedIds.length > 0, 'ID', 'notIn', allSelectedIds)

      return () => repo
    },

    async syncAclRlsEntriesWithCollection (value, prevValue) {
      const promises = []

      for (const aclAttr of this.aclAttributes) {
        const unityEntity = aclAttr.associatedEntity
        const currentIds = this.pickAclAttributeValues({ source: JSON.parse(value), unityEntity })
        const prevIds = this.pickAclAttributeValues({ source: JSON.parse(prevValue), unityEntity })

        const newIds = currentIds.filter(id => !prevIds.includes(id))
        for (const valueID of newIds) {
          promises.push(
            this.addCollectionItemWithoutDefaultValues({
              collection: ACL_RLS_COLLECTION,
              execParams: {
                [aclAttr.code]: valueID,
                instanceID: this.instanceID
              }
            })
          )
        }

        const removedIds = prevIds.filter(id => !currentIds.includes(id))

        // iterate from the end to not mix indexes if we should delete several items
        for (const [index, item] of [...this.collectionItems.entries()].reverse()) {
          if (removedIds.includes(item[aclAttr.code])) {
            this.DELETE_COLLECTION_ITEM_WITHOUT_TRACKING({
              collection: ACL_RLS_COLLECTION,
              index
            })
          }
        }
      }

      await Promise.all(promises)
    }
  }
}
</script>
