<template>
  <div :key="propName">
    <div
      v-for="item in currentObj"
      :key="item.name+item.expressionType+item.expression"
    >
      <el-card shadow="never">
        <el-row
          type="flex"
          style="margin-bottom: 5px;"
        >
          <el-col style="margin-right: 5px">
            <el-select
              v-model="item.name"
              placeholder="Name"
            >
              <el-option
                v-for="value in schema.properties.name.enum"
                :key="value"
                :label="value"
                :value="value"
              />
            </el-select>
          </el-col>
          <el-col>
            <el-select
              v-model="item.expressionType"
              placeholder="ExpressionType"
            >
              <el-option
                v-for="value in schema.properties.expressionType.enum"
                :key="value"
                :label="value"
                :value="value"
              />
            </el-select>
          </el-col>
        </el-row>
        <el-row
          type="flex"
          style="margin-bottom: 5px;"
        >
          <el-col>
            <el-input
              v-model="item.expression"
              placeholder="Expression"
            />
          </el-col>
        </el-row>
        <el-row>
          <el-col>
            <el-button
              type="danger"
              size="small"
              icon="u-icon-delete"
              @click="removeProperty(item)"
            >
              Delete
            </el-button>
          </el-col>
        </el-row>
      </el-card>
    </div>
    <div>
      <el-card shadow="never">
        <el-row
          type="flex"
          style="margin-bottom: 5px;"
        >
          <el-col style="margin-right: 5px">
            <el-select
              v-model="currentDB"
              placeholder="Name"
            >
              <el-option
                v-for="value in schema.properties.name.enum"
                :key="value"
                :label="value"
                :value="value"
              />
            </el-select>
          </el-col>
          <el-col>
            <el-select
              v-model="currentType"
              placeholder="ExpressionType"
            >
              <el-option
                v-for="value in schema.properties.expressionType.enum"
                :key="value"
                :label="value"
                :value="value"
              />
            </el-select>
          </el-col>
        </el-row>
        <el-row style="margin-bottom: 5px;">
          <el-col>
            <el-input
              v-model="currentValue"
              placeholder="Expression"
            />
          </el-col>
        </el-row>
        <el-row>
          <el-col>
            <el-button
              type="success"
              size="small"
              icon="u-icon-check"
              @click="addProperty"
            >
              Add
            </el-button>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<script>
module.exports.default = {
  name: 'MappingObject',
  props: {
    row: {
      type: Object,
      required: true
    },
    propName: String,
    schema: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      currentDB: null,
      currentType: null,
      currentValue: null
    }
  },
  computed: {
    currentObj: {
      get () {
        if (typeof this.row[this.propName] !== 'object') {
          this.$emit('setPropValue', this.propName, [])
          this.$forceUpdate()
        }
        return this.row[this.propName]
      },
      set (value) {
        this.row[this.propName] = value
      }
    }
  },
  methods: {
    removeProperty (item) {
      this.currentObj = this.currentObj.filter((obj) => {
        return item !== obj
      }, this)
    },
    addProperty () {
      if (this.currentDB && this.currentValue) {
        this.currentObj.push({
          name: this.currentDB,
          expressionType: this.currentType,
          expression: this.currentValue
        })
        this.currentDB = null
        this.currentType = null
        this.currentValue = null
      }
    }
  }
}
</script>
