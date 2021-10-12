<template>
  <u-form-row
    :label="entitySchema.attributes.parentID.caption"
    required
    :error="$v.desktopID.$error"
  >
    <el-input
      :value="activeShortcut.caption"
      readonly
    >
      <el-button
        slot="append"
        icon="u-icon-edit"
        @click="dialogVisible = true"
      />
    </el-input>

    <el-dialog
      :visible.sync="dialogVisible"
      append-to-body
      width="400px"
      :close-on-click-modal="false"
      @open="onOpen"
    >
      <el-input
        v-model="query"
        suffix-icon="u-icon-search"
        clearable
        :placeholder="$ut('Search')"
      />

      <div class="ub-shortcut-tree__container">
        <el-tree
          ref="tree"
          :data="desktops"
          default-expand-all
          highlight-current
          :current-node-key="selectedShortcut.hasOwnProperty('ID') ? selectedShortcut.ID : null"
          node-key="ID"
          :expand-on-click-node="false"
          :props="{
            label: 'caption'
          }"
          :filter-node-method="filterNode"
          @node-click="selectNode"
        />
      </div>

      <u-form-row
        :label="entitySchema.attributes.parentID.caption"
        :label-width="120"
      >
        <el-input
          :value="selectedShortcut.caption"
          readonly
          :placeholder="$ut('chooseShortcutFolder')"
        />
      </u-form-row>

      <template slot="footer">
        <el-button @click="dialogVisible = false">
          {{ $ut('el.messagebox.cancel') }}
        </el-button>
        <el-button
          type="primary"
          :disabled="!selectedShortcut.hasOwnProperty('ID')"
          @click="save"
        >
          {{ $ut('el.messagebox.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </u-form-row>
</template>

<script>
const { mapInstanceFields } = require('@unitybase/adminui-vue')

export default {
  name: 'ShortcutTree',

  inject: ['$v', 'entitySchema'],

  data () {
    return {
      menu: [],
      loading: true,
      dialogVisible: false,
      query: '',
      desktops: [],
      shortcuts: [],
      selectedShortcut: {}
    }
  },

  computed: {
    ...mapInstanceFields(['parentID', 'desktopID']),

    activeShortcut () {
      if (this.loading) return {}

      if (this.desktopID) {
        if (this.parentID) {
          const shortcut = this.shortcuts.find(s => s.ID === this.parentID)
          if (shortcut) {
            return shortcut
          }
        } else {
          const desktop = this.desktops.find(d => d.ID === this.desktopID)
          if (desktop) {
            return desktop
          }
        }
      } else {
        return {}
      }
    }
  },

  watch: {
    query (val) {
      this.$refs.tree.filter(val)
    }
  },

  mounted () {
    this.initMenu()
  },

  methods: {
    loadDesktops () {
      return this.$UB.connection.Repository('ubm_desktop')
        .attrs('ID', 'caption')
        .orderBy('caption')
        .select()
    },

    loadShortcuts () {
      return this.$UB.connection.Repository('ubm_navshortcut')
        .attrs('ID', 'parentID', 'caption', 'desktopID', 'iconCls', 'displayOrder', 'isFolder')
        .where('isFolder', '=', true)
        .orderBy('desktopID').orderBy('parentID')
        .orderBy('displayOrder').orderBy('caption')
        .select()
    },

    initMenu () {
      this.loading = true
      Promise.all([
        this.loadDesktops(),
        this.loadShortcuts()
      ]).then(([desktops, shortcuts]) => {
        for (const shortcut of shortcuts) {
          if (shortcut.parentID) {
            const parent = shortcuts.find(s => s.ID === shortcut.parentID)
            if (parent.children) {
              parent.children.push(shortcut)
            } else {
              parent.children = [shortcut]
            }
          } else {
            const desktop = desktops.find(d => d.ID === shortcut.desktopID)
            if (desktop) {
              if (desktop.children) {
                desktop.children.push(shortcut)
              } else {
                desktop.children = [shortcut]
              }
            }
          }
        }

        this.shortcuts = shortcuts
        this.desktops = desktops
        this.loading = false
      })
    },

    filterNode (value, data) {
      if (!value) return true
      return data.caption.toLowerCase().indexOf(value.toLowerCase()) !== -1
    },

    selectNode (node) {
      this.selectedShortcut = node
    },

    save () {
      const isDesktop = !this.selectedShortcut.hasOwnProperty('desktopID')
      if (isDesktop) {
        this.$store.commit('SET_DATA', {
          key: 'desktopID',
          value: this.selectedShortcut.ID
        })
        this.$store.commit('SET_DATA', {
          key: 'parentID',
          value: null
        })
      } else {
        this.$store.commit('SET_DATA', {
          key: 'desktopID',
          value: this.selectedShortcut.desktopID
        })
        this.$store.commit('SET_DATA', {
          key: 'parentID',
          value: this.selectedShortcut.ID
        })
      }

      this.dialogVisible = false
    },

    onOpen () {
      if (this.activeShortcut.hasOwnProperty('ID')) {
        this.selectedShortcut = {
          ID: this.activeShortcut.ID,
          caption: this.activeShortcut.caption,
          desktopID: this.activeShortcut.desktopID
        }
      } else {
        this.selectedShortcut = {}
      }
      this.query = ''
    }
  }
}
</script>

<style>
.ub-shortcut-tree__container{
  overflow-y: auto;
  height: 40vh;
  margin-top: 10px;
  margin-bottom: 40px;
}
</style>
