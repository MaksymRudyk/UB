<template>
  <div class="ub-sidebar">
    <div
      class="u-sidebar__collapse-button"
      @click="isCollapsed = !isCollapsed"
    >
      <i :class="isCollapsed ? 'u-icon-arrow-right' : 'u-icon-arrow-left'" />
    </div>

    <div
      v-if="logo !== null"
      class="ub-sidebar__logo"
    >
      <img :src="isCollapsed ? logo : logoBig">
    </div>

    <slot />

    <desktop-selector
      :desktops="desktops"
      :is-collapsed="isCollapsed"
      :selected-desktop-id="selectedDesktop"
      @change-desktop="changeDesktop"
    />

    <div
      class="ub-sidebar__nav-label"
      :class="isCollapsed && 'collapsed'"
    >
      {{ $ut('menu') }}
    </div>
    <el-menu
      ref="menu"
      active-text-color="hsl(var(--hs-primary), var(--l-text-disabled))"
      text-color="hsl(var(--hs-text), var(--l-text-inverse))"
      unique-opened
      :collapse="isCollapsed"
      :collapse-transition="false"
      class="ub-sidebar__main-menu"
      :default-openeds="defaultOpeneds"
      @open="setActiveFolder"
      @contextmenu.native.stop.prevent="showContextMenu($event, {desktopID: selectedDesktop})"
    >
      <u-sidebar-item
        v-for="item in activeShortcuts"
        :key="item.ID"
        :item="item"
        :context-disabled="isCollapsed"
        @contextmenu="showContextMenu"
      />
    </el-menu>

    <u-dropdown ref="contextMenu">
      <template slot="dropdown">
        <u-dropdown-item
          label="Edit"
          :disabled="!canEdit"
          icon="u-icon-edit"
          @click="selectContext('edit')"
        />
        <u-dropdown-item
          label="addShortcut"
          :disabled="!canAdd"
          icon="u-icon-add"
          @click="selectContext('addShortcut')"
        />
        <u-dropdown-item
          label="addFolder"
          :disabled="!canAdd"
          icon="u-icon-folder-add"
          @click="selectContext('addFolder')"
        />
        <u-dropdown-item divider />
        <u-dropdown-item
          label="Delete"
          :disabled="!canDelete || contextMenuPayload.ID === undefined"
          icon="u-icon-delete"
          @click="selectContext('deleteShortcut')"
        />
      </template>
    </u-dropdown>
  </div>
</template>

<script>
/* global $App */

const UB = require('@unitybase/ub-pub')
const USidebarItem = require('./USidebarItem.vue').default
const DesktopSelector = require('./DesktopSelector.vue').default

