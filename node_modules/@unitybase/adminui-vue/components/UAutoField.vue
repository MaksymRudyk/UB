<script>
const alsMixin = require('./controls/mixins/alsMixin')
/**
 * Render a `UFormRow` (label + validation text) with based on attribute metadata control class
 */
export default {
  name: 'UAutoField',
  mixins: [alsMixin],
  inject: {
    $v: { from: '$v' },
    entity: { from: 'entity' },
    entitySchema: { from: 'entitySchema' },
    isDisabled: { from: 'isDisabled', default: false }
  },

  props: {
    /**
     * attribute name
     */
    attributeName: {
      type: String,
      required: true
    },

    /**
     * override an attribute "required" (nullAllowed in meta file)
     */
    required: {
      type: Boolean,
      default: undefined
    },

    /**
     * override an attribute "readonly" (readOnly in meta file)
     */
    readonly: {
      type: Boolean,
      default: undefined
    },

    /**
     * specify a component what should be used instead of default, based on attribute type.
     * For example `<u-auto-field attribute-name="bool_attr" force-cmp="el-switch" />` will create
     * `el-switch` instead of `el-checkbox` (default cmp for Boolean)
     */
    forceCmp: {
      type: String,
      default: undefined
    }
  },

  computed: {
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
    },

    dataType () {
      return this.entitySchema.attributes[this.attributeName].dataType
    },

    associatedEntity () {
      return this.entitySchema.attributes[this.attributeName].associatedEntity
    },

    isRequired () {
      if (this.required !== undefined && this.required !== false) {
        return this.required
      }
      return (
        this.$_isRequiredByALS(this.attributeName) ||
        (this.$v && this.$v[this.attributeName] && 'required' in this.$v[this.attributeName].$params)
      )
    },

    isReadOnly () {
      return (this.readonly !== undefined && this.readonly !== false)
        ? this.readonly
        : this.$_isReadOnlyByALS(this.attributeName) ||
          !!this.entitySchema.attributes[this.attributeName].readOnly
    },

    /**
     *  Re-assign parent event listeners for `input` event, so u-auto-filed can be extended as such:

     <template>
      <u-auto-field
        v-if="!isHidden(attributeName)"
        :required="isRequired(attributeName)"
        v-bind="$attrs"
        :attribute-name="attributeName"
        v-on="$listeners"
      />
     </template>

     * @returns {Record<string, Function | Function[]> & {input: input}}
     */
    buildListenersOnInput () {
      const vm = this
      // `Object.assign` concatenates objects together to get a new object
      return Object.assign({},
        // We add all listeners from the parent
        this.$listeners,
        // Then we can add our own listeners or
        // overwrite the behavior of some existing ones.
        {
          // This will ensure that v-model works on the component
          input: (value, option) => {
            vm.model = value
            vm.$emit('input', value, option)
          }
        }
      )
    },

    /**
     * Re-assign parent event listeners for `change` event
     * @return {Record<string, Function | Function[]> & {change: change}}
     */
    buildListenersOnChange () {
      const vm = this
      return Object.assign({},
        this.$listeners,
        {
          change: value => {
            vm.model = value
            vm.$emit('change', value)
          }
        }
      )
    }
  },

  render (h) {
    let cmp
    let defIsRequired = this.isRequired
    const /** @type {UBEntityAttribute} */ATTR = this.entitySchema.attributes[this.attributeName]
    if (!ATTR) throw new Error(`UAutoFiled attribute-name property is mapped to the non-existed attribute '${this.attributeName}' for entity '${this.entitySchema.name}'`)
    const baseAttrs = { // vue split attrs into attrs and props automatically
      ...this.$attrs,
      attributeName: this.attributeName,
      value: this.model,
      disabled: this.isDisabled || this.$attrs.disabled,
      readonly: this.isDisabled || this.$attrs.readonly || this.isReadOnly,
      required: this.isRequired
    }
    switch (ATTR.dataType) {
      case 'Boolean':
        if (!baseAttrs.disabled && baseAttrs.readonly) {
          baseAttrs.disabled = baseAttrs.readonly // need because 'el-checkbox' and 'el-switch' doesn't have 'readonly' prop
        }
        if ((this.required === undefined) && ATTR.defaultValue) {
          // hide asterisk for boolean attributes with defaultValue specified (as should be in most case)
          // and `required` prop for UAutoField is not specified explicitly
          defIsRequired = false
        }
        cmp = h(this.forceCmp || 'el-checkbox', {
          attrs: baseAttrs,
          on: this.buildListenersOnChange
        })
        break
      case 'Date':
      case 'DateTime':
        if (!ATTR.allowNull) {
          baseAttrs.clearable = false
        }
        cmp = h(this.forceCmp || 'u-date-picker', {
          attrs: {
            type: ATTR.dataType.toLowerCase(),
            placeholder: this.$ut(ATTR.dataType === 'Date' ? 'selectDate' : 'selectDateAndTime'),
            ...baseAttrs
          },
          on: this.buildListenersOnInput
        })
        break
      case 'Enum':
        cmp = h(this.forceCmp || 'u-select-enum', {
          attrs: {
            eGroup: ATTR.enumGroup,
            clearable: ATTR.allowNull,
            ...baseAttrs
          },
          on: this.buildListenersOnInput
        })
        break
      case 'Entity':
        cmp = h(this.forceCmp || 'u-select-entity', {
          attrs: {
            entityName: ATTR.associatedEntity,
            ...baseAttrs
          },
          on: this.buildListenersOnInput
        })
        break
      case 'Many':
        cmp = h(this.forceCmp || 'u-select-many', {
          attrs: {
            entityName: ATTR.associatedEntity,
            ...baseAttrs
          },
          on: this.buildListenersOnInput
        })
        break
      case 'Text':
        cmp = h(this.forceCmp || 'el-input', {
          attrs: {
            type: 'textarea',
            autosize: { minRows: 3, maxRows: 4 },
            ...baseAttrs
          },
          on: this.buildListenersOnInput
        })
        break
      case 'Document':
        cmp = h(this.forceCmp || 'u-file', {
          attrs: baseAttrs,
          on: this.buildListenersOnInput
        })
        break
      case 'Json':
        cmp = h(this.forceCmp || 'u-code-mirror', {
          attrs: baseAttrs,
          on: this.buildListenersOnInput
        })
        break
      case 'String':
        cmp = h(this.forceCmp || 'u-input', {
          attrs: {
            maxLength: ATTR.size,
            ...baseAttrs
          }
        })
        break
      default:
        cmp = h(this.forceCmp || 'u-input', {
          attrs: baseAttrs
        })
    }
    return h('u-form-row',
      {
        attrs: {
          attributeName: this.attributeName,
          required: defIsRequired,
          readonly: this.isReadOnly,
          ...this.$attrs
        }
      },
      [cmp, this.$slots.default]
    )
  }
}
</script>

<docs>
Render a `UFormRow` (label + validation text) with based on attribute metadata control class

### Basic usage

```vue
<template>
  <u-form-container label-position="top">
    <u-auto-field attribute-name="duration" />
    <u-auto-field attribute-name="reqDate"/>
    <u-auto-field attribute-name="applicant" />
  </u-form-container>
</template>
```

### Default slot
Anything you need to render inside u-form-row container can be added as a u-form-row default slot content.
In sample below we output a description for `department` attribute:

``` vue
<u-auto-field attribute-name="department" label-position="top">
  <div class="u-form-row__description">
    {{ $UB.connection.domain.get('req_request').attributes['department'].description }}
  </div>
</u-auto-field>
```
</docs>
