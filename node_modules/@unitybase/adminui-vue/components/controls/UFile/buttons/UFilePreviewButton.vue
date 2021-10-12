<template>
  <div>
    <u-button
      :title="$ut('UFile.previewButtonTooltip')"
      color="primary"
      icon="u-icon-eye"
      appearance="inverse"
      :disabled="isDisabled"
      @click="dialogVisible = true"
    />

    <el-dialog
      v-if="file"
      class="u-file__preview-dialog"
      :title="file.name"
      :visible.sync="dialogVisible"
    >
      <u-button
        slot="title"
        :title="$ut('UFile.fullscreenButtonTooltip')"
        color="primary"
        appearance="inverse"
        icon="u-icon-expand"
        @click="requestFullscreen"
      />
      <file-renderer
        ref="renderer"
        :key="file.ID"
        :file="file"
        with-preview
        :entity-name="instance.entityName"
        :attribute-name="multiple ? instance.fileAttribute : instance.attributeName"
        :file-id="multiple ? file.ID : instance.recordId"
      />
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'UFilePreviewButton',

  components: {
    FileRenderer: require('../views/FileRenderer.vue').default
  },

  props: {
    multiple: Boolean
  },

  inject: {
    instance: 'fileComponentInstance'
  },

  data () {
    return {
      dialogVisible: false,
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
    },

    file () {
      const instance = this.instance
      if (this.multiple) {
        return instance.files.find(f => f.ID === instance.selectedFileId)
      } else {
        if (instance.file) {
          return {
            ...instance.file,
            ID: instance.recordId
          }
        } else {
          return null
        }
      }
    }
  },

  methods: {
    requestFullscreen () {
      if (this.$refs.renderer.$refs.view) {
        this.$refs.renderer.$refs.view.requestFullscreen()
      }
    }
  }
}
</script>

<style>
  .u-file__preview-dialog .el-dialog {
    display: flex;
    flex-direction: column;
    height: 90vh;
    width: 80vw;
    margin-top: 5vh !important;
  }

  .u-file__preview-dialog .el-dialog__body {
    flex-grow: 1;
    overflow: auto;
    display: flex;
    align-items: center;
  }

  .u-file__preview-dialog .el-dialog__body img {
    margin: auto;
  }
</style>
