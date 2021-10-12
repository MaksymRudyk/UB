<template>
  <u-dropdown
    v-if="filterColumns.length > 0"
    ref="dropdown"
  >
    <u-button
      :title="$ut('table.filter.list.title')"
      appearance="inverse"
      color="control"
      icon="u-icon-filter"
    />

    <div
      slot="dropdown"
      class="u-fake-table"
    >
      <div class="u-fake-table__tr">
        <div class="u-fake-table__td u-fake-table__label">
          {{ $ut('table.columnLabel') }}
        </div>
        <div class="u-fake-table__td">
          <el-select
            v-model="selectedFilterableColumnId"
            :placeholder="$ut('table.filter.columnPlaceholder')"
          >
            <el-option
              v-for="column in filterColumns"
              :key="column.id"
              :value="column.id"
              :label="$ut(column.label)"
            />
          </el-select>
        </div>
      </div>

      <template v-if="selectedFilterableColumnId">
        <div class="u-fake-table__tr">
          <div class="u-fake-table__td u-fake-table__label">
            {{ $ut('table.filter.conditionPlaceholder') }}
          </div>
          <div class="u-fake-table__td">
            <el-select v-model="condition">
              <el-option
                v-for="(filterData, filterId) in selectedColumn.filters"
                :key="filterId"
                :value="filterId"
                :label="$ut(filterData.label)"
              />
            </el-select>
          </div>
        </div>

        <keep-alive>
          <component
            :is="selectedColumn.filters[condition].template"
            v-if="selectedColumn.filters && selectedColumn.filters[condition]"
            :column="selectedColumn"
            @search="throttledApplyFilter"
          />
        </keep-alive>
      </template>
    </div>
  </u-dropdown>
</template>

<script>
const { mapGetters, mapActions } = require('vuex')
const { throttle } = require('throttle-debounce')

export default {
  data () {
    return {
      conditionsByColumns: {}
    }
  },

  computed: {
    ...mapGetters(['columns']),

    filterColumns () {
      return this.columns.filter(column => {
        const availableFilters = Object.keys(column.filters)
        const hasFilters = availableFilters.length > 0
        const everyFilterHasTemplate = availableFilters.every(filterCode => column.filters[filterCode].template)

        return hasFilters && everyFilterHasTemplate
      })
    },

    selectedColumnId: {
      get () {
        return this.$store.state.selectedColumnId
      },

      set (value) {
        this.$store.commit('SELECT_COLUMN', value)
      }
    },

    selectedColumn () {
      const column = this.filterColumns.find(c => c.id === this.selectedColumnId)
      if (column) {
        return column
      } else {
        return {}
      }
    },

    selectedFilterableColumnId: {
      get () {
        return this.selectedColumn.id || null
      },

      set (value) {
        this.selectedColumnId = value
      }
    },

    condition: {
      get () {
        return this.conditionsByColumns[this.selectedFilterableColumnId]
      },

      set (value) {
        this.conditionsByColumns[this.selectedFilterableColumnId] = value
      }
    }
  },

  watch: {
    filterColumns: {
      immediate: true,
      handler (columns) {
        this.$set(this, 'conditionsByColumns', {})
        for (const column of columns) {
          this.$set(
            this.conditionsByColumns,
            column.id,
            Object.keys(column.filters)[0]
          )
        }
      }
    }
  },

  methods: {
    ...mapActions(['applyFilter']),

    throttledApplyFilter: throttle(50, function (...args) {
      this.$refs.dropdown.close()
      this.applyFilter(...args)
    })
  }
}
</script>
