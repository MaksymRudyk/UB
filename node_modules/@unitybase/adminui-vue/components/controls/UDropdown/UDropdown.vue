<template>
  <div>
    <div
      v-if="$slots.default"
      ref="reference"
      class="u-dropdown__reference"
      tabindex="1"
      @click="toggleVisible"
      @keydown.esc="closeByEscape"
    >
      <!-- @slot Reference button -->
      <slot />
    </div>

    <transition
      name="dropdown-transition"
      @enter="beforeEnter"
    >
      <div
        v-show="visible && $slots.dropdown"
        :key="renderKey"
        ref="dropdown"
        tabindex="1"
        @keydown.esc="closeByEscape"
      >
        <div class="u-dropdown">
          <div
            ref="arrow"
            class="u-dropdown__arrow"
          >
            <div class="u-dropdown__arrow-inner" />
          </div>

          <!-- @slot Dropdown -->
          <slot name="dropdown" />
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
const { createPopper } = require('@popperjs/core')
const {
  addClickOutsideListener,
  removeClickOutsideListener
} = require('../../../utils/clickOutside')

/**
 * Shows dropdown after click on reference element.
 * Can be used as context menu.
 * @requires ./UDropdownItem.vue
 */
export default {
  name: 'UDropdown',

  inject: {
    parentClose: {
      default () {
        return () => {}
      }
    }
  },

  provide () {
    return {
      parentClose: () => {
        this.parentClose()
        this.close()
      },
      placement: this.childPlacement
    }
  },

  props: {
    /**
     * dropdown positioning. In Popper.js it option called strategy
     */
    position: {
      type: String,
      default: 'fixed',
      validator (value) {
        return ['fixed', 'absolute'].includes(value)
      }
    },

    /**
     * dropdown placement (relative to the reference button)
     * @values auto, auto-start, auto-end, top, top-start, top-end, bottom, bottom-start, bottom-end, right, right-start, right-end, left, left-start, left-end
     */
    placement: {
      type: String,
      default: 'bottom-start'
    },

    /**
     * child dropdown placement (relative to the opened dropdown). The same possible values as for placement.
     */
    childPlacement: {
      type: String,
      default: 'right'
    },

    /**
     * reference element used to position the popper
     */
    refElement: {
      default: null
    },

    /**
     * disables a dropdown toggle
     */
    disabled: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      visible: false,
      clickOutsideListenerId: 0,
      renderKey: 0,
      virtualElement: {
        getBoundingClientRect: this.generateClientRect(),
        contains: () => true,
        addEventListener () {},
        removeEventListener () {}
      }
    }
  },

  watch: {
    async visible (isVisible) {
      await this.$nextTick()
      if (isVisible) {
        this.clickOutsideListenerId = addClickOutsideListener(
          [this.referenceEl, this.$refs.dropdown],
          this.close
        )
      } else {
        removeClickOutsideListener(this.clickOutsideListenerId)
      }
    }
  },

  beforeDestroy () {
    this.$refs.dropdown.remove()
  },

  methods: {
    toggleVisible () {
      if (this.disabled) return
      this.visible = !this.visible
    },

    beforeEnter (el) {
      el.style.zIndex = this.$zIndex()
      if (this.refElement === null) {
        this.referenceEl =
          this.$slots.default === undefined
            ? this.virtualElement
            : this.$refs.reference
      } else {
        this.referenceEl = this.refElement
      }
      const arrow = this.$refs.arrow
      if (this.position === 'fixed') {
        document.body.appendChild(this.$refs.dropdown)
      }
      const popperInstance = createPopper(
        this.referenceEl,
        this.$refs.dropdown,
        {
          strategy: this.position,
          placement: this.placement,
          modifiers: [
            {
              name: 'offset',
              options: { offset: [-5, 5] }
            },
            {
              name: 'arrow',
              options: { padding: 5, element: arrow }
            }
          ]
        }
      )
      requestAnimationFrame(() => {
        this.checkAndUpdatePopupPosition(popperInstance)
      })
    },

    async checkAndUpdatePopupPosition (popperInstance) {
      const popEl = popperInstance.state.elements.popper
      if (!popEl) return
      const popStyle = popEl.getBoundingClientRect()
      if (checkOverflow(popStyle)) {
        popperInstance.setOptions({ placement: 'auto' })
      }

      function checkOverflow (popStyle) {
        const viewportStyle = document.documentElement.getBoundingClientRect()
        if (popStyle.right > viewportStyle.width) return true
        if (popStyle.bottom > viewportStyle.height) return true
      }
    },

    close () {
      this.visible = false
      this.$emit('close')
    },

    closeByEscape (event) {
      if (this.visible) {
        event.stopPropagation()
      }
      this.parentClose()
      this.close()
    },

    async show ({ x, y, target }) {
      this.visible = false
      this.renderKey++
      await this.$nextTick()
      this.virtualElement.getBoundingClientRect = this.generateClientRect(x, y)
      this.virtualElement.contains = ref => target.contains(ref)
      this.visible = true
      await this.$nextTick()
      this.$refs.dropdown.focus()
    },

    generateClientRect (x = 0, y = 0) {
      return () => ({
        width: 0,
        height: 0,
        top: y,
        right: x,
        bottom: y,
        left: x
      })
    }
  }
}
</script>

<style>
.u-dropdown {
  --border-color: hsl(var(--hs-border), var(--l-layout-border-default));
  --popup-color: hsl(var(--hs-background), var(--l-background-inverse));

  background: var(--popup-color);
  border: 1px solid var(--border-color);
  box-shadow: var(--box-shadow-default);
  border-radius: var(--border-radius);
  z-index: 10;
  padding: 6px 0;
  position: relative;
}

.u-dropdown__reference {
  display: inline-block;
}

.u-dropdown .u-dropdown__reference {
  /* prevent inline-block for inner elements */
  display: block;
}

.u-dropdown__arrow {
  --size: 4px;
  pointer-events: none;
  z-index: 1;
}

.u-dropdown__arrow-inner:before {
  content: '';
  position: absolute;
  border: var(--size) solid transparent;
  border-bottom-color: var(--border-color);
}

.u-dropdown__arrow-inner:after {
  content: '';
  position: absolute;
  border: var(--size) solid transparent;
  border-bottom-color: var(--popup-color);
  bottom: -1px;
}

.u-dropdown__arrow-inner {
  width: calc(var(--size) * 2);
  height: calc(var(--size) * 2);
}

[data-popper-placement^='bottom'] > .u-dropdown > .u-dropdown__arrow {
  bottom: 100%;
}

[data-popper-placement^='top'] > .u-dropdown > .u-dropdown__arrow {
  top: 100%;
}

[data-popper-placement^='top'] > .u-dropdown > .u-dropdown__arrow > .u-dropdown__arrow-inner {
  transform: rotate(180deg);
}

[data-popper-placement^='right'] > .u-dropdown > .u-dropdown__arrow {
  right: 100%;
}

[data-popper-placement^='right'] > .u-dropdown > .u-dropdown__arrow > .u-dropdown__arrow-inner {
  transform: rotate(-90deg);
}

[data-popper-placement^='left'] > .u-dropdown > .u-dropdown__arrow {
  left: 100%;
}

[data-popper-placement^='left'] > .u-dropdown > .u-dropdown__arrow > .u-dropdown__arrow-inner {
  transform: rotate(90deg);
}

.dropdown-transition-enter,
.dropdown-transition-leave-to {
  opacity: 0;
}
.dropdown-transition-enter-active,
.dropdown-transition-leave-active {
  transition-property: opacity;
  transition-duration: 0.2s;
}
</style>
