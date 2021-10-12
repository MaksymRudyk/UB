Entity attributes with dataType `Text`, `BLOB`, `TimeLog` did not have default render component,
If you need to render this dataTypes, render it by named column slots.
You need to decide to display this column type with great caution because this column can create large server requests.

One of these options is required:
- `entity-name`
- `repository`

### Use as `entity-name`

```vue
<template>
<u-table-entity :max-height="200" entity-name="req_request"/>
</template>
```

### Use as `repository`
Need to set function which returns UB Repository.

```vue
<template>
<u-table-entity :max-height="200" :repository="repository"/>
</template>

<script>
export default {
  methods: {
    repository () {
      return this.$UB.Repository('req_request')
        .attrs('ID', 'reqDate', 'department.name')
    }
  }
}
</script>
```

### Columns
Columns array can contain strings or objects.

```vue
<template>
<u-table-entity
  :max-height="200"
  entity-name="uba_user"
  :columns="columns"
/>
</template>

<script>
export default {
  data () {
    return {
      columns: [
        'phone', // default column from entity
        {
          id: 'name', // default column from but overrides settings
          label: 'User name',
          width: 250,
          align: 'center'
        }
      ]
    }
  }
}
</script>
```

### Slots
You can override values as named slots.
In this case another columns will be shown as usual.
Slot scope will pass `value`, `row`, and `column`.

```vue
<template>
<u-table-entity
  :max-height="200"
  entity-name="uba_user"
  :columns="columns"
>
  <template #age="{row}">
    {{ row.name }}
    {{ row.age >= 18 ? 'is adult' : 'is kid'}}
  </template>

  <template #disabled="{value}">
    {{ value ? 'user is disabled' : 'user is enabled'}}
  </template>
</u-table-entity>
</template>

<script>
export default {
  data () {
    return {
      columns: [
        'phone',
        'name',
        'age',
        'disabled'
      ]
    }
  }
}
</script>
```

### Custom columns
A custom column must have a slot, because entity doesn't have data for it.

```vue
<template>
<u-table-entity
    entity-name="uba_user"
    :columns="columns"
    :max-height="200"
>
  <template #customCol="{row}">
    {{ row.age >= 18 ? 'is adult' : 'is kid'}}
  </template>

  <template #customCol2="{row}">
    {{ row.disabled ? 'user is disabled' : 'user is enabled'}}
  </template>
</u-table-entity>
</template>

<script>
export default {
  data () {
    return {
      columns: [
        'phone',
        'fullName',
        'name',
        'customCol',
        {
          id: 'customCol2',
          label: 'Custom Col',
          width: 200,
          align: 'right'
        },
        'disabled'
      ]
    }
  }
}
</script>
```

### Actions override
```vue
<template>
<u-table-entity
    entity-name="req_request"
    :build-edit-config="actionEditOverride"
    :max-height="200"
/>
</template>
<script>
export default {
  data () {
    return {
      value: 1
    }
  },

  methods: {
    actionEditOverride (cfg) {
      return {
        ...cfg,
        isModal: false,
        docID: 12345
      }
    }
  }
}
</script>
```

### Custom filter templates

By default most UBDataTypes has filter templates and any filter can be replaced by custom.
In each column filter label or filter template can be replaced separately.
This dataTypes has next filters:
- String
    - equal
    - contains
    - startWith
    - inNull
- Boolean
    - isTrue
    - isFalse
    - isNull
- Date, DateTime
    - range
    - fromDate
    - onDate
    - toDate
    - isNull
- Entity
    - contains
    - equal
    - isNull
    - notContains
    - notEqual
- Enum
    - contains
    - equal
    - isNull
    - notContains
    - notEqual
- Many
    - contains
    - isNull
- BigInt, Currency, Float, Int, ID
    - equal
    - more
    - less
    - range
    - isNull

Json, Document, Text, BLOB, TimeLog has no filters

`label` sets label for option in select with available filters for current column.
If unset label will be equal filter id.
`template` param must be `Vue.Component` or object with `render` function.
To apply a filter from custom component emit event 'seach'
with an object which has `description` and `whereList`.
`description` - is a text for tag in list of applied filters.
`whereList` - same as ubql whereList but without param `expression` it will be computed automatically.
Filter application example:
```vue
<template>
<form @submit.prevent="$emit('search', {
  description: 'Filter query: ' + value,
  whereList: [{ condition: 'equal', value }]
})">
  <input type="text" v-model="value">
  <button type="submit">submit</button>
</form>
</template>
<script>
export default {
  data () {
    return {
      value: ''
    }
  }
}
</script>
```

### Custom filter example

```vue
<template>
<u-table-entity
  entity-name="req_department"
  :columns="columns"
  :max-height="200"
/>
</template>
<script>
export default {
  data () {
    return {
      columns: [
        'ID',
        'code',
        {
          id: 'name',
          filters: {
            // example replace default filters
            equal: {
              label: 'Custom equal label', // Replace label
              template: {render(h) { return h('div', 'example') }} // Replace filter template
            },
            contains: {
              label: 'Custom contains label' // Can be replaced only label
            },

            // adds custom filter
            myCustomFilter: {
              /**
               * In current example default value is "myCustomFilter"
               * if unset will be equal filter id by default.
               */
              label: 'My custom filter',
              template: {render(h) { return h('div', 'example') }}
            }
          }
        }
      ]
    }
  }
}
</script>
```