export default {
  name: 'USidebar',
  components: {
    USidebarItem,
    DesktopSelector
  },

  data () {
    return {
      menu: [],
      desktops: [],
      selectedDesktop: null,
      isCollapsed: null,
      logo: null,
      logoBig: null,
      contextMenuPayload: {}
    }
  },

  computed: {
    defaultOpeneds () {
      const arr = localStorage.getItem('portal:sidebar:activeShortcutFolder')
      return arr ? JSON.parse(arr) : []
    },

    activeShortcuts () {
      if (!this.menu.length && this.selectedDesktop) {
        return this.menu[this.selectedDesktop]
      } else {
        return []
      }
    },

    schema () {
      return this.$UB.connection.domain.entities.ubm_navshortcut
    },

    canAdd () {
      return this.schema && this.schema.haveAccessToMethod('insert')
    },
    canDelete () {
      return this.schema && this.schema.haveAccessToMethod('delete')
    },
    canEdit () {
      return this.schema && this.schema.haveAccessToMethod('update')
    }
  },

  watch: {
    isCollapsed (value) {
      window.localStorage.setItem('portal:sidebar:isCollapsed', value)
      this.$UB.core.UBApp.fireEvent('portal:sidebar:collapse', value)
      let { full, collapsed } = $App.viewport.leftPanel.defaultSizes

      if (window.innerWidth < 768) {
        collapsed = 0
      }
      $App.viewport.leftPanel.setWidth(value ? collapsed : full)
    },
    selectedDesktop (value) {
      if (!value) return
      $App.fireEvent('portal:sidebar:desktopChanged', value)
      this.saveInLocalStorage(value)
    }
  },

  created () {
    this.setLogo()
  },

  mounted () {
    this.initMenu()
    this.initCollapseState()
    $App.on({
      'portal:sidebar:defineSlot': (Component, bindings) => {
        this.$slots.default = this.$createElement(Component, bindings)
        this.$forceUpdate()
      },

      'portal:sidebar:appendSlot': (Component, bindings) => {
        if (Array.isArray(this.$slots.default)) {
          this.$slots.default.push(this.$createElement(Component, bindings))
        } else {
          this.$slots.default = [this.$slots.default, this.$createElement(Component, bindings)]
        }
        this.$forceUpdate()
      }
    })
    UB.connection.on('ubm_navshortcut:changed', this.initMenu)
    UB.connection.on('ubm_desktop:changed', this.initMenu)
    // hack to redefine a hoover background for all menu items
    Object.defineProperty(this.$refs.menu, 'hoverBackground', {
      get () {
        return 'hsl(var(--hs-sidebar), var(--l-sidebar-depth-4))'
      }
    })
  },

  methods: {
    async loadDesktops () {
      const desktops = await this.$UB.connection.Repository('ubm_desktop')
        .attrs('ID', 'caption', 'isDefault', 'description', 'iconCls', 'displayOrder')
        .orderBy('displayOrder').orderBy('caption')
        .select()

      const userLogin = UB.connection.userData().login
      let preferredDesktop = +window.localStorage.getItem(`${userLogin}:desktop`)
      // desktop can be deleted
      if (!preferredDesktop || !desktops.find(i => i.ID === preferredDesktop)) {
        const defaultDesktop = desktops.find(d => d.isDefault)
        preferredDesktop = defaultDesktop ? defaultDesktop.ID : null
      }
      if (!preferredDesktop) preferredDesktop = desktops.length && desktops[0].ID
      if (preferredDesktop) this.selectedDesktop = preferredDesktop

      return desktops
    },

    loadShortcuts () {
      return this.$UB.connection.Repository('ubm_navshortcut')
        // the same field list as in UBStoreManager.shortcutAttributes
        .attrs('ID', 'desktopID', 'parentID', 'code', 'isFolder', 'caption', 'inWindow', 'isCollapsed', 'displayOrder', 'iconCls')
        .orderBy('desktopID').orderBy('parentID')
        .orderBy('displayOrder').orderBy('caption')
        .select()
    },

    initMenu () {
      Promise.all([
        this.loadDesktops(),
        this.loadShortcuts()
      ]).then(([desktops, shortcuts]) => {
        const menu = {}
        for (const desktop of desktops) {
          menu[desktop.ID] = []
        }
        for (const shortcut of shortcuts) {
          if (shortcut.parentID) {
            const parent = shortcuts.find(s => s.ID === shortcut.parentID)
            if (!parent) continue // parent folder is not accessible due to RLS - skip shortcut
            if (parent.children) {
              parent.children.push(shortcut)
            } else {
              parent.children = [shortcut]
            }
          } else {
            if (shortcut.desktopID in menu) {
              menu[shortcut.desktopID].push(shortcut)
            }
          }
        }
        this.desktops = desktops
        // recursive set menu item level starts from 0
        function setLevel (item, L) {
          item.level = L
          if (!item.children) return
          for (let i = 0, cL = item.children.length; i < cL; i++) {
            setLevel(item.children[i], L + 1)
          }
        }
        for (const desktopID in menu) {
          for (const itm of menu[desktopID]) {
            setLevel(itm, 0)
          }
        }
        this.menu = menu
      })
    },

    saveInLocalStorage (ID) {
      const userLogin = UB.connection.userData().login
      window.localStorage.setItem(`${userLogin}:desktop`, ID)
    },

    initCollapseState () {
      const savedCollapse = window.localStorage.getItem('portal:sidebar:isCollapsed')
      if (savedCollapse) {
        this.isCollapsed = savedCollapse === 'true'
      } else {
        this.isCollapsed = window.innerWidth < 1024
      }
    },

    showContextMenu (event, payload) {
      this.contextMenuPayload = payload
      this.$refs.contextMenu.show(event)
    },

    async selectContext (action) {
      const { ID, desktopID, parentID, isFolder } = this.contextMenuPayload
      const contextMenuPayload = this.contextMenuPayload
      const command = {
        cmdType: 'showForm',
        entity: 'ubm_navshortcut',
        contextMenuPayload
      }
      switch (action) {
        case 'edit':
          command.instanceID = ID
          break

        case 'addShortcut':
        case 'addFolder':
          command.parentContext = {
            desktopID: desktopID,
            parentID: isFolder ? ID : parentID,
            isFolder: action === 'addFolder'
          }
          break

        case 'deleteShortcut': {
          const confirm = await this.$dialogYesNo('areYouSure', 'deletionDialogConfirmCaption')

          if (confirm) {
            await $App.connection.doDelete({
              entity: 'ubm_navshortcut',
              execParams: {
                ID
              }
            })
            this.initMenu() // reload after delete
          }
          return
        }
      }

      $App.doCommand(command)
    },

    setActiveFolder (ID, arr) {
      localStorage.setItem('portal:sidebar:activeShortcutFolder', JSON.stringify(arr))
    },

    changeDesktop (ID) {
      this.selectedDesktop = ID
    },

    setLogo () {
      const logo = this.$UB.connection.appConfig.uiSettings.adminUI.sidebarLogoURL
      const logoBig = this.$UB.connection.appConfig.uiSettings.adminUI.sidebarLogoBigURL

      if (logo) {
        this.logo = logo
        this.logoBig = logoBig || logo
      }
    }
  }
}
</script>

