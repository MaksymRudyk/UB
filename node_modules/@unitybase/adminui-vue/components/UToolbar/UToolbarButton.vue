<template>
  <u-button
    :title="$ut(tooltip)"
    class="u-toolbar-button"
    :appearance="appearance"
    :icon="icon"
    :color="transformedColor"
    :disabled="disabled"
    v-bind="$attrs"
    v-on="$listeners"
  />
</template>

<script>
/**
 * @deprecated Legacy component, use UButton instead it
 * @example
 *     <u-button
 *       :title="Edit"
 *       appearance="inverse"
 *       icon="u-icon-edit"
 *     />
 */
export default {
  name: 'UToolbarButton',

  props: {
    /**
     * Icon class
     */
    icon: String,
    /**
     * Tooltip text
     */
    tooltip: String,
    /**
     * Icon and text color.
     * enum = primary | secondary | info | danger | warning
     */
    color: {
      type: String,
      default: 'primary'
    },
    /**
     * Weather disabled state
     */
    disabled: Boolean,

    appearance: {
      type: String,
      default: 'inverse'
    }
  },

  data () {
    return {
      colorMap: {
        primary: 'primary',
        secondary: 'success',
        info: 'control',
        danger: 'danger',
        warning: 'warning'
      }
    }
  },

  computed: {
    /**
     * Transform legacy color definition according UButton colors
     *
     * @return {string}
     */
    transformedColor () {
      return this.colorMap[this.color]
    }
  }
}
</script>
