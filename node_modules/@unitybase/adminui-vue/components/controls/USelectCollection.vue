<template>
  <u-select-multiple
    :value="selectedRecords"
    :entity-name="associatedEntity"
    :disabled="disabled"
    :clearable="clearable"
    :placeholder="placeholder"
    :readonly="readonly"
    :fixed-items="fixedItems"
    @input="changeCollection"
    @focus="onFocus"
    @blur="onBlur"
  />
</template>

<script>
const { mapMutations, mapActions } = require('vuex')

/**
 * Display a collection of a details from master-detail relation inside a multiselect.
 * Acts like a control for "Many" data type, but can be bound to any detailed entity.
 */
export default {
  name: 'USelectCollection',
  inject: {
    masterEntityName: 'entity'
  },

  props: {
    /**
     * Associated attribute.
     * Attribute in the target entity for which the collection record is associated with the master record
     */
    associatedAttr: {
      type: String,
      required: true
    },

    /**
     * Name of key what you set in collectionRequests object
     */
    collectionName: {
      type: String,
      required: true
    },

    /**
     * Set disable status
     */
    disabled: Boolean,

    /**
     * Add clear icon
     */
    clearable: Boolean,
    /**
     * Input placeholder.
     */
    placeholder: {
      type: String,
      default: ''
    },
    /**
     * Set readonly status
     */
    readonly: Boolean,
    /**
     * An array with IDs of elements that unable to remove
     */
    fixedItems: {
      type: Array,
      default: () => []
    }
  },

  data () {
    return {
      isPending: false
    }
  },

  computed: {
    collectionData () {
      return this.$store.state.collections[this.collectionName]
    },

    entityName () {
      return this.collectionData.entity
    },

    entitySchema () {
      return this.$UB.connection.domain.get(this.entityName)
    },

    selectedRecords () {
      return this.collectionData.items
        .map(i => i.data[this.associatedAttr])
    },

    objectIDName () {
      return this.entitySchema.filterAttribute(a => a.associatedEntity === this.masterEntityName)[0].name
    },

    associatedEntity () {
      return this.entitySchema.attributes[this.associatedAttr].associatedEntity
    }
  },

  methods: {
    ...mapMutations(['DELETE_COLLECTION_ITEM']),
    ...mapActions(['addCollectionItem']),

    async changeCollection (arr) {
      const isChecked = arr.length > this.selectedRecords.length
      if (isChecked) {
        // block addNew request before previous request is pending
        if (!this.isPending) {
          this.isPending = true
          const options = arr.filter(o => !this.selectedRecords.includes(o))
          const requests = options.map(option => {
            return this.addCollectionItem({
              collection: this.collectionName,
              execParams: {
                [this.associatedAttr]: option,
                [this.objectIDName]: this.$store.state.data.ID
              }
            })
          })
          await Promise.all(requests)
          this.isPending = false
        }
      } else {
        const options = this.selectedRecords.filter(o => !arr.includes(o))
        for (const option of options) {
          const index = this.selectedRecords.indexOf(option)
          if (index !== -1) {
            this.DELETE_COLLECTION_ITEM({
              collection: this.collectionName,
              index: index
            })
          }
        }
      }
    },

    onFocus () {
      this.$emit('focus')
    },

    onBlur () {
      this.$emit('blur')
    }
  }
}
</script>

<docs>
```vue
<template>
  <u-select-collection
    associated-attr="admSubjID"
    entity-name="ubm_navshortcut_adm"
    collection-name="rightsSubjects"
  />
</template>
```
```javascript
<script>
const { Form } = require('@unitybase/adminui-vue')
module.exports.mount = function ({ title, entity, instanceID, formCode, rootComponent }) {
  Form({
    component: rootComponent,
    entity,
    instanceID,
    title,
    formCode
  })
    .processing({
      collections: {
        rightsSubjects: ({state}) => UB.connection
          .Repository('ubm_navshortcut_adm')
          .attrs('ID', 'instanceID', 'admSubjID')
          .where('instanceID', '=', state.data.ID)
      }
    })
    .validation()
    .mount()
}

module.exports.default = {
  // root component
}
</script>
```
</docs>
