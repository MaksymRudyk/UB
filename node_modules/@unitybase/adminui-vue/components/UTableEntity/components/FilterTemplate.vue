<template>
  <form
    class="u-fake-table__tbody"
    @submit.prevent="$emit('submit')"
  >
    <div
      v-if="$slots.default"
      class="u-fake-table__tr"
    >
      <div class="u-fake-table__td u-fake-table__label">
        {{ $ut('table.filter.valueLabel') }}
      </div>
      <div class="u-fake-table__td">
        <slot />
      </div>
    </div>
    <div class="u-fake-table__tr">
      <div class="u-fake-table__td" />
      <div class="u-fake-table__td u-table-entity__filter-submit-container">
        <u-button
          :disabled="buttonDisabled"
          type="submit"
          icon="u-icon-search"
          color="primary"
        >
          {{ $ut('search') }}
        </u-button>
      </div>
    </div>
  </form>
</template>

<script>
/**
 * Template for filter. Accepts slot for value input and disabling state of submit button.
 * Emits "submit" event.
 */
export default {
  name: 'UTableEntityFilterTemplate',

  props: {
    /**
     * Disable state of submit button.
     */
    buttonDisabled: Boolean
  }
}
</script>
