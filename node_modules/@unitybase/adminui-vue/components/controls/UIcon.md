### Colors

```vue
<template>
<div>
  <h1>Default color is "control"</h1>
  <u-icon icon="u-icon-edit"/>
  <h2>Other colors</h2>
  <u-icon color="control" icon="u-icon-edit"/>
  <u-icon color="primary" icon="u-icon-edit"/>
  <u-icon color="success" icon="u-icon-edit"/>
  <u-icon color="warning" icon="u-icon-edit"/>
  <u-icon color="danger" icon="u-icon-edit"/>
</div>
</template>
```

### Sizes

```vue
<template>
<div>
  <u-icon icon="u-icon-edit" size="small"/>
  <u-icon icon="u-icon-edit" size="medium"/>
  <u-icon icon="u-icon-edit" size="large"/>
</div>
</template>
```

### Use icon CSS classes everywhere
```vue
<template>
  <u-grid :columns="3">
    <div>As a class for &lti&gt tag: <i class="u-icon-save"/></div>
    <div>As a button icon: <u-button icon="u-icon-save"/></div>
    <div>Or as u-icon component: <u-icon icon="u-icon-save" size="large" color="danger"/></div>
  </u-grid>
</template>
```
