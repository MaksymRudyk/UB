<template>
  <el-tabs
    v-if="metaObject && schemaObject"
    type="border-card"
    @tab-click="onTabChanged"
  >
    <el-tab-pane label="Entity">
      <object-card
        :meta-object="metaObject"
        :file-name="fileName"
        :schema="schemeAttributes"
      />
    </el-tab-pane>
    <el-tab-pane label="Mixins">
      <mixins-card
        :mixins="metaObject.mixins"
        :schema="schemaObject.properties.mixins.properties"
      />
    </el-tab-pane>
    <el-tab-pane
      ref="sourceTab"
      label="Source"
    >
      <u-code-mirror
        ref="codeMirror"
        v-model="outputJson"
        style="height: 800px"
      />
    </el-tab-pane>
  </el-tabs>
</template>

<script>
const ObjectCard = require('./ObjectCardComponent.vue').default
const MixinsCard = require('./MixinsCardComponent.vue').default
const { UBDomain } = require('@unitybase/cs-shared')

module.exports.default = {
  name: 'ConfiguratorComponent',
  components: {
    ObjectCard,
    MixinsCard
  },
  props: {
    fileName: {
      type: [String],
      required: true
    }
  },
  data () {
    return {
      metaObject: null,
      schemaObject: null,
      codeMirror: null
    }
  },
  computed: {
    schemeAttributes () {
      return this.schemaObject.properties.attributes.items.properties
    },
    outputJson: {
      get: function () {
        if (!this.metaObject) return
        let e = new UBDomain.UBEntity(this.metaObject)
        return JSON.stringify(e.asPlainJSON(true), null, '  ')
      },
      set: function (newValue) {
        this.initMetaObject(newValue)
      }
    }
  },
  created () {
    if (this.fileName) {
      let entity = this.$UB.connection.domain.get(this.fileName)
      if (entity) this.initMetaObject(entity)
    }
    this.$UB.connection.get('models/UB/schemas/entity.schema.json').then((response) => {
      this.schemaObject = response.data
    })
  },
  methods: {
    onTabChanged (tab) {
      if (tab._uid === this.$refs.sourceTab._uid) {
        setTimeout(function () {
          this.$refs.codeMirror.editorInstance.refresh()
        }.bind(this), 1)
      }
    },

    initMetaObject (json) {
      let valid = true
      try {
        this.metaObject = typeof json === 'string' ? JSON.parse(json) : { ...json }
      } catch (e) {
        valid = false
      }
      if (valid && this.metaObject) {
        if (!Array.isArray(this.metaObject.attributes)) {
          Object.keys(this.metaObject.attributes).forEach((propertyName) => {
            if (!this.metaObject.attributes[propertyName]['name']) { this.$set(this.metaObject.attributes[propertyName], 'name', propertyName) }
          })
          this.$set(this.metaObject, 'attributes', Object.values(this.metaObject.attributes))
        }
      }
    }
  }
}
</script>
