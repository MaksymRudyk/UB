<template>
  <div v-if="currentRow">
    <el-form
      ref="propsForm"
      label-position="left"
      label-width="10rem"
      :model="currentRow"
    >
      <el-form-item
        v-for="prop in currentSchema"
        :key="prop.name"
        :label="prop.name+': '"
        :prop="prop.name"
        :model="currentRow"
        :required="prop.ui && prop.ui.required"
        :style="prop.type === 'boolean' ? 'display:inline-block' : ''"
      >
        <el-switch
          v-if="prop.type === 'boolean'"
          v-model="currentRow[prop.name]"
          style="padding-right: 10px"
        />
        <object-control
          v-else-if="prop.type === 'object'"
          :row="currentRow"
          :prop-name="prop.name"
          @setPropValue="setPropValue"
        />
        <el-select
          v-else-if="prop.type === 'array' && prop.name !== 'mapping'"
          v-model="currentRow[prop.name]"
          multiple
          no-match-text="No match text"
          no-data-text="No data"
          filterable
          allow-create
          default-first-option
          placeholder="Add Items"
        >
          <el-option
            v-for="item in currentRow[prop.name]"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
        <el-select
          v-else-if="prop.enum"
          v-model="currentRow.dataType"
          placeholder="Select"
          no-match-text="No match text"
          no-data-text="No data"
          default-first-option
        >
          <el-option
            v-for="item in prop.enum"
            :key="item"
            :label="item"
            :value="item"
          >
            <span style="float: left">{{ item }}</span>
          </el-option>
        </el-select>
        <mapping-object
          v-else-if="prop.name === 'mapping'"
          :row="currentRow"
          :prop-name="prop.name"
          :schema="schema.mapping.items"
          @setPropValue="setPropValue"
        />
        <el-input
          v-else-if="!prop.enum"
          v-model="currentRow[prop.name]"
          :type="prop.type === 'number' ? 'number' : 'text'"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
const ObjectControl = require('./ObjectControl.vue').default
const MappingObject = require('./MappingObjectControl.vue').default

module.exports.default = {
  name: 'PropertyCard',
  props: {
    currentRow: [Object, undefined],
    schema: {
      type: Object,
      required: true
    }
  },
  data () {
    return {}
  },
  methods: {
    setPropValue (name, value) {
      this.$set(this.currentRow, name, value)
    }
  },
  computed: {
    currentSchema () {
      return Object.keys(this.schema)
        .filter((schemaName) => {
          let ui = this.schema[schemaName].ui
          return (ui && ui.forTypes && ui.forTypes.includes(this.currentRow.dataType)) ||
            (ui && !ui.forTypes) || !ui
        }, this)
        .map((schemaName) => {
          return {
            name: schemaName,
            ...this.schema[schemaName]
          }
        })
    }
  },
  components: {
    ObjectControl,
    MappingObject
  }
}
</script>
