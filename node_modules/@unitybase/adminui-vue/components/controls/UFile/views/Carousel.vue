<template>
  <el-carousel
    :autoplay="false"
    :loop="false"
    trigger="click"
    class="u-file-multiple__carousel"
    @change="setSelectedFileId"
  >
    <el-carousel-item
      v-for="(file, index) in files"
      :key="file.ID"
      class="u-file-multiple__carousel-item"
    >
      <file-renderer
        v-if="activeIndex === index"
        :ref="`renderer_${file.ID}`"
        :file="file"
        :entity-name="entityName"
        :attribute-name="fileAttribute"
        :file-id="file.ID"
        :with-preview="withPreview"
      />
    </el-carousel-item>
  </el-carousel>
</template>

<script>
export default {
  name: 'MultipleFileViewCarousel',
  components: {
    FileRenderer: require('./FileRenderer.vue').default
  },

  mixins: [
    require('../helpers/formatterMixin')
  ],

  props: {
    value: [Number, null],
    files: Array,
    entityName: String,
    fileAttribute: String,
    withPreview: Boolean
  },

  data () {
    return {
      activeIndex: 0
    }
  },

  computed: {
    selectedFileId: {
      get () {
        return this.value
      },

      set (value) {
        this.$emit('input', value)
      }
    }
  },

  watch: {
    files: {
      immediate: true,
      handler (value) {
        const file = value.find(f => f.ID === this.selectedFileId)
        if (!file && value.length > 0) {
          this.selectedFileId = value[0].ID
        }
      }
    }
  },

  methods: {
    selectRow ({ row: { ID } }) {
      this.$emit('input', ID)
    },

    setSelectedFileId (index) {
      this.activeIndex = index
      this.selectedFileId = this.files[index].ID
    }
  }
}
</script>

<style>
  .u-file-multiple__carousel {
    width: 100%;
  }

  .u-file-multiple__carousel .el-carousel__button {
    background-color: hsl(var(--hs-border), var(--l-layout-border-default));
  }

  .u-file-multiple__carousel-item {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .u-file-multiple__carousel img{
    max-height: 100%;
  }
</style>