<style>
.ub-sidebar {
  height: 100%;
  background: hsl(var(--hs-sidebar), var(--l-sidebar-default));
  display: flex;
  flex-direction: column;
  position: relative;
}

.ub-sidebar__main-menu {
  border-right: 0;
  margin: 12px auto;
  margin-top: 0;
  width: 100%;
  flex-grow: 1;
  overflow-y: auto;
  background-color: hsl(var(--hs-sidebar), var(--l-sidebar-default));
}

.ub-sidebar .el-menu::-webkit-scrollbar {
  width: 12px;
  height: 12px;
  background-color: hsl(var(--hs-sidebar), var(--l-sidebar-depth-1));
}

.ub-sidebar .el-menu::-webkit-scrollbar-thumb {
  border: 2px solid rgba(0, 0, 0, 0);
  background-clip: padding-box;
  background-color: hsl(var(--hs-sidebar), 60%);
  transition: background-color .1s;
}

.ub-sidebar .el-menu-item .el-tooltip {
  display: flex !important;
  align-items: center;
  justify-content: center;
}

.ub-sidebar .el-menu-item [class*=fa-],
.ub-sidebar .el-submenu [class*=fa-],
.ub-sidebar .el-menu-item [class*=u-icon-],
.ub-sidebar .el-submenu [class*=u-icon-] {
  vertical-align: middle;
  width: 24px;
  min-width: 24px;
  text-align: center;
  font-size: 18px;
}

.ub-sidebar .el-menu-item [class*=fa-],
.ub-sidebar .el-submenu [class*=fa-],
.ub-sidebar .el-menu-item [class^="el-icon-"],
.ub-sidebar .el-submenu [class^="el-icon-"],
.ub-sidebar .el-menu-item [class^="u-icon-"],
.ub-sidebar .el-submenu [class^="u-icon-"] {
  margin-right: 5px !important;
}

.ub-sidebar .el-submenu__title,
.ub-sidebar .el-menu-item {
  display: flex;
  height: auto;
  line-height: 1.5;
  padding: 8px 0;
  align-items: center;
  white-space: pre-wrap;
  min-height: 32px;
  letter-spacing: 0.6px;
}

.ub-sidebar .el-menu--collapse .el-submenu__title,
.ub-sidebar .el-menu--collapse .el-menu-item {
  justify-content: center;
}

.ub-sidebar .el-menu-item,
.ub-sidebar .el-submenu__title {
  padding-right: 15px;
}

.ub-sidebar .el-submenu__icon-arrow {
  right: 6px;
}

.ub-sidebar .el-submenu__title .el-submenu__icon-arrow {
  transform: rotateZ(-90deg);
}

.ub-sidebar .el-submenu.is-opened > .el-submenu__title .el-submenu__icon-arrow {
  transform: rotateZ(0deg);
}

.ub-sidebar__logo {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px 15px;
}

.ub-sidebar__logo img {
  width: 100%;
  max-height: 40px;
}

.ub-sidebar__nav-label {
  color: hsl(var(--hs-text), var(--l-text-inverse));
  font-size: 12px;
  margin: 12px;
}

.ub-sidebar__nav-label.collapsed {
  text-align: center;
}

.u-sidebar__collapse-button {
  position: absolute;
  top: 8px;
  left: 100%;
  z-index: 11;
  width: 20px;
  height: 32px;
  display: flex;
  align-items: center;
  font-size: 16px;
  color: hsl(var(--hs-text), var(--l-text-inverse));
  background: hsl(var(--hs-sidebar), var(--l-sidebar-default));
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  cursor: pointer;
}

.u-sidebar__collapse-button:hover {
  background: hsl(var(--hs-sidebar), var(--l-sidebar-depth-1));
}

/* menu level colors */
.ub-sidebar [data-ub-level="1"] {
  background-color: hsl(var(--hs-sidebar), var(--l-sidebar-depth-1));
}

.ub-sidebar [data-ub-level="2"] {
  background-color: hsl(var(--hs-sidebar), var(--l-sidebar-depth-2));
}

.ub-sidebar [data-ub-level="3"] {
  background-color: hsl(var(--hs-sidebar), var(--l-sidebar-depth-3));
}

.ub-sidebar [data-ub-level="4"] {
  background-color: hsl(var(--hs-sidebar), var(--l-sidebar-depth-4));
}

/* mark expanded item */
.ub-sidebar .el-submenu.is-opened > .el-submenu__title {
  border-left: 1px solid;
}

</style>
