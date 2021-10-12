<template>
  <div
    :class="{
      'audit-diff-table__cell_json': ['Json', 'Document'].includes(dataType)
    }"
  >
    <span
      v-for="(atom, index) in atoms"
      :key="index"
      :class="`audit-diff-table__cell-atom__${atom.operation}`"
    >{{ atom.word }}</span>
  </div>
</template>

<script>
export default {
  name: 'DiffCell',

  props: {
    atoms: Array,
    dataType: String
  }
}
</script>

<style>
.audit-diff-table__cell-atom__add {
  background: hsl(var(--hs-success), var(--l-background-default));
  color: hsl(var(--hs-success), var(--l-state-default));
}

.audit-diff-table__cell-atom__delete {
  background: hsl(var(--hs-danger), var(--l-background-default));
  color: hsl(var(--hs-danger), var(--l-state-default));
}

.audit-diff-table__cell_json {
  white-space: pre;
  font-family: monospace;
}
</style>
