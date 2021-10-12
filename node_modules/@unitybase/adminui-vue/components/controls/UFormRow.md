### Usage

An CSS class `u-form-row__description` can be used to add a "description"

```vue
<template>
<div>
  <h4>Required (asterisk symbol)</h4>
  <u-form-row
      required
      label-position="top"
      :error="showError"
      label="User name (required)"
  >
    <u-base-input v-model="userName"/>
  </u-form-row>

  <h4>Readonly (non-editable + lock symbol)</h4>
  <u-form-row
      readonly
      label-position="top"
      :error="showError"
      label="User name (read only)"
  >
    <u-base-input v-model="userName"/>
  </u-form-row>

  <h4>Required + left label positioning</h4>
  <u-form-row
    required
    label-position="left"
    :error="showError"
    label="User name"
  >
    <u-base-input v-model="userName"/>
  </u-form-row>

  <h4>With a description</h4>
  <u-form-row
    label-position="top"
    label="User name (description below edit is added)"
  >
    <u-base-input v-model="userName"/>
    <div class="u-form-row__description">
      name of user who responsible to handle a request
    </div>
  </u-form-row>

  <h4>Left / right label position</h4>
  <u-grid>
    <u-form-row
      label-position="left"
      label="Label on left"
    >
      <u-base-input v-model="userName"/>
    </u-form-row>

    <u-form-row
      label-position="right"
      label="label on right"
    >
      <u-base-input v-model="userName"/>
    </u-form-row>
  </u-grid>
  
  <el-switch
    v-model="showError"
    active-text="Show error"
    inactive-text="Hide error">
  </el-switch>

</div>
</template>

<script>
export default {
  data () {
    return {
      showError: true,
      userName: 'Pablo'
    }
  }
}
</script>
```