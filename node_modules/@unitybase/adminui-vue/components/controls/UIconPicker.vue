<template>
  <div>
    <el-input
      v-model="iconClass"
      class="ub-icon-select__input-group"
    >
      <i
        slot="prepend"
        :class="value"
      />
      <el-button
        slot="append"
        icon="u-icon-desktop-swap"
        @click="dialogVisible = true"
      />
    </el-input>

    <el-dialog
      :visible.sync="dialogVisible"
      append-to-body
      width="700px"
      :close-on-click-modal="false"
      @open="onOpenDialog"
    >
      <el-input
        v-model="searchQuery"
        suffix-icon="u-icon-search"
        :placeholder="$ut('Search')"
      />

      <div class="ub-icon-select__list">
        <h3>UB icons</h3>
        <div
          v-if="getUbIcons.length > 0"
          class="ub-icon-select__list-wrapper"
        >
          <span
            v-for="icon in getUbIcons"
            :key="icon"
            class="ub-icon-select__item"
            :class="{
              selected: icon === selectedIcon
            }"
            @click="selectedIcon = icon"
          >
            <i :class="icon" />
            <span>{{ icon }}</span>
          </span>
        </div>
        <div v-else>
          Not found
        </div>

        <h3>Element ui icons</h3>

        <div
          v-if="getElIcons.length > 0"
          class="ub-icon-select__list-wrapper"
        >
          <span
            v-for="icon in getElIcons"
            :key="icon"
            class="ub-icon-select__item"
            :class="{
              selected: icon === selectedIcon
            }"
            @click="selectedIcon = icon"
          >
            <i :class="icon" />
            <span>{{ icon }}</span>
          </span>
        </div>
        <div v-else>
          Not found
        </div>

        <h3>Font awesome 5 free icons</h3>

        <div
          v-if="getFaIcons.length > 0"
          class="ub-icon-select__list-wrapper"
        >
          <span
            v-for="icon in getFaIcons"
            :key="icon"
            class="ub-icon-select__item"
            :class="{
              selected: icon === selectedIcon
            }"
            @click="selectedIcon = icon"
          >
            <i :class="icon" />
            <div>{{ icon }}</div>
          </span>
        </div>
        <div v-else>
          Not found
        </div>
      </div>

      <template slot="footer">
        <u-form-row :label="label">
          <el-input
            readonly
            :value="selectedIcon"
          />
        </u-form-row>

        <el-button
          type="primary"
          :disabled="!selectedIcon"
          @click="chooseIcon"
        >
          Choose
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
const FA_HELPERS = {
  '.el-icon--right': true,
  '.el-icon--left': true,
  '.fa-xs': true,
  '.fa-sm': true,
  '.fa-lg': true,
  '.fa-1x': true,
  '.fa-2x': true,
  '.fa-3x': true,
  '.fa-4x': true,
  '.fa-5x': true,
  '.fa-6x': true,
  '.fa-7x': true,
  '.fa-8x': true,
  '.fa-9x': true,
  '.fa-10x': true,
  '.fa-fw': true,
  '.fa-ul': true,
  '.fa-ul > li': true,
  '.fa-li': true,
  '.fa-li.fa-lg': true,
  '.fa-border': true,
  '.fa-pull-left': true,
  '.fa-pull-right': true,
  '.fa-spin': true,
  '.fa-pulse': true,
  '.fa-rotate-90': true,
  '.fa-rotate-180': true,
  '.fa-rotate-270': true,
  '.fa-flip-horizontal': true,
  '.fa-flip-vertical': true,
  '.fa-stack': true,
  '.fa-stack-1x': true,
  '.fa-stack-2x': true,
  '.fa-stack-1x, .fa-stack-2x': true,
  '.fa-inverse': true,
  '.fa-space': true
}

/**
 * Pick an icon from available iconic fonts
 */
