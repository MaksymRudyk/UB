<template>
  <u-button
    :title="$ut('UFile.scanSettingsButtonTooltip')"
    color="primary"
    icon="u-icon-scan-settings"
    appearance="inverse"
    @click="runSettings"
  />
</template>

<script>
export default {
  name: 'UFileScanSettingsButton',

  methods: {
    async runSettings () {
      this.$UB.core.UBApp.scannerSettings()
    }
  }
}
</script>
