<template>
  <div>
    <div
      v-if="column.isHtml"
      v-html="formatValue({ value, column, row })"
    />
    <template v-else>
      {{ formatValue({ value, column, row }) }}
    </template>
  </div>
</template>

<script>
const formatValueMixin = require('../../controls/UTable/formatValueMixin')

export default {
  name: 'DefaultCellTemplate',

  mixins: [formatValueMixin],

  props: ['value', 'row', 'column']
}
</script>
