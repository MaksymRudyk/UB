## Usage
```vue
<template>
  <u-grid>
    <div>
    <h5>Default appearance + horizontal direction</h5>
      <u-button-group>
        <u-button icon="u-icon-sort-desc-alt">Sort desc</u-button>
        <u-button icon="u-icon-sort-asc-alt">Sort asc</u-button>
        <u-button icon="u-icon-circle-close">No sorting</u-button>
      </u-button-group>
    </div>
    <div>
      <h5>Vertical direction</h5>
      <u-button-group direction="vertical">
        <u-button appearance="plain" icon="u-icon-send">Send</u-button>
        <u-button appearance="plain" icon="u-icon-arrow-down">Low</u-button>
        <u-button icon="u-icon-arrow-up">Hi</u-button>
      </u-button-group>
    </div>
  </u-grid>
</template>
```
