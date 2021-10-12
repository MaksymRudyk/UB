<template>
  <el-form
    ref="ubAuthForm"
    :model="authData"
    :rules="authRules"
    autocomplete="off"
    @submit.native.prevent
  >
    <div>
      <p
        class="auth-page__cert-info"
        v-html="cert2Tip()"
      />
      <div v-if="!simpleCertAuth">
        <el-form-item prop="login">
          <el-input
            v-model="authData.login"
            autofocus="true"
            :placeholder="$ut('User')"
            @keyup.enter.native="doCert2Login"
          >
            <template slot="prepend">
              <i class="u-icon-person" />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="authData.password"
            :placeholder="$ut('Password')"
            type="password"
            autocomplete="off"
            @keyup.enter.native="doCert2Login"
          >
            <template slot="prepend">
              <i class="u-icon-key" />
            </template>
          </el-input>
        </el-form-item>
      </div>
      <el-button
        type="primary"
        style="min-width: 8rem"
        @click="doCert2Login"
      >
        {{ $ut('UBAuthContinue') }}
      </el-button>
    </div>
  </el-form>
</template>

<script>
export default {
  name: 'UbAuthCert2',
  props: {
    resolveAuth: {
      type: Function,
      default: null
    }
  },
  data () {
    const adminUI = this.$UB.connection.appConfig.uiSettings.adminUI
    return {
      authData: {
        login: '',
        password: adminUI.defaultPasswordForDebugOnly
      },
      simpleCertAuth: adminUI.authenticationCert ? (adminUI.authenticationCert.requireUserName !== true) : true,
      authRules: {
        login: [
          { required: true, message: this.$ut('blankText'), trigger: 'blur' }
        ],
        password: [
          { required: true, message: this.$ut('EnterOldPassword'), trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    cert2Tip () {
      return this.simpleCertAuth ? this.$ut('useCertificateInfoSimple') : this.$ut('useCertificateInfo')
    },
    doCert2Login: function (pkParams) {
      if (!this.simpleCertAuth) { // certificate + user name + pwd - only one project use it
        this.$refs.ubAuthForm.validate((valid) => {
          if (valid) {
            this.resolveAuth({ authSchema: 'CERT2', login: this.authData.login.trim(), password: this.authData.password })
            if (!this.$UB.connection.appConfig.uiSettings.adminUI.defaultPasswordForDebugOnly) {
              this.authData.password = ''
            }
            this.$emit('close')
          } else {
            return false
          }
        })
      } else {
        this.resolveAuth({
          authSchema: 'CERT2'
        })
        this.$emit('close')
      }
    }
  }
}
</script>
