<template>
  <div v-clickoutside="hideDrawer">
    <div
      :class="{
        collapsed: isCollapsed
      }"
      class="desktop-select-button"
      @click="drawer = !drawer"
    >
      <i
        :class="selectedDesktop.iconCls"
        class="desktop-select-button__icon-before"
      />
      <template v-if="!isCollapsed">
        <span>{{ selectedDesktop.caption }}</span>
        <i class="desktop-select-button__icon-after u-icon-desktop-swap" />
      </template>
    </div>

    <transition name="sidebar-animation">
      <div
        v-show="drawer"
        class="u-desktop-drawer"
      >
        <div class="u-desktop-drawer__title">
          {{ $ut('sidebar.desktopSelector.title') }}
        </div>

        <!--        TODO: full text search-->
        <!--        <div-->
        <!--          v-clickoutside="hideSearch"-->
        <!--          class="u-desktop-drawer__search"-->
        <!--        >-->
        <!--          <div class="u-desktop-drawer__search-box__wrap">-->
        <!--            <el-input-->
        <!--              v-model="searchQuery"-->
        <!--              class="u-desktop-drawer__search-input"-->
        <!--              :class="searchDropdownVisible && 'u-desktop-drawer__search-input__open'"-->
        <!--              prefix-icon="u-icon-search"-->
        <!--              clearable-->
        <!--            />-->

        <!--            <div-->
        <!--              v-show="searchDropdownVisible"-->
        <!--              class="u-desktop-drawer__search-box"-->
        <!--            >-->
        <!--              <div class="u-desktop-drawer__search__title">-->
        <!--                Search:-->
        <!--              </div>-->

        <!--              <div class="u-desktop-drawer__search-list">-->
        <!--                <div-->
        <!--                  v-for="desktop in desktops"-->
        <!--                  :key="desktop.ID"-->
        <!--                  class="u-desktop-drawer__search-item"-->
        <!--                >-->
        <!--                  <div class="u-desktop-drawer__search-item__icon">-->
        <!--                    <i :class="desktop.iconCls" />-->
        <!--                  </div>-->
        <!--                  <div class="u-desktop-drawer__search-item__text">-->
        <!--                    <div class="u-desktop-drawer__search-item__title">-->
        <!--                      {{ desktop.caption }}-->
        <!--                    </div>-->
        <!--                    <div class="u-desktop-drawer__search-item__shortcuts">-->
        <!--                      Document test, CLOB test, test IIT Sign, tst_mainunity, tst_IDMapping, tst_histDict, tst_maindata-->
        <!--                    </div>-->
        <!--                  </div>-->
        <!--                </div>-->
        <!--              </div>-->
        <!--            </div>-->
        <!--          </div>-->
        <!--        </div>-->

        <div class="u-desktop-drawer__list">
          <div
            v-for="desktop in desktops"
            :key="desktop.ID"
            :class="selectedDesktopId === desktop.ID && 'active'"
            class="u-desktop-drawer__item"
            @click="changeDesktop(desktop.ID)"
          >
            <div class="u-desktop-drawer__item__icon">
              <i :class="desktop.iconCls" />
            </div>
            <div class="u-desktop-drawer__item__text">
              <div class="u-desktop-drawer__item__title">
                {{ desktop.caption }}
              </div>
              <div
                v-show="desktop.description"
                :title="desktop.description"
                class="u-desktop-drawer__item__description"
              >
                {{ desktop.description }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  props: {
    isCollapsed: Boolean,
    desktops: {
      type: Array,
      default: () => []
    },
    selectedDesktopId: {
      type: [Number, undefined],
      default: null
    }
  },

  data () {
    return {
      searchQuery: '',
      drawer: false
    }
  },

  computed: {
    selectedDesktop () {
      if (this.selectedDesktopId) {
        const desktop = this.desktops.find(d => d.ID === this.selectedDesktopId)
        if (desktop) {
          return desktop
        } else {
          return {}
        }
      } else {
        return {}
      }
    },

    searchDropdownVisible () {
      return this.searchQuery !== ''
    }
  },

  methods: {
    changeDesktop (ID) {
      this.$emit('change-desktop', ID)
      this.drawer = false
    },

    hideDrawer () {
      this.drawer = false
    },

    hideSearch () {
      this.searchQuery = ''
    }
  }
}
</script>

