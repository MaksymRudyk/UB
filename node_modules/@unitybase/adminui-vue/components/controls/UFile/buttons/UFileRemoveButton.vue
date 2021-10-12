<template>
  <u-button
    :title="$ut('UFile.removeButtonTooltip')"
    color="primary"
    icon="u-icon-delete"
    appearance="inverse"
    :disabled="isDisabled"
    @click="removeFile"
  />
</template>

<script>
export default {
  name: 'UFileRemoveButton',

  props: {
    multiple: Boolean
  },

  inject: {
    instance: 'fileComponentInstance'
  },

  computed: {
    isDisabled () {
      if (this.instance.disabled) return true

      if (this.multiple) {
        return !this.instance.selectedFileId
      } else {
        return !this.instance.file || this.instance.disabled
      }
    }
  },

  methods: {
    removeFile () {
      const instance = this.instance
      if (this.multiple) {
        instance.$emit(
          'input',
          instance.value.filter(f => f.ID !== instance.selectedFileId)
        )
        instance.selectedFileId = null
      } else {
        instance.$emit('input', null)
      }
    }
  }
}
</script>
