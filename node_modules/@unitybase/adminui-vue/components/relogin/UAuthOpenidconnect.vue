<template>
  <div>
    <div class="auth-page__text">
      <i
        :title="$ut('OpenidTip')"
        class="auth-page__tooltip u-icon-circle-question"
      ></i>
      <p v-html="$ut('OpenIDHeader')" />
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
  name: 'UbOpenIDProvider',

  props: {
    resolveAuth: Function
  },

  methods: {
    doLogin () {
      const selectedProvider = localStorage.getItem('openIDProvider')
      const me = this
      const url = window.location.origin + '/openIDConnect/' + selectedProvider

      const loginWindowOpenID = window.open(url, 'login', 'toolbar=0,scrollbars=1,status=1,resizable=1,location=1,menuBar=0')
      function loginListener (event) {
        if (event.source === loginWindowOpenID) {
          window.removeEventListener('message', loginListener)
          if (event.origin.indexOf(window.location.origin) === 0) {
            const response = event.data

            if (response.success) {
              response.authSchema = 'OpenIDConnect'
              response.provider = selectedProvider
              response.registration = 0

              me.resolveAuth(response)
              me.$emit('close')
            } else {
              me.$dialogError('authOpenIDConnectFail')
            }
          } else {
            me.$dialogError('authOpenIDConnectFail')
          }
        }
      }
      window.addEventListener('message', loginListener)
    }
  }
}
</script>
