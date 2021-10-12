<template>
  <button
    class="u-button"
    :type="type"
    :class="[
      `u-button_appearance-${appearance}`,
      `u-button_color-${color}`,
      `u-button_size-${size}`,
      {
        'u-button_has-icon': icon || rightIcon,
        'u-button_has-text': $slots.default,
        'u-button_circle': circle
      }
    ]"
    v-on="$listeners"
  >
    <i
      v-if="icon || loading"
      class="u-button__icon"
      :class="!loading ? icon : 'el-icon-loading'"
    />
    <span
      v-if="$slots.default"
      class="u-button__label"
    >
      <!-- @slot Use this slot for button content -->
      <slot />
    </span>
    <i
      v-if="rightIcon"
      class="u-button__icon"
      :class="[rightIcon, icon]"
    />
  </button>
</template>

<script>
/**
 * Button with icon (left and right), multiple sizes, appearances and colors.
 * Button with primary color should be used only once per view for main call-to-action.
 *
 * Accept handlers for all [HTML element events](https://developer.mozilla.org/en-US/docs/Web/API/Element#Events), for example
 * `@click="onClick" @paste="onPaste"` etc.
 */
export default {
  name: 'UButton',

  props: {
    /**
     * Left icon css class
     */
    icon: String,

    /**
     * Right icon css class
     */
    rightIcon: String,

    /**
     * Size of the button
     */
    size: {
      type: String,
      default: 'medium',
      validator (value) {
        return ['small', 'medium', 'large'].includes(value)
      }
    },
    /**
     * Native button type. See "type" property on https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button
     */
    type: {
      type: String,
      default: 'button'
    },

    /**
     * Appearance of the button
     */
    appearance: {
      type: String,
      default: 'default',
      validator (value) {
        return ['default', 'plain', 'inverse'].includes(value)
      }
    },

    /**
     * A loading icon appears instead of the regular one
     */
    loading: {
      type: Boolean,
      default: false
    },

    /**
     * Color of the button
     */
    color: {
      type: String,
      default: 'control',
      validator (value) {
        return ['control', 'primary', 'success', 'danger', 'warning'].includes(value)
      }
    },

    /**
     * Circle button
     */
    circle: {
      type: Boolean,
      default: false
    },
  }
}
</script>

<style>
  .u-button {
    --hs: var(--hs-control);
    --l: var(--l-state-default);
    color: hsl(var(--hs-text), var(--l-text-inverse));
    cursor: pointer;
    background: hsl(var(--hs), var(--l));
    border-radius: var(--border-radius);
    border: 1px solid hsl(var(--hs), var(--l));
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .u-button_size-small {
    --font-size: 14px;
    --padding-of-button-and-inner-elements: 2px;
    --side-padding-of-button-with-text: 20px;
    --side-padding-of-button-with-text-and-icon: 8px;
  }

  .u-button_size-medium {
    --font-size: 16px;
    --padding-of-button-and-inner-elements: 4px;
    --side-padding-of-button-with-text: 24px;
    --side-padding-of-button-with-text-and-icon: 16px;
  }

  .u-button_size-large {
    --font-size: 18px;
    --padding-of-button-and-inner-elements: 6px;
    --side-padding-of-button-with-text: 28px;
    --side-padding-of-button-with-text-and-icon: 20px;
  }

  .u-button {
    font-size: var(--font-size);
  }

  .u-button__icon {
    font-size: calc(var(--font-size) + 2px);
  }

  .u-button,
  .u-button__icon,
  .u-button__label {
    padding: var(--padding-of-button-and-inner-elements);
  }

  .u-button_has-text:before,
  .u-button_has-text:after {
    min-width: var(--side-padding-of-button-with-text);
  }

  .u-button_has-text.u-button_has-icon:before,
  .u-button_has-text.u-button_has-icon:after {
    min-width: var(--side-padding-of-button-with-text-and-icon);
  }

  .u-button_appearance-default:before,
  .u-button_appearance-default:after,
  .u-button_appearance-plain:before,
  .u-button_appearance-plain:after {
    content: ''
  }

  .u-button_circle {
    border-radius: 50%;
    border-color: inherit !important;
  }
  .u-button_circle:hover:not(:disabled){
    --hs: var(--hs-primary);
  }

  .u-button__label {
    line-height: 1;
  }

  .u-button_appearance-inverse {
    color: hsl(var(--hs), var(--l));
    border-color: transparent;
    background: none;
  }

  .u-button_appearance-plain {
    background: hsl(var(--hs), var(--l-background-default));
    color: hsl(var(--hs), var(--l));
  }

  .u-button:disabled {
    --l: var(--l-state-disabled);
    cursor: not-allowed;
  }

  .u-button:hover:not(:disabled){
    --l: var(--l-state-hover);
  }

  .u-button:focus {
    outline: 2px solid hsl(var(--hs), var(--l-layout-border-default));
  }

  .u-button:active:not(:disabled) {
    --l: var(--l-state-active);
  }

  .u-button_color-control {
    --hs: var(--hs-control)
  }

  .u-button_color-primary {
    --hs: var(--hs-primary)
  }

  .u-button_color-success {
    --hs: var(--hs-success)
  }

  .u-button_color-danger {
    --hs: var(--hs-danger)
  }

  .u-button_color-warning {
    --hs: var(--hs-warning)
  }

</style>
