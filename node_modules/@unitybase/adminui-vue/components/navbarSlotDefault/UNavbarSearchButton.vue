<template>
  <el-popover
    v-if="modeList.length"
    ref="popover"
    placement="bottom"
    trigger="click"
    class="u-navbar__dropdown"
    :width="400"
    @after-enter="setFocusAndSelect"
  >
    <u-button
      slot="reference"
      :title="$ut('search') + ' (Ctrl+Shift+F)'"
      icon="u-icon-search"
      appearance="inverse"
      circle
    />

    <el-input
      ref="input"
      v-model="query"
      :placeholder="$ut('search')"
      @keyup.native.enter="doSearch"
      @keyup.native.esc="doClose"
    >
      <el-select
        slot="prepend"
        v-model="currentMode"
        class="ub-fts__select"
      >
        <el-option
          v-for="mode in modeList"
          :key="mode"
          :label="$ut('ftsConnection' + mode)"
          :value="mode"
        />
      </el-select>
      <el-button
        slot="append"
        icon="u-icon-search"
        @click="doSearch"
      />
    </el-input>

    <div class="ub-fts__period-toggle">
      <el-switch
        v-model="isPeriod"
        :active-text="$ut('searchByDateRange')"
        :inactive-text="$ut('forAllTime')"
      />
    </div>

    <u-date-picker
      v-show="isPeriod"
      v-model="period"
      class="ub-fts__date-picker"
      type="daterange"
      :picker-options="pickerOptions"
    />
  </el-popover>
</template>

<script>
/* global $App, Ext */
const SNIPED_RE = new RegExp('Z(.*?)Z:', 'gim')
/**
 * @class UNavbarSearchButton
 * Full text search navbar widget.
 *
 * Hides itself in case user do not have access to any of `fts` pseudo-entities.
 * This can be done either by set `application.fts.enabled: false` in ubConfig of by removing the fts
 * connections from connections array
 */
export default {
  name: 'UNavbarSearchButton',

  data () {
    return {
      query: '',
      currentMode: '',
      modeList: [],
      period: null,
      isPeriod: false,
      pickerOptions: {
        shortcuts: [{
          text: this.$ut('el.datepicker.today'),
          onClick (picker) {
            picker.$emit('pick', [new Date(), new Date()])
          }
        }, {
          text: this.$ut('lastMonth'),
          onClick (picker) {
            const end = new Date()
            const start = new Date()
            start.setMonth(start.getMonth() - 1)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: this.$ut('lastQuarter'),
          onClick (picker) {
            const end = new Date()
            const start = new Date()
            start.setMonth(start.getMonth() - 3)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: this.$ut('last6Month'),
          onClick (picker) {
            const end = new Date()
            const start = new Date()
            start.setMonth(start.getMonth() - 6)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: this.$ut('thisYear'),
          onClick (picker) {
            const end = new Date()
            const start = new Date(new Date().getFullYear(), 0)
            picker.$emit('pick', [start, end])
          }
        }]
      }
    }
  },

  created () {
    this.initSearchModes()
  },

  mounted () {
    if (!this.modeList.length) return // widget is hidden because no fts connections
    document.body.addEventListener('keydown', (e) => {
      const { code, ctrlKey, shiftKey } = e
      if (code === 'KeyF' && ctrlKey && shiftKey) {
        e.preventDefault()
        this.$refs.popover.doShow()
      }
    })
  },

  methods: {
    doClose () {
      this.$refs.popover.doClose()
    },

    setFocusAndSelect () {
      const i = this.$refs.input
      i.focus()
      i.select()
    },

    doSearch () {
      if (!this.query) {
        return
      }
      let qText = this.query
      if (qText[0] === '№') qText = '"' + qText + '"' // do not split № on lexemas - search as is

      const ftsTabId = 'FullTextSearchWidgetResult'
      const repo = this.$UB.Repository('fts_' + this.currentMode)
        .attrs('ID', 'entity', 'entitydescr', 'snippet')
        .using('fts')
        .where('', 'match', qText)
      if (this.isPeriod && this.period) {
        repo.where('ftsDate', '>=', this.period[0])
          .where('ftsDate', '<=', this.period[1])
      }

      const tab = Ext.getCmp(ftsTabId)
      if (tab) {
        tab.close()
      }
      // TODO: hide all actions of UTableEntity toolbar
      $App.doCommand({
        cmdType: 'showList',
        renderer: 'vue',
        tabId: ftsTabId,
        target: $App.viewport.centralPanel,
        title: this.$ut('fullTextSearchWidgetResultTitle', this.query),
        cmdData: {
          scopedSlots: h => ({
            toolbarDropdownAudit: () => h('div'),
            contextMenuAudit: () => h('div')
          }),
          repository () {
            return repo
          },
          buildEditConfig (cfg, row) {
            cfg.entity = row.entity
            cfg.instanceID = row.ID
            cfg.target = $App.viewport.centralPanel
            cfg.tabId = $App.generateTabId({
              entity: row.entity,
              instanceID: row.ID
            })

            return cfg
          },
          columns: [{
            id: 'entitydescr',
            label: 'ftsFieldCaption'
          }, {
            id: 'snippet',
            label: 'ftsFieldSnippet',
            isHtml: true,
            /**
             * Replace attribute codes wrapped in Z..Z (lower cased in snipped) by their captions
             */
            format: ({ value, row }) => {
              if (!value) return

              const schema = this.$UB.connection.domain.get(row.entity)

              // UB-1255 - complex attributes in snippet. LowerCase, multiline
              return value
                .replace(SNIPED_RE, (matched, attrCode, matchIndex) => {
                  attrCode = attrCode.split('.')[0]
                  // FTS returns attributes in lower case. First try to get as is. If not fount - search with lower case
                  const attr = schema.attributes[attrCode] || schema.filterAttribute(a => a.code.toLowerCase() === attrCode)[0]
                  return `${matchIndex === 0 ? '' : '<br>'}
                  <span class="fts__result-attribute-code">
                    ${attr ? (attr.caption || attr.description) : attrCode}
                  :</span>&nbsp
                `
                })
            }
          }]
        }
      })
      this.doClose()
    },

    initSearchModes () {
      const modeSet = new Set()
      modeSet.add('ftsDefault')
      const domain = this.$UB.connection.domain
      domain.eachEntity((ubEntity) => {
        if (ubEntity.hasMixin('fts')) {
          const connectionName = ubEntity.mixins.fts.connectionName
          if (connectionName) {
            modeSet.add(connectionName)
          }
        }
      })
      for (const mode of modeSet) {
        if (domain.isEntityMethodsAccessible(`fts_${mode}`, 'fts')) {
          this.modeList.push(mode)
        }
      }
      if (this.modeList.length) {
        this.currentMode = this.modeList[0]
      }
    }
  }
}
</script>

<style>
.ub-fts__select {
  width: 10em;
}

.ub-fts__period-toggle {
  padding: 10px 10px 0;
  text-align: right;
}

.ub-fts__period-toggle .el-switch__label {
  font-weight: 400;
  color: hsl(var(--hs-text), var(--l-text-default));
}

.ub-fts__period-toggle .el-switch__label.is-active {
  color: hsl(var(--hs-primary), var(--l-text-default));
}

.ub-fts__date-picker {
  width: 250px !important;
  margin-top: 10px;
  float: right;
}

.fts__result-attribute-code {
  color: hsl(var(--hs-primary), var(--l-text-default));
}
</style>
