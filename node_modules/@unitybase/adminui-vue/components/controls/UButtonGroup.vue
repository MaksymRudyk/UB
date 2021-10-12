<template>
  <div
    class="u-button-group"
    :class="[`u-button-group_direction-${direction}`]"
  >
    <slot />
  </div>
</template>

<script>
/**
 * Group a series of u-button's together
 */
export default {
  name: 'UButtonGroup',

  props: {
    /**
     * direction of a buttons in group
     * */
    direction: {
      type: String,
      default: 'horizontal',
      validator (value) {
        return ['horizontal', 'vertical'].includes(value)
      }
    }
  }
}
</script>

<style>
.u-button-group {
  display: flex;
}

.u-button-group > .u-button {
  border-radius: 0;
  z-index: 0;
  position: relative;
  border: 1px solid rgba(0,0,0, 0.5);
}

.u-button-group > .u-button:not(.u-button_appearance-default):hover {
  z-index: 1;
}

.u-button-group_direction-horizontal > .u-button:first-child {
  border-bottom-left-radius: var(--border-radius);
  border-top-left-radius: var(--border-radius);
}

.u-button-group_direction-horizontal > .u-button:last-child {
  border-bottom-right-radius: var(--border-radius);
  border-top-right-radius: var(--border-radius);
}

.u-button-group_direction-vertical{
  flex-direction: column;
}

.u-button-group_direction-vertical > .u-button{
  justify-content: left;
}

.u-button-group_direction-vertical > .u-button:first-child {
  border-top-left-radius: var(--border-radius);
  border-top-right-radius: var(--border-radius);
}

.u-button-group_direction-vertical > .u-button:last-child {
  border-bottom-left-radius: var(--border-radius);
  border-bottom-right-radius: var(--border-radius);
}

.u-button-group_direction-horizontal > .u-button + .u-button {
  margin-left: -1px;
}

.u-button-group_direction-vertical > .u-button + .u-button {
  margin-top: -1px;
}

.u-button-group > .u-button_appearance-default + .u-button_appearance-default {
  border-left-color: hsl(var(--hs-background), var(--l-background-inverse));
}
</style>