export default {
  name: 'UIconPicker',

  props: {
    label: {
      type: String,
      default: ''
    },
    value: {
      type: String,
      default: ''
    }
  },

  data () {
    return {
      elIcons: [],
      faIcons: [],
      ubIcons: [],
      dialogVisible: false,
      searchQuery: '',
      selectedIcon: null,
      isInited: false
    }
  },

  computed: {
    iconClass: {
      get () {
        return this.value
      },
      set (value) {
        this.$emit('change', value)
      }
    },

    getUbIcons () {
      return this.ubIcons.filter(this.iconFilter)
    },

    getElIcons () {
      return this.elIcons.filter(this.iconFilter)
    },

    getFaIcons () {
      return this.faIcons.filter(this.iconFilter)
    }
  },

  methods: {
    iconFilter (icon) {
      return icon.toLowerCase().indexOf(this.searchQuery.toLowerCase()) !== -1
    },

    async initIcons () {
      let allFaAvailable = true
      try {
        const allFaIcons = await this.$UB.get('/models/adminui-vue/dist/fonts/all-fa-icons.json')
        this.faIcons = allFaIcons.data
      } catch (e) { // fallback in case json not found
        allFaAvailable = false
      }
      for (const ss of document.styleSheets) {
        for (const r of ss.cssRules) {
          if (r.selectorText) {
            if (r.selectorText.startsWith('.u-icon-')) {
              const icon = r.selectorText.split(':')[0].substr(1)
              if (!this.ubIcons.includes(icon)) {
                this.ubIcons.push(icon)
              }
            }
            if (r.selectorText.startsWith('.el-icon')) {
              const icon = r.selectorText.split(':')[0].substr(1)
              const className = '.' + icon
              const isDuplicate = this.elIcons.includes(icon)
              const isHelper = this.isHelperCls(className)
              if (!isDuplicate && !isHelper) {
                this.elIcons.push(icon)
              }
            }
            if (!allFaAvailable) {
              const st = r.selectorText
              if (st.startsWith('.fa-') && st.endsWith(':before')) {
                const cls = st.split(':')[0].substr(1)
                const icon = 'fas ' + cls
                this.faIcons.push(icon)
              }
            }
          }
        }
      }
    },

    async onOpenDialog () {
      this.selectedIcon = this.value ? this.value : null
      this.searchQuery = ''
      if (!this.isInited) {
        await this.initIcons()
        this.isInited = true
      }
    },

    isHelperCls (cls) {
      return FA_HELPERS[cls] === true
    },

    chooseIcon () {
      this.$emit('change', this.selectedIcon)
      this.dialogVisible = false
    }
  }

}
</script>

<style>
.ub-icon-select__list {
  height: 45vh;
  overflow-y: auto;
  overflow-x: visible;
  margin: 10px 0;
  padding-bottom: 20px;
}

.ub-icon-select__list-wrapper {
  display: flex;
  flex-wrap: wrap;
}

.ub-icon-select__item {
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  height: 90px;
  width: 16.6667%;
  padding: 5px;
  cursor: pointer;
}

.ub-icon-select__item.selected {
  color: hsl(var(--hs-primary), var(--l-state-default))
}

.ub-icon-select__item i {
  margin-bottom: 10px;
  font-size: 36px;
}

.ub-icon-select__input-group .el-input-group__prepend {
  height: 30px;
  width: 16px;
  padding: 0;
  padding-top: 0px;
  position: absolute;
  top: 1px;
  left: 15px;
  display: flex;
  align-items: center;
  background-color: #fff;
  border: none;
  font-size: 16px;
}

.ub-icon-select__input-group .el-input__inner {
  padding-left: 45px;
  border-bottom-left-radius: 4px;
  border-top-left-radius: 4px;
}
</style>

<docs>
### Usage
```vue
<template>
  <u-icon-picker
    :value="iconCls"
    @change="iconCls = $event"
  ></u-icon-picker>
</template>
<script>
  export default {
    data () {
      return {
        iconCls: 'u-icon-save'
      }
    }
  }
</script>
```
</docs>
