<template>
  <el-form
    ref="ubAuthForm"
    :model="authData"
    :rules="authRules"
    @submit.native.prevent
  >
    <div class="auth-page__text">
      <i
        :title="$ut('UBAuthTip')"
        class="auth-page__tooltip u-icon-circle-question"
      ></i>
      <p v-html="$ut('UBAuthHeader', applicationName)" />
    </div>

    <el-form-item />

    <el-form-item>
      <el-input
        :placeholder="$ut('User')"
        disabled
        :value="login"
      >
        <template slot="prepend">
          <i class="u-icon-person" />
        </template>
      </el-input>
    </el-form-item>

    <el-form-item prop="password">
      <el-input
        v-model="authData.password"
        autofocus
        :placeholder="$ut('Password')"
        type="password"
        autocomplete="off"
        @keyup.enter.native="doLogin"
      >
        <template slot="prepend">
          <i class="u-icon-key" />
        </template>
      </el-input>
    </el-form-item>

    <el-button
      type="primary"
      plain
      size="medium"
      class="auth-page__submit-btn"
      @click="doLogin"
    >
      {{ $ut('Enter') }}
    </el-button>
  </el-form>
</template>

<script>
module.exports = {
  name: 'UbAuthUb',

  props: {
    login: String,
    resolveAuth: Function
  },

  data () {
    return {
      authData: {
        password: this.$UB.connection.appConfig.uiSettings.adminUI.defaultPasswordForDebugOnly
      },
      authRules: {
        password: [
          { required: true, message: this.$ut('EnterOldPassword'), trigger: 'blur' }
        ]
      }
    }
  },

  computed: {
    applicationName () {
      return this.$UB.connection.appConfig.applicationName
    }
  },

  methods: {
    doLogin () {
      this.$refs.ubAuthForm.validate((valid) => {
        if (valid) {
          this.resolveAuth({
            authSchema: window.localStorage.getItem('lastAuthType'),
            login: this.login.trim(),
            password: this.authData.password
          })
          if (!this.$UB.connection.appConfig.uiSettings.adminUI.defaultPasswordForDebugOnly) {
            this.authData.password = ''
          }
          this.$emit('close')
        } else {
          return false
        }
      })
    }
  }
}
</script>
