### Basic usage
```vue
<template>
<u-file-multiple
  v-model="files"
  file-attribute="doc_file"
  subject-attribute="dictID"
  entity-name="tst_attachment"
  :subject-attribute-value="ID"
/>
</template>
<script>
export default {
  data () {
    return {
      files: []
    }
  }
}
</script>
```

### Disabled
```vue
<template>
<u-file-multiple
  v-model="files"
  file-attribute="doc_file"
  subject-attribute="dictID"
  entity-name="tst_attachment"
  :subject-attribute-value="ID"
  disabled
/>
</template>
<script>
export default {
  data () {
    return {
      files: []
    }
  }
}
</script>
```

### View mode
```vue
<template>
<div>
  <el-radio v-model="viewMode" label="table">Table</el-radio>
  <el-radio v-model="viewMode" label="carousel">Carousel</el-radio>
  <el-radio v-model="viewMode" label="carouselWithPreview">Carousel with preview</el-radio>

  <u-file-multiple
    v-model="files"
    file-attribute="doc_file"
    subject-attribute="dictID"
    entity-name="tst_attachment"
    :subject-attribute-value="ID"
    :view-mode="viewMode"
  />
</div>
</template>
<script>
export default {
  data () {
    return {
      files: [],
      viewMode: 'table'
    }
  }
}
</script>
```

### Custom additional button
```vue
<template>
<u-file-multiple
  v-model="files"
  file-attribute="doc_file"
  subject-attribute="dictID"
  entity-name="tst_attachment"
  :subject-attribute-value="ID"
>
  <u-button
    appearance="inverse"
    icon="u-icon-send"
  >
    Test
  </u-button>
</u-file-multiple>
</template>
<script>
export default {
  data () {
    return {
      files: []
    }
  }
}
</script>
```

### Access to parent UFile instance from custom button
```vue
<template>
<u-file-multiple
  v-model="files"
  file-attribute="doc_file"
  subject-attribute="dictID"
  entity-name="tst_attachment"
  :subject-attribute-value="ID"
>
  <custom-button/>
</u-file-multiple>
</template>
<script>
export default {
  data () {
    return {
      files: []
    }
  }
}
</script>
```

### Custom button component
```vue
<template>
<u-button
    appearance="inverse"
    icon="u-icon-send"
    :disabled="instance.file || instance.disabled"
    @click="showParentInstance"
>
  Test
</u-button>
</template>
<script>
export default {
  inject: {
    instance: 'fileComponentInstance'
  },

  methods: {
    showParentInstance () {
      console.log(this.instance)
    }
  }
}
</script>
```

### Remove default buttons

```vue
<template>
<u-file-multiple
  v-model="files"
  file-attribute="doc_file"
  subject-attribute="dictID"
  entity-name="tst_attachment"
  :subject-attribute-value="ID"
  remove-default-buttons
/>
</template>
<script>
export default {
  data () {
    return {
      files: []
    }
  }
}
</script>
```

To remove one or few buttons pass array with buttons names
Buttons names:
- add
- webcam
- scan
- scanSettings
- download
- remove
- preview
- fullscreen

```vue
<template>
<u-file-multiple
  v-model="files"
  file-attribute="doc_file"
  subject-attribute="dictID"
  entity-name="tst_attachment"
  :subject-attribute-value="ID"
  :remove-default-buttons="['add', 'preview']"
/>
</template>
<script>
export default {
  data () {
    return {
      files: []
    }
  }
}
</script>
```
