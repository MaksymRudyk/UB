<template>
  <el-input
    v-model="model"
    class="ub-input"
    :type="type"
    :step="step"
    :disabled="isDisabled || $attrs.disabled"
    v-bind="$attrs"
    @change="internalValue=undefined"
  >
    <!-- @slot content as Input prefix -->
    <slot
      slot="prefix"
      name="prefix"
    />
    <!-- @slot content as Input suffix -->
    <slot
      slot="suffix"
      name="suffix"
    />
    <!-- @slot content to prepend before Input -->
    <slot
      slot="prepend"
      name="prepend"
    />
    <!-- @slot content to append after Input -->
    <slot
      slot="append"
      name="append"
    />
  </el-input>
</template>

<script>
/**
 * Input. For inputs of type="number", rounding precision and changing step (for up/down arrows) can be specified
 */
export default {
  name: 'UBaseInput',

  inject: {
    isDisabled: { from: 'isDisabled', default: false }
  },

  props: {
    /*
     * @model
     */
    value: {
      required: true
    },

    /**
     * a stepping interval to adjust the value using up/down keys
     * will be ignored if type !== 'number'
     */
    step: {
      type: [Number, String],
      default: 'any'
    },

    /**
     * rounding precision. Applied in case `type === 'number'` and `precision !== undefined`
     */
    precision: {
      type: Number,
      default: undefined
    },

    /**
     * input type. See [input types on MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#input_types)
     */
    type: {
      type: String,
      default: 'text'
    }
  },

  data () {
    return {
      internalValue: undefined
    }
  },

  computed: {
    model: {
      get () {
        if (this.type === 'number' && this.internalValue !== undefined) {
          return this.internalValue
        }
        return this.value
      },
      set (value) {
        this.internalValue = value

        if (value === null || value === '') {
          this.$emit('input', null)
          return
        }

        if (this.type === 'number') {
          let asNumber = Number(value)
          if (this.precision !== undefined) {
            const preciseness = 10 ** this.precision
            asNumber = Math.round((asNumber * preciseness)) / preciseness
          }
          this.$emit('input', asNumber)
          return
        }

        this.$emit('input', value)
      }
    },

    numberEvent () {
      return (this.type === 'number') ? 'change' : null
    }
  }
}
</script>

<style>
.ub-input input::-webkit-inner-spin-button,
.ub-input input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
