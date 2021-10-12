<template>
  <div class="u-form-layout">
    <u-toolbar />

    <u-form-container
      v-loading.body="loading"
      label-position="top"
      :max-width="800"
    >
      <u-auto-field
        v-for="attributeName in fields"
        :key="attributeName"
        :attribute-name="attributeName"
        :disabled="parentContext.hasOwnProperty(attributeName)"
      />
    </u-form-container>
  </div>
</template>

<script>
const { mapGetters } = require('vuex')

export default {
  name: 'UAutoForm',
  inject: ['entitySchema'],

  props: {
    parentContext: {
      type: Object,
      default () {
        return {}
      }
    }
  },

  computed: {
    fields () {
      return this.entitySchema
        .filterAttribute(attr => attr.defaultView)
        .map(a => a.name)
    },

    ...mapGetters(['loading'])
  }
}
</script>

<docs>
### Usage
A metadata based autoform with **UToolbar** and each entity attribute with `defaultView: true`
rendered using **UAutoField**. Entity itself should be provided by parent using `entitySchema`.

In this example `entitySchema` is provided by `Form` class.

```vue
<template>
  <u-auto-form></u-auto-form>
</template>
```

</docs>
