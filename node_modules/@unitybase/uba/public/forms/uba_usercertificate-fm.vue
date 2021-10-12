<template>
<div class="u-form-layout">
  <u-toolbar>
    <u-button
      @click="downloadCert"
      :disabled="!serial"
      appearance="plain"
      icon="u-icon-download"
      slot="left"></u-button>
  </u-toolbar>

  <u-form-container
    v-loading="loading"
    label-position="top"
  >
     <!-- place form layout here -->
    <u-grid>
      <u-auto-field attribute-name="userID" />
      <u-form-row :label="$ut('uba_usercertificate.serial')">
        {{serial}}
      </u-form-row>

    </u-grid>
    <u-form-row
      v-if="isNew"
      label=""
    >
      <u-file-input
        :v-model="certificateFile"
        style="height: 80px"
        @input="updateCert"
      />
    </u-form-row>
    <u-grid :columns="4">
      <u-auto-field attribute-name="isForSigning" readonly force-cmp="el-switch" />
      <u-auto-field attribute-name="disabled" force-cmp="el-switch" />
      <u-auto-field attribute-name="revoked" force-cmp="el-switch" />
      <u-auto-field attribute-name="revocationDate" />
    </u-grid>
    <u-auto-field attribute-name="description" />
    <u-auto-field attribute-name="certParsed" readonly />
  </u-form-container>
</div>
</template>

<script>
const { Form, mapInstanceFields } = require('@unitybase/adminui-vue')
const { mapGetters, mapState } = require('vuex')
const UB = require('@unitybase/ub-pub')

module.exports.mount = function (cfg) {
  Form(cfg)
    .store({ // add certificateFile state attribute
      state: {
        certificateFile: []
      }
    })
    .processing({
      inited (store) { // if opened for adding from detail grid - ser a userID passed in parentContext
        if (!cfg.instanceID && cfg.parentContext) {
          store.commit('ASSIGN_DATA', { loadedState: cfg.parentContext })
        }
      }
    })
    // .validation() disable client-side validation - all required attributes are calculated by server
    .mount()
}

// WARNING - certificate sets as base64 but returns as binary
module.exports.default = {
  name: 'uba_usercertificate',
  inject: ['$v', 'entitySchema'],
  computed: {
    ...mapInstanceFields(['ID', 'isForSigning', 'description', 'serial', 'certificate', 'certParsed', 'certificateFile']),
    ...mapGetters(['loading']),
    ...mapState(['isNew'])
  },
  methods: {
    async updateCert (ffile) {
      this.$store.commit('LOADING', {
        isLoading: true,
        target: 'parseCertificate'
      })
      try {
        const certResp = await UB.connection.post('/crypto/parseCertificate', ffile[0])
        this.certificate = await UB.base64FromAny(ffile[0])
        this.certParsed = certResp.data
        this.isForSigning = (certResp.data.KeyUsage && (certResp.data.KeyUsage.indexOf('ЕЦП') !== -1))
        this.description = certResp.data.Subject
      } finally {
        this.$store.commit('LOADING', {
          isLoading: false,
          target: 'parseCertificate'
        })
      }
    },
    async downloadCert () {
      const certBin = await this.$UB.connection.get('/rest/uba_usercertificate/getCertificate', {
        params: { ID: this.ID },
        responseType: 'arraybuffer'
      })
      const certBlob = new Blob(
        [certBin.data],
        { type: 'application/x-x509-ca-cert' }
      )
      window.saveAs(certBlob, this.serial + '.cer', true /* no_auto_bom */)
    }
  }
}
</script>
