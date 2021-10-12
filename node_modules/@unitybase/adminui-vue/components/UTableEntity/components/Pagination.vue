<template>
  <div class="pagination">
    <div class="pagination__current">
      {{ items.length === 0 ? 0 : pageIndex * pageSize + 1 }} - {{ pageIndex * pageSize + items.length }}
    </div>

    <div class="pagination__out-of">
      {{ $ut('table.pagination.outOf') }}
    </div>

    <button
      v-if="total === null"
      class="pagination__total"
      :disabled="loading"
      @click="getTotal"
    >
      <span>---</span>
      <i class="pagination__total-icon u-icon-eye" />
    </button>
    <button
      v-else
      class="pagination__total"
      disabled
    >
      <span>{{ totalFormatted }}</span>
    </button>

    <u-button
      :title="$ut('table.pagination.prevPage')"
      icon="u-icon-arrow-left"
      class="pagination__button__prev"
      color="control"
      size="small"
      appearance="inverse"
      :disabled="pageIndex === 0 || loading"
      @click="pageIndex -= 1"
    />
    <u-button
      :title="$ut('table.pagination.nextPage')"
      icon="u-icon-arrow-right"
      class="pagination__button__next"
      color="control"
      size="small"
      appearance="inverse"
      :disabled="isLastPageIndex || loading"
      @click="pageIndex += 1"
    />
  </div>
</template>

<script>
const { mapState, mapGetters, mapActions } = require('vuex')

export default {
  name: 'UTableEntityPagination',

  computed: {
    ...mapState([
      'items',
      'isLastPageIndex',
      'total',
      'loading'
    ]),

    ...mapGetters(['pageSize']),

    totalFormatted () {
      return this.$UB.formatter.formatNumber(
        this.total,
        'numberGroup',
        this.$UB.connection.userLang()
      )
    },

    pageIndex: {
      get () {
        return this.$store.state.pageIndex
      },
      set (value) {
        this.updatePageIndex(value)
      }
    }
  },

  methods: mapActions([
    'getTotal',
    'updatePageIndex'
  ])
}
</script>

<style>
  .pagination{
    margin-left: auto;
    display: flex;
    align-items: center;
    padding: 0 8px;
    white-space: nowrap;
  }

  .pagination__current{
    color: hsl(var(--hs-text), var(--l-text-label));
    font-weight: 500;
  }

  .pagination__total{
    background: hsl(var(--hs-background), var(--l-background-default));
    border-radius: 5px;
    cursor: pointer;
    border: none;
    height: 100%;
    padding: 8px 6px;
    display: flex;
    align-items: center;
  }

  .pagination__total:disabled{
    cursor: not-allowed;
  }

  .pagination__total span {
    color: hsl(var(--hs-text), var(--l-text-label));
    font-weight: 500;
  }

  .pagination__total-icon{
    margin-left: 6px;
  }

  .pagination__total i {
    color: hsl(var(--hs-primary), var(--l-state-default));
    font-size: 18px;
  }

  .pagination__out-of{
    color: hsl(var(--hs-text), var(--l-text-label));
    font-weight: 500;
    margin: 0 4px;
  }

  .pagination__button__prev{
    margin-left: 12px;
    padding: 2px;
  }

  .pagination__button__next{
    margin-right: 8px;
    padding: 2px;
  }
</style>