<style>
  .ub-sidebar__desktop-select {
    padding: 12px;
  }

  .ub-sidebar__desktop-select.collapsed {
    padding: 12px 0;
  }

  .desktop-select-button {
    color: hsl(var(--hs-text), var(--l-text-inverse));
    font-size: 14px;
    padding: 10px 17px;
    cursor: pointer;
    display: flex;
    align-items: center;
    margin-top: 12px;
  }

  .desktop-select-button i {
    font-size: 18px;
  }

  .desktop-select-button.collapsed {
    display: flex;
    justify-content: center;
  }

  .desktop-select-button.collapsed .desktop-select-button__icon-before {
    margin-right: 0;
  }

  .desktop-select-button:hover {
    background: hsl(var(--hs-sidebar), var(--l-sidebar-depth-1));
  }

  .desktop-select-button .desktop-select-button__icon-before {
    margin-right: 10px;
  }

  .u-desktop-drawer {
    position: absolute;
    z-index: 100;
    top: 0;
    left: 100%;
    width: 300px;
    height: 100%;
    background: hsl(var(--hs-background), var(--l-background-inverse));
    box-shadow: var(--box-shadow-default);
    display: grid;
    grid-template-rows: auto auto 1fr;
  }

  .u-desktop-drawer__title {
    color: hsl(var(--hs-text), var(--l-text-default));
    padding: 16px;
  }

  .u-desktop-drawer__search {
    position: relative;
    padding: 16px;
    padding-top: 10px;
  }

  .u-desktop-drawer__search-box__wrap {
    position: relative;
  }

  .u-desktop-drawer__search-box {
    position: absolute;
    top: calc(100% - 1px);
    left: 0;
    width: 100%;
    height: 220px;
    background: hsl(var(--hs-background), var(--l-background-inverse));
    border: 1px solid hsl(var(--hs-text), var(--l-text-description));
    box-shadow: var(--box-shadow-default);
    border-radius: var(--border-radius);
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  .u-desktop-drawer__list {
    overflow: auto;
    margin: 10px 0;
  }

  .u-desktop-drawer__item {
    border-bottom: 1px solid hsl(var(--hs-border), var(--l-layout-border-default));
    padding: 16px;
    display: flex;
    cursor: pointer;
    position: relative;
  }

  .u-desktop-drawer__item.active:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background: hsl(var(--hs-primary), var(--l-state-default));
  }

  .u-desktop-drawer__search-item:hover,
  .u-desktop-drawer__item:hover {
    background: hsl(var(--hs-primary), var(--l-background-default));
  }

  .u-desktop-drawer__item__icon {
    width: 36px;
    min-width: 36px;
    height: 36px;
    margin-right: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    color: hsl(var(--hs-primary), var(--l-state-default));
  }

  .u-desktop-drawer__item__text {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .u-desktop-drawer__item__title {
    font-size: 16px;
    color: hsl(var(--hs-text), var(--l-text-default));
  }

  .u-desktop-drawer__item__description {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.3;
    color: hsl(var(--hs-text), var(--l-text-label));
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .u-desktop-drawer__search-box {
    display: grid;
    grid-template-rows: auto 1fr;
    padding-bottom: 32px;
  }

  .u-desktop-drawer__search-input .el-input__inner {
    border: 1px solid hsl(var(--hs-border), var(--l-input-border-default)) !important;
    border-radius: var(--border-radius);
  }

  .u-desktop-drawer__search-input__open .el-input__inner {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .u-desktop-drawer__search__title {
    color: hsl(var(--hs-text), var(--l-text-default));
    font-size: 12px;
    padding: 16px;
  }

  .u-desktop-drawer__search-list {
    overflow-y: auto;
    border-bottom: 1px solid hsl(var(--hs-border), var(--l-layout-border-default));
    border-top: 1px solid hsl(var(--hs-border), var(--l-layout-border-default));
  }

  .u-desktop-drawer__search-item {
    display: flex;
    padding: 8px 16px;
    border-bottom: 1px solid hsl(var(--hs-border), var(--l-layout-border-default));
    cursor: pointer;
  }

  .u-desktop-drawer__search-item:last-child {
    border-bottom: none;
  }

  .u-desktop-drawer__search-item__icon {
    width: 24px;
    min-width: 24px;
    height: 24px;
    margin-right: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: hsl(var(--hs-primary), var(--l-state-default));
  }

  .u-desktop-drawer__search-item__text {
    overflow: hidden;
  }

  .u-desktop-drawer__search-item__title {
    color: hsl(var(--hs-text), var(--l-text-default));
    font-size: 12px;
  }

  .u-desktop-drawer__search-item__shortcuts {
    margin-top: 6px;
    font-size: 10px;
    color: hsl(var(--hs-text), var(--l-text-default));
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .sidebar-animation-enter-active,
  .sidebar-animation-leave-active {
    transition: .15s;
  }

  .sidebar-animation-leave-to {
    opacity: 0;
    transform: translateY(-10px);
  }

  .sidebar-animation-enter {
    opacity: 0;
    transform: translateX(10px);
  }

  .desktop-select-button__icon-after {
    margin-left: auto;
    transform: rotate(90deg);
  }
</style>
