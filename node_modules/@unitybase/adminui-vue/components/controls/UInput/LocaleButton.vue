<template>
  <div>
    <el-button
      :disabled="$parent.disabled"
      tabindex="-1"
      icon="u-icon-globe"
      @click="showModal = true"
    />
    <el-dialog
      :visible.sync="showModal"
      width="500px"
      append-to-body
      :close-on-click-modal="false"
      class="u-locale-button__dialog"
      @open="initLangs"
    >
      <u-form-row
        v-for="(item, index) in langsData"
        :key="item.lang"
        :label="item.lang"
        :required="'required' in $v.langsData.$each[index].value.$params"
        :error="$v.langsData.$each[index].value.$error"
      >
        <el-input
          v-model="item.value"
          @keyup.native="$v.langsData.$each[index].value.$touch()"
        />
      </u-form-row>

      <el-button
        slot="footer"
        type="primary"
        @click="save"
      >
        {{ $ut('apply') }}
      </el-button>
    </el-dialog>
  </div>
</template>

<script>
const { mapState } = require('vuex')
const required = require('vuelidate/lib/validators/required').default

export default {
  name: 'LocaleButton',
  inject: ['entity', 'entitySchema'],

  props: {
    attributeName: {
      type: String,
      default: undefined
    }
  },

  data () {
    return {
      showModal: false,
      langsData: []
    }
  },

  computed: {
    ...mapState(['isNew']),

    supportedLanguages () {
      return this.$UB.connection.appConfig.supportedLanguages
    },

    userLang () {
      return this.$UB.connection.userLang()
    },

    localeAttrs () {
      return this.supportedLanguages
        .filter(l => l !== this.userLang)
        .map(lang => ({
          attr: `${this.attributeName}_${lang}^`,
          lang
        }))
    },

    mainAttr () {
      return {
        attr: this.attributeName,
        lang: this.userLang
      }
    },

    attrs () {
      return [
        this.mainAttr,
        ...this.localeAttrs
      ]
    },

    isLoaded () {
      return this.localeAttrs.every(item => item.attr in this.$store.state.data)
    },

    isMasterAttrRequired () {
      return this.entitySchema.attributes[this.attributeName].allowNull === false
    }
  },

  validations () {
    const value = this.isMasterAttrRequired ? { required } : {}

    return {
      langsData: {
        $each: { value }
      }
    }
  },

  methods: {
    save () {
      this.$v.$touch()
      if (!this.$v.$error) {
        this.$v.$reset()
        this.showModal = false
        for (const { attr, value } of this.langsData) {
          if (value !== null && value !== '') {
            this.$store.commit('SET_DATA', {
              key: attr,
              value
            })
          }
        }
      }
    },

    async initLangs () {
      // fetch data if not loaded
      if (!this.isLoaded) {
        if (!this.isNew) {
          // fetch localized fields
          const repo = this.$UB.Repository(this.entity).attrs('ID')
          this.localeAttrs.forEach(a => repo.attrs(a.attr))
          const data = await repo.selectById(this.$store.state.data.ID)
          delete data.ID
          this.$store.commit('LOAD_DATA_PARTIAL', data)
        }
      }

      const updatedData = this.attrs.map(item => {
        const value = this.$store.state.data[item.attr]
        return {
          ...item,
          value
        }
      })
      this.langsData.splice(0, this.langsData.length, ...updatedData)
    }
  }
}
</script>

<style>
  .u-locale-button__dialog .el-dialog__body{
    padding: 10px 20px;
  }
</style>
