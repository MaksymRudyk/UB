<template>
  <el-dialog
    v-hold-focus
    append-to-body
    :close-on-click-modal="false"
    :visible.sync="visible"
    :title="$ut('aktualnoS')"
    width="300px"
  >
    <u-date-picker
      v-model="selectedDate"
      :picker-options="pickerOptions"
    />

    <u-button
      slot="footer"
      :disabled="!selectedDate"
      @click="submit"
    >
      {{ $ut('ok') }}
    </u-button>
  </el-dialog>
</template>

<script>
export default {
  name: 'DataHistoryDatePicker',

  props: {
    dateFrom: Date,
    pickDate: Function
  },

  data () {
    return {
      visible: false,
      selectedDate: null
    }
  },

  computed: {
    pickerOptions () {
      return {
        disabledDate: time => time.getTime() < this.dateFrom.getTime()
      }
    }
  },

  watch: {
    visible (value) {
      if (value === false) {
        this.pickDate()
        this.$destroy()
      }
    }
  },

  mounted () {
    this.visible = true
  },

  methods: {
    submit () {
      this.pickDate(this.selectedDate)
      this.visible = false
    }
  }
}
</script>
