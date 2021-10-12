<template>
  <div
    v-if="id"
    ref="formContainer"
    v-loading="loading"
  >
    <div />
  </div>
  <u-icon
    v-else
    class="preview-form_empty"
    icon="u-icon-file"
  />
</template>

<script>
const { throttle } = require('throttle-debounce')

export default {
  name: 'PreviewForm',

  props: {
    id: Number,
    entity: String
  },

  data () {
    return {
      loading: false,
      openedFormId: undefined
    }
  },

  watch: {
    id: 'throttledLoadForm'
  },

  mounted () {
    this.throttledLoadForm(this.id)
  },

  methods: {
    throttledLoadForm: throttle(200, function (...args) {
      this.loadForm(...args)
    }),

    async loadForm (id, prevId) {
      if (!id) return

      if (this.openedFormId !== undefined) {
        this.openedFormId = undefined
        return
      }
      this.loading = true
      const success = await this.savePreviousForm()
      if (success) {
        this.$UB.core.UBApp.doCommand({
          cmdType: 'showForm',
          entity: this.entity,
          instanceID: id,
          target: this.$refs.formContainer.firstChild
        })
      } else {
        this.openedFormId = id
        this.$emit('cancel-close', prevId)
      }
      this.loading = false
    },

    async savePreviousForm () {
      await this.$nextTick()
      const formInstance = this.$refs.formContainer.firstChild.__vue__
      if (!formInstance || !formInstance.$store) {
        return true
      }

      const store = formInstance.$store
      if (store.getters.isDirty) {
        const answer = await this.$dialog({
          title: this.$ut('unsavedData'),
          msg: this.$ut('confirmSave'),
          type: 'warning',
          buttons: {
            yes: this.$ut('save'),
            no: this.$ut('doNotSave'),
            cancel: this.$ut('cancel')
          }
        })

        if (answer === 'yes') {
          if ('save' in store._actions) {
            await store.dispatch('save')
            return true
          }
        }

        if (answer === 'cancel') {
          return false
        }
      }
      return true
    }
  }
}
</script>

<style>
.preview-form_empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 100px;
}
</style>
