## Usage
See also `UInput` documentation for more examples.

For selecting files we recommend using a `UFileInput`, for dates - `UDatePicker` 

```vue
<template>
  <div>
    <u-grid row-gap="20px">
      <div> String <u-base-input v-model="strVal" /> </div>
      <div> Password
        <u-base-input type="password" v-model="strVal">
          <el-button icon="u-icon-eye" slot="append" />
        </u-base-input>
      </div>
      <div> Integer <u-base-input type="number" :precision="0" v-model="intVal" /> </div>
      <div> Currency <u-base-input type="number" :precision="2" :step="0.01" v-model="decVal" /> </div>
    </u-grid>
    <p>Browser-specific input types (can look different on different browsers): </p>
    <u-grid row-gap="20px">
      <div> Color <u-base-input type="color" v-model="other" /> </div>
      <div> Date <u-base-input type="date" v-model="other" /> </div>
      <div> Datetime <u-base-input type="datetime-local" v-model="other" /> </div>
      <div> Range <u-base-input type="range" min="100" max="1000" v-model="other" /> </div>
    </u-grid>
  </div>
</template>
<script>
  export default {
    data () {
      return {
        other: null,
        strVal: 'Hello',
        intVal: 10,
        decVal: 12.34
      }
    }
  }
</script>
```