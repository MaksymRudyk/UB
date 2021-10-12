<template>
  <u-table
    :columns="tableColumns"
    :items="files"
    class="u-file-multiple__table-view"
    :get-row-class="getRowClass"
    @click-row="selectRow"
    :max-height="300"
  />
</template>

<script>
const formatterMixin = require('../helpers/formatterMixin')

export default {
  name: 'MultipleFileViewTable',

  mixins: [formatterMixin],

  props: {
    value: [Number, null],
    files: Array
  },

  data () {
    return {
      tableColumns: [{
        id: 'origName',
        label: 'fileInput.manyFilesTable.label',
        minWidth: 180
      }, {
        id: 'size',
        label: 'fileInput.manyFilesTable.size',
        width: 120,
        minWidth: 120,
        format: ({ value }) => this.formatBytes(value)
      }, {
        id: 'type',
        label: 'fileInput.manyFilesTable.type',
        width: 60,
        minWidth: 60,
        format: ({ row }) => this.getType(row.origName)
      }, {
        id: 'uploadDate',
        label: 'fileInput.manyFilesTable.uploadDate',
        width: 200,
        minWidth: 200,
        format: ({ value }) => this.$UB.formatter.formatDate(value, 'dateTime')
      }]
    }
  },

  computed: {
    selectedFileId: {
      get () {
        return this.value
      },

      set (value) {
        this.$emit('input', value)
      }
    }
  },

  methods: {
    selectRow ({ row: { ID } }) {
      this.$emit('input', ID)
    },

    getRowClass ({ ID }) {
      return ID === this.selectedFileId
        ? 'selected'
        : ''
    }
  }
}
</script>

<style>
  .u-file-multiple__table-view {
    width: 100%;
  }

  .u-file-multiple__table-view tr:last-child td {
    border-bottom: none;
  }

  .u-file-multiple__table-view tr:hover td {
    background: hsl(var(--hs-background), var(--l-background-default));
  }

  .u-file-multiple__table-view tr.selected td {
    background: hsl(var(--hs-primary), var(--l-background-default));
  }
</style>
