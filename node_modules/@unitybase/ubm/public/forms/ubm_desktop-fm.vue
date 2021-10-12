<template>
  <div class="u-form-layout">
    <u-toolbar>
      <template slot="left">
        <u-button
          color="primary"
          appearance="inverse"
          icon="u-icon-refresh"
          tooltip="refresh"
          @click="refresh"
        />
      </template>
    </u-toolbar>

    <u-form-container
      v-loading.body="loading"
      label-position="top"
      :max-width="800"
    >
      <u-auto-field attribute-name="caption" />

      <u-auto-field attribute-name="code" />

      <u-form-row
        :label="`${entity}.isDefault`"
        required
        :error="$v.isDefault.$error"
      >
        <el-switch v-model="isDefault" />
      </u-form-row>

      <u-auto-field attribute-name="description" />

      <u-form-row
        :label="`${entity}.iconCls`"
        required
        :error="$v.iconCls.$error"
      >
        <u-icon-picker
          :value="iconCls"
          :label="`${entity}.iconCls`"
          @change="iconCls = $event"
        />
      </u-form-row>

      <u-auto-field attribute-name="displayOrder" />

      <u-form-row label="Desktop rights">
        <u-select-collection
          associated-attr="admSubjID"
          entity-name="ubm_desktop_adm"
          collection-name="rightsSubjects"
          clearable
        />
      </u-form-row>
    </u-form-container>
  </div>
</template>

<script>
const { Form, mapInstanceFields } = require('@unitybase/adminui-vue')
const { mapGetters, mapActions } = require('vuex')
const UB = require('@unitybase/ub-pub')

module.exports.mount = function (cfg) {
  Form(cfg)
    .processing({
      collections: {
        rightsSubjects: ({ state }) => UB.connection
          .Repository('ubm_desktop_adm')
          .attrs('ID', 'instanceID', 'admSubjID')
          .where('instanceID', '=', state.data.ID)
      }
    })
    .validation()
    .mount()
}

module.exports.default = {
  name: 'UbmDesktop',
  inject: ['entitySchema', '$v', 'entity'],

  computed: {
    ...mapInstanceFields([
      'ID',
      'name',
      'caption',
      'code:',
      'description',
      'iconCls',
      'isDefault',
      'displayOrder'
    ]),

    ...mapGetters(['loading']),

    iconClsCaption () {
      return this.entitySchema.attributes.iconCls.caption
    }
  },

  methods: {
    ...mapActions([
      'refresh'
    ])
  }
}
</script>
