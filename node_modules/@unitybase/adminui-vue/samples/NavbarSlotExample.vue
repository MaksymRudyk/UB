<template>
  <div class="u-navbar__right-side__buttons">
    <el-button
      icon="u-icon-bell"
      circle
      class="u-navbar__button"
    />

    <el-button
      icon="u-icon-search"
      circle
      class="u-navbar__button"
    />

    <el-dropdown
      size="big"
      class="u-navbar__user-dropdown"
    >
      <el-button
        icon="u-icon-person"
        circle
        class="u-navbar__button"
      />
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item>Action 1</el-dropdown-item>
        <el-dropdown-item>Action 2</el-dropdown-item>
        <el-dropdown-item>Action 3</el-dropdown-item>
        <el-dropdown-item disabled>
          Action 4
        </el-dropdown-item>
        <el-dropdown-item divided>
          <i class="u-icon-exit" /> Logout
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

<script>
export default {
  name: 'TabbarSlotExample'
}
</script>

<style>
.u-navbar__right-side__buttons{
  display: flex;
  padding-left: 10px;
}

.u-navbar__button{
  width: 32px;
  height: 32px;
}

.u-navbar__user-dropdown{
  margin-left: 10px;
}
</style>
