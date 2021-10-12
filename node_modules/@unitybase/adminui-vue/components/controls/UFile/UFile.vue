<template>
  <u-file-container :style="previewSizeCss">
    <template #toolbar>
      <u-file-add-button v-if="hasButton('add')" :accept="accept"/>
      <u-file-webcam-button v-if="hasButton('webcam')" />
      <div
        v-if="hasButton('add') || hasButton('webcam')"
        class="u-divider"
      />
      <u-file-scan-button v-if="hasButton('scan')" />
      <u-file-scan-settings-button v-if="hasButton('scanSettings')" />
      <div
        v-if="hasButton('scan') || hasButton('scanSettings')"
        class="u-divider"
      />
      <u-file-download-button v-if="hasButton('download')" />
      <u-file-preview-button v-if="hasButton('preview')" />
      <u-file-fullscreen-button v-if="hasButton('fullscreen')" />
      <div
        v-if="hasButton('download') || hasButton('preview') || hasButton('fullscreen')"
        class="u-divider"
      />
      <u-file-remove-button v-if="hasButton('remove')" />

      <slot />
    </template>

    <template #view>
      <file-renderer
        v-if="value"
        :key="value"
        ref="renderer"
        :attribute-name="attributeName"
        :entity-name="entityName"
        :file="file"
        :file-id="recordId"
        :with-preview="!!previewMode"
      />
      <u-file-input
        v-else
        ref="input"
        :accept="accept"
        :disabled="disabled"
        :border="false"
        @input="upload"
      />
    </template>
  </u-file-container>
</template>

<script>
export default {
  name: 'UFile',

  components: {
    UFileContainer: require('./UFileContainer.vue').default,
    FileRenderer: require('./views/FileRenderer.vue').default
  },

  props: {
    /**
     * @model
     */
    value: {
      required: true
    },

    /**
     * name of entity that stores file
     */
    entityName: {
      type: String,
      default () {
        return this.providedEntity
      }
    },

    /**
     * name of attribute that stores file in target entity
     */
    attributeName: {
      type: String,
      required: true
    },

    /**
     * ID of record that stores file
     */
    recordId: {
      type: Number,
      default () {
        return this.$store.state.data.ID
      }
    },

    /**
     * toggle preview mode, do not confuse with preview dialog.
     * Loaded file will be shown if they mime type ar one of: PDF, PNG or JPG.
     * By default in "preview" mode control width is sets to "100%" and heights to "auto".
     */
    previewMode: {
      type: [Boolean, Object],
      width: {
        type: [String, Number]
      },
      height: {
        type: [String, Number]
      }
    },

    /**
     * disable removing or uploading file
     */
    disabled: Boolean,

    /**
     * file extensions to bind into `accept` input property
     */
    accept: String,

    /**
     * if `true` - remove all default buttons. To remove specific buttons - pass an array of button names to be hidden
     *
     * @example :remove-default-buttons="['add', 'preview']"
     *
     * Buttons names are:
     *  - add
     *  - webcam
     *  - scan
     *  - scanSettings
     *  - download
     *  - remove
     *  - fullscreen
     *  - preview
     */
    removeDefaultButtons: [Boolean, Array],

    /**
     * hook which called before `UB.setDocument`. Must be as async function or function which returns promise
     *
     * @param {object} params
     * @param {string} params.entity
     * @param {number} params.id
     * @param {string} params.attribute
     * @param {object} params.file
     */
    beforeSetDocument: {
      type: Function,
      default: () => Promise.resolve()
    }
  },

  provide () {
    return {
      fileComponentInstance: this
    }
  },

  inject: {
    providedEntity: 'entity'
  },

  computed: {
    file () {
      if (this.value) {
        return JSON.parse(this.value)
      } else {
        return null
      }
    },

    fileName () {
      const { origName, fName } = this.file
      return origName || fName
    },

    /**
     * sets preview size if unset in config
     */
    previewSize () {
      const defaults = {
        width: '100%',
        height: 'auto'
      }
      if (this.previewMode === true) {
        return Object.assign({}, defaults)
      } else {
        return Object.assign({}, defaults, this.previewMode)
      }
    },

    /**
     * transform number size values to string
     */
    previewSizeCss () {
      return ['width', 'height'].reduce((style, property) => {
        const value = this.previewSize[property]
        style[property] = typeof value === 'number'
          ? value + 'px'
          : value
        return style
      }, {})
    },

    availableButtons () {
      if (this.removeDefaultButtons === true) {
        return []
      }
      const defaultButtons = [
        'add',
        'webcam'
      ]
      // Show scan options only if disableScanner property is not explicitly set as true
      if (!this.$UB.connection.appConfig.uiSettings.adminUI.disableScanner) {
        defaultButtons.push('scan', 'scanSettings')
      }
      defaultButtons.push('download', 'remove')

      if (this.previewMode) {
        defaultButtons.push('fullscreen')
      } else {
        defaultButtons.push('preview')
      }

      if (Array.isArray(this.removeDefaultButtons)) {
        return defaultButtons.filter(b => !this.removeDefaultButtons.includes(b))
      }

      return defaultButtons
    }
  },

  methods: {
    async upload (binaryFiles) {
      const file = binaryFiles[0]
      await this.beforeSetDocument({
        entity: this.entityName,
        attribute: this.attributeName,
        id: this.recordId,
        file
      })
      const uploadedFileMetadata = await this.$UB.connection.setDocument(file, {
        entity: this.entityName,
        attribute: this.attributeName,
        origName: file.name,
        id: this.recordId
      })
      this.$emit(
        'input',
        JSON.stringify(uploadedFileMetadata)
      )
    },

    hasButton (button) {
      return this.availableButtons.includes(button)
    },

    requestFullscreen () {
      if (this.$refs.renderer && this.$refs.renderer.$refs.view) {
        this.$refs.renderer.$refs.view.requestFullscreen()
      }
    }
  }
}
</script>
