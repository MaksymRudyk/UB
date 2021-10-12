<template>
  <div
    v-if="!isCollapsed"
    class="ub-sidebar__quick-access-group"
  >
    <i
      v-for="item in quickAccessMenu"
      :key="item.label"
      :title="item.label"
      :class="item.iconCls"
      @click="item.onClick ? item.onClick($event) : null"
    />
  </div>

  <el-dropdown
    v-else
    trigger="click"
    placement="right"
    class="ub-sidebar__quick-access-button"
    size="big"
  >

    <i
      :title="$ut('quickAccessButtons')"
      class="u-icon-rhombus"
    />

    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item
        v-for="item in quickAccessMenu"
        :key="item.label + 'uniqFlag'"
        @click.native="item.onClick ? item.onClick($event) : null"
      >
        <i :class="item.iconCls" />
        {{ item.label }}
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
export default {
  name: 'SidebarSlotExample',

  data () {
    return {
      quickAccessMenu: [{
        iconCls: 'u-icon-book',
        label: 'Contacts',
        onClick: (e) => {
          console.log(e)
        }
      }, {
        iconCls: 'u-icon-image',
        label: 'Colors'
      }, {
        iconCls: 'u-icon-globe',
        label: 'Locations'
      }, {
        iconCls: 'u-icon-list-success',
        label: 'Favorite'
      }]
    }
  },

  computed: {
    isCollapsed () {
      return this.$parent.isCollapsed
    }
  }
}
</script>

<style>
.ub-sidebar__quick-access-group{
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-bottom: 1px solid hsl(var(--hs-border), var(--l-layout-border-default));
  padding-bottom: 10px;
  flex-shrink: 0;
}

.ub-sidebar__quick-access-group i{
  display: block;
  color: hsl(var(--hs-control), var(--l-state-default));
  font-size: 30px;
  margin: 0 4px;
  width: 30px;
  text-align: center;
  cursor: pointer;
}

.ub-sidebar__quick-access-group i:hover{
  color: hsl(var(--hs-primary), var(--l-state-hover));
}

.ub-sidebar__quick-access-button{
  font-size: 18px;
  height: 56px;
  width: 100%;
  cursor: pointer;
  color: hsl(var(--hs-text), var(--l-text-default));
  transition: .3s;
}

.ub-sidebar__quick-access-button i {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.ub-sidebar__quick-access-button:hover{
  color: hsl(var(--hs-primary), var(--l-text-default));
  background: rgb(38, 51, 64);
}
</style>
