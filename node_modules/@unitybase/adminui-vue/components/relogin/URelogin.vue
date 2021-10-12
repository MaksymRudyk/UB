<template>
  <el-dialog
    :show-close="false"
    width="340px"
    :visible.sync="visible"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div
      slot="title"
      class="auth-page__header"
    >
      {{ $ut('Authentication') }}
    </div>
    <div class="auth-page__container">
      <div class="auth-page__logo-container">
        <img
          alt="Logo"
          :src="logoUrl"
          class="auth-page__logo"
        >
      </div>
      <hr>
      <component
        :is="'u-auth-' + authSchema"
        :login="login"
        :resolve-auth="resolveAuth"
        @close="visible = false"
      />
    </div>
  </el-dialog>
</template>

<script>
const UAuthCert2 = require('./UAuthCert2.vue').default
const UAuthUb = require('./UAuthUb.vue').default
const UAuthNegotiate = require('./UAuthNegotiate.vue').default
const UAuthOpenidconnect = require('./UAuthOpenidconnect.vue').default

export default {
  name: 'URelogin',

  components: {
    UAuthCert2,
    UAuthUb,
    UAuthNegotiate,
    UAuthOpenidconnect
  },

  data () {
    return {
      visible: false,
      resolveAuth: null,
      login: ''
    }
  },

  computed: {
    authSchema () {
      // console.debug('authSchema ####', window.localStorage.getItem('lastAuthType').toLowerCase())
      return window.localStorage.getItem('lastAuthType').toLowerCase()
    },

    logoUrl () {
      return this.$UB.connection.appConfig.uiSettings.adminUI.loginWindowTopLogoURL
    }
  },

  created () {
    this.$UB.connection.setRequestAuthParamsFunction((connection /*, isRepeat */) => {
      connection._events.authorizationFail = ({ message }) => {
        this.$message.error({
          message: this.$ut(message),
          customClass: 'auth-error-notify',
          duration: 7000
        })
      }
      this.login = connection.lastLoginName
      this.visible = true

      return new Promise((resolve /*, reject */) => {
        this.resolveAuth = resolve
      })
    })
  }
}
</script>

<style>
.auth-page--left {
  text-align: left;
}

.auth-page__header {
  font-size: 1.5rem;
  font-weight: 100;
  text-align: center;
}

.auth-page__cert-info {
  text-align: left;
  line-height: 1.25rem;
  word-break: break-word;
}

.auth-page__container {
  width: 300px;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.auth-page__logo-container {
  max-width: 210px;
  margin: 0 auto 1rem;
  height: 3rem;
  text-align: center;
}

.auth-page__logo {
  max-height: 3rem;
  max-width: fit-content;
}

.auth-page__tooltip {
  position: absolute;
  right: 0;
  top: 0;
}

.auth-error-notify{
  z-index: 400000 !important;
}

.auth-page__text{
  position: relative;
  text-align: center;
  font-size: 16px;
}

.auth-page__submit-btn{
  min-width: 8rem;
  margin: 0 auto;
  display: block;
}
</style>
