<template>
  <div class="uba_als__container">
    <el-select
      v-model="selectedEntity"
      filterable
      clearable
      :placeholder="$ut('entity')"
    >
      <el-option
        v-for="entity in entityList"
        :key="entity.code"
        :label="entity.code"
        :value="entity.code"
      />
    </el-select>
    <el-select
      v-if="selectedEntity"
      v-model="selectedState"
      filterable
      clearable
      :placeholder="$ut('uba_als.state')"
    >
      <el-option
        v-for="entity in stateList"
        :key="entity"
        :label="entity"
        :value="entity"
      />
    </el-select>
    <el-popover
      v-model="popoverVisible"
      placement="bottom-end"
      trigger="click"
    >
      <el-table
        :data="emptyAttributes"
        :show-header="false"
        @row-click="onEmptyAttributesClick"
      >
        <el-table-column
          width="200"
          property="name"
        />
      </el-table>
      <el-button
        v-if="selectedState && emptyAttributes.length !== 0"
        slot="reference"
        icon="u-icon-add"
        @click="popoverVisible = !popoverVisible"
      >
        {{ $ut('actionAdd') }}
      </el-button>
    </el-popover>
    <el-button
      v-if="selectedState"
      type="success"
      icon="u-icon-check"
      :disabled="!needSave"
      @click="save"
    >
      {{ $ut('save') }}
    </el-button>
    <el-button
      v-if="selectedState"
      type="success"
      icon="u-icon-file-text"
      :disabled="!needSave"
      @click="generateDiffFile"
    >
      {{ generateDiffFileCaption }}
    </el-button>
    <el-row v-if="selectedState">
      <el-col :span="18">
        <u-table
          height="100%"
          :items="tableData"
          :columns="tableColumns"
          fixed-column-id="code"
        >
          <template
            v-for="role of checkedRoles"
            #[roleColumnPrefix+role]="{row}"
          >
            <action-component
              :key="role"
              :value="(currentRights.find(right => right.attribute === row.code && right.roleName === role) || {}).actions"
              class="als__actions"
              @input="doOnDataChanged($event, role)"
            />
          </template>

          <template #removeAction="{row}">
            <el-button
              size="small"
              icon="u-icon-delete"
              circle
              @click.native.prevent="deleteRow(row.code)"
            />
          </template>
        </u-table>
      </el-col>
      <el-col
        :span="6"
        style="padding-left: 30px"
      >
        <h4>{{ $ut('roles') }}:</h4>
        <el-button
          @click="doCheckAllRoles"
        >
          {{ $ut('checkAll') }}
        </el-button>
        <el-button
          @click="doUnCheckAllRoles"
        >
          {{ $ut('uncheckAll') }}
        </el-button>
        <el-button
          @click="doCheckAllUsedRoles"
        >
          {{ $ut('checkAllUsedRoles') }}
        </el-button>
        <el-scrollbar>
          <el-checkbox-group
            v-model="checkedRoles"
            style="margin-top: 10px"
          >
            <div
              v-for="role in roleList"
              :key="role"
              style="margin-top: 5px"
            >
              <el-checkbox
                :key="role"
                :label="role"
                @change="checkBoxChange(role)"
              >
                {{ role }}
              </el-checkbox>
            </div>
          </el-checkbox-group>
        </el-scrollbar>
      </el-col>
    </el-row>
  </div>
</template>

<script>
/* global saveAs */
const ActionComponent = require('../components/RoleActionsComponent.vue').default
const adminUiVue = require('@unitybase/adminui-vue')

module.exports.mount = function ({ title, tabId, entity, instanceID, formCode, rootComponent, parentContext }) {
  adminUiVue.mountUtils.mountTab({
    component: rootComponent,
    tabId: tabId,
    props: {
      initialInstanceID: instanceID
    },
    entity,
    instanceID,
    formCode,
    title
  })
}

const ALS_FIELD_LIST = ['ID', 'attribute', 'state', 'roleName', 'actions']

