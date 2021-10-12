<template>
  <div
    v-if="!isLastPageIndex && !loading"
    class="u-table-entity__next-page-button-wrap"
  >
    <u-button
      appearance="plain"
      color="primary"
      right-icon="u-icon-arrow-right"
      :disabled="loading"
      @click="pageIndex += 1"
    >
      {{ $ut('table.pagination.nextPage') }}
    </u-button>
  </div>
</template>

<script>
const { mapState } = require('vuex')

export default {
  name: 'NextPageButton',
  computed: {
    ...mapState([
      'loading',
      'isLastPageIndex'
    ]),

    pageIndex: {
      get () {
        return this.$store.state.pageIndex
      },
      set (index) {
        this.$store.dispatch('updatePageIndex', index)
      }
    }
  }
}
</script>

<style>
.u-table-entity__next-page-button-wrap {
  position: sticky;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 12px 16px;
}
</style>
