<template>
  <div class="u-form-layout">
    <u-toolbar />

    <u-form-container
      v-loading.body="loading"
      label-position="top"
      :max-width="800"
    >
      <u-auto-field attribute-name="code" />
      <u-auto-field attribute-name="name" />
      <u-auto-field
        editor-mode="application/json"
        attribute-name="ubql"
      />
    </u-form-container>
  </div>
</template>

<script>
const { Form, formHelpers } = require('@unitybase/adminui-vue')
const { mapGetters } = require('vuex')

module.exports.mount = cfg => {
  Form(cfg)
    .processing()
    .validation({
      validations () {
        return {
          ubql: {
            json: formHelpers.validateWithErrorText(
              'invalidJson',

              value => {
                try {
                  const parsed = JSON.parse(value)
                  return typeof parsed === 'object'
                } catch (e) {
                  return false
                }
              }
            )
          }
        }
      }
    })
    .mount()
}

export default {
  name: 'UbmSysdictionary',
  computed: {
    ...mapGetters(['loading'])
  }
}
</script>
