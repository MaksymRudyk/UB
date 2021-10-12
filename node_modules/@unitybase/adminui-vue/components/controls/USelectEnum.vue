<template>
  <u-select-entity
    :repository="getEnumRequest"
    :value="value"
    :value-attribute="valueAttribute"
    :disabled="disabled"
    :readonly="readonly"
    remove-default-actions
    :editable="editable"
    :placeholder="placeholder"
    :clearable="clearable"
    v-on="$listeners"
  />
</template>

<script>
/**
* Component for select UB enum.
*/
export default {
  name: 'USelectEnum',
  props: {
    /**
     * Selected item ID
     * @model
     */
    value: {
      type: [Number, String],
      default () {
        return null
      }
    },
    /**
     * Enum group from dictionary 'ubm_enum'
     */
    eGroup: {
      type: String,
      required: true
    },
    /**
     * Set disabled status
     */
    disabled: Boolean,
    /**
     * False to prevent the user from typing text directly into the field;
     * the field can only have its value set via selecting a value from the picker.
     * In this state, the picker can also be opened by clicking directly on the input field itself.
     */
    editable: {
      type: Boolean,
      default: false
    },
    /**
     * Input placeholder.
     */
    placeholder: {
      type: String,
      default: ''
    },
    /**
     * Set readonly status
     */
    readonly: Boolean,
    /**
     * Add clear icon
     */
    clearable: Boolean,

    /**
     * Search request condition
     */
    searchStrategy: {
      type: String,
      default: 'like',
      validator: value => ['like', 'startsWith'].includes(value)
    },
    /**
     * Function which return UBRepository
     * @returns {ClientRepository}
     */
    repository: Function
  },

  data () {
    return {
      valueAttribute: 'code',
      enumEntity: 'ubm_enum'
    }
  },

  computed: {
    entitySchema () {
      return this.$UB.connection.domain.get(this.enumEntity)
    },

    displayAttribute () {
      return this.entitySchema.descriptionAttribute
    }

  },

  methods: {
    getEnumRequest () {
      if (this.repository) {
        return this.repository()
      } else {
        return this.$UB.Repository(this.enumEntity)
          .attrs('eGroup', this.valueAttribute, this.displayAttribute, 'sortOrder')
          .where('eGroup', '=', this.eGroup, { clearable: false })
          .orderBy('sortOrder')
      }
    }
  }
}
</script>

<docs>
Based on `u-select-entity` accordingly have all same props

```vue
<template>
  <u-select-enum
    v-model="value"
    e-group="FORM_TYPE"
  />
</template>
<script>
  export default {
    data () {
      return {
        value: null
      }
    }
  }
</script>
```
</docs>
