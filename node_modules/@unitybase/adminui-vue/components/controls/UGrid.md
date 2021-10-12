### Basic usage

By default, UGrid align elements in 2 columns with `columnGap` (space between columns) of 20px and 0 `rowGap` (space between rows):

> default rowGap is 0 because in most case `UFormRow` (what have his own margins) is placed into cells (see below)

```vue
<template>
  <u-grid>
    <div>Any HTML can be in cell
      <ul>
        <li>list for example</li>
        <li>row height is `auto` so it's expanded down</li>
      </ul>
    </div>
    <textarea :value="txtVal1"/>
    <u-base-input :value="txtVal2"/>
    <div>2-d column of <strong>2-d row</strong></div>
  </u-grid>
</template>
<script>
export default {
  data () {
    return {
      txtVal1: 'Or any control.Here is second column of first row',
      txtVal2: 'UBaseInput in row2 col1'
    }
  }
}
</script>
```

### Columns and provided props

UGrid provides a `label-position` `label-width` and `max-width` to child's UFormRow's.

Here we place labelled elements in **4-columns**, and provide a `label-position` to child's UFormRow's
```vue
<template>
  <u-grid :columns="3" label-position="top">
    <u-form-row label="Document #"><strong>{{docNum}}</strong></u-form-row>
    <u-form-row label="Created on"><strong>{{$UB.formatter.formatDate(docDate, 'date')}}</strong></u-form-row>
    <div> Some HTML content </div>
    <u-form-row label="Long attr" style="grid-column-start: 1; grid-column-end: 4" ><u-base-input v-model="longText" /> </u-form-row>
    <u-form-row label="User" style="grid-column-start: 1; grid-column-end: 3" ><u-base-input v-model="userName"/></u-form-row>
    <u-form-row label="Password"><u-base-input type="password" v-model="pwd"/></u-form-row>

  </u-grid>
</template>
<script>
export default {
  data () {
    return {
      docNum: '2020-11',
      docDate: new Date('2021-01-12'),
      longText: 'this is a long text value, so better use 3 column for it',
      userName: 'Homer is fat, reserve a 2 columns for him',
      pwd: 'Simpson'
    }
  }
}
</script>
```

### Template[Columns|Rows]

In simple case prop `columns` define N columns all with the same width and rows height is calculated based on cell content.

Using `template-columns` (see [grid-template-rows](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-rows) ) and
`template-rows` ( see [grid-template-rows](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-rows)) almost any layout can be created

In example below the second column occupy 300px and third - 10%, and the first all the available space.

Height of the first row is `auto`(calculated based on row content), height of the second - 200px.
Height for 3-d row is not defined, so `auto` is used 

```vue
<template>
  <div>
    <u-grid
      template-columns="1fr 300px 10%"
      template-rows="auto 200px"
      row-gap="10px"
    >
      <u-base-input :value="1"/>
      <u-base-input :value="2"/>
      <u-base-input :value="3"/>
      <textarea :value="longText"/>
      <textarea :value="5"/>
      <textarea :value="6"/>
      <div style="grid-column-start: 1; grid-column-end: 4" v-html="longText" />
    </u-grid>
  </div>
</template>
<script>
export default {
  data () {
    return {
      longText: `Third row take a three column width and auto-height, the long text here is placed to demonstrate
        a CSS grid <strong>grid-column-start</strong> and <strong>grid-column-end</strong> properties usage.
        The grid-column-end sets to 4 because this prop value is a vertical line number, not a column number`
    }
  }
}
</script>
```

### Gap
Gap between rows and columns can be defined using `column-gap` and `row-gap`.
See [grid-column-gap](https://developer.mozilla.org/en-US/docs/Web/CSS/column-gap) and [grid-row-gap](https://developer.mozilla.org/en-US/docs/Web/CSS/row-gap)
documentation.
```vue
<template>
  <u-grid
    column-gap="50px"
    row-gap="10px"
    :columns="3"
  >
    <u-base-input :value="1"/>
    <u-base-input :value="2"/>
    <u-base-input :value="3"/>
    <u-base-input :value="4"/>
    <u-base-input :value="5"/>
    <u-base-input :value="6"/>
    <u-base-input :value="7"/>
  </u-grid>
</template>
```