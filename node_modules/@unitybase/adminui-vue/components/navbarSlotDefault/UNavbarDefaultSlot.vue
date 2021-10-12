<template>
  <div class="ub-navbar__right-side__buttons">
    <u-navbar-notifications-button />
    <u-navbar-search-button />
    <u-navbar-user-button />
  </div>
</template>

<script>
const UNavbarUserButton = require('./UNavbarUserButton.vue').default
const UNavbarSearchButton = require('./UNavbarSearchButton.vue').default
const UNavbarNotificationsButton = require('./UNavbarNotificationsButton.vue').default

export default {
  name: 'UNavbarDefaultSlot',
  components: {
    UNavbarUserButton,
    UNavbarSearchButton,
    UNavbarNotificationsButton
  }
}
</script>

<style>
.ub-navbar__right-side__buttons{
  display: flex;
  padding-left: 10px;
}

.ub-navbar__menu-dropdown__popover{
  padding: 10px 0;
}

.ub-navbar__menu-dropdown .el-dropdown-menu__item {
  position: relative;
}

.u-navbar__dropdown + .u-navbar__dropdown{
  margin-left: 10px;
}

.u-navbar__dropdown__caret {
  position: absolute;
  bottom: 11px;
  font-size: 14px;
  left:2px;
}
</style>
