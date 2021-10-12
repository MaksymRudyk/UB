<template>
  <div class="u-table-register">
    <div class="u-table-register__view">
      <u-table-entity
        ref="masterTable"
        :bordered="false"
        v-bind="$attrs"
        :before-initial-load="onInitialLoad"
        :class="{
          'u-table-register__view__preview-form-mode': viewMode === 'previewForm'
        }"
        v-on="$listeners"
        @change-row="selectedRowId = $event"
      >
        <template
          v-for="slot in Object.keys($scopedSlots)"
          :slot="slot"
          slot-scope="scope"
        >
          <slot
            :name="slot"
            v-bind="scope"
          />
        </template>

        <template #contextMenuDetails="scope">
          <slot
            v-bind="scope"
            name="contextMenuDetails"
          >
            <template v-if="details.length">
              <u-dropdown-item divider />
              <u-dropdown-item
                label="Details"
                icon="u-icon-file-text"
              >
                <u-dropdown-item
                  v-for="detail in details"
                  :key="detail.entity + detail.attribute"
                  :disabled="detail === selectedDetail && detailsVisible"
                  :label="formatDetailLabel(detail)"
                  @click="showDetail(detail)"
                />
              </u-dropdown-item>
            </template>
          </slot>
        </template>

        <template #toolbarDropdownAppend="scope">
          <slot
            v-bind="scope"
            name="dropdownMenuDetails"
          >
            <template v-if="details.length">
              <u-dropdown-item divider />
              <u-dropdown-item
                label="Details"
                icon="u-icon-file-text"
              >
                <u-dropdown-item
                  v-for="detail in details"
                  :key="detail.entity + detail.attribute"
                  :disabled="detail === selectedDetail && detailsVisible"
                  :label="formatDetailLabel(detail)"
                  @click="showDetail(detail)"
                />
              </u-dropdown-item>
            </template>
          </slot>

          <slot
            v-bind="scope"
            name="toolbarDropdownAppend"
          />
        </template>

        <template #toolbarDropdownViewMode="scope">
          <slot
            name="toolbarDropdownViewMode"
            v-bind="scope"
          >
            <u-dropdown-item
              label="table.viewMode.label"
              icon="u-icon-eye"
            >
              <u-dropdown-item
                v-for="button in viewModeButtons"
                :key="button.code"
                :disabled="viewMode === button.code"
                :label="button.label"
                :icon="button.icon"
                @click="viewMode = button.code"
              />
            </u-dropdown-item>
          </slot>
        </template>
      </u-table-entity>

      <template v-if="detailsVisible">
        <div class="u-table-register__divider">
          <div class="u-table-register__divider-title">
            {{ formatDetailLabel(selectedDetail) }}
          </div>
          <button
            class="u-table-register__divider-button"
            @click="detailsVisible = false"
          >
            <i class="u-icon-eye-slash" />
            {{ $ut('tableRegister.hideDetails') }}
          </button>

          <div class="u-table-register__divider-line" />
        </div>

        <u-table-entity
          ref="detailsTable"
          class="u-table-register__details"
          :repository="repository"
          :columns="columns"
          :build-add-new-config="buildDetailAddNewConfig"
        />
      </template>
    </div>

    <preview-form
      v-if="viewMode === 'previewForm'"
      :id="selectedRowId"
      ref="previewForm"
      :entity="entityName"
      class="u-table-register__form-preview"
      @cancel-close="setSelectedRow"
    />
  </div>
</template>

<script>
/* global $App */
const { throttle } = require('throttle-debounce')

/**
 * Same as UTableEntity but with details grid.
 */
