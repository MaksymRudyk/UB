## Usage
```vue
<template>
  <u-grid :columns="2" row-gap="20px">
      <u-code-mirror v-model="scriptSrc" readonly></u-code-mirror>
      <u-code-mirror v-model="yamlSrc" editor-mode="text/yaml"></u-code-mirror>
      <u-code-mirror v-model="jsonSrc" value-is-jsone editor-mode="application/json"></u-code-mirror>
  </u-grid>
</template>
<script>
  export default {
    data () {
      return {
        scriptSrc: `const d = new Date()
console.log(d)
// type d. and press Ctrl+Space for code completion

`,
        yamlSrc: `$context:
  type: roles

Uidoc:
  description: AdminUI documentation user
  els:
    read: req
        `,
        jsonSrc: {a: 10, b: 'Hello'}
      }
    }
  }
</script>
```
