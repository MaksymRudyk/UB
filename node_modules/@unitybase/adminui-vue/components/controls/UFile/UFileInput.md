### Usage
```vue
<template>
<u-grid>
  <div>
    <h5> Basic usage with modified `height=80px`: </h5>
    <u-file-input
      :disabled="disabled"
      :multiple="multiple"
      style="height: 80px"
      @input="upload"
    />
  </div>
  <div>
      <h5> Accept only PDF and TXT; Binds to model `selectedFiles` property: </h5>
      <u-file-input
          :disabled="disabled"
          :multiple="multiple"
          placeholder="Select file for import"
          selected-placeholder="Will import"
          accept=".pdf,.txt"
          v-model="selectedFiles"
      />
      <u-button @click="doImport" :disabled="!selectedFiles.length">Import</u-button>
  </div>
  <div>
    <u-button @click="disabled = !disabled">Toggle "disabled"</u-button>
    <u-button @click="multiple = !multiple">Toggle "multiple"</u-button>
    <pre>
      disabled: {{disabled}}
      multiple: {{multiple}}
      {{selectedFiles.length}} files selected
    </pre>
  </div>
</u-grid>
</template>

<script>
export default {
  data () {
    return {
      disabled: false,
      multiple: true,
      selectedFiles: []
    }
  },
  methods: {
    doImport () {
      const fileNames = this.selectedFiles.map(f => f.name).join(', ')
      this.$dialogYesNo(`Import ${fileNames} into database?`)
    },
    upload () {
      this.$dialogInfo(`Will upload ${this.selectedFiles.length} files`)
      // actual upload can looks like:
      // this.$UB.connection.post('uploadEndpoint', this.selectedFiles[0])
    }
  }
}
</script>
```