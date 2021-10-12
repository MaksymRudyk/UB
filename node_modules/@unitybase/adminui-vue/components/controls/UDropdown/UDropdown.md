### Basic usage

Items can be disabled. Multi-level menu and divider is supported.

Closing on click can de prevented using `prevent-close` - try click on `Delete` item.

Item can contain any valid HTML as we did for `Some action` item. 

```vue
<template>
  <u-dropdown>
    <u-button>Press to see a dropdown</u-button>

    <template #dropdown>
      <u-dropdown-item @click="say('Edit')" disabled icon="u-icon-edit" label="Edit"/>
      <u-dropdown-item @click="say('Delete')" icon="u-icon-delete" label="Delete" prevent-close/>
      <u-dropdown-item @click="say('Add')" icon="u-icon-add" label="Add"/>
      <u-dropdown-item divider/>
      <u-dropdown-item prevent-close>
        <el-checkbox slot="label" v-model="checked">
          Some action
        </el-checkbox>
      </u-dropdown-item>
      <u-dropdown-item icon="u-icon-setting" label="Actions">
        <u-dropdown-item icon="u-icon-edit" label="Edit"/>
        <u-dropdown-item icon="u-icon-delete" label="Delete"/>
        <u-dropdown-item icon="u-icon-add" label="Add"/>
      </u-dropdown-item>
    </template>
  </u-dropdown>
</template>

<script>
export default {
  methods: {
    say (value) {
      alert(value)
    }
  },
  data () {
    return { checked: true }
  }
}
</script>
```

### Context menu

Can be used as a context menu:

```vue
<template>
  <div>
    <div
      @contextmenu.prevent="showContextMenu"
      style="width: 200px; height: 50px; background: lightblue"
    >
      Right click for context menu
    </div> 
    
    <u-dropdown ref="contextMenu">
      <template slot="dropdown">
        <u-dropdown-item label="item 1" @click="doSomething"/>
        <u-dropdown-item label="item 2"/>
        <u-dropdown-item label="item 3"/>
      </template>
    </u-dropdown>
  </div>
</template>

<script>
  export default {
    methods: {
      showContextMenu (event) {
        this.$refs.contextMenu.show(event)
      },
      doSomething () {
        this.$alert('Ups...') 
      }
    }
  }
</script>
```