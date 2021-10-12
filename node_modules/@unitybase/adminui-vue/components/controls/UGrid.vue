<template>
  <div
    class="u-grid"
    :style="{
      'display': 'grid',
      'grid-template-columns': gridTemplateColumns,
      'grid-template-rows': templateRows,
      'grid-column-gap': columnGap,
      'grid-row-gap': rowGap
    }"
  >
    <slot />
  </div>
</template>

<script>
/**
 * Container for align form elements into columns. Wrapper for a [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout/Basic_Concepts_of_Grid_Layout).
 */
export default {
  name: 'UGrid',

  props: {
    /**
     * Align controls into **N** equal columns. A wrapper for `repeat(**columns**, 1fr)`
     * Ignored if `templateColumns` is define.
     */
    columns: {
      type: Number,
      default: 2
    },

    /**
     * Sets a [grid-template-columns](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-columns)
     */
    templateColumns: String,

    /**
     * Sets a [grid-template-rows](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-rows)
     */
    templateRows: String,

    /**
     * Sets a [grid-column-gap](https://developer.mozilla.org/en-US/docs/Web/CSS/column-gap)
     */
    columnGap: {
      type: String,
      default: '20px'
    },

    /**
     * Sets a [grid-row-gap](https://developer.mozilla.org/en-US/docs/Web/CSS/row-gap)
     */
    rowGap: String,

    /**
     * Set label width to child `<u-form-row>`'s
     * Can be override by same prop in `u-form-row`.
     * Will ignored with labelPosition === 'top'
     */
    labelWidth: {
      type: Number
    },
    /**
     * Set label position of child `<u-form-row>`'s
     * Can be override by the same prop in `u-form-row`
     */
    labelPosition: {
      type: String,
      validator: (value) => ['left', 'right', 'top'].includes(value)
    },

    /**
     * Provides a max width in px to the child UFormRow's.
     * Do not confuse with the maximum width of the form itself
     */
    maxWidth: Number
  },

  inject: {
    parentLabelWidth: { from: 'labelWidth', default: null },
    parentLabelPosition: { from: 'labelPosition', default: null },
    parentMaxWidth: { from: 'maxWidth', default: null }
  },

  provide () {
    return {
      labelWidth: this.labelWidth || this.parentLabelWidth,
      labelPosition: this.labelPosition || this.parentLabelPosition,
      maxWidth: this.maxWidth || this.parentMaxWidth
    }
  },

  computed: {
    gridTemplateColumns () {
      if (this.templateColumns) {
        return this.templateColumns
      } else {
        return `repeat(${this.columns}, 1fr)`
      }
    }
  }
}
</script>

<style>
  .u-grid {
    display: grid;
  }

  @media (max-width: 960px) {
    .u-grid {
      grid-template-columns: 1fr !important;
    }
  }
</style>
