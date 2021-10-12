<template>
  <u-table
    class="uba_audit__diff-table"
    :items="tableData"
    :columns="[{
      id: 'attrName',
      label: 'nameAttr'
    }, {
      id: 'oldValue',
      label: 'fromValue'
    }, {
      id: 'newValue',
      label: 'toValue'
    }]"
  >
    <template #oldValue="{value, row}">
      <diff-cell
        :atoms="value"
        :data-type="row.dataType"
      />
    </template>

    <template #newValue="{value, row}">
      <diff-cell
        :atoms="value"
        :data-type="row.dataType"
      />
    </template>
  </u-table>
</template>

<script>
const { mapState } = require('vuex')

export default {
  name: 'DiffTable',

  components: {
    DiffCell: require('./DiffCell.vue').default
  },

  computed: mapState(['tableData'])
}
</script>

<style>
.uba_audit__diff-table .u-table__cell-container{
  display: block;
}

.uba_audit__diff-table th:nth-child(1) {
  min-width: 220px;
}
.uba_audit__diff-table th:nth-child(2),
.uba_audit__diff-table th:nth-child(3) {
  width: 50%;
}
</style>
