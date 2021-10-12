<template>
  <u-button
    :title="$ut('UFile.downloadButtonTooltip')"
    color="primary"
    icon="u-icon-download"
    appearance="inverse"
    :disabled="isDisabled"
    @click="downloadFile"
  />
</template>

<script>
export default {
  name: 'UFileDownloadButton',

  props: {
    multiple: Boolean
  },

  inject: {
    instance: 'fileComponentInstance'
  },

  computed: {
    isDisabled () {
      if (this.multiple) {
        return !this.instance.selectedFileId
      } else {
        return !this.instance.file
      }
    }
  },

  methods: {
    async downloadFile () {
      const instance = this.instance
      let fileMetadata, recordID
      if (this.multiple) {
        fileMetadata = instance.files.find(f => f.ID === instance.selectedFileId)
        recordID = fileMetadata && fileMetadata.ID
      } else {
        fileMetadata = instance.file
        recordID = instance.recordId
      }
      if (!fileMetadata) return
      return $App.downloadDocument({
        entity: instance.entityName,
        attribute: instance.attributeName,
        ID: recordID
      }, fileMetadata)
    }
  }
}
</script>
