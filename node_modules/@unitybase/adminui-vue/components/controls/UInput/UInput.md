### Usage

See also `UBaseInput` for additional examples

```vue
<template>
  <u-grid
    column-gap="50px"
    row-gap="10px"
  >
      <div> 
        <strong>req_request.notes</strong> attribute of type `String`
        <u-input attribute-name="notes" />
      </div>
      <div>
        <strong>req_request.cost</strong> attribute of type `Currency`
        <u-input attribute-name="cost" />    
      </div>
      <div>
          <strong>Disabled</strong>
          <u-input disabled attribute-name="notes" />
      </div>
      <div>
        <strong>Readonly</strong> (uses HTML input property)
        <u-input readonly attribute-name="notes"/>
    </div>
  </u-grid>
</template>
```
