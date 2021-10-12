<template>
  <div class="u-form-layout">
    <u-toolbar />

    <u-form-container
      v-loading.body="loading"
      label-position="top"
      :max-width="800"
    >
      <u-auto-field
        attribute-name="code"
        disabled
      />
      <u-auto-field
        attribute-name="name"
        disabled
      />
      <u-auto-field
        attribute-name="type"
        disabled
      />
      <u-auto-field
        attribute-name="ubql"
        readonly
      />
    </u-form-container>
  </div>
</template>

<script>
const { Form } = require('@unitybase/adminui-vue')
const { mapGetters } = require('vuex')

module.exports.mount = cfg => {
  Form(cfg)
    .processing()
    .validation()
    .mount()
}

export default {
  name: 'UbmQuery',
  computed: {
    ...mapGetters(['loading'])
  }
}
</script>
