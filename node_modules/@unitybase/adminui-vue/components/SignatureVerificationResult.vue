<template>
  <div class="u-table">
    <table>
      <!--      <tr>-->
      <!--        <th :colspan="sigCaptions.length ? 4: 3"> {{ VRi18n.signingTime }} </th>-->
      <!--        <th> {{ VRi18n.signatureAuthor }} </th>-->
      <!--      </tr>-->
      <template
        v-for="(vr, vIdx) in verificationResults"
      >
        <tr
          :key="'c' + vIdx"
          @click="toggleRow(vIdx)"
        >
          <td style="cursor: pointer; width: 2em">
            <i :class="detailsOpened[vIdx] ? 'u-icon-arrow-up': 'u-icon-arrow-down'" />
          </td>
          <td
            v-if="sigCaptions.length"
            v-html="sigCaptions[vIdx]"
          />
          <td style="width: 2em">
            <i
              :title="statusTip(vIdx, false)"
              :class="vr.isDigitalStamp ? 'fas fa-2x fa-stamp' : 'fas fa-2x fa-signature'"
              :style="statusStyle(vIdx)"
            />
          </td>
          <td> {{ $UB.formatter.formatDate(vr.signingTime, 'dateTime') }} </td>
          <td> {{ vr.subject.fullName || vr.organization.digitalStampName || vr.organization.orgName }} </td>
          <template v-if="actions.length > 0">
            <td>
              <i
                v-for="action in actions"
                :key="action.tooltip"
                :title="action.tooltip"
                :class="action.icon"
                @click="buttonClick($event, vIdx, action.callback)"
              />
            </td>
          </template>
        </tr>
        <template v-if="detailsOpened[vIdx] === true">
          <tr :key="'d' + vIdx">
            <td :colspan="sigCaptions.length ? 5 : 4">
              <h4>{{ VRi18n.signatureStatus }}</h4>
              <p
                :style="statusStyle(vIdx)"
                v-html="statusTip(vIdx, true)"
              />
              <h4>{{ VRi18n.signatureAuthor }}</h4>
              <p>
                {{ VRi18n.certificate.subject._ }}
                <ul>
                  <li
                    v-for="(prop, idx) in Object.keys(vr.subject)"
                    v-if="vr.subject[prop]"
                    :key="idx"
                  >
                    <span class="signature-verify-result_info">{{ VRi18n.certificate.subject[prop] }}:</span> {{ vr.subject[prop] }}
                  </li>
                </ul>
              </p>
              <p v-if="vr.organization.orgName">
                {{ VRi18n.certificate.organization._ }}
                <ul>
                  <li
                    v-for="(prop, idx) in Object.keys(vr.organization)"
                    v-if="vr.organization[prop]"
                    :key="idx"
                  >
                    <span class="signature-verify-result_info">{{ VRi18n.certificate.organization[prop] }}:</span> {{ vr.organization[prop] }}
                  </li>
                </ul>
              </p>
              <p>
                {{ VRi18n.certificate._ }}
                <ul>
                  <li
                    v-for="(prop, idx) in Object.keys(vr.certificate)"
                    :key="idx"
                  >
                    <template v-if="prop === 'issuedBy'">
                      <span class="signature-verify-result_info">{{ VRi18n.certificate.issuedBy._ }}:</span>
                      <ul>
                        <li
                          v-for="(prop, idx) in Object.keys(vr.certificate.issuedBy)"
                          :key="idx"
                        >
                          <span class="signature-verify-result_info">{{ VRi18n.certificate.issuedBy[prop] }}:</span> {{ vr.certificate.issuedBy[prop] }}
                        </li>
                      </ul>
                    </template>
                    <template v-else>
                      <span class="signature-verify-result_info">{{ VRi18n.certificate[prop] }}:</span>
                      {{ (vr.certificate[prop] instanceof Date) ? $UB.formatter.formatDate(vr.certificate[prop], 'date') : vr.certificate[prop] }}
                    </template>
                  </li>
                </ul>
              </p>
            </td>
          </tr>
        </template>
      </template>
    </table>
  </div>
</template>

<style>
  .signature-verify-result_info {
    color: hsl(var(--hs-text), var(--l-text-label))
  }
</style>
<script>
export default {
  name: 'SignatureVerificationResult',
  props: {
    /**
     * @type {Array<SignatureValidationResult>}
     */
    verificationResults: {
      type: Array,
      default: () => []
    },
    /**
     * @type {Array<string>}
     */
    sigCaptions: {
      type: Array,
      default: () => []
    },
    /**
     * @type {Array<SignatureValidationResultAction>}
     */
    actions: {
      type: Array,
      default: () => []
    }
  },
  data: () => {
    return {
      detailsOpened: []
    }
  },
  beforeMount () {
    this.VRi18n = this.$ut('SignatureVerificationResultObj')
    if (this.verificationResults.length === 1) this.detailsOpened[0] = true
  },
  methods: {
    toggleRow (vIdx) {
      this.$set(this.detailsOpened, vIdx, !this.detailsOpened[vIdx])
    },
    statusStyle (vIdx) {
      const r = this.verificationResults[vIdx]
      if (!r.valid) return 'color: hsl(var(--hs-danger), var(--l-state-default));'
      if (r.valid && r.tspValid /* MPV - uncomment in 2021 && r.ocspVerified */ && !r.warnings) return 'color: hsl(var(--hs-success), var(--l-state-default));'
      return 'color:hsl(var(--hs-warning), var(--l-state-default);'
    },
    statusTip (vIdx, isHTML) {
      const r = this.verificationResults[vIdx]
      if (!r.valid) {
        let m = this.VRi18n.valid.no
        if (r.errorMessage && r.errorCode) {
          m = `${m} (#${r.errorCode}: ${r.errorMessage})`
        } else if (r.errorMessage) {
          m = `${m} (${r.errorMessage})`
        } else if (r.errorCode) {
          m = `${m} (#${r.errorCode})`
        }
        return m
      }
      let s = this.VRi18n.valid.yes; s += isHTML ? '<br>' : '; '
      s += this.VRi18n.tspValid[r.tspValid ? 'yes' : 'no']; s += isHTML ? '<br>' : '; '
      s += this.VRi18n.ocspVerified[r.ocspVerified ? 'yes' : 'no']; s += isHTML ? '<br>' : '; '
      s += this.VRi18n.hardwareKeyUsed[r.hardwareKeyUsed ? 'yes' : 'no']; s += isHTML ? '<br>' : '; '
      if (r.warnings) s += r.warnings
      return s
    },
    async buttonClick(e, index, callback) {
      await callback(e, index, this.verificationResults)
    }
  }
}
</script>
