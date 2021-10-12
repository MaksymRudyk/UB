### Basic usage
```vue
<template>
  <div>
    <h4>Colors and appearance</h4>
    <h5>Default appearance</h5>    
    <u-button>Default</u-button>
    <u-button color="primary">primary</u-button>
    <u-button color="control">control</u-button>
    <u-button color="success">success</u-button>
    <u-button color="warning">warning</u-button>
    <u-button color="danger">danger</u-button>

    <h5>Disabled state</h5>
    <u-button disabled>Default</u-button>
    <u-button disabled color="primary">primary</u-button>
    <u-button disabled color="control">control</u-button>
    <u-button disabled color="success">success</u-button>
    <u-button disabled color="warning">warning</u-button>
    <u-button disabled color="danger">danger</u-button>

    <h5>Plain appearance</h5>
    <u-button appearance="plain" color="primary">Plain primary</u-button>
    <u-button appearance="plain" color="control">Plain control</u-button>
    <u-button appearance="plain" color="success">Plain success</u-button>
    <u-button appearance="plain" color="warning">Plain warning</u-button>
    <u-button appearance="plain" color="danger">Plain danger</u-button>

    <h5>Inverse appearance</h5>
    <u-button appearance="inverse" color="primary">Inverse primary</u-button>
    <u-button appearance="inverse" color="control">Inverse control</u-button>
    <u-button appearance="inverse" color="success">Inverse success</u-button>
    <u-button appearance="inverse" color="warning">Inverse warning</u-button>
    <u-button appearance="inverse" color="danger">Inverse danger</u-button>
  </div>
</template>
```

### Icons & sizes
```vue
<template>
  <div>
    <h5>Icon only:</h5>
    <u-button icon="u-icon-clock"/>
    <u-button appearance="plain" icon="u-icon-signature"/>
    <u-button appearance="inverse" icon="u-icon-undo"/>
    <u-button circle icon="u-icon-clock"/>
    <u-button circle appearance="plain" icon="u-icon-signature"/>
    <u-button circle appearance="inverse" icon="u-icon-undo"/>

    
    <h5>Icon left:</h5> 
    <u-button icon="u-icon-save">Default</u-button>
    <u-button appearance="plain" icon="u-icon-arrow-alt-left">Go back</u-button>
    <u-button appearance="inverse" icon="u-icon-close">Close</u-button>

    <h5>Icon right</h5>
    <u-button right-icon="u-icon-tabs-dotted">Select</u-button>
    <u-button appearance="plain" right-icon="u-icon-refresh">Refresh</u-button>
    <u-button appearance="inverse" right-icon="u-icon-arrow-alt-right">Next</u-button>
  
    <h4>Sizes</h4>
    <u-button icon="u-icon-file-csv" size="small">Small</u-button>
    <u-button icon="u-icon-file-excel" size="medium">Medium</u-button>
    <u-button icon="u-icon-file-image" size="large">Large</u-button>
        
    <h4>Other examples</h4>
    <u-button icon="u-icon-dollar" right-icon="u-icon-dollar" @click="this.$dialogInfo('You are rich now')">Make me rich</u-button>
    <u-button appearance="plain">
      Mixed content: <a href="https://unitybase.info" target="_blank">href</a> 
    </u-button>
    <u-button type="submit">Submit(acts on user press enter anywhere in &lt;form&gt;</u-button>
  </div>
</template>
```