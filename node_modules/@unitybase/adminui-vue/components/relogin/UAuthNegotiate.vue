<template>
  <div>
    <div class="auth-page__text">
      <i
        :title="$ut('KerberosTip')"
        class="auth-page__tooltip u-icon-circle-question"
      ></i>
      <p v-html="$ut('KerberosHeader')" />
    </div>

    <el-button
      type="primary"
      size="medium"
      class="auth-page__submit-btn"
      @click="doLogin"
    >
      {{ $ut('UBAuthContinue') }}
    </el-button>
  </div>
</template>

<script>
export default {
  name: 'UbAuthNegotiate',

  props: {
    resolveAuth: Function
  },

  methods: {
    doLogin () {
      this.resolveAuth({
        authSchema: 'Negotiate',
        registration: 0
      })
      this.$emit('close')
    }
  }
}
</script>
