<template>
  <div
    v-if="divider"
    class="u-dropdown-item__divider"
  />

  <u-dropdown
    v-else
    :placement="placement"
    position="absolute"
  >
    <button
      :disabled="disabled"
      class="u-dropdown-item"
      @click="close"
      v-on="$listeners"
    >
      <i
        v-if="icon"
        :class="icon"
        class="u-dropdown-item__icon"
      />

      <span class="u-dropdown-item__label">
        <!-- @slot Replace label prop -->
        <slot
          v-if="$slots.label"
          name="label"
        />

        <template v-else>
          {{ $ut(label) }}
        </template>
      </span>

      <i
        v-if="hasChildren"
        class="u-dropdown-item__arrow u-icon-arrow-right"
      />
    </button>

    <!-- @slot For children u-dropdown-item -->
    <slot slot="dropdown" />
  </u-dropdown>
</template>

<script>
/**
 * A dropdown menu item for `UDropdown`
 */
export default {
  name: 'UDropdownItem',

  inject: ['placement', 'parentClose'],

  props: {
    /**
     * icon class
     */
    icon: String,

    /**
     * item text
     */
    label: String,

    /**
     * render divider ignore other props
     */
    divider: Boolean,

    /**
     * disabled state
     */
    disabled: Boolean,

    /**
     * prevent close dropdown
     */
    preventClose: Boolean
  },

  computed: {
    hasChildren () {
      return this.$slots.default !== undefined
    }
  },

  mounted () {
    this.$on('hide', () => {
      this.$parent.$emit('hide')
    })
  },

  methods: {
    close () {
      if (this.preventClose || this.hasChildren) {
        return
      }
      this.parentClose()
    }
  }
}
</script>

<style>
  .u-dropdown-item {
    display: flex;
    align-items: center;
    cursor: pointer;
    border: none;
    background: none;
    width: 100%;
    white-space: nowrap;
  }

  .u-dropdown-item:not(:disabled):hover {
    background: hsl(var(--hs-background), var(--l-background-default));
  }

  .u-dropdown-item__arrow {
    font-size: 12px;
    color: hsl(var(--hs-control), var(--l-state-default));
    padding-right: 4px;
    margin-left: auto;
  }

  .u-dropdown-item__icon {
    font-size: 16px;
    color: hsl(var(--hs-control), var(--l-state-default));
    width: 16px;
    height: 16px;
    margin-left: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .u-dropdown-item__label {
    color: hsl(var(--hs-text), var(--l-text-default));
    font-size: 14px;
    line-height: 1.4;
    padding: 8px;
    padding-right: 12px;
    margin-left: 4px;
  }

  .u-dropdown-item__divider {
    width: 100%;
    height: 1px;
    background: hsl(var(--hs-border), var(--l-layout-border-default));
    margin: 6px 0;
  }

  .u-dropdown-item:disabled {
    cursor: not-allowed;
  }

  .u-dropdown-item:disabled > .u-dropdown-item__icon{
    color: hsl(var(--hs-control), var(--l-state-disabled));
  }

  .u-dropdown-item:disabled > .u-dropdown-item__label{
    color: hsl(var(--hs-text), var(--l-text-disabled));
  }
</style>
