<template>
  <u-button
    :title="$ut('UFile.fullscreenButtonTooltip')"
    color="primary"
    icon="u-icon-expand"
    appearance="inverse"
    :disabled="isDisabled"
    @click="instance.requestFullscreen"
  />
</template>

<script>
export default {
  name: 'UFileFullscreenButton',

  inject: {
    instance: 'fileComponentInstance'
  },

  props: {
    multiple: Boolean
  },

  data () {
    return {
      previewFormats: [
        'image/jpeg',
        'image/png',
        'image/vnd.wap.wbmp',
        'image/bmp',
        'application/pdf'
      ]
    }
  },

  computed: {
    isDisabled () {
      const instance = this.instance
      if (this.multiple) {
        if (!instance.selectedFileId) return true
        const file = instance.files.find(f => f.ID === instance.selectedFileId) || {}
        return !this.previewFormats.includes(file.ct)
      } else {
        return !instance.file || !this.previewFormats.includes(instance.file.ct)
      }
    }
  }
}
</script>
