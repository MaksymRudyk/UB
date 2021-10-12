<template>
  <el-dialog
    :title="$ut('Select CAPI')"
    :visible.sync="visible"
    :show-close="false"
    :append-to-body="true"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="500px"
    class="u-form-layout"
  >
    <section
      v-for="(capi, idx) in availableCAPI"
      :key="idx"
      @click="selectedCAPIIdx = idx"
      :class="['capi-section__row', idx === selectedCAPIIdx ? 'capi-section__row-active': '']"
    >
      <h4>{{$ut(capi.module).name}}</h4>
      <div class="u-form-row__description">
        {{ $ut(capi.module).description }}
      </div>
    </section>
    <span
      slot="footer"
      class="dialog-footer"
    >
      <el-button
        type="primary"
        :disabled="typeof selectedCAPIIdx !== 'number'"
        @click.prevent="doSelect"
      >{{ $ut('OK') }}</el-button>
      <el-button
        type="secondary"
        @click.prevent="doCancel"
      >{{ $ut('Cancel') }}</el-button>
    </span>
  </el-dialog>
</template>

<script>
const UB = require('@unitybase/ub-pub')
export default {
  name: 'CapiSelection',
  data: () => {
    return {
      visible: false,
      showError: false,
      availableCAPI: [],
      selectedCAPIIdx: null
    }
  },
  mounted () {
    this.$options.availableCAPI.forEach(c => {
      this.availableCAPI.push(c)
    })
  },
  methods: {
    doCancel () {
      this.$options.resolver.reject(new UB.UBAbortError())
      this.$destroy()
    },
    doSelect () {
      this.$options.resolver.resolve(this.availableCAPI[this.selectedCAPIIdx].moduleURI)
      this.$destroy()
    }
  }
}
</script>

<style>
.capi-section__row {
  cursor: pointer;
  padding: 10px;
  word-break: break-word;
}
.capi-section__row-active {
  background-color: hsl(var(--hs-success), var(--l-background-default));
}
</style>
