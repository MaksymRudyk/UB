<template>
  <u-base-input
    v-model="model"
    :type="getType"
    :step="getStep"
    :precision="getPrecision"
    v-bind="$attrs"
  >
    <locale-button
      v-if="getMultilang"
      slot="append"
      :attribute-name="attributeName"
    />
  </u-base-input>
</template>

<script>
const LocaleButton = require('./LocaleButton.vue').default
const numberTypes = ['Int', 'BigInt', 'Float', 'Currency', 'ID']

/**
 * A UBaseInput with added support of multi-lang string attributes
 *
 * **Important** - can be used inside instance module only (injects `entitySchema` and `$v`)
 */
export default {
  name: 'UInput',
  components: { LocaleButton },
  inject: ['entitySchema', '$v'],

  props: {
    /**
     * attribute name in entitySchema
     */
    attributeName: {
      type: String,
      required: true
    },
    /**
     * "step" for `type=numeric`. Default is calculated based on attribute metadata
     */
    step: Number,
    /**
     * "precision" for `type=numeric`. Default is calculated based on attribute metadata
     */
    precision: Number,
    /**
     * use :multilang="false" to hide locale button for multi-lang attribute
     */
    multilang: {},
    /**
     * an input "type". Default is calculated based on attribute metadata.
     * See [input types on MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#input_types)
     */
    type: String
  },

  computed: {
    getStep () {
      if (this.step !== undefined) {
        return this.step
      }
      if (this.dataType === 'Float') {
        return 1 / 10 ** (this.$UB.connection.domain.FLOATING_SCALE_PRECISION)
      }
      if (this.dataType === 'Currency') {
        return 0.01
      }
      if ((this.dataType === 'Int') || (this.dataType === 'BigInt') || (this.dataType === 'ID')) return 1

      return undefined
    },

    getPrecision () {
      if (this.precision !== undefined) {
        return this.precision
      }
      if (this.dataType === 'Float') return this.$UB.connection.domain.FLOATING_SCALE_PRECISION
      if (this.dataType === 'Currency') return 2
      if ((this.dataType === 'Int') || (this.dataType === 'BigInt') || (this.dataType === 'ID')) return 0

      return undefined
    },

    dataType () {
      return this.entitySchema.attributes[this.attributeName].dataType
    },

    getMultilang () {
      if (this.multilang !== undefined) {
        return this.multilang
      }
      return this.entitySchema.attributes[this.attributeName].isMultiLang
    },

    getType () {
      if (this.type !== undefined) {
        return this.type
      }
      const isNumber = numberTypes.includes(this.dataType)
      return isNumber ? 'number' : 'text'
    },

    model: {
      get () {
        return this.$store.state.data[this.attributeName]
      },

      set (value) {
        if (this.$v && this.attributeName in this.$v) {
          this.$v[this.attributeName].$touch()
        }
        this.$store.commit('SET_DATA', { key: this.attributeName, value })
      }
    }
  }
}
</script>

<style>
  .ub-input.is-disabled .el-input-group__append{
    border-color: hsl(var(--hs-border), var(--l-input-border-default));
  }
</style>