module.exports.default = {
  name: 'AlsComponent',
  props: {
    initialInstanceID: Number
  },
  data () {
    return {
      popoverVisible: false,
      entityList: this.$UB.connection.domain.filterEntities(e => e.mixins.als),
      alsEntity: this.$UB.connection.domain.get('uba_als'),
      roleList: [],
      stateList: [],
      selectedEntity: null,
      selectedState: null,
      checkedRoles: [],
      // do not make huge array reactive rightsFromDb: [],
      rightsFromDbCounter: 1,
      createdRights: [],
      deletedRights: [],
      generateDiffFileCaption: 'Save diff in file',
      usedAttributes: [],
      actions: [{
        name: 'Select',
        value: 1
      }, {
        name: 'Update',
        value: 3
      }, {
        name: 'Mandatory',
        value: 7
      }],
      roleColumnPrefix: 'roleId'
    }
  },
  mounted () {
    if (this.initialInstanceID) {
      return UB.Repository('uba_als').attrs('entity', 'state').where('ID', '=', this.initialInstanceID)
        .selectSingle()
        .then(row => {
          if (row) {
            this.selectedEntity = row.entity
            this.selectedState = row.state
          }
        })
    }
  },
  watch: {
    currentRights () {
      this.setUsedAttributes()
    },
    selectedEntity () {
      this.loadRightsFromDB()
      this.createdRights = []
      if (this.selectedEntity) {
        this.$UB.connection.query({ entity: this.selectedEntity, method: 'getallroles' }).then(response => {
          this.roleList = response.alsRoleAllValues.sort()
        })
        this.$UB.connection.query({ entity: this.selectedEntity, method: 'getallstates' }).then(response => {
          this.stateList = response.alsStateAllValues
          if (!this.stateList.includes(this.selectedState)) {
            this.selectedState = null
          }
        })
      } else {
        this.roleList = []
        this.stateList = []
        this.selectedState = null
      }
    }
  },
  computed: {
    attributeList () {
      return this.selectedEntity ? Object.keys(this.$UB.connection.domain.get(this.selectedEntity).attributes) : []
    },
    changedRights () {
      // return [] // MPV temporarty
      let rows = []
      if (!this.rightsFromDb) return rows
      this.rightsFromDb.forEach((right) => {
        // let oldRight = this.oldRights.find((oldR) => { return oldR.ID === right.ID })
        let oldActions = this.oldActions.get(right.ID)
        if (oldActions && (oldActions !== right.actions)) { // oldRight.attribute roleName state do not changed
          rows.push(right)
        }
      })
      return rows
    },
    dbRights () {
      // touch a reactive variable to made this computed reactive when rightsFromDb retrieved from server
      // without observing a huge rightsFromDb array
      return this.rightsFromDb
        ? this.rightsFromDb.filter(right => right.state === this.selectedState)
        : []
    },
    currentRights () {
      let newR = this.createdRights.filter(right => right.state === this.selectedState)
      return [...this.dbRights, ...newR]
    },
    emptyAttributes () {
      let allAttrs = this.selectedEntity ? Object.values(this.$UB.connection.domain.get(this.selectedEntity).attributes) : []
      return allAttrs.filter(attr => !this.usedAttributes.includes(attr.name))
    },
    needSave () {
      return this.changedRights.length > 0 || this.createdRights.some(cr => cr.actions !== 0)
    },

    tableData () {
      return [...this.usedAttributes].sort().map(code => ({ code }))
    },

    tableColumns () {
      const columns = []
      const attributeColumn = {
        id: 'code',
        label: 'uba_als.attribute'
      }
      const removeActionColumn = {
        id: 'removeAction',
        width: 60
      }
      columns.push(attributeColumn)
      for (const role of this.checkedRoles) {
        columns.push({
          id: this.roleColumnPrefix + role,
          label: role,
          headerAlign: 'center'
        })
      }
      columns.push(removeActionColumn)
      return columns
    }
  },
  methods: {
    setForAllAttributes (action, roleName) {
      this.currentRights.forEach(right => {
        if (right.roleName === roleName) {
          right.actions = action
        }
      })
    },
    doOnDataChanged (currentValue, role) {
      this.createdRights[this.createdRights.findIndex(cr => cr.roleName === role)].actions = currentValue
      this.rightsFromDbCounter += 1
    },
    createRightForRole (role) {
      this.usedAttributes.forEach(attr => this.createRightByRoleAttr(role, attr))
    },
    createRightByRoleAttr (role, attr) {
      if (!this.currentRights.some(right =>
        right.attribute === attr &&
        right.roleName === role)) {
        this.createdRights.push({
          state: this.selectedState,
          entity: this.selectedEntity,
          attribute: attr,
          roleName: role,
          actions: 0
        })
      }
    },
    checkBoxChange (role) {
      if (this.checkedRoles.includes(role)) {
        this.createRightForRole(role)
      }
    },
    doCheckAllUsedRoles () {
      let dbRights = this.dbRights
      let usedRoles = this.roleList.filter(roleName => { // at last one rule for this role + state exists in uba_als
        return dbRights.findIndex(r => r.roleName === roleName) !== -1
      })
      let unchecked = usedRoles.filter(role => this.checkedRoles.indexOf(role) === -1)
      unchecked.forEach(role => this.createRightForRole(role))
      this.checkedRoles = usedRoles
    },
    doCheckAllRoles () {
      let unchecked = this.roleList.filter(role => this.checkedRoles.indexOf(role) === -1)
      unchecked.forEach(role => this.createRightForRole(role))
      this.checkedRoles = this.roleList
    },
    doUnCheckAllRoles () {
      this.checkedRoles = []
    },
    onEmptyAttributesClick (item) {
      this.addRow(item.name)
      this.popoverVisible = this.emptyAttributes.length !== 0
    },
    setUsedAttributes () {
      // this.usedAttributes = this.currentRights.map(right => right.attribute).filter((value, index, self) => self.indexOf(value) === index)
      this.usedAttributes = this.currentRights.map(right => right.attribute).filter((value, index, self) => self.indexOf(value) === index)
    },
    loadRightsFromDB () {
      if (!this.selectedEntity) return
      UB.Repository('uba_als').attrs(ALS_FIELD_LIST).where('entity', '=', this.selectedEntity).selectAsObject().then((rights) => {
        this.rightsFromDb = rights
        this.oldActions = new Map()
        // this.oldRights = rights.map((right) => { return { ...right } })
        rights.forEach(r => {
          this.oldActions.set(r.ID, r.actions)
        })
        this.rightsFromDbCounter += 1 // force calculated props to recalc
      })
    },
    generateDiffFile () {
      let output = ''
      let allRigts = [...this.changedRights.map(row => JSON.stringify({
        entity: 'uba_als',
        method: row.actions !== 0 ? 'update' : 'delete',
        execParams: row.actions === 0 ? { ID: row.ID } : { ID: row.ID, actions: row.actions }
      }, null, '\t')),
      ...this.createdRights.filter(cr => cr.actions !== 0).map(row => JSON.stringify({
        entity: 'uba_als',
        method: 'insert',
        execParams: row
      }, null, '\t'))]
      output = allRigts.join(');\n\nconn.run(')
      saveAs(
        new Blob([`conn.run(${output});`], { type: 'text/plain;charset=utf-8' }),
        `uba_als__${this.selectedEntity}__${new Date().toLocaleDateString()}-${new Date().toLocaleTimeString()}.txt`
      )
    },
    save () {
      if (this.needSave) {
        let requests = []
        this.changedRights.forEach(row => requests.push({
          entity: 'uba_als',
          method: row.actions !== 0 ? 'update' : 'delete',
          execParams: row
        }))
        this.createdRights.filter(cr => cr.actions !== 0).forEach(row => requests.push({
          entity: 'uba_als',
          method: 'insert',
          execParams: row
        }))
        this.$UB.connection.runTrans(requests).then(this.loadRightsFromDB.bind(this)).then(() => { this.createdRights = this.createdRights.filter(cr => cr.actions === 0) })
      }
    },
    addRow (attr) {
      this.usedAttributes.push(attr)
      this.checkedRoles.forEach(role => this.createRightByRoleAttr(role, attr))
    },
    deleteRow (attr) {
      let index = this.usedAttributes.indexOf(attr)
      if (index !== -1) {
        this.usedAttributes.splice(index, 1)
      }
      this.currentRights
        .filter(cr => cr.attribute === attr && cr.state === this.selectedState)
        .forEach(right => { right.actions = 0 })
    }
  },
  components: {
    ActionComponent
  }
}
</script>

<style>
  .uba_als__container{
    overflow: auto;
    height: 100%;
  }

  .als__actions {
    display: flex;
    justify-content: center;
  }

  .role-actions-component i:not(:last-child) {
    margin-right: 7px;
  }
</style>
