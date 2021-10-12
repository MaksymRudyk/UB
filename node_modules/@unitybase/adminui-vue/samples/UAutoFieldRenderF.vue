// this is example of how Vue creates render function  (see script section) from template
<template>
  <u-form-row
      :label="label"
      :required="isRequired"
      :error="isError"
      v-bind="$attrs"
  >
    <el-checkbox
        v-if="dataType === 'Boolean'"
        v-bind="$attrs"
        v-model="model"
    />
    <u-date-picker
        v-else-if="(dataType === 'Date') || (dataType === 'DateTime')"
        v-model="model"
        v-bind="$attrs"
        :type="dataType.toLowerCase()"
        :placeholder="$ut(dataType === 'Date' ? 'selectDate' : 'selectDateAndTime')"
        :picker-options="{ firstDayOfWeek }"
    />
    <u-select-enum
        v-else-if="dataType === 'Enum'"
        v-model="model"
        v-bind="$attrs"
        :e-group="entitySchema.attributes[attributeName].enumGroup"
        :clearable="entitySchema.attributes[attributeName].allowNull"
    />
    <u-select-entity
        v-else-if="dataType === 'Entity'"
        v-model="model"
        v-bind="$attrs"
        :entity-name="associatedEntity"
    />
    <u-select-many
        v-else-if="dataType === 'Many'"
        v-model="model"
        v-bind="$attrs"
        :entity-name="associatedEntity"
    />
    <el-input
        v-else-if="dataType === 'Text'"
        v-model="model"
        v-bind="$attrs"
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 4 }"
    />
    <u-file
        v-else-if="dataType === 'Document'"
        v-model="model"
        v-bind="$attrs"
        :attribute-name="attributeName"
    />
    <u-code-mirror
        v-else-if="dataType === 'Json'"
        v-model="model"
        v-bind="$attrs"
    />
    <u-input
        v-else
        v-bind="$attrs"
        :attribute-name="attributeName"
    />
    <slot />
  </u-form-row>
</template>

<script>
with (this) {
  return _c('u-form-row', _b({
    attrs: {
      'label': label,
      'required': isRequired,
      'error': isError
    }
  }, 'u-form-row', $attrs, false), [(dataType === 'Boolean') ? _c('el-checkbox', _b({
    model: {
      value: (model),
      callback: function ($$v) {model = $$v},
      expression: 'model'
    }
  }, 'el-checkbox', $attrs, false)) : ((dataType === 'Date') || (dataType === 'DateTime')) ? _c('el-date-picker', _b({
    attrs: {
      'type': dataType.toLowerCase(),
      'placeholder': $ut(dataType === 'Date' ? 'selectDate' : 'selectDateAndTime'),
      'picker-options': {firstDayOfWeek}
    }, model: {value: (model), callback: function ($$v) {model = $$v}, expression: 'model'}
  }, 'el-date-picker', $attrs, false)) : (dataType === 'Enum') ? _c('u-select-enum', _b({
    attrs: {
      'e-group': entitySchema.attributes[attributeName].enumGroup,
      'clearable': entitySchema.attributes[attributeName].allowNull
    }, model: {value: (model), callback: function ($$v) {model = $$v}, expression: 'model'}
  }, 'u-select-enum', $attrs, false)) : (dataType === 'Entity') ? _c('u-select-entity', _b({
    attrs: {'entity-name': associatedEntity},
    model: {value: (model), callback: function ($$v) {model = $$v}, expression: 'model'}
  }, 'u-select-entity', $attrs, false)) : (dataType === 'Many') ? _c('u-select-many', _b({
    attrs: {'entity-name': associatedEntity},
    model: {value: (model), callback: function ($$v) {model = $$v}, expression: 'model'}
  }, 'u-select-many', $attrs, false)) : (dataType === 'Text') ? _c('el-input', _b({
    attrs: {
      'type': 'textarea',
      'autosize': {minRows: 3, maxRows: 4}
    }, model: {value: (model), callback: function ($$v) {model = $$v}, expression: 'model'}
  }, 'el-input', $attrs, false)) : (dataType === 'Document') ? _c('u-file', _b({
    attrs: {'attribute-name': attributeName},
    model: {value: (model), callback: function ($$v) {model = $$v}, expression: 'model'}
  }, 'u-file', $attrs, false)) : (dataType === 'Json') ? _c('u-code-mirror', _b({
    model: {
      value: (model),
      callback: function ($$v) {model = $$v},
      expression: 'model'
    }
  }, 'u-code-mirror', $attrs, false)) : _c('u-input', _b({attrs: {'attribute-name': attributeName}}, 'u-input', $attrs, false)), _v(' '), _t('default')], 2)
}
</script>

