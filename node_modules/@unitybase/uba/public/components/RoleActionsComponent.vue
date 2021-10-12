<template>
  <div
    id="RoleActionsComponent"
    class="role-actions-component"
  >
    <i
      v-for="action in actions"
      :key="action.value"
      :class="action.icon"
      aria-hidden="true"
      :style="{ color: currentValue >= action.value ? activeColor : defaultColor}"
      @click="doSomething(action)"
    />
  </div>
</template>

<script>
module.exports.default = {
  props: {
    value: [Number, String]
  },
  name: 'RoleActionsComponent',
  data () {
    return {
      actions: [{
        icon: 'u-icon-book',
        value: 1
      }, {
        icon: 'u-icon-edit',
        value: 3
      }, {
        icon: 'u-icon-mandatory',
        value: 7
      }],
      currentValue: this.value,
      activeColor: '#409eff',
      defaultColor: '#e1ddd9'
    }
  },
  watch: {
    value (value) {
      this.currentValue = value
    }
  },
  methods: {
    doSomething (action) {
      if (this.currentValue !== action.value) {
        this.currentValue = action.value
      } else {
        this.currentValue = this.actions.indexOf(action) === 0 ? 0 : this.actions[this.actions.indexOf(action) - 1].value
      }
      this.$emit('input', this.currentValue)
    }
  }
}
</script>
