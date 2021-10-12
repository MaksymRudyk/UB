<template>
  <u-grid
    template-columns="200px 1fr"
    template-rows="600px"
    column-gap="0px"
    label-position="top"
  >
    <u-form-row :label="$ut('Attributes')">
      <div
        ref="snippet"
        class="ub-navshortcut__cmd-code__snippet"
        tabindex="-1"
      >
        <el-tree
          ref="tree"
          :data="cmdCodeAttrs"
          :expand-on-click-node="false"
          :props="{
            label: 'text'
          }"
          @node-click="selectNode"
        >
          <div slot-scope="{ node }" v-html="node.label"> </div>
        </el-tree>
      </div>
    </u-form-row>
    <u-form-row :label="$ut('ubm_navshortcut.cmdCode')">
      <u-code-mirror
        ref="codeMirror"
        v-model="cmdCode"
        style="height: 100%; display: grid"
        :hints-function="doOnShowHints"
      />
    </u-form-row>
  </u-grid>
</template>

<script>
const { mapInstanceFields } = require('@unitybase/adminui-vue')
const ENTITY_RE = /"(?:entity|entityName)"\s*:\s*"(\w*)"/
const ENTITY_JS_RE = /(?:entity|entityName)\s*:\s*'(\w*)'/

export default {
  name: 'ShortcutCmdCodeSnippet',

  data () {
    return {
      entityName: '',
      isJsStyle: false
    }
  },

  computed: {
    ...mapInstanceFields(['cmdCode']),

    cmdCodeAttrs () {
      if (this.entityName) {
        return this.$UB.core.UBUtil.getEntityAttributesTreeData(this.entityName, '', 1)
      } else {
        return []
      }
    }
  },

  watch: {
    cmdCode: {
      immediate: true,
      handler () {
        this.getEntityName()
      }
    }
  },

  methods: {
    selectNode (node) {
      this.$refs.codeMirror._codeMirror.replaceSelection(this.isJsStyle ? `'${node.id}'` : `"${node.id}"`)
      this.$refs.codeMirror._codeMirror.getInputField().focus()
    },

    getEntityName () {
      this.isJsStyle = false
      let res = ENTITY_RE.exec(this.cmdCode) // "entity": "xx"
      if (!res) {
        res = ENTITY_JS_RE.exec(this.cmdCode) // entity: 'xx'
        this.isJsStyle = true
      }
      if (res && res[1] && this.$UB.connection.domain.has(res[1])) {
        this.entityName = res[1]
      }
    },

    doOnShowHints (cm) {
      return {
        list: [{
          displayText: 'showList-Vue',
          text: JSON.stringify({
            renderer: 'vue',
            cmdType: 'showList',
            cmdData: {
              entityName: 'TYPE-ENTITY-CODE',
              columns: [
                'Dbl-CLICK on left prop panel to add attribute. See UTableColumn for extended config props',
              ]
            }
          }, null, '  ')
        }, {
          displayText: 'showList-Ext',
          text: JSON.stringify({
            cmdType: 'showList',
            cmdData: {
              params: [{
                entity: 'TYPE-ENTITY-CODE',
                method: 'select',
                fieldList: ['Dbl-CLICK on left prop panel to add attribute']
              }]
            }
          }, null, '  ')
        }, {
          displayText: 'showForm',
          text: JSON.stringify({
            cmdType: 'showForm',
            formCode: 'TYPE HERE A FORM CODE FROM UBM_FORM or remove this line to use a default form for entity',
            entity: 'TYPE HERE A ENTITY CODE',
            instanceID: 'REPLACE IT by ID value (to edit element) or remove this line'
          }, null, '  ')
        }, {
          displayText: 'showReport',
          text: JSON.stringify({
            cmdType: 'showReport',
            description: 'OPTIONAL report form caption',
            cmdData: {
              reportCode: 'type here report code',
              reportType: 'html or pdf',
              reportParams: { // if passed report viewer will skip showing parameters enter form to user
                paramName: 'param value'
              }
            }
          }, null, '  ')
        }],
        from: cm.getCursor(), // this._codeMirror
        to: cm.getCursor()
      }
    }
  }
}
</script>

<style>
.ub-navshortcut__cmd-code__snippet{
  overflow: auto;
  height: 100%;
  width: 250px;
}
</style>
