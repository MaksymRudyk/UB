<template>
  <div>
    <el-popover
      v-if="!disabled"
      v-model="dropdownVisible"
      :width="popperWidth"
      :popper-options="{
        appendToBody: true
      }"
      trigger="manual"
      popper-class="ub-select__options__reset-padding"
      :tabindex="-1"
      :disabled="disabled"
      @show="onShowDropdown"
      @hide="afterHide"
      @keydown.native.exact.down="changeSelected(1)"
      @keydown.native.exact.up="changeSelected(-1)"
      @keydown.native.enter="chooseOption"
      @keydown.native.esc.capture="cancelInput"
      @keydown.native.tab="leaveInput"
    >
      <div
        slot="reference"
        ref="input"
        class="ub-select-multiple__container"
        :class="{
          'is-focused': isFocused || dropdownVisible
        }"
      >
        <div class="ub-select-multiple__input-wrap">
          <el-tag
            v-for="option in displayedOptions"
            :key="option[valueAttribute]"
            :type="getTagType(option)"
            :closable="isOptionClosable(option[valueAttribute])"
            size="mini"
            class="ub-select-multiple__tag"
            :class="{
              'fixed': isOptionFixed(option[valueAttribute])
            }"
            @close="removeOption(option[valueAttribute])"
          >
            <i
              v-if="option.isDeleted"
              :title="$ut('recordWasDeleted')"
              class="u-icon-delete"
            />

            <i
              v-if="option.isUndefined"
              :title="$ut('select.valueIsUndefined', option[valueAttribute], getEntityName)"
              class="el-icon-warning"
            />

            {{ option.label }}
          </el-tag>

          <input
            v-model="queryDisplayValue"
            :readonly="readonly"
            class="ub-select-multiple__input"
            :placeholder="$ut(placeholder)"
            @focus="onFocus"
            @blur="onBlur"
            @keydown.exact.down.alt="readonly || onKeydownAltDown()"
            @keydown.exact.up.prevent
            @keydown.exact.down.prevent
          >
        </div>
        <div
          ref="icon-wrap"
          class="ub-select-multiple__icon-wrap"
        >
          <i
            v-if="clearable && value.length > 0 && !readonly"
            class="ub-select-multiple__icon u-icon-close"
            @click="clearSelected"
          />
          <i
            v-if="!readonly"
            class="ub-select-multiple__icon"
            :class="inputIconCls"
            @click="toggleDropdown"
          />
        </div>
      </div>

      <div v-if="options.length > 0 && !readonly">
        <div
          ref="options"
          class="ub-select__list-options"
        >
          <div
            v-for="option in options"
            :key="option[valueAttribute]"
            :ref="`option_${option[valueAttribute]}`"
            class="ub-select__option"
            :class="{
              'active': option[valueAttribute] === value,
              'selected': option[valueAttribute] === selectedOption,
              'fixed': isOptionFixed(option[valueAttribute])
            }"
            @click.prevent="chooseOption"
            @mouseenter="selectedOption = option[valueAttribute]"
          >
            <el-checkbox
              :value="value.includes(option[valueAttribute])"
            />
            {{ option[getDisplayAttribute] }}
          </div>
        </div>
        <el-row
          type="flex"
          class="ub-select__list-options--tags">
          <template v-for="button in dropdownButtons">
            <el-button
              v-if="button.visibility"
              :key="button.name"
              size="mini"
              style="margin: 5px"
              @click="button.handler"
            >
              {{ $ut(button.label) }}
            </el-button>
          </template>
        </el-row>
      </div>

      <div
        v-else
        style="text-align: center; padding: 10px"
      >
        {{ $ut('el.select.noData') }}
      </div>
    </el-popover>

    <div
      v-else
      class="ub-select-multiple__container disabled"
    >
      <div class="ub-select-multiple__input-wrap">
        <el-tag
          v-for="option in displayedOptions"
          :key="option[valueAttribute]"
          :type="getTagType(option)"
          size="mini"
          class="ub-select-multiple__tag"
          :class="{
            'fixed': isOptionFixed(option[valueAttribute])
          }"
        >
          <i
            v-if="option.isUndefined"
            :title="$ut('select.valueIsUndefined', option[valueAttribute], getEntityName)"
            class="el-icon-warning"
          />

          <i
            v-if="option.isDeleted"
            :title="$ut('recordWasDeleted')"
            class="u-icon-delete"
          />
          {{ option.label }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script>
const { debounce } = require('throttle-debounce')
const clickOutsideDropdown = require('./mixins/clickOutsideDropdown')

/**
 * Multy-select component mapped to Entity
 */
export default {
  name: 'USelectMultiple',

  mixins: [clickOutsideDropdown],

  props: {
    /**
     * Selected IDs array
     * @model
     */
    value: {
      type: Array,
      required: true
    },
    /**
     * Attribute which is the value for v-model
     */
    valueAttribute: {
      type: String,
      default: 'ID'
    },
    /**
     * Function which return UBRepository
     */
    repository: Function,
    /**
     * Name of entity. If repository is set entityName will be ignored
     */
    entityName: String,
    /**
     * Attribute which is display value of options
     */
    displayAttribute: String,
    /**
     * Set disable status
     */
    disabled: Boolean,
    /**
     * Add clear icon
     */
    clearable: Boolean,
    /**
     * Input placeholder.
     */
    placeholder: {
      type: String,
      default: ''
    },
    /**
     * Set readonly status
     */
    readonly: Boolean,
    /**
     * An array with IDs of non-removable elements
     */
    fixedItems: {
      type: Array,
      default: () => []
    },

    /**
     * Search by include (may be slow) or by first letters (faster)
     */
    searchStrategy: {
      type: String,
      default: 'like',
      validator: value => ['like', 'startsWith'].includes(value)
    },
    /**
     * Dropdown buttons definition array. Can contains additional dropdown buttons,
     */
    additionalButtons: {
      type: Array,
      default: () => []
    }
  },

  data () {
    return {
      loading: false,
      query: '', // search query
      options: [],
      pageNum: 0, // page which load. will change if you click more btn
      pageSize: 20, // count of options which loads by 1 request
      moreVisible: false, // shows when the request has an answer what is the next page
      dropdownVisible: false,
      popperWidth: 300, // by default 300, will change after popper show
      selectedOption: null, // ID of option which user hover or focused by arrows
      prevQuery: '', // when user click show more need to track prev query value for send same request to next page
      displayedOptions: [],
      isFocused: false
    }
  },

  computed: {
    getEntityName () {
      return this.entityName || this.repository().entityName
    },

    getDisplayAttribute () {
      return this.displayAttribute || this.$UB.connection.domain.get(this.getEntityName).descriptionAttribute
    },

    isExistDeleteDate () {
      const schema = this.$UB.connection.domain.get(this.getEntityName)
      return 'mi_deleteDate' in schema.attributes
    },

    inputIconCls () {
      let icon
      const arrowPrefix = 'u-icon-arrow-'

      if (this.dropdownVisible) {
        icon = arrowPrefix + 'up'
      } else {
        icon = arrowPrefix + 'down'
      }

      if (this.loading) {
        icon = 'el-icon-loading'
      }

      return icon
    },

    /**
     * need for update displayed query if original option query changed
     * but show dropdown and fetch date just if changed queryDisplayValue
     */
    queryDisplayValue: {
      get () {
        return this.query
      },

      set (value) {
        this.query = value

        this.debouncedFetch(value, () => {
          this.dropdownVisible = true
        })
      }
    },

    dropdownButtons () {
      const moreButton = {
        name: 'moreButton',
        label: 'USelectEntity.dropdown.moreButton',
        visibility: this.moreVisible,
        handler: () => this.showMore()
      }
      return [...this.additionalButtons, moreButton]
    }
  },

  watch: {
    /**
     * Update tags when value is changed
     */
    value: {
      immediate: true,
      async handler (value) {
        this.displayedOptions = await this.getFormattedOptions(value)
      }
    }
  },

  methods: {
    /**
     * @return {ClientRepository}
     */
    getRepository () {
      if (this.repository) {
        return this.repository()
      }

      return this.$UB.Repository(this.entityName)
        .attrs(this.valueAttribute, this.getDisplayAttribute)
        .orderBy(this.getDisplayAttribute)
    },

    async fetchPage (query, pageNum = 0) {
      this.loading = true
      this.prevQuery = query
      this.pageNum = pageNum

      const data = await this.getRepository()
        .whereIf(query, this.getDisplayAttribute, this.searchStrategy, query)
        .start(pageNum * this.pageSize)
        .limit(this.pageSize + 1)
        .select()

      if (data.length <= this.pageSize) {
        this.moreVisible = false
      } else {
        this.moreVisible = true
        data.length -= 1
      }
      if (pageNum === 0) {
        this.options.splice(0, this.options.length)
      }
      this.options.push(...data)
      if (this.options.length) {
        const currentValueIndex = this.options.findIndex(i => i[this.valueAttribute] === this.value)
        const index = currentValueIndex === -1 ? 0 : currentValueIndex
        this.selectedOption = this.options[index][this.valueAttribute]
      } else {
        this.selectedOption = null
      }

      this.loading = false
    },

    debouncedFetch: debounce(600, function (query, resolve, reject) {
      this.fetchPage(query).then(resolve, reject)
    }),

    async fetchDisplayValues (IDs) {
      this.loading = true
      const repositoryClone = this.getRepository().clone().clearWhereList()
      const data = await repositoryClone
        .where(this.valueAttribute, 'in', IDs)
        .attrsIf(this.isExistDeleteDate, 'mi_deleteDate')
        .misc({
          __allowSelectSafeDeleted: true
        })
        .select()
      this.loading = false

      return data
    },

    /**
     * Get label and isDeleted status for displayedOptions
     * fetch labels from server just if is not already fetched in options
     *
     * @param {array<number>} attributeValues list of attribute values
     * @returns {Promise<Array>}
     */
    async getFormattedOptions (attributeValues) {
      const result = []
      for (const attributeValue of attributeValues) {
        const option = this.options.find(o => o[this.valueAttribute] === attributeValue)
        if (option) {
          result.push({
            [this.valueAttribute]: attributeValue,
            label: option[this.getDisplayAttribute]
          })
        } else {
          result.push({
            [this.valueAttribute]: attributeValue
          })
        }
      }
      const shouldFetch = result.filter(o => !Object.prototype.hasOwnProperty.call(o, 'label'))
        .map(o => o[this.valueAttribute])

      if (shouldFetch.length) {
        const responseData = await this.fetchDisplayValues(shouldFetch)
        for (const fetchedID of shouldFetch) {
          const responseItem = responseData.find(i => i[this.valueAttribute] === fetchedID)
          const option = result.find(i => i[this.valueAttribute] === fetchedID)
          if (responseItem) {
            option.label = responseItem[this.getDisplayAttribute]
            if (this.isExistDeleteDate) {
              const isDeleted = responseItem.mi_deleteDate.getTime() < Date.now()
              if (isDeleted) {
                option.isDeleted = true
              }
            }
          } else {
            option.label = fetchedID
            option.isUndefined = true
          }
        }
      }
      return result
    },

    onShowDropdown () {
      this.popperWidth = this.$refs.input.offsetWidth
    },

    afterHide () {
      this.query = ''
    },

    // emits when user click on option or click enter when option is focused
    chooseOption () {
      if (this.selectedOption === null || this.isOptionFixed(this.selectedOption)) return
      const isChecked = this.value.includes(this.selectedOption)
      if (isChecked) {
        this.removeOption(this.selectedOption)
      } else {
        this.$emit('input', this.value.concat(this.selectedOption))
      }
    },

    removeOption (ID) {
      this.$emit('input', this.value.filter(i => i !== ID))
    },

    cancelInput (e) {
      if (this.dropdownVisible) {
        /*
         * need to stopPropagation only if this is necessary,
         * otherwise the handler will intercept other actions on the ESC,
         * for example, closing dialog
         */
        e.stopPropagation()
        this.selectedOption = this.value
        this.dropdownVisible = false
      }
    },

    leaveInput () {
      if (this.dropdownVisible) {
        this.query = ''
        this.dropdownVisible = false
      }
    },

    async onKeydownAltDown () {
      if (!this.dropdownVisible) {
        await this.fetchPage()
        this.dropdownVisible = true
      }
    },

    async showMore () {
      await this.fetchPage(this.prevQuery, this.pageNum + 1)
      const { scrollHeight } = this.$refs.options
      this.$refs.options.scrollTop = scrollHeight
      this.$refs.input.click()
    },

    async toggleDropdown () {
      const isTurnedOn = !this.dropdownVisible

      if (isTurnedOn) {
        await this.fetchPage()
      }

      // make dropdown visible after fetch
      this.dropdownVisible = isTurnedOn
    },

    /**
     * emits when user press arrows
     * @param {number} direction available params -1/1 for up/down
     */
    changeSelected (direction) {
      const index = this.options.findIndex(o => o[this.valueAttribute] === this.selectedOption)
      const nextIndex = index + direction
      const lessMin = nextIndex < 0
      const moreMax = nextIndex > this.options.length - 1
      const inRange = !lessMin && !moreMax
      if (inRange) {
        this.selectedOption = this.options[nextIndex][this.valueAttribute]
      }
      if (this.dropdownVisible && this.options.length > 0) {
        const el = this.$refs[`option_${this.selectedOption}`][0]
        el.scrollIntoView({ block: 'nearest' })
      }
    },

    clearSelected () {
      const filterFixed = this.value.filter(i => i === this.isOptionFixed(i))
      this.$emit('input', filterFixed)
    },

    isOptionClosable (option) {
      return !(this.readonly || !!this.isOptionFixed(option))
    },

    isOptionFixed (option) {
      return this.fixedItems.find(fi => fi === option) && this.value.find(v => v === option)
    },

    onFocus () {
      this.isFocused = true
      this.$emit('focus')
    },

    onBlur () {
      this.isFocused = false
      this.$emit('blur')
    },

    getTagType ({ isUndefined, isDeleted }) {
      if (isUndefined) {
        return 'warning'
      } else if (isDeleted) {
        return 'danger'
      } else {
        return 'info'
      }
    }
  }
}
</script>

<style>
.ub-select__list-options--tags{
  --padding: 4px;
  border-top: 1px solid hsl(var(--hs-border), calc(var(--l-layout-border-light) -  10%));
  padding-top: var(--padding);
  padding-bottom: var(--padding);
}

.ub-select-multiple__container{
  border: 1px solid hsl(var(--hs-border), var(--l-input-border-default));
  border-radius: var(--border-radius);
  padding-left: 5px;
  background-color: hsl(var(--hs-background), var(--l-background-inverse));
  display: flex;
}

.ub-select-multiple__container.disabled{
  background-color: hsl(var(--hs-background), var(--l-background-default));
  border-color: hsl(var(--hs-border), var(--l-input-border-disabled));
  color: hsl(var(--hs-text), var(--l-text-disabled));
  cursor: not-allowed;
  min-height: 36px;
}

.ub-select-multiple__container.is-focused{
  position: relative;
  border-color: hsl(var(--hs-primary), var(--l-input-border-default));
}

.ub-select-multiple__input-wrap{
  display: flex;
  flex-wrap: wrap;
  margin-top: 7px;
  flex-grow: 1;
  overflow: hidden;
}

.ub-select-multiple__input{
  font-size: 16px;
  border: none;
  flex-grow: 1;
  min-width: 100px;
  background: none;
  margin-bottom: 7px;
  margin-left: 10px;
  height: 20px;
}

.ub-select-multiple__input::placeholder{
  color: hsl(var(--hs-text), var(--l-text-label));
}

.ub-select-multiple__icon-wrap {
  display: flex;
  align-items: center;
}

.ub-select-multiple__icon{
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-width: 34px;
  color: hsl(var(--hs-control), var(--l-state-default));
  cursor: pointer;
}

.ub-select-multiple__tag {
  position: relative;
  padding-right: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 4px;
  margin-bottom: 7px;
}

.ub-select-multiple__tag.fixed {
  padding-right: 10px;
  background-color: hsl(var(--hs-background), var(--l-background-default));
  border-color: hsl(var(--hs-border), var(--l-input-border-default));
}

.ub-select__option.selected.fixed {
  background-color: hsl(var(--hs-primary), var(--l-background-default));
}

.ub-select__option.fixed .el-checkbox__inner {
  background-color: hsl(var(--hs-primary), var(--l-background-default));
  border-color: hsl(var(--hs-primary), var(--l-input-border-default));
}

.ub-select-multiple__tag .el-icon-close {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translate(0, -50%) scale(0.7);
}

.ub-select-multiple__container.disabled .ub-select-multiple__tag{
  padding-right: 5px;
}
</style>
