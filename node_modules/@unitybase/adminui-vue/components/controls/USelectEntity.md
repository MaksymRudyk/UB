## Usage

Either `entity-name` or `repository` property MUST be defined

### `entity-name` as a source

A data source is `req_department` entity.
If `display-attribute` is not specified it will be set to the entity `descriptionAttribute` (defied in metadata).

```vue
<template>
  <u-select-entity
    v-model="reqID"
    entity-name="req_department"
  />
</template>
<script>
  export default {
    name: 'USelectEntitySrc',
    data () {
      return {
        reqID: null
      }
    }
  }
</script>
```

### `repository` as a source

A `repository` is reactive, if `afterThe` date in data() changed - it refreshed automatically.

If `display-attribute` not defined USelect entity will use a second repository attribute (reqDate in sample below)

```vue
<template>
  <u-select-entity
    v-model="reqID"
    :repository="getRepo"
    display-attribute="text"
  />
</template>
<script>
  export default {
    name: 'USelectRepositorySrc',
    data () {
      return {
        reqID: null,
        afterThe: new Date('2020-01-01')
      }
    },

    methods: {
      getRepo () {
        return this.$UB.Repository('req_request')
          .attrs('ID', 'reqDate', 'text')
          .where('reqDate', '>', this.afterThe)
      }
    }
  }
</script>
```

### Custom `valueAttribute`

By default, an `ID` attribute is used as a value. This can be changed by set a `value-attribute`:

```vue
<template>
  <div>
    <u-select-entity
      v-model="departmentCode"
      entity-name="req_department"
      value-attribute="code"
    />
    Selected value is: "{{departmentCode}}"
  </div>
</template>
<script>
  export default {
    name: 'USelectValueAttribute',
    data () {
      return {
        departmentCode: null
      }
    }
  }
</script>
```

### Changing a default actions

#### Remove default actions

```vue
<template>
  <u-select-entity
    v-model="value"
    entity-name="req_department"
    remove-default-actions
  />
</template>
<script>
  export default {
    name: 'USelectRemoveDefaultActions',
    data () {
      return {
        value: null
      }
    }
  }
</script>
```

#### Add actions

```vue
<template>
  <u-select-entity
    v-model="value"
    entity-name="req_department"
    :additional-actions="actions"
  />
</template>
<script>
  export default {
    name: 'USelectAddActions',
    data () {
      return {
        value: null
      }
    },

    computed: {
      actions () {
        return [{
          name: 'test action',
          caption: 'Test action caption',
          icon: 'u-icon-branch',
          handler: () => {
            console.log('click test action')
          }
        }, {
          name: 'test action 2',
          caption: 'Test action 2 caption',
          icon: 'u-icon-calendar-alt',
          handler: () => {
            console.log('click test action 2')
          }
        }]
      }
    }
  }
</script>
```

#### Only custom actions
```vue
<template>
  <u-select-entity
    v-model="value"
    entity-name="req_department"
    :additional-actions="actions"
    remove-default-actions
  />
</template>
<script>
  export default {
    name: 'USelectOnlyCustomActions',
    data () {
      return {
        value: null
      }
    },

    computed: {
      actions () {
        return [{
          name: 'test action',
          caption: 'Test action caption',
          icon: 'u-icon-calendar-alt',
          handler: () => {
            console.log('click test action')
          }
        }, {
          name: 'test action 2',
          caption: 'Test action 2 caption',
          icon: 'u-icon-check-double',
          handler: () => {
            console.log('click test action 2')
          }
        }]
      }
    }
  }
</script>
```

### Disabled vs readonly

Readonly USectEntity allow using actions (for example to view selected element form) while `disabled` - not

```vue
<template>
  <div>
    Select department:
    <u-select-entity
      v-model="value"
      entity-name="req_department"
    />

    disabled:
    <u-select-entity
      v-model="value"
      entity-name="req_department"
      disabled
    />
    readonly:
    <u-select-entity
      v-model="value"
      entity-name="req_department"
      readonly
    />
  </div>
</template>
<script>
  export default {
    name: 'USelectDisabledVsReadonly',
    data () {
      return {
        value: null
      }
    }
  }
</script>
```

### Actions overrides
```vue
<template>
  <u-select-entity
    v-model="value"
    entity-name="req_department"
    :build-edit-config="actionEditOverride"
  />
</template>
<script>
  export default {
    name: 'USelectActionsOverride',
    data () {
      return {
        value: null
      }
    },

    methods: {
      actionEditOverride (cfg) {
        return Object.assign(
          {},
          cfg,
          {
            isModal: false,
            docID: 12345
          }
        )
      }
    }
  }
</script>
```

### Allow adding
```vue
<template>
  <u-select-entity
    v-model="personID"
    entity-name="cdn_person"
    allow-dictionary-adding
    :build-add-dictionary-config="buildAddPersonConfig"
  />
</template>
<script>
  export default {
    data () {
      return {
        personID: null
      }
    },

    methods: {
      buildAddPersonConfig (cfg) {
        const parsedFIO = _.compact(cfg.query.split(' ')).map(word => _.capitalize(word))
        if (!parsedFIO[1]) this.$notify.error('Wrong citizen full name, must contain at least 2 words')
        cfg.props = {}
        cfg.props.parentContext = {
          fullFIO: cfg.query,
          shortFIO: parsedFIO[1] + ' ' + _.compact([parsedFIO[0] && parsedFIO[0][1], parsedFIO[2] && parsedFIO[2][1]])
            .join('.') + '.',
          lastName: parsedFIO[1],
          firstName: parsedFIO[0],
          middleName: parsedFIO[2] || null
        }
        return cfg
      }
    }
  }
</script>
```