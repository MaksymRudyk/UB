<template>
  <div class="u-toolbar">
    <!-- @slot content to prepend to the left side of the toolbar *before* default buttons -->
    <slot name="leftBefore" />

    <u-button
      v-for="button in mainPanelButtons"
      :key="button.label + button.icon"
      :title="$ut(button.label)"
      :appearance="button.type === 'text' ? 'default' : 'inverse'"
      :size="button.type === 'text' ? 'small' : 'large'"
      :disabled="button.disabled"
      :icon="button.icon"
      :color="button.color"
      @click="button.handler"
    >
      <template v-if="button.type === 'text'">
        {{ button.label || '' }}
      </template>
    </u-button>
    <!-- @slot content to append of the left side of the toolbar *after* default buttons -->
    <slot name="left" />
    <div class="u-toolbar__flex-divider" />
    <!-- @slot content to prepend to the right side of the toolbar *before* setting button -->
    <slot name="right" />

    <u-button
      v-if="entitySchema.hasMixin('softLock')"
      :title="lockInfoMessage"
      :icon="isLocked ? 'u-icon-lock' : 'u-icon-unlock'"
      :color="isLocked ? (isLockedByMe ? 'primary' : 'danger') : 'control'"
      appearance="inverse"
    />

    <u-dropdown
      v-if="showDropdown"
      class="u-toolbar__settings-button"
      placement="bottom-end"
    >
      <u-button
        appearance="inverse"
        icon="u-icon-setting"
        tooltip="allActions"
      />

      <template #dropdown>
        <template
          v-for="button in dropdownButtons"
        >
          <u-dropdown-item
            :key="button.label + button.icon"
            :label="button.label"
            :disabled="button.disabled"
            :icon="button.icon"
            @click="button.handler"
          />
          <u-dropdown-item
            v-if="button.divider"
            :key="button.label + button.icon + 1"
            divider
          />
        </template>

        <!-- @slot if need append items to dropdown -->
        <slot name="dropdown" />
      </template>
    </u-dropdown>

    <table
      v-if="mi_createDate && mi_modifyDate"
      class="u-toolbar__date"
    >
      <tr>
        <td>{{ $ut('createdEntityCaption') }}:</td>
        <td>{{ $UB.formatter.formatDate(mi_createDate, 'dateTimeFull') }}</td>
      </tr>
      <tr>
        <td>{{ $ut('updatedEntityCaption') }}:</td>
        <td>{{ $UB.formatter.formatDate(mi_modifyDate, 'dateTimeFull') }}</td>
      </tr>

      <!-- @slot content to append under the dates of creation and modification (if entity have mi_createDate & mi_modifyDate) -->
      <slot name="toolbarInfoRow" />
    </table>
  </div>
</template>

<script>
/* global $App, _ */
const { mapState, mapGetters, mapActions } = require('vuex')
const { mapInstanceFields } = require('../../utils/Form/helpers')

/**
 * Form toolbar with default actions.
 * Addition actions can be added either using `toolbar-buttons` or using slots
 */
