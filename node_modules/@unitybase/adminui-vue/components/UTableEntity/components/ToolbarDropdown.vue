<template>
  <u-dropdown
    class="u-table-entity__header-dropdown"
    placement="bottom-end"
    child-placement="left-start"
    :width="210"
  >
    <u-button
      appearance="inverse"
      icon="u-icon-more"
      color="control"
    />

    <template slot="dropdown">
      <slot name="prepend" />

      <u-dropdown-item
        icon="u-icon-refresh"
        :label="$ut('refresh') + ' (Ctrl + R)'"
        :disabled="loading"
        @click="refresh"
      />
      <slot name="add-new">
        <u-dropdown-item
          icon="u-icon-add"
          :label="$ut('actionAdd') + ' (Ctrl + Ins)'"
          :disabled="!canAddNew"
          @click="addNew"
        />
      </slot>
      <u-dropdown-item divider />
      <slot name="edit">
        <u-dropdown-item
          icon="u-icon-edit"
          :label="$ut('Edit') + ' (Ctrl + E)'"
          :disabled="!canEdit"
          @click="editRecord(selectedRowId)"
        />
      </slot>
      <slot name="copy">
        <u-dropdown-item
          icon="u-icon-copy"
          label="Copy"
          :disabled="!hasSelectedRow || !canAddNew"
          @click="copyRecord(selectedRowId)"
        />
      </slot>
      <slot name="delete">
        <u-dropdown-item
          icon="u-icon-delete"
          :label="$ut('Delete') + ' (Ctrl + Delete)'"
          :disabled="!canDelete"
          @click="deleteRecord(selectedRowId)"
        />
      </slot>
      <slot name="audit">
        <u-dropdown-item
          icon="u-icon-line-chart"
          label="showAudit"
          :disabled="!canAudit"
          @click="audit(selectedRowId)"
        />
      </slot>
      <slot name="summary">
        <u-dropdown-item
          icon="u-icon-list-success"
          label="table.summary.menuText"
          @click="showSummary"
        />
      </slot>

      <slot name="dataHistory">
        <template v-if="hasDataHistoryMixin">
          <u-dropdown-item divider />

          <u-dropdown-item
            icon="u-icon-file-add"
            label="novajaVersija"
            :disabled="!canCreateNewVersion || !selectedRowId"
            @click="createNewVersion(selectedRowId)"
          />

          <u-dropdown-item
            icon="u-icon-file-preview"
            label="ChangesHistory"
            :disabled="!selectedRowId"
            @click="showRevision(selectedRowId)"
          />
        </template>
      </slot>

      <slot name="exports">
        <u-dropdown-item divider />
        <u-dropdown-item
          icon="u-icon-file-export"
          label="export"
        >
          <u-dropdown-item
            icon="u-icon-file-excel"
            label="exportXls"
            @click="exportTo('xlsx')"
          />
          <u-dropdown-item
            icon="u-icon-file-html"
            label="exportHtml"
            @click="exportTo('html')"
          />
          <u-dropdown-item
            icon="u-icon-file-csv"
            label="exportCsv"
            @click="exportTo('csv')"
          />
        </u-dropdown-item>
      </slot>

      <slot name="viewMode" />

      <slot name="append" />
    </template>
  </u-dropdown>
</template>

<script>
const { mapState, mapGetters, mapActions } = require('vuex')

export default {
  computed: {
    ...mapGetters([
      'canAddNew',
      'canEdit',
      'canDelete',
      'canAudit',
      'hasSelectedRow',
      'hasDataHistoryMixin',
      'canCreateNewVersion'
    ]),
    ...mapState([
      'selectedRowId',
      'loading'
    ])
  },

  methods: {
    ...mapActions([
      'refresh',
      'addNew',
      'deleteRecord',
      'editRecord',
      'copyRecord',
      'audit',
      'exportTo',
      'showSummary',
      'createNewVersion',
      'showRevision'
    ])
  }
}
</script>
