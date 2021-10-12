<template>
  <div class="u-form-layout">
    <u-form-container
      v-loading="loading"
      label-position="top"
    >
      <u-grid template-columns="1fr 40%">
        <div>
          <u-form-row
            required
            :label="$ut('messageType')"
            :error="$v.messageType.$error && $ut('isRequiredFieldFmt', $ut('messageType'))"
          >
            <u-select-enum
              v-model="messageType"
              :e-group="$UB.connection.domain.entities.ubs_message.attributes.messageType.enumGroup"
              @input="$v.messageType.$touch()"
            />
          </u-form-row>
          <u-form-row
            required
            :label="$ut('message')"
            :error="$v.messageBody.$error && $ut('isRequiredFieldFmt', $ut('message'))"
          >
            <el-input
              v-model="messageBody"
              type="textarea"
              :rows="7"
              resize="none"
              @change="$v.messageBody.$touch()"
            />
          </u-form-row>
          <u-form-row :label="$ut('byDateRange')">
            <u-date-picker
              v-model="dateRange"
              type="datetimerange"
              :picker-options="getPickerOptions()"
              :clearable="false"
            />
          </u-form-row>
        </div>
        <u-form-row>
          <u-form-row :label="$ut('addByRole')">
            <u-grid>
              <u-select-entity
                v-model="roleModel"
                entity-name="uba_role"
              />
              <u-button
                color="success"
                appearance="plain"
                icon="u-icon-add"
                @click="addByRole"
              >
                {{ $ut('actionAdd') }}
              </u-button>
            </u-grid>
          </u-form-row>
          <u-form-row :label="$ut('addUser')">
            <u-grid>
              <u-select-entity
                v-model="userModel"
                entity-name="uba_user"
              />
              <u-button
                color="success"
                appearance="plain"
                icon="u-icon-add"
                @click="addUser"
              >
                {{ $ut('actionAdd') }}
              </u-button>
            </u-grid>
          </u-form-row>
          <u-form-row :label="$ut('selectedUsers')" />
          <div class="ub-notification__add__users-list">
            <template v-if="selectedUsers.length">
              <div
                v-for="user in selectedUsers"
                :key="user.ID"
                class="ub-notification__users-list__item"
              >
                {{ user.name }}
                <u-button
                  color="danger"
                  appearance="plain"
                  icon="u-icon-delete"
                  size="small"
                  style="margin-left: auto"
                  @click="removeUser(user.ID)"
                />
              </div>
            </template>
            <div
              v-else
              class="ub-empty-text"
            >
              {{ $ut('allUsers') }}
            </div>
          </div>
          <div style="direction: rtl">
            <u-button
              color="primary"
              right-icon="u-icon-send"
              style="margin-top: 10px; width: 100%"
              @click="save"
            >
              {{ $ut('send') }}
            </u-button>
          </div>
        </u-form-row>
      </u-grid>
    </u-form-container>
  </div>
</template>

<script>
const required = require('vuelidate/lib/validators/required').default
const { Form } = require('@unitybase/adminui-vue')

module.exports.mount = cfg => {
  Form(cfg).mount()
}

