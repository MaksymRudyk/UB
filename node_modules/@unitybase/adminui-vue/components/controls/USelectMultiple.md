## Usage
One of these options is required:
- `entity-name`
- `repository`

### Get list vales using `entity-name`

```vue
<template>
  <u-grid>
    <u-form-row label="Select departments" label-position="top">
      <u-select-multiple
        v-model="deps"
        entity-name="req_department"
      />  
    </u-form-row>
    
    <u-form-row label="Selected IDs are" label-position="top">
      <u-base-input v-model="depIDs"></u-base-input>
    </u-form-row>  
  </u-grid>
</template>
<script>
  export default {
    data () {
      return {
        deps: []
      }
    },
    computed: {
      depIDs: {
        get: function () {
          return this.deps.join(',')
        },
        set: function (newValues) {
          if (!newValues) {
            this.deps = []
          } else {
            this.deps = newValues.split(',').map(v => parseInt(v)).filter(v => !Number.isNaN(v)) 
          }
        }
      }
    }
  }
</script>
```

### Get list vales using `repository` function

```vue
<template>
  <u-select-multiple
    v-model="deps"
    :repository="getRepo"
  />
</template>
<script>
  export default {
    data () {
      return {
        deps: []
      }
    },

    methods: {
      getRepo () {
        return this.$UB.Repository('req_department')
          .attrs('ID', 'code', 'name')
          .where('parentID', 'notIsNull')
      }
    }
  }
</script>
```

### Custom `valueAttribute`
By default an `ID` attribute is used as a value. This can be changed by set a `value-attribute`:

```vue
<template>
  <u-grid>
    <u-select-multiple
      v-model="deps"
      entity-name="req_department"
      value-attribute="code"
    />
    <div>Selected codes are: {{deps}}</div>
  </u-grid>
</template>
<script>
  export default {
    data () {
      return {
        deps: []
      }
    }
  }
</script>
```

### Clearable

```vue
<template>
  <u-select-multiple
    v-model="deps"
    entity-name="req_department"
    value-attribute="code"
    clearable
  />
</template>
<script>
  export default {
    data () {
      return {
        deps: ["dep2", "dep1"]
      }
    }
  }
</script>
```

### Disabled

```vue
<template>
  <u-select-multiple
    v-model="deps"
    entity-name="req_department"
    value-attribute="code"
    disabled
  />
</template>
<script>
  export default {
    data () {
      return {
        deps: ["dep2", "dep3"]
      }
    }
  }
</script>
```

### Use `fixed-items` to mark some items as non-removable

```vue
<template>
  <u-select-multiple
    v-model="deps"
    entity-name="req_department"
    value-attribute="code"
    :fixed-items="fixedItems"
  />
</template>
<script>
  export default {
    data () {
      return {
        deps: ["dep1", "dep2", "dep3"],
        fixedItems: ["dep1", "dep3"]
      }
    }
  }
</script>
```
### Use `additional-buttons` to add additional buttons in dropdown before default `more` button

```vue
<template>
  <u-select-multiple
    v-model="deps"
    entity-name="req_department"
    value-attribute="code"
    :additional-buttons="additionalButtons"
  />
</template>
<script>
  export default {
    data () {
      return {
        deps: ["dep1", "dep2", "dep3"],
        additionalButtons: [{
          name: 'byTemplate',
          label: 'By template',
          visibility: true,
          handler: () => this.showTemplates()
        },
        {
          name: 'all',
          label: 'Choose dep2 and dep3',
          visibility: true,
          handler: () => this.chooseDep()
        }]
      }
    },
    methods: {
      showTemplates () {
        // for example, open modal form to choose template
      },
      chooseDep () {
        this.deps = ['dep2', 'dep3']
      }
    }
  }
</script>
```