export default {
  name: 'UMasterDetailView',

  components: {
    PreviewForm: require('./PreviewForm.vue').default
  },

  mixins: [
    require('./localStorageMixin')
  ],

  data () {
    return {
      rowId: null,
      selectedDetail: null,
      detailsVisible: false,
      selectedRowId: null,
      viewModeButtons: [{
        code: 'table',
        label: 'table.viewMode.table',
        icon: 'u-icon-grid'
      }, {
        code: 'card',
        label: 'table.viewMode.card',
        icon: 'u-icon-attributes'
      }, {
        code: 'previewForm',
        label: 'showPreview',
        icon: 'u-icon-window-left'
      }],
      viewMode: null
    }
  },

  computed: {
    entityName () {
      const eName = this.$attrs.entity || this.$attrs.entityName
      if (eName) {
        return eName
      }
      const repository = this.$attrs.repository
      if (typeof repository === 'object') {
        return repository.entity
      }
      if (typeof repository === 'function') {
        return repository().entityName
      }
      return ''
    },

    details () {
      const thisEntity = $App.domainInfo.get(this.entityName)
      return thisEntity.getDetailsForUI().map(attr => {
        return { entity: attr.entity.name, attribute: attr.name }
      })
    },

    schema () {
      return this.$UB.connection.domain.get(this.selectedDetail.entity)
    },

    columns () {
      return this.schema
        .filterAttribute(a => a.defaultView && a.code !== this.selectedDetail.attribute)
        .map(a => a.code)
    }
  },

  watch: {
    selectedRowId () {
      if (this.$refs.detailsTable) {
        this.refreshMasterTable()
      }
    },

    viewMode (mode) {
      switch (mode) {
        case 'table':
        case 'card':
          this.$refs.masterTable.$store.commit('SET_VIEW_MODE', mode)
          break
        case 'previewForm':
          this.$refs.masterTable.$store.commit('SET_VIEW_MODE', 'card')
          break
      }
    }
  },

  methods: {
    setSelectedRow (id) {
      this.$refs.masterTable.$store.commit('SELECT_ROW', id)
    },

    repository () {
      const columns = Array.from(
        new Set(
          this.columns.concat(this.selectedDetail.attribute)
        )
      )

      return this.$UB.Repository(this.selectedDetail.entity)
        .attrs(columns)
        .where(this.selectedDetail.attribute, '=', this.selectedRowId)
    },

    async showDetail (detail) {
      this.selectedDetail = detail
      this.detailsVisible = true
      await this.$nextTick()
      this.refreshMasterTable()
      this.$refs.masterTable.$el.focus()
    },

    refreshMasterTable: throttle(
      50,
      true,
      function () {
        this.$refs.detailsTable.$store.dispatch('refresh')
      }),

    formatDetailLabel ({ entity, attribute }) {
      const hasSameEntity = this.details.filter(d => d.entity === entity).length > 1
      if (hasSameEntity) {
        const attributeLabelText = this.$ut(`${entity}.${attribute}`)
        const attributeLabel = ` (${attributeLabelText})`
        return this.$ut(entity) + attributeLabel
      } else {
        return this.$ut(entity)
      }
    },

    buildDetailAddNewConfig (cfg) {
      cfg.props = {
        parentContext: {
          [this.selectedDetail.attribute]: this.selectedRowId
        }
      }
      return cfg
    },

    onInitialLoad (masterTableInstance) {
      this.viewMode = masterTableInstance.viewMode
      this.initLocalStorageWatcher(masterTableInstance)
    }
  }
}
</script>

<style>
.u-table-register {
  display: flex;
}

.u-table-register__view {
  overflow: auto;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  flex-basis: 450px;
  flex-shrink: 0;
}

.u-table-register__view__preview-form-mode > .u-table-entity__head .u-button .u-button__label {
  display: none;
}

.u-table-register__form-preview {
  flex-grow: 1;
  flex-basis: 100%;
  margin-left: 8px;
  padding-left: 8px;
  border-left: 1px solid hsl(var(--hs-border), var(--l-layout-border-default));
  overflow: auto;
}

.u-table-register__view > .u-table-entity {
  overflow: auto;
  flex-grow: 1;
}

.u-table-register__details {
  min-height: 50%;
  max-height: 75%;
  flex-grow: 1;
}

.u-table-register__divider {
  padding: 4px 0;
  display: flex;
  align-items: center;
}

.u-table-register__divider-line {
  flex-grow: 1;
  height: 1px;
  background: hsl(var(--hs-border), var(--l-layout-border-default));
}

.u-table-register__divider-title {
  padding: 0 10px;
  font-size: 18px;
  line-height: 1;
}

.u-table-register__divider-button {
  color: hsl(var(--hs-primary), var(--l-state-default));
  font-size: 15px;
  background: none;
  border: none;
  padding-right: 10px;
  padding-left: 0;
  cursor: pointer;
}

.u-table-register__divider-button:hover {
  color: hsl(var(--hs-primary), var(--l-state-hover));
}
</style>
