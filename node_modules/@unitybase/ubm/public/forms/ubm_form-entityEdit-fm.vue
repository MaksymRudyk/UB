<script>
const adminUiVue = require('@unitybase/adminui-vue')
const ConfiguratorComponent = require('./configurator/ConfiguratorComponent.vue').default

module.exports.mount = function ({ title, tabId, entity, instanceID, parentContext, formCode, rootComponent }) {
  let tabTitle = 'Entity editor(' + parentContext.entityCode + ')'
  adminUiVue.mountUtils.mountTab({
    component: rootComponent,
    tabId,
    props: {
      fileName: parentContext.entityCode
    },
    title: tabTitle
  })
}

module.exports.default = {
  name: 'MetadataEditor',
  components: { ConfiguratorComponent },
  props: {
    fileName: String
  }
}
</script>

<template>
  <el-scrollbar style="height: 100%;">
    <configurator-component :fileName="fileName" />
  </el-scrollbar>
</template>
