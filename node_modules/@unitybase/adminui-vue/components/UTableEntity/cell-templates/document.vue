<template>
  <div
    v-if="value"
    class="u-table-entity__document-col"
  >
    <span>{{ fileName }}</span>
    <u-button
      icon="u-icon-download"
      size="small"
      color="control"
      appearance="plain"
      class="u-table-entity__document-button"
      @click="download"
    />
  </div>
</template>

<script>
export default {
  name: 'DocumentCellTemplate',

  props: ['value', 'row', 'column'],

  computed: {
    document () {
      return JSON.parse(this.value)
    },

    fileName () {
      return this.document.origName || this.document.fName
    }
  },

  methods: {
    download () {
      const instanceInfo = this.getRecordParams()
      return $App.downloadDocument(instanceInfo, this.document)
    },

    getRecordParams () {
      const attribute = this.column.attribute.code
      const attributePath = this.column.id.split('.')
      const isMasterAttr = attributePath.length === 1
      let ID

      if (isMasterAttr) {
        ID = this.row.ID
      } else {
        const identifierAttribute = attributePath.slice(0, attributePath.length - 1).join('.')
        ID = this.row[identifierAttribute]
        if (!ID) {
          throw new Error(`Cannot download document, because "${identifierAttribute}" attribute is not in fieldList`)
        }
      }

      return {
        entity: this.column.attribute.entity.code,
        attribute,
        ID
      }
    }
  }
}
</script>

<style>
  .u-table-entity__document-col {
    display: flex;
    align-items: center;
  }

  .u-table-entity__document-col span {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .u-table-entity__document-button {
    margin-left: 10px;
  }
</style>
