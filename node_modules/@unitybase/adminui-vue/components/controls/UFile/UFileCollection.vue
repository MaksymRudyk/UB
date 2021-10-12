<template>
  <u-file-multiple
    v-model="files"
    :file-attribute="fileAttribute"
    :subject-attribute="subjectAttribute"
    :entity-name="entityName"
    :view-mode="viewMode"
    :remove-default-buttons="removeDefaultButtons"
    :subject-attribute-value="$store.state.data.ID"
    :disabled="disabled"
    :before-set-document="beforeSetDocument"
  >
    <slot />
  </u-file-multiple>
</template>

<script>
const { mapMutations } = require('vuex')
/**
 * Collection of a "Documents" (files from BLOB stores)
 */
export default {
  name: 'UFileCollection',

  props: {
    /**
     * watched collection name
     */
    collectionName: {
      type: String,
      required: true
    },

    /**
     * attribute of type "Document" in a collection entity
     */
    fileAttribute: {
      type: String,
      required: true
    },

    /**
     * name of attribute which creates relation master entity with entity that stores files.
     * For example we have master entity "tst_dictionary" and entity which collects user files "tst_attachment".
     * In this case subjectAttribute in "tst_attachment" is a link to "tst_dictionary.ID"
     */
    subjectAttribute: {
      type: String,
      required: true
    },

    /**
     * name of entity that stores file
     */
    entityName: String,

    /**
     * file extensions to bind into `accept` input property
     */
    accept: {
      type: String,
      default: ''
    },

    /**
     * if `true` - remove all default buttons. To remove specific buttons - pass an array of button names to be hidden
     *
     * @example :remove-Default-Buttons="['add', 'preview']"
     *
     * Buttons names are:
     *  - add
     *  - webcam
     *  - scan
     *  - scanSettings
     *  - download
     *  - remove
     */
    removeDefaultButtons: [Boolean, Array],

    /**
     * hook which called before `UB.setDocument`. Must be as async function or function which returns promise
     *
     * @param {object} params
     * @param {string} params.entity
     * @param {number} params.id
     * @param {string} params.attribute
     * @param {string} params.subjectAttribute
     * @param {*} params.subjectAttributeValue
     */
    beforeSetDocument: {
      type: Function,
      default: () => Promise.resolve()
    },

    /**
     * disable file removing/uploading
     */
    disabled: Boolean,

    /**
     * carousel view mode
     */
    viewMode: {
      type: String,
      default: 'table',
      validator: (value) => ['table', 'carousel', 'carouselWithPreview'].includes(value)
    }
  },

  computed: {
    collectionData () {
      return this.$store.state.collections[this.collectionName]
    },

    files: {
      get () {
        return this.collectionData.items.map(i => i.data)
      },

      set (updatedFiles) {
        const collectionIds = this.collectionData.items.map(i => i.data.ID)
        const updateFileIds = updatedFiles.map(f => f.ID)

        const filesToAdd = updatedFiles.filter(file => !collectionIds.includes(file.ID))
        const filesToUpdate = updatedFiles.filter(file => collectionIds.includes(file.ID))
        const idsToDelete = collectionIds.filter(ID => !updateFileIds.includes(ID))

        for (const item of filesToAdd) {
          this.ADD_COLLECTION_ITEM({
            collection: this.collectionName,
            item
          })
        }

        for (const file of filesToUpdate) {
          const index = this.collectionData.items.findIndex(p => p.data.ID === file.ID)
          this.SET_DATA({
            collection: this.collectionName,
            index,
            key: this.subjectAttribute,
            value: file[this.subjectAttribute]
          })
        }

        for (const deleteId of idsToDelete) {
          const deleteIndex = this.collectionData.items.findIndex(p => p.data.ID === deleteId)
          this.DELETE_COLLECTION_ITEM({
            collection: this.collectionName,
            index: deleteIndex
          })
        }
      }
    }
  },

  methods: {
    ...mapMutations([
      'SET_DATA',
      'DELETE_COLLECTION_ITEM',
      'ADD_COLLECTION_ITEM'
    ])
  }
}
</script>

<docs>
  UFileCollection extends UFileMultiple, so it has same props, slots etc.
  But it maps to the collection items by collection name

  ### Usage
  ```vue
  <template>
    <u-file-collection
      collection-name="attachments"
      entity-name="tst_attachment"
      file-attribute="doc_file"
      subject-attribute="dictID"
      :remove-default-buttons="['add']"
    />
  </template>
  ```
</docs>
