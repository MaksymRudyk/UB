<template>
  <div
    v-show="filters.length > 0"
    class="u-table-entity__filter-list"
  >
    <div class="u-table-entity__filter-list__title">
      {{ $ut('table.filter.list.title') }}:
    </div>

    <div
      v-for="filter in filters"
      :key="filter.id"
      class="u-table-entity__filter-list-item"
      @click.middle="!loading && removeFilter(filter.columnId)"
    >
      <div>
        <span>
          {{ $ut(filter.label) }}
        </span>
        <span class="filter-list-item__description">
          {{ $ut(filter.description) }}
        </span>
      </div>
      <i
        class="u-table-entity__filter-list-item__close-icon u-icon-close"
        @click="!loading && removeFilter(filter.columnId)"
      />
    </div>
  </div>
</template>

<script>
const { mapState, mapActions } = require('vuex')

export default {
  computed: mapState(['filters', 'loading']),
  methods: mapActions(['removeFilter'])
}
</script>

<style>
.u-table-entity__filter-list{
  display: flex;
  align-items: center;
  padding: 8px 16px;
}

.u-table-entity__filter-list__title{
  color: hsl(var(--hs-text), var(--l-text-label));
}

.u-table-entity__filter-list-item{
  display: flex;
  align-items: center;
  padding-left: 8px;
  margin-left: 8px;
  color: hsl(var(--hs-text), var(--l-text-description));
  font-size: 12px;
  line-height: 1.1;
  background: hsl(var(--hs-background), var(--l-background-default));
  border: 1px solid hsl(var(--hs-border), var(--l-input-border-disabled));
  border-radius: var(--border-radius);
  font-weight: 300;
}

.filter-list-item__description{
  color: hsl(var(--hs-text), var(--l-text-default));
}

.u-table-entity__filter-list-item__close-icon{
  margin-left: 4px;
  font-size: 14px;
  color: #000;
  cursor: pointer;
  width: 30px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
