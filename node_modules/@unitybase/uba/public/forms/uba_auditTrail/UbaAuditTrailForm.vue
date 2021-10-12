<template>
  <div
    v-loading="loading"
    class="u-form-layout"
  >
    <div />
    <u-form-container label-position="top">
      <u-form-row :label="`${masterEntity}.entity`">
        <strong>{{ entity }} ({{ $ut(entity) }})</strong>
      </u-form-row>

      <u-grid>
        <u-form-row :label="`${masterEntity}.actionType`">
          <strong>{{ actionType }}</strong>
        </u-form-row>

        <u-form-row :label="`${masterEntity}.actionUser`">
          <strong>{{ actionUserName }} ({{ actionUser }})</strong>
        </u-form-row>
      </u-grid>

      <u-grid>
        <u-form-row :label="`${masterEntity}.remoteIP`">
          <strong>{{ remoteIP }}</strong>
        </u-form-row>

        <u-form-row :label="`${masterEntity}.actionTime`">
          <strong>{{ $UB.formatter.formatDate(actionTime, 'dateTimeFull') }}</strong>
        </u-form-row>
      </u-grid>

      <div class="audit-diff-title">
        {{ $ut('changedAttributes') }}:
      </div>
      <diff-table />
    </u-form-container>
  </div>
</template>

<script>
const { mapGetters } = require('vuex')
const { mapInstanceFields } = require('@unitybase/adminui-vue')

export default {
  name: 'AuditFormRoot',

  components: {
    DiffTable: require('./DiffTable.vue').default
  },

  inject: {
    masterEntity: 'entity'
  },

  computed: {
    ...mapGetters(['loading']),

    ...mapInstanceFields([
      'entity',
      'actionUserName',
      'actionUser',
      'remoteIP',
      'actionTime'
    ]),

    actionType () {
      return this.$lookups.get('ubm_enum', {
        eGroup: this.$UB.connection.domain.get(this.masterEntity).attributes.actionType.enumGroup,
        code: this.$store.state.data.actionType
      })
    }
  }
}
</script>

<style>
.audit-diff-title {
  font-size: 18px;
  margin-bottom: 4px;
  color: hsl(var(--hs-text), var(--l-text-default));
  margin-top: 20px;
}
</style>
