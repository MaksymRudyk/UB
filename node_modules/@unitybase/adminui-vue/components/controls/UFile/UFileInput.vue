<template>
  <label
    class="u-file__dropzone"
    :class="{
      hover: dragging,
      disabled,
      'u-file__dropzone-border': border
    }"
    @dragleave.prevent.stop="dragging = false"
    @dragend.prevent.stop="dragging = false"
    @dragenter="dragover"
    @dragover="dragover"
    @drop.stop.prevent="drop"
  >
    <u-icon
      icon="u-icon-cloud-alt"
      color="control"
      size="large"
      class="u-file__dropzone-icon"
    />
    <div
      v-if="value.length"
      class="text--truncated"
    >
      <strong>{{ $ut(selectedPlaceholder) }}:</strong> {{ selectedFileNames }}
    </div>
    <div
      v-else
      class="u-file__dropzone-placeholder"
    >
      {{ $ut(placeholder) }}
      <div v-if="accept">
        ({{ accept }})
      </div>
    </div>
    <input
      type="file"
      :disabled="disabled"
      :multiple="multiple"
      :accept="accept"
      v-bind="$attrs"
      @change="fileInputChanged"
    >
  </label>
</template>

<script>
/**
 * Select file(s) from the file system by clicking or drag-and-drop
 */
export default {
  name: 'UFileInput',

  props: {
    /**
     * Whether uploading multiple files is permitted
     */
    multiple: Boolean,
    /**
     * Placeholder for the dropzone when file(s) is not selected
     */
    placeholder: {
      type: String,
      default: 'fileInput.dropZone.caption'
    },
    /**
     * Placeholder for the dropzone when file(s) are selected
     */
    selectedPlaceholder: {
      type: String,
      default: 'fileInput.dropZone.selectedFiles'
    },
    /**
     * Whether to disable input
     */
    disabled: Boolean,
    /**
     * Types of files input should accept. A comma-separated list of unique file type specifiers.
     * See [Input element accept](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#accept)
     *
     * Example: ".doc,.docx,application/msword"
     */
    accept: {
      type: String,
      default: ''
    },

    /**
     * Whether to show border
     */
    border: {
      type: Boolean,
      default: true
    },

    /**
     * Selected files
     */
    value: {
      type: Array,
      default: () => []
    }
  },

  data () {
    return {
      dragging: false
    }
  },

  computed: {
    acceptableFileTypes: function () {
      return this.accept.split(',').map(a => a.trim())
    },
    selectedFileNames: function () {
      return this.value.map(f => f.name).join('; ')
    }
  },

  methods: {
    fileInputChanged (e) {
      this.upload(e.target.files)
      e.target.value = null
    },

    drop (e) {
      this.dragging = false
      if (this.disabled) return

      this.upload(e.dataTransfer.files)
    },

    upload (files) {
      const { valid, invalid } = this.validateFiles(files)

      if (valid.length) {
        /**
         * Triggers when file(s) selected for valid (match `accept` rule) files
         *
         * @param {Array<File>} valid
         */
        this.$emit('input', valid)
      }

      if (invalid.length) {
        const invalidFilesNames = invalid.map(f => f.name).join(', ')
        this.$notify({
          type: 'error',
          message: `${this.$ut('fileInput.dropZone.acceptError')}: ${invalidFilesNames}`,
          duration: 0
        })
      }
    },

    validateFiles (files) {
      const valid = []
      const invalid = []
      for (const file of Array.from(files)) {
        if (this.isAcceptable(file)) {
          valid.push(file)
        } else {
          invalid.push(file)
        }
      }

      return { valid, invalid }
    },

    dragover (e) {
      if (this.disabled) return false
      e.preventDefault()
      e.stopPropagation()
      this.dragging = true
    },

    isAcceptable (file) {
      if (this.accept === '') {
        return true
      }
      return this.acceptableFileTypes.some(ft => {
        // file type specifier can be either extension or mime
        const lcName = String(ft).toLowerCase()
        return file.name.toLowerCase().endsWith(lcName) || file.type.includes(lcName)
      })
    }
  }
}
</script>

<style>
  .u-file__dropzone input {
    display: none;
  }

  .u-file__dropzone {
    padding: 20px 12px;
    border-radius: var(--border-radius);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    justify-content: center;
    cursor: pointer;
    line-height: 1;
    height: 100%;
    width: 100%;
  }

  .u-file__dropzone-placeholder {
    color: hsl(var(--hs-text), var(--l-text-description));
  }

  .u-file__dropzone-border{
    border: 1px solid hsl(var(--hs-border), var(--l-layout-border-default));
  }

  .u-file__dropzone-icon {
    margin-bottom: 4px;
  }

  .u-file__dropzone:active:not(.disabled),
  .u-file__dropzone.hover:not(.disabled) {
    border-color: hsl(var(--hs-primary), var(--l-input-border-hover));
    color: hsl(var(--hs-primary), var(--l-text-label));
    background: hsl(var(--hs-primary), var(--l-background-default));
  }

  .u-file__dropzone.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .u-file__dropzone .text--truncated {
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
</style>