module.exports.default = {
  data () {
    return {
      roleModel: null,
      userModel: null,
      messageType: null,
      selectedUsers: [],
      messageBody: '',
      loading: false,
      /**
       * by default from now to next year
       * @type {Array}
       */
      dateRange: [new Date(), new Date(new Date().getFullYear() + 1, 0)],
      ID: null,
      mi_modifyDate: null
    }
  },

  inject: ['$formServices'],

  validations: {
    messageType: { required },
    messageBody: { required }
  },

  created () {
    this.addNew()
  },

  methods: {
    isDirty () {
      return this.$v.$anyDirty
    },
    /**
     * adds a new user to the list only if it is not in the list.
     * cleans `userModel`
     */
    async addUser () {
      if (this.userModel) {
        this.loading = true
        const user = await this.$UB.connection.Repository('uba_user')
          .attrs('ID', 'name')
          .selectById(this.userModel)
        const notExist = this.selectedUsers.findIndex(u => u.ID === user.ID) === -1
        if (notExist) this.selectedUsers.push(user)
        this.userModel = null
        this.loading = false
      }
    },
    /**
     * adds new users to the list only if it is not in the list.
     * cleans `roleModel`
     */
    async addByRole () {
      if (this.roleModel) {
        this.loading = true
        const users = await this.$UB.connection
          .Repository('uba_userrole')
          .attrs('ID', 'roleID', 'userID', 'userID.name')
          .where('roleID', '=', this.roleModel)
          .select()

        for (const user of users) {
          const notExist = this.selectedUsers.findIndex(u => u.ID === user.userID) === -1
          if (notExist) {
            this.selectedUsers.push({
              ID: user.userID,
              name: user['userID.name']
            })
          }
        }

        this.roleModel = null
        this.loading = false
      }
    },
    /**
     * remove current user by ID
     * @param  {Number} ID
     */
    removeUser (ID) {
      const index = this.selectedUsers.findIndex(u => u.ID === ID)
      if (index !== -1) this.selectedUsers.splice(index, 1)
    },
    /**
     * show dialog before close form
     * @param  {Function} done callback which called when user click on some action
     */
    async beforeClose (done) {
      const confirm = await $App.dialogYesNo('close', 'vyUvereny')
      if (confirm) done()
    },
    /**
     * validate form before send save requests.
     * Then close form
     */
    async save () {
      this.$v.$touch()
      if (this.$v.$anyError) return 'error'
      this.loading = true
      await this.insertMessage()
      await this.insertRecipients()
      this.$formServices.forceClose()
      this.$notify({
        type: 'success',
        message: this.$ut('messageSentSuccessfully')
      })
      this.$v.$reset()
      this.loading = false
    },
    /**
     * creates ID and mi_modifyDate form new form
     */
    async addNew () {
      this.loading = true
      const resp = await this.$UB.connection.addNew({
        entity: 'ubs_message_edit',
        fieldList: ['complete', 'messageType', 'startDate', 'expireDate', 'messageBody', 'ID', 'mi_modifyDate']
      })
      const parsedResp = this.$UB.LocalDataStore.selectResultToArrayOfObjects(resp)
      this.ID = parsedResp[0].ID
      this.mi_modifyDate = parsedResp[0].mi_modifyDate
      this.loading = false
    },
    /**
     * insert message to DB.
     * if dateRange is unset - will set range from today to start of next year
     */
    async insertMessage () {
      if (this.dateRange === null) this.dateRange = [new Date(), new Date(new Date().getFullYear() + 1, 0)]
      await this.$UB.connection.insert({
        entity: 'ubs_message_edit',
        fieldList: ['complete', 'messageType', 'startDate', 'expireDate', 'messageBody', 'ID', 'mi_modifyDate'],
        execParams: {
          ID: this.ID,
          complete: true,
          messageType: this.messageType,
          startDate: this.dateRange[0],
          expireDate: this.dateRange[1],
          messageBody: this.messageBody,
          mi_modifyDate: this.mi_modifyDate
        }
      })
    },
    /**
     * if selectedUsers is empty will be attach all users to current record
     * else will attach just selected users
     */
    async insertRecipients () {
      const users = []
      if (this.selectedUsers.length) {
        for (const user of this.selectedUsers) {
          users.push(user.ID)
        }
      } else {
        const allUsers = await this.$UB.connection
          .Repository('uba_user')
          .attrs('ID')
          .selectAsArray()
        for (const item of allUsers.resultData.data) {
          users.push(item[0])
        }
      }
      await this.$UB.connection
        .runTrans(users.map(userID => ({
          method: 'insert',
          entity: 'ubs_message_recipient',
          fieldList: ['ID', 'userID', 'messageID'],
          execParams: {
            messageID: this.ID,
            userID
          }
        })))
    },
    getPickerOptions () {
      return {
        /**
         * disable all dates before today
         * @param  {Date} time
         * @return {Boolean}
         */
        disabledDate: time => {
          return time.getTime() < Date.now() - (24 * 60 * 60 * 1000) // 24 hours before now
        },
        shortcuts: [{
          text: this.$ut('nextWeek'),
          onClick (picker) {
            const end = new Date()
            const start = new Date()
            end.setTime(start.getTime() + 3600 * 1000 * 24 * 7)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: this.$ut('nextMonth'),
          onClick (picker) {
            const end = new Date()
            const start = new Date()
            end.setTime(start.getTime() + 3600 * 1000 * 24 * 30)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: this.$ut('next3Months'),
          onClick (picker) {
            const end = new Date()
            const start = new Date()
            end.setTime(start.getTime() + 3600 * 1000 * 24 * 90)
            picker.$emit('pick', [start, end])
          }
        }]
      }
    }
  }
}
</script>

<style>
.ub-notification__add__users-list{
  border-top: 1px solid hsl(var(--hs-border), var(--l-layout-border-default));
  margin-top: 10px;
  flex-grow: 1;
  overflow-y: auto;
  max-height: 170px;
}

.ub-notification__users-list__item{
  border-bottom: 1px solid hsl(var(--hs-border), var(--l-layout-border-default));
  padding: 5px;
  display: flex;
  align-items: center;
}
</style>
