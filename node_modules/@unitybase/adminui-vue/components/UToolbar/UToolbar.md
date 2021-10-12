### Entity based form (with processing)
```vue
<template>
  <div class="u-form-layout">
    <u-toolbar/>
    <u-form-container>
      <!-- Your form -->
    </u-form-container>
  </div>
</template>

<script>
  export default {}
</script>
```

### Custom buttons only
```vue
<template>
  <div class="u-form-layout">
    <u-toolbar :hide-default-buttons="true" :toolbar-buttons="toolbarButtons"/>
    <u-form-container>
      <!-- Your form -->
    </u-form-container>
  </div>
</template>

<script>
  export default {
    name: 'MyForm',

    computed: {
      toolbarButtons () {
        return [
          // New buttons
          {
            name: 'customButton1',
            label: 'Custom button',
            icon: 'fa fa-user',
            type: 'text', // Classic u-button (not icon only) will be shown. Can includes icon from prop above
            divider: true, // Will be used for `dropdownButtons`
            handler () {
              // logic
            }
          },
          {
            name: 'customButton2',
            label: 'button2',
            icon: 'u-icon-letter',
            handler () {
              // logic
            }
          }
        ]
      }
    }
  }
</script>
```

### Slots
```vue
<template>
  <div class="u-form-layout">
    <u-toolbar>
      <u-button appearance="plain" icon="u-icon-download" slot="left"></u-button>
      <u-button slot="right">right side btn</u-button>
      <!-- Or any component you need, button for example -->
      <button slot="dropdown">dropdown btn</button>
      <div slot="toolbarInfoRow">some content</div>
    </u-toolbar>
    <u-form-container>
      <!-- Your form -->
    </u-form-container>
  </div>
</template>

<script>
  export default {
    name: 'Toolbar'
  }
</script>
```

### Add new button `customButton1` and override build-in `delete` and `save` buttons behavior
```vue
<template>
  <div class="u-form-layout">
    <u-toolbar :toolbar-buttons="toolbarButtons"/>
    <u-form-container>
      <!-- Your form -->
    </u-form-container>
  </div>
</template>

<script>
  export default {
    name: 'MyForm',

    computed: {
      toolbarButtons () {
        return [
          // Hide delete button
          {
            name: 'delete',
            visible: false
          },
          // Override save button attrs
          {
            name: 'save',
            disabled: this.$store.getters.isDirty,
            handler () {
              // new logic
            }
          },
          // New button
          {
            name: 'customButton1',
            label: 'Custom button',
            icon: 'fa fa-user',
            disabled: this.$store.state.isNew,
            type: 'text', // Classic u-button (not icon only) will be shown. Can includes icon from prop above
            divider: true, // Will be used for `dropdownButtons`
            handler () {
              // logic
            }
          }
        ]
      }
    }
  }
</script>
```