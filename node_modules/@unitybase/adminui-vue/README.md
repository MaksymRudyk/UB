Extends UnityBase adminUI by Vue + ElementUI libraries.
Starts from UB@5 Vue is a preferred way to build a UI.

This documentation contains a JS (non-visual) functions/methods/modules exported by @unitybase/adminui-vue.
For documentation of the VueJS based UI components see [UI library for Vue](/api/adminui-vue/index.html).

## What included
 - `VueJS` - exported as global Vue variable and registered in SystemJS as 'vue'
 - `Vuex` - injected into Vue.prototype 
 - `Vuelidate` - injected into Vue.prototype as `$v` 
 - `throttle-debounce` - exported as `throttleDebounce`
 - `magicLink` - a hyperlink click custom actions - see {@link module:magicLinks}  
 - `ElementUI` - exported as global ElementUI variable and registered in SystemJS as 'element-ui'
 - `@unitybase/ub-pub` - available as `Vue.prototype.$UB` (or this.$UB inside vue component)  
 - `UB.i18n` - integrated into Vue as `$ut`
 - `i18n` filter available in vue templates. Lines below produce the same output
 ```vue
 <div> {{ 'uba_user' | i18n}} </div>
 <div> {{ $ut('uba_user') }} </div>
```
 - `dist/adminui-vue.css` theme include normalize.css && modified element-theme-chalk
 - modern login page - located in `/views/ub-auth.html`. The path to this page is a default for `uiSettings.adminUI.loginURL`

# Usage
## adminUI based app
 An `adminUI` based application should adds a `@unitybase/adminui-vue` model into `domain.models`
 section of ubConfig after `adminui-pub`

```json
"application": {
  "domain": {
    "models": [
      ...
      { "path": "./node_modules/@unitybase/adminui-vue" }
      ..
```

## Stand-alone app
See `/views/ub-auth.html` for sample

### Embed a compiled Vue app into adminUI
- define `output` and `externals` section into webpack config to prevent loading modules twice:

```javascript
  {output: {
    path: path.join(__dirname, 'dist'),
    library: 'YUR_LIB_NAME',
    libraryTarget: 'var',
    filename: 'your-lib-entry-point.min.js',
    publicPath: '/clientRequire/YOUR_MODULE_NAME/dist/'
  },
  externals: {
    lodash: '_',
    '@unitybase/ub-pub': 'UB',
    '@unitybase/adminui-pub': '$App',
    'vue': 'Vue',
    'element-ui': 'ElementUI',
  }}
```

## Debugging
### ElementUI in debug mode 
 For better debugging experience we recommend rebuilding element-ui in development mode.
 Use `element-ui` branch for a version specified in `adminui-vue` package.json (2.5.4 in a moment of writing this manual)
 
 ```bash
  git clone https://github.com/ElemeFE/element.git
  cd element
  git checkout v2.5.4
  npm i
  npm run clean && npm run build:file && npx webpack --config build/webpack.conf.js --mode development
```

 and copy /lib/index.js into your project. In my case project is located in `~/dev/ubjs/apps/autotest`  
 
 ```bash
 cp ./lib/index.js ~/dev/ubjs/apps/autotest/node_modules/element-ui/lib
 ```

### Prevent debugger to dig into vue sources
 While debugging a components source you can prevent debugger to dig into vue sources.
 
 To do this in Source tab of debugger press F1 to open `Preferences`,
 select `Blackboxing` on the left and add a pattern `vue.common.dev.js$`.
 
 After this `Step into` (F11) will skip vue sources
   
## Theme
Generate variables 
```bash
npm run gen-el-vars
```

Edit theme/ub-el.scss and build a theme using command:

```bash
npm run build:theme
```
