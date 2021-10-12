<template>
  <form
    tabindex="1"
    autocomplete="off"
    @submit.prevent
  >
    <slot />
  </form>
</template>

<script>
/**
 * A properties provider for child `u-form-row` components. Can set a focus to the first element
 */
export default {
  name: 'UFormContainer',

  props: {
    /**
     * Provides a label width to the child `<u-form-row>`'s
     * Individual `u-form-row` can override it using `:label-width="xx"`.
     * Ignored for labelPosition === 'top'
     */
    labelWidth: {
      type: Number
    },
    /**
     * Provides a label position to the child `<u-form-row>`'s.
     * Individual `u-form-row` can override it using `:label-position="xx"`
     */
    labelPosition: {
      type: String,
      validator: (value) => ['left', 'right', 'top'].includes(value)
    },
    /**
     * If 'true' (default) sets a focus to the first child element when mounted
     */
    autofocus: {
      type: Boolean,
      default: true
    },

    /**
     * Provides a max width in px to the child UFormRow's.
     * Do not confuse with the maximum width of the form itself
     */
    maxWidth: Number,

    /**
     * Provides `is-disabled` property to the child U-controls.
     * Don't applied to the ElementUI controls.
     */
    isDisabled: {
      type: Boolean,
      default: false
    }
  },

  inject: {
    parentLabelWidth: { from: 'labelWidth', default: null },
    parentLabelPosition: { from: 'labelPosition', default: null },
    parentMaxWidth: { from: 'maxWidth', default: null },
    parentIsDisabled: { from: 'isDisabled', default: false },
    parentIsModal: { from: 'isModal', default: false }
  },

  provide () {
    return {
      labelWidth: this.labelWidth || this.parentLabelWidth,
      labelPosition: this.labelPosition || this.parentLabelPosition,
      maxWidth: this.maxWidth || this.parentMaxWidth,
      isDisabled: this.isDisabled || this.parentIsDisabled
    }
  },

  mounted () {
    if (this.autofocus) {
      this.setFocus()
    }
  },

  methods: {
    async setFocus () {
      /*
       * added $nextTick because when UForm isMounted, its children's are not yet,
       * so you need to wait until the whole tree is built
       */
      await this.$nextTick()
      for (const el of this.$el.elements) {
        if (!el.disabled) {
          el.focus()
          break
        }
      }
    }
  }
}
</script>