export default {
  name: 'UToolbar',

  inject: [
    '$formServices',
    'formCode',
    'entitySchema',
    'fieldList',
    'entity'
  ],

  props: {
    /**
     * Do not show any of the default buttons / actions
     */
    hideDefaultButtons: Boolean,
    /**
     * Buttons definition array. Can contains additional toolbar/dropdown buttons or override default button
     * in case `name` property match some of the default button name.
     *
     * Can be used together with `hideDefaultButtons` property and slots.
     * See example in `docs` below.
     */
    toolbarButtons: {
      type: Array,
      default: () => []
    },

    /**
     * To show the dropdown with its buttons
     */
    showDropdown: {
      type: Boolean,
      default: () => true
    }
  },

  computed: {
    ...mapGetters([
      'canSave',
      'canRefresh',
      'canDelete',
      'isLocked',
      'isLockedByMe',
      'lockInfoMessage'
    ]),
    ...mapState([
      'isNew',
      'lockInfo',
      'loading'
    ]),
    ...mapInstanceFields(['mi_createDate', 'mi_modifyDate']),

    mainPanelButtons () {
      if (this.hideDefaultButtons) {
        return this.toolbarButtons
      }

      const defaultToolbarButtons = [{
        name: 'save',
        label: this.$ut('save') + ' (Ctrl + S)',
        icon: 'u-icon-save',
        handler: () => this.save(),
        disabled: !this.canSave,
        color: 'primary'
      }, {
        name: 'saveAndClose',
        label: this.$ut('saveAndClose') + ' (Ctrl + Enter)',
        icon: 'u-icon-save-and-close',
        handler: this.saveAndClose,
        disabled: !this.canSave,
        color: 'primary'
      }, {
        name: 'delete',
        label: this.$ut('Delete') + ' (Ctrl + Delete)',
        icon: 'u-icon-delete',
        handler: () => this.deleteInstance(this.$formServices.forceClose),
        disabled: !this.canDelete,
        divider: true
      }]

      return this.mergeButtons(this.toolbarButtons, defaultToolbarButtons)
    },

    dropdownButtons () {
      if (this.hideDefaultButtons) {
        return this.toolbarButtons
      }
      const buttons = [{
        label: this.$ut('refresh') + ' (Ctrl + R)',
        icon: 'u-icon-refresh',
        handler: () => this.refresh(),
        disabled: !this.canRefresh || this.loading
      }]
      buttons.push(...this.mainPanelButtons)

      if (this.$UB.connection.domain.isEntityMethodsAccessible('ubm_form', 'update')) {
        buttons.push({
          icon: 'u-icon-wrench',
          label: 'formConstructor',
          handler: this.formConstructorHandler,
          divider: true
        })
      }

      buttons.push({
        icon: 'u-icon-link',
        label: 'link',
        handler: this.copyLink
      })

      if (this.entitySchema.hasMixin('dataHistory')) {
        buttons.push({
          icon: 'u-icon-branch',
          label: 'ChangesHistory',
          disabled: this.isNew,
          handler: this.showDataHistory
        })
      }

      if (this.entitySchema.hasMixin('audit')) {
        buttons.push({
          icon: 'u-icon-line-chart',
          label: 'showAudit',
          handler: this.showAudit,
          disabled: !this.$UB.connection.domain.isEntityMethodsAccessible('uba_auditTrail', 'select')
        })
      }

      if (this.entitySchema.hasMixin('aclRls')) {
        const mixins = this.entitySchema.mixins
        const aclEntityName = mixins?.aclRls?.useUnityName
          ? mixins.unity.entity + '_acl'
          : this.entitySchema.name + '_acl'
        buttons.push({
          icon: 'u-icon-key',
          label: 'accessRight',
          handler: () => { this.showAccessRights(aclEntityName) },
          disabled: !this.$UB.connection.domain.isEntityMethodsAccessible(aclEntityName, 'select')
        })
      }

      if (this.entitySchema.hasMixin('softLock')) {
        buttons.push({
          icon: 'u-icon-lock',
          label: 'lockBtn',
          handler: () => { this.lockEntity(true) },
          disabled: this.isNew,
          divider: true
        })
        buttons.push({
          icon: 'u-icon-unlock',
          label: 'unLockBtn',
          handler: () => { this.unlockEntity() },
          disabled: !this.isLockedByMe
        })
      }

      return buttons
    },

    linkToEntity () {
      const query = [
        'cmdType=showForm',
        `entity=${this.entity}`,
        `instanceID=${this.$store.state.data.ID}`
      ].join('&')
      return `${window.location.protocol}//${window.location.host}${window.location.pathname}#${query}`
    }
  },

  mounted () {
    if (!this.hideDefaultButtons) {
      this.$root.$el.addEventListener('keydown', this.onKeydownActions)
    }
  },

  beforeDestroy () {
    if (!this.hideDefaultButtons) {
      this.$root.$el.removeEventListener('keydown', this.onKeydownActions)
    }
  },

  methods: {
    ...mapActions([
      'save',
      'refresh',
      'deleteInstance',
      'lockEntity',
      'unlockEntity'
    ]),

    async saveAndClose () {
      await this.save(() => this.$formServices.forceClose())
    },

    dropdownHandler (command) {
      if (command === 'hide') {
        this.$refs.dropdown.hide()
      }
    },

    async formConstructorHandler () {
      const formEntity = this.$UB.connection.domain.get('ubm_form')

      if (!formEntity.haveAccessToMethod('update')) {
        return
      }
      if (!this.formCode) {
        this.$notify({
          title: this.$ut('isAutoGeneratedForm'),
          duration: 3000
        })
        return
      }

      const result = await this.$UB.Repository('ubm_form')
        .attrs(['ID', 'code'])
        .where('code', '=', this.formCode)
        .selectSingle()

      if (!result) {
        this.$notify({
          title: this.$ut('formNotFound'),
          duration: 3000
        })
        return
      }

      $App.doCommand({
        cmdType: 'showForm',
        description: '',
        entity: 'ubm_form',
        instanceID: result.ID,
        sender: this,
        target: $App.getViewport().centralPanel,
        tabId: 'ubm_form' + result.ID,
        isModal: this.$store.state.isModal
      })
    },

    copyLink () {
      const input = document.createElement('input')
      input.value = this.linkToEntity
      input.style.position = 'absolute'
      input.style.top = '100%'
      input.style.left = '100%'
      document.body.appendChild(input)
      input.select()
      if (document.execCommand('copy')) {
        document.body.removeChild(input)
        this.$notify({
          title: this.$ut('link'),
          message: this.$ut('linkCopiedText'),
          duration: 5000
        })
      }
      window.getSelection().removeAllRanges()
    },

    showDataHistory () {
      const fieldList = new Set(this.fieldList)

      fieldList.add('mi_dateFrom')
      fieldList.add('mi_dateTo')

      const extendedFieldList = this.$UB.core.UBUtil.convertFieldListToExtended([...fieldList])
      for (const item of extendedFieldList) {
        const field = item.name
        if (field === 'mi_dateTo' || field === 'mi_dateFrom') {
          item.visibility = true
          item.description = this.$ut(field)
        }
      }
      $App.doCommand({
        cmdType: 'showList',
        isModal: true,
        cmdData: {
          params: [{
            entity: this.entitySchema.name,
            method: 'select',
            fieldList: [...fieldList]
          }]
        },
        cmpInitConfig: {
          extendedFieldList
        },
        instanceID: this.$store.state.data.ID,
        __mip_recordhistory: true
      })
    },

    showAccessRights (aclEntityName) {
      const { domain } = this.$UB.connection
      const instanceID = this.$store.state.data.ID
      const aclMixin = this.entitySchema.mixins.aclRls
      const aclAttributes = domain.get(aclEntityName).filterAttribute(attrDef => {
        return attrDef.associatedEntity && aclMixin.onEntities.includes(attrDef.associatedEntity)
      })
      const aclFieldList = aclAttributes.flatMap(attrDef => {
        const associatedEntityInfo = domain.get(attrDef.associatedEntity)
        const descriptionAttribute = associatedEntityInfo.getDescriptionAttribute()
        const attrs = [attrDef.code, `${attrDef.code}.${descriptionAttribute}`]
        if (associatedEntityInfo.attr('mi_unityEntity')) {
          attrs.push(`${attrDef.code}.mi_unityEntity`)
        }
        return attrs
      })

      const getAssignedAclAttrInfoForEntry = row => {
        const aclAttr = Object.keys(row).find(key => key !== 'valueID' && row[key] === row.valueID)
        return aclAttributes.find(attr => attr.code === aclAttr)
      }

      const formProps = {
        title: `${this.$UB.i18n('accessRight')} (${this.$UB.i18n(this.entity)})`,
        instanceID,
        entity: this.entitySchema.code,
        formCode: 'aclRlsEntry',
        props: {
          aclEntityName,
          instanceID,
          aclAttributes
        }
      }

      $App.doCommand({
        renderer: 'vue',
        isModal: true,
        title: `${this.$UB.i18n('accessRight')} (${this.$UB.i18n(this.entity)})`,
        cmdType: 'showList',
        cmdData: {
          withPagination: false,

          repository: () => {
            return this.$UB.Repository(aclEntityName)
              .attrs(...aclFieldList, 'valueID')
              .where('instanceID', '=', instanceID)
          },

          buildAddNewConfig: cfg => {
            return {
              ...cfg,
              ...formProps
            }
          },

          buildEditConfig: cfg => {
            return {
              ...cfg,
              ...formProps
            }
          },

          columns: [
            {
              id: 'subject',
              label: this.$ut('aclRlsInfo.subject'),
              filterable: false,
              sortable: false,
              toValidate: false,
              format: ({ row }) => {
                const aclAttr = getAssignedAclAttrInfoForEntry(row)
                const unityEntityAttr = `${aclAttr.code}.mi_unityEntity`
                const withUnity = aclFieldList.includes(unityEntityAttr)
                const associatedEntity = withUnity ? row[unityEntityAttr] : aclAttr.associatedEntity
                return this.$ut(associatedEntity)
              }
            },

            {
              id: 'name',
              label: this.$ut('aclRlsInfo.name'),
              filterable: false,
              sortable: false,
              toValidate: false,
              format: ({ row }) => {
                const attr = getAssignedAclAttrInfoForEntry(row)
                const descriptionAttribute = domain.get(attr.associatedEntity).getDescriptionAttribute()
                return row[`${attr.code}.${descriptionAttribute}`]
              }
            }
          ],

          hideActions: [
            'export',
            'copy',
            'audit',
            'summary'
          ]
        }
      })
    },

    showAudit () {
      $App.showAuditTrail({
        entityCode: this.entity,
        instanceID: this.$store.state.data.ID,
        isModal: this.$store.state.isModal
      })
    },

    onKeydownActions (e) {
      if (!e.ctrlKey) return // return ASAP in case Ctrl not pressed
      if (e.key === 'r') {
        e.preventDefault()
        if (this.canRefresh && !this.loading) {
          this.refresh()
        }
      }

      if (e.key === 's') {
        e.preventDefault()
        if (this.canSave) {
          this.save()
        }
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        if (this.canSave) {
          this.saveAndClose()
        }
      }

      if (e.key === 'Delete') {
        e.preventDefault()
        if (this.canDelete) {
          this.deleteInstance(this.$formServices.forceClose)
        }
      }
    },

    mergeButtons (propButtons, defButtons) {
      const buttons = _.cloneDeep(defButtons)
      for (const btn of propButtons) {
        if (btn.name) {
          const defBtnIdx = buttons.findIndex(f => f.name === btn.name)
          if (defBtnIdx >= 0) {
            if (btn.visible === false) {
              buttons.splice(defBtnIdx, 1)
            } else {
              _.merge(buttons[defBtnIdx], btn)
            }
            continue
          }
        }
        if (btn.visible !== false) buttons.push(btn)
      }
      return buttons
    }
  }
}
</script>

<style>
.u-toolbar {
  border-bottom: 1px solid hsl(var(--hs-border), var(--l-layout-border-default));
  padding: 0.5em 1em;
  display: flex;
  flex-shrink: 0;
  align-items: center;
}

.u-toolbar > .u-button:not(:first-child) {
  margin-left: 8px;
}

.u-toolbar__flex-divider {
  margin-left: auto;
}

.u-toolbar__date td {
  font-size: 10px;
  color: hsl(var(--hs-text), var(--l-text-label));
  text-align: right;
  padding-right: 5px;
  white-space: nowrap;
}

.u-toolbar__date {
  border-left: 1px solid hsl(var(--hs-border), var(--l-layout-border-default));
  padding-left: 10px;
  margin-left: 10px;
}

.u-toolbar__settings-button > .u-dropdown__reference {
  height: 100%;
}
</style>
