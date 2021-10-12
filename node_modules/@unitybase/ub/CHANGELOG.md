# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
### Added

### Changed

### Deprecated

### Removed

### Fixed

## [5.22.15] - 2021-09-24
### Added
 - `App.registerEndpoint` accept 4-d parameter `bypassHTTPLogging`.
 If sets to `true` server bypass logging of HTTP body into (useful if body contains sensitive information) and instead log `[DEDACTED]`
 For UB < 5.20.8 parameter is ignored.

## [5.22.14] - 2021-09-16
### Added
 - `fsStorage` mixin - added `allowOverride` property. Sets it to `true` allows row with the same natural key
 to be present in several models. In this case last model (in order they defined in ubConfig) win.

### Changed
- captions from `meta` files: the words are capitalized according to English
  rules for captions

## [5.22.13] - 2021-09-08
## [5.22.12] - 2021-09-02
### Removed
 - `App.logoutAllWithTheSameNameExceptMe()` is removed - use `App.removeUserSessions(userID)` instead.
Actually `logoutAllWithTheSameNameExceptMe` dose not works since UB5. 

## [5.22.11] - 2021-08-31
## [5.22.10] - 2021-08-18
### Added
 - `App.fsObserve` and `App.httpCallObserve` methods - an observation for fs calls and external HTTP calls what stored in 
  prometheus `unitybase_fs_operation_duration_seconds` & `unitybase_httpext_duration_seconds` buckets.
  Feature works for US server >= 5.20.4 under Linux.

### Fixed
- **BREAKING** `TubDataStore.insert` return numeric value (instead of array) ONLY in case fieldList is === `['ID']` (as documented).
  Before this fix numeric value is returned for any fieldList with ONE element.

## [5.22.9] - 2021-08-09
## [5.22.8] - 2021-08-04
## [5.22.7] - 2021-07-18
### Added
 - Dutch (nl) localization

### Fixed
 - `App.domainIsLoaded` documentation improved

## [5.22.6] - 2021-07-08
### Added
 - for Document type attributes added validation what BLOB store used by attribute is defined in ubConfig  

## [5.22.5] - 2021-06-14
### Added
 - `getAppInfo` endpoint result can be modified by subscribe to newly added `App.getAppInfo` event:
```js
App.on('getAppInfo', function(appInfo) {
  const serverConfig = App.serverConfig
  const DSTU = serverConfig.security && serverConfig.security.dstu
  appInfo.trafficEncryption = DSTU ? DSTU.trafficEncryption : false
})
```   

### Removed
 - DSTU related section of `getAppInfo` response is removed (moved into `getAppInfo` event handler of @ub-d/crypto-api endpoint)

### Fixed
 - initial call to `App.serverConfig` is protected by critical section to prevent possible multithreading errors
 - `fsStorage` mixin: for *.vue files force `script/x-vue` mime type (`mime` module do not detect .vue)
 - `/allLocales?lang=LL&includeDomain=1` - will merge meta with meta.lang - the same algo as in client-side UBEntity constructor.
  This fix `ubcli migrate` in case {$i18n: entityName} is defined in YAML but meta file is not localized to some language 

## [5.22.4] - 2021-05-24
### Added
 - Hardware Security Module (UB EE+) config description is added to the ubConfig JSON schema
 - `rest` endpoint documented - see [rest endpoint documentation](https://unitybase.info/api/server-v5/module-endpoints.html#restEp)

## [5.22.3] - 2021-05-13
### Added
 - JSDoc: `UB.App` and `UB.Session` events are documented

### Fixed
 - improved JSDoc. UB.App is now instance of ServerApp (instead of App) for better documentation

## [5.22.2] - 2021-05-07
## [5.22.1] - 2021-05-05
## [5.22.0] - 2021-04-24
### Deprecated
 - `UB.ns` is deprecated and will be removed soon

## [5.21.6] - 2021-04-23
### Fixed
 - fix `global.UB.getServerConfiguration is not a function` error (can occur during thread initialization)
   by prevent override a legacy `global.UB` object

## [5.21.5] - 2021-04-22
## [5.21.4] - 2021-04-19
### Fixed
 - fix `global.UB.getDomainInfo is not a function`

## [5.21.3] - 2021-04-19
### Changed
 - `allLocales` endpoint, when loading as JSON files, now merges all models, and return as a normal key-value resources.
   Add 2 more parameters: `includeDomain` and `includeData`, which would merge appropriate type of resources in:
   - `includeDomain` controls inclusion of `entityCode: caption` and `entityCode.attribute: caption` resources,
   - `includeData` controls reading and including JSON files from `_data/locale/lang-nn.json` files, resources, which
     are needed for data migration only.

## [5.21.2] - 2021-04-16
## [5.21.1] - 2021-04-13
### Changed
 - `allLocales` endpoint (client-side localization download) supports downloading of JSON files only, without js files
   Request shall be like `/allLocales?lang=en&json=1`
   Response body will contain model name as a key and JSON file content as a value:

   ```json
   {
     "ub-pub": {...},
     "UBM": {...}
   }.
   ```

## [5.21.0] - 2021-04-02
### Added
 -  new property `UBEntity.overriddenBy` - comma separated model names where entity is overridden

### Changed
 - **BREAKING** for overridden entities `UBEntity.modelName` property now contains an original model name instead of
  last override model name

## [5.20.3] - 2021-04-01
## [5.20.2] - 2021-03-30
## [5.20.1] - 2021-03-29
### Added
 - new method `App.blobStores.internalWriteDocumentToResp` - writes a BLOB content to the response without
  verifying an ALS (but RLS is verified) or return an error without modifying a response.

  **SECURITY** - method can be used inside endpoint or rest entity method, which already checks
  the access rights to the document.

## [5.20.0] - 2021-03-25
## [5.19.7] - 2021-03-23
### Added
 - new ubConfig parameter `uiSettings.adminUI.forgotPasswordURL`. If sets, then "Forgot password" link is displayed on the login form
 - added `THTTPRequest.json()` method - read a UTF8 encoded HTTP request body as JSON Object.
   Can be used as faster alternative to `JSON.parse(req.read('utf8'))`
 - added `IncomingMessage.json()` - a faster alternative to `JSON.parse(resp.read())` for http client requests
 - `ub_blobHistory` entity extended by `entity` and `createdAt` attributes

## [5.19.6] - 2021-03-17
### Added
 - `App.launchEndpoint` emits 2 addition events:
   - `launchEndpoint:before` with parameters: (req, resp, endpointName)
   - `launchEndpoint:after` with parameters: (req, resp, endpointName, defaultPrevented)
   Can be used to do something on before/after any endpoint execution
     
 - `App.removeUserSessions(userID)` a method to `logout` a user completely
     
### Changed
 - `fsStorage` mixin can use a simplified BLOB info (only origName is stored instead of JSON) for `mdb` based BLOB attributes

### Fixed
 - multitenancy: prevent recreation of default constraint for mi_tenantID on Postgres

## [5.19.5] - 2021-03-15
### Added
 - `UB.registerMixinModule(mixinName, mixinModule)` - a way to add a pure JS mixin implementation.
  See detailed [mixins](https://unitybase.info/api/server-v5/tutorial-mixin_custom.html) tutorial for details
 - `Sesson.tenantID` property added - contains a number >0 for multitenancy app. 0 on case multitenancy not enabled 
 - implicitly disable multitenancy mixin for `ub_version` and `ub_miration`
 - `fsStorage` mixin: implements a CRUID operation for entity, whose data is stored in the file system.
   Used as data storage implementation for `ubm_form`, `ubs_reports` and `ubm_diagrams` - 
   see [File system storage tutorial](https://unitybase.info/api/server-v5/tutorial-mixins_fsstorage.html) for details.
   
   **BREAKING** diagrams, reports and forms MUST be converted:
    - `ubcli convertDefFiles -u root`
    - *.ubrow and modified files added to git (`git add *.ubrow && git add *.def && git add *.template`)
    - files, reported by convertDefFiles should be deleted from project (removal script is outputted to the stdout by `convertDefFiles`) 

 - [critical section](https://en.wikipedia.org/wiki/Critical_section) now available in http working threads:
 ```javascript
  const App = require('@unitybase/ub').App
  // critical sectin must be registered once in the moment modules are evaluated 
  const MY_CS = App.registerCriticalSection('SHARED_FILE_ACCESS')

  function concurrentFileAccess() {
    // prevents mutual access to the same file from the different threads
    App.enterCriticalSection(FSSTORAGE_CS)
    try {
      const data = fs.readfileSync('/tmp/concurrent.txt', 'utf8')
      // do some operation what modify data
      fs.writefileSync('/tmp/concurrent.txt', data)
    } finally {
      // important to leave critical section in finally block to prevent forever lock 
      App.leaveCriticalSection(FSSTORAGE_CS)  
    }
  }
 ``` 

 - `App.logEnter(enterText)` / `App.logLeave` - allows increasing/decreasing logging recursion level
  (just like native methods do). Each `logEnter` call MUST have paired `logLeave` call, so better to use as such:
```javascript
 wrapEnterLeave: function (enterText, originalMethod) {
    return function(ctx) {
      App.logEnter(enterText)
      try {
        originalMethod(ctx)
      } finally {
        App.logLeave()
      }
    }
  }
```
### Changed
 - implicitlyAddedMixins logic is moved from native to @unitybase/ub model (into `_hookMetadataTransformation.js` hook)

### Removed
 - `UB.mixins.mStorage` removed (obsolete) 

## [5.19.4] - 2021-03-03
### Added
 - new ubConfig property `uiSettings.adminUI.disableScanner`- disable a scanner related functionality if `true`.
 - new property `Session.pendingUserName` - a username for authentication in pending state. Used for security audit
   to log a username in case session is not created yet
 
### Changed
 - `allLocales` endpoint (client-side localization download) supports JSON files in `/public/lang-??.json`.
  Content of such files are wrapped into `UB.i18nExtend(....)` before passing to client.
   
  This allows using automation tools for preparing other language's localization.

 - server-side localization automatically loads a JSON files from models `serverLocale` folder.
   Naming convention is - `*-??.json` where ?? is a language code. Such convention allows creating of a model with 
   serverLocale folder contains localization to the new language for all other models,
   for example model for `zz` language `zz-locale` with `serverLocale/cdn-zz.json`, `serverLocale/org-zz.json` etc.
   
   It's recommended to split existed `serverLocale/*.js` into several JSON and remove a `require('./serverLocale/*.js')`
   form model initialization using instruction below (remove locales you do not need from touch, replace `modelName` by lowercased name of your model ):
   ```shell
   cd serverLocale
   touch modelName_sl-en.json modelName_sl-ru.json modelName_sl-uk.json modelName_sl-az.json modelName_sl-id.json modelName_sl-ka.json modelName_sl-tg.json modelName_sl-ky.json
   git add ./*.json
   // for each language move content of the js locale for individual language into modelName-??.json (without language identifier)
   // Use WebStorm 'Fix all JSON problems' action to add a double quoters in new lang files  
   // remove require('./serverLocale/nameOfLocaleFile.js') from initModel.js
   git rm ./serverLocale/nameOfLocaleFile.js
   ```
   
## [5.19.3] - 2021-02-10
## [5.19.2] - 2021-02-08
### Added
 - new syntax sugar methods `insert`, `insertAsObject`, `update` and `updateAsObject` are added to `TubDataStore`.
  Methods semantic are the same as for Connection.
  See [TubDataStore documentation](https://unitybase.info/api/server-v5/TubDataStore.html) for details. Example:
   
```javascript
 const STORE = UB.DataStore('uba_role')
 // return ID (generated, since ID not passed in the execParamms)
 // 3000000000201
 const testRoleID = STORE.insert({
   fieldList: ['ID'],
   execParams: {
     name: 'testRole1',
     allowedAppMethods: 'runList'
   }
 })
```

## [5.19.1] - 2021-02-03
## [5.19.0] - 2021-02-02
### Added
 - `THTTPRequest` extended by helper functions:
    - req.getHeader(name) -> string|undefined
    - req.getHeaderNames() -> array<string>
    - req.getHeaders() -> Object
 
 - `THTTPRequest` extended by `parsedParameters` getter. Result is cached, so second call is faster than first
  ```javascript
  // for parameters 'foo=bar&baz=qux&baz=quux&corge' return
  req.parsedParameters // { foo: 'bar', baz: ['qux', 'quux'], corge: '' }
  ```
  We recommend using this getter instead of `querystring.parse(req.parameters)` to prevent multiple
  call to parameter parsing from different methods (require **UB server >= 5.19.0**).

 - `THTTPRequest.writeToFile` can accept second parameter `encoding` - 'bin' (default) or `base64`.
  For `basse64` request body will be converted from base64 into binary before write to file

### Changed
 - **BREAKING** JS endpoints, added by `App.registerEndpoint` and native endpoints, added by a server (stat, auth, ubql, logout and metrics)
  now executed using `App.launchEndpoint` JS implementation.
   
  This allows to use the same `req` and `resp` objects for both endpoint types, and a one step forward to pure JS ubql implementation.

  These changes require **UB server >= 5.19.0**.

## [5.7.21] - 2021-01-30
## [5.7.20] - 2021-01-26
## [5.7.19] - 2021-01-19
## [5.7.18] - 2021-01-17
## [5.7.17] - 2020-12-30
## [5.7.16] - 2020-12-28
## [5.7.15] - 2020-12-22
## [5.7.14] - 2020-12-21
## [5.7.13] - 2020-12-20
### Added
 - `attribute.customSettings.hiddenInDetails` is documented in the `entity.schema.json`

## [5.7.12] - 2020-12-14
## [5.7.11] - 2020-12-09
## [5.7.10] - 2020-12-02
## [5.7.9] - 2020-11-25
## [5.7.8] - 2020-11-20
### Added
 - new `privateSettings` property for entity and attribute added to the JSON schema for entity metadata
  
## [5.7.7] - 2020-11-19
### Fixed
  - `UB.UBAbort` server side abort error now logged as `ERR` log level instead of `EXC` (as should be) for UBServer@5.18.20.
  For UBServer < 5.18.20 nothing changed and UB.UBAbort will be logged as `EXC`.
    

## [5.7.6] - 2020-11-15
## [5.7.5] - 2020-11-14
## [5.7.4] - 2020-11-12
## [5.7.3] - 2020-11-10
## [5.7.2] - 2020-11-08
## [5.7.1] - 2020-11-08
## [5.7.0] - 2020-11-05
### Added
 - `ub_migration` & `ub_version` entities added

## [5.6.8] - 2020-11-01
### Added
 - `App.blobStores.getContentPath` - retrieve full path to a file with BLOB content
 - EE & DE edition: added `dstu.iit.strictMode` parameter. If true (default) - force server-side signature format to CADES_X_LONG (enable TSP if disabled)

## [5.6.7] - 2020-10-20
### Added
 - SUFFIXES dbExtension type added to entity schema (UB>=5.18.15)

### Removed
  - `ignoreCollation` attribute property removed (in flavor of SUFFIXES extension)
  
## [5.6.6] - 2020-10-15
### Added
 - `ignoreCollation` attribute property added to entity metadata schema

## [5.6.5] - 2020-09-23
## [5.6.4] - 2020-09-22
## [5.6.3] - 2020-09-20
## [5.6.2] - 2020-09-08
## [5.6.1] - 2020-09-01
## [5.6.0] - 2020-08-31
### Deprecated
 - `javascript` section in ubConfig is deprecated. Starting from UB 5.18.12 use command line switches or env. vars
   Use `ub --help` for details.
    
## [5.5.13] - 2020-08-19
## [5.5.12] - 2020-08-19
### Removed
 - nodeJS compatibility test suite is moved from `@unitybase/ub` to `apps/autotest/models/TST`.
 This reduced the `@unitybase/ub` module size by 900Kb.

## [5.5.11] - 2020-07-28
### Fixed
 - show correct JS exception with trace in case domain transformation hook broke some entities

## [5.5.10] - 2020-07-26
## [5.5.9] - 2020-07-19
## [5.5.8] - 2020-07-16
### Added
 - Unix Domain Socket configuration notes added to the ubConfig.schema

### Fixed
 - `RLS.allowForAdminOwnerAndAdmTable` (used in ubm_desktop & ubm_navshortcut RLS) take into account user groups, so Groups
 can be added to shortcut permissions 

## [5.5.7] - 2020-07-15
## [5.5.6] - 2020-07-08
## [5.5.5] - 2020-07-01
## [5.5.4] - 2020-06-30
### Fixed
 - `RLS.allowForAdminOwnerAndAdmTable` fixed to allow for users with role `Admin` to see all folders

## [5.5.3] - 2020-06-21
## [5.5.2] - 2020-06-15
### Fixed
 - fix `getUniqKey is not a function` during login (ubm_navshortcut RLS)

## [5.5.1] - 2020-06-15
## [5.5.0] - 2020-06-14
### Added
 - `App.launchRLS` - a JS based RLS mixin helper for UB@5.18.4
 - `RLS.allowForAdminOwnerAndAdmTable`  a functional RLS for filtering rows by `${entity}_adm` subtable.
   To be used instead of "expression based RLS": `${$.currentUserInGroup(ubm_navshortcut,'Admin')} OR ${$.currentUserOrUserGroupInAdmSubtable(ubm_navshortcut)}`.
   See `ubm_navshortcut` for usage sample. 
 - `rls.func` property added to entity.schema.json
 
## [5.4.12] - 2020-05-25
## [5.4.11] - 2020-05-22
## [5.4.10] - 2020-05-17
### Added
 - put a model version (version from package.json) into log while loading domain models on server startup. New log example:
```
20200514 09285007  " info  		Loading domain models... 
20200514 09285007  " info  		"UB"(5.4.9) from "./node_modules/@unitybase/ub" 
20200514 09285007  " info  		"UBA"(5.4.9) from "./node_modules/@unitybase/uba" 
```

## [5.4.9] - 2020-05-13
### Added
 - HTTPRequest.requestId property added: returns unique HTTP request ID - the same value as used to fill a `uba_auditTrail.request_id`;
   In case audit trail is disabled in domain (uba_auditTrail entity not available) or Ub server version < 5.18.2 returns 0.

## [5.4.8] - 2020-05-06
### Added
 - support for "attribute restriction" feature added in UB server 5.18.1 (u)

## [5.4.7] - 2020-04-24
### Added
 - `isLicenseExceed` property added to `getAppInfo` endpoint result (UB EE). `true` in case license is exceed. Undefined in other cases.
  
### Changed
 - ServerRepository will check for total (in case builds using `.withTotal(true)`) in `DataStore.totalRowCount` property 
 instead of switching DataStore to `.currentDataName = '__totalRecCount'`
 
### Removed
 - **BREAKING** UBQL with `options.totalRequired = true` no longer create a separate DataStore namespace `__totalRecCount`.  
   To get a total record count property `DataStore.totalRowCount` should be used instead.  
   This only affect a UB 1.12 legacy code like this:
   ```js
   if (mParams.options.totalRequired) {
     ctx.dataStore.currentDataName = "__totalRecCount";
     mParams.__totalRecCount = (ctx.dataStore.rowCount) ? ctx.dataStore.get(0) : ctx.dataStore.rowCount;
     ctx.dataStore.currentDataName = "";
   }
   ```
   should be replaced by
   ```js
   if (mParams.options.totalRequired) {
     mParams.__totalRecCount = ctx.dataStore.totalRowCount
   }
   ```  
   or simply removed - UB5.18.1 will add a `mParams.__totalRecCount` output parameter automatically
        
## [5.4.6] - 2020-04-10
### Added
 - in case of unexpected exception inside metadata initialization entity name which cause an error will be logged
   
### Changed
  - DBConnection unit moved into @unitybase/base from @unitybase/ub; This allows to use it in shell scripts
  (App.dbConnections available as before)

## [5.4.5] - 2020-03-30
## [5.4.4] - 2020-03-20
## [5.4.3] - 2020-03-17
## [5.4.2] - 2020-03-09
## [5.4.1] - 2020-03-04
### Added
 - user-friendly exception in case UB server version < 5.18. 5.18.0 is a minimal version of server for this package version

### Removed
  - `App.fileChecksum` `App.folderChecksum` `App.resolveStatic` are removed
  - ubConfig sections `httpServer.headersPostprocessors` and `httpServer.watchFileChanges` are removed
   
## [5.4.0] - 2020-02-29
### Added
 - **metadata transformation hook**: in case `_hookMetadataTransformation.js` file exists in the root of the model folder it's export
 will be applied to Domain JSON before the Domain is created. This hook allows to apply any modifications to metadata (*.meta).
 Usage example: `apps/autotest/models/TST/_hookMetadataTransformation.js` 
        
 - `dataStore.getAsJsObject()` and `dataStore.getAsJsArray()` methods - direct serialization of TubDataStore into JS Object
 without using `JSON.parse`. This is 20% faster compared to `JSON.parse(dataStore.asJSONObject)`.
 In case UB server is of version < 5.18.0 new methods will fallback to `JSON.parse(dataStore.asJSONObject)`
 
 For better performance and code readability we recommend applying following changes to the applications sources:  
   - `JSON.parse(dataStore.asJSONObject)` -> `dataStore.getAsJsObject()`
   - `JSON.parse(dataStore.asJSONArray)` -> `dataStore.getAsJsArray()`
 (the easiest way if to search for all case sensitive occurrences of `asJSON`)
   
### Changed
 - metadata **localization** files can be placed in the **model sub-folder** instead of model folder root.
 Recommend naming such folders `meta_locale`. In fact now localization files can be even moved into his own model.
 for example for adding a new `zl` localization new model can be created and all `*.meta.zl` files can be placed where.
 
 - Entity metadata merging: in case **several** descendant model contains entity with the same name as
  original model they `*.meta` files will be **MERGED** (before this patch only **LAST** model metafile is merged with original metafile).
 
 - metadata **localization** files are merged in the same way as *.meta files (see above)
  
 - entity.schema.json: add conditional requirements for dataType field.
 Now `size` required for dataType=String, associatedEntity for dataType=["Entity", "Many"], etc.

### Deprecated
 - `TubDataStore.asJSONObject`, `TubDataStore.asJSONArray`
 
### Removed
 - `onlyOfficeEndpoints` module. Moved to a separate package '@unitybase/only-office'
 
## [5.3.19] - 2020-02-23
### Added
 - new method `Session._buildPasswordHash` - create a password hash for login/plainPassword pair. Can be overrated by application
 to provide a custom hashing mechanism (in current implementation for CERT2/Basic auth only but will be used in UB auth in future)
  
## [5.3.18] - 2020-02-18
### Changed
 - ubConfig JSON schema: add `simpleCertAuth` parameter description; remove deprecated `novaLib` key 

### Removed
 - legacy `newUserRegistration` event for Session object is **not emitted**. CERT auth schema what use it is deprecated.
  CERT2 auth schema do not require this event  

### Fixed
 - fix JSDoc for UB namespace - mark UB.App as `@property {App} App` instead of `@type {App}` for WebStorm code competition

## [5.3.17] - 2020-02-13
### Changed
 - in case @unitybase/ub package installed into different path throw human friendly error
 instead of `can't redefine non-configurable property "entity"`
   
## [5.3.16] - 2020-02-10
## [5.3.15] - 2020-02-08
### Changed
 - improved error message in case getDomainInfo called with invalid userName URL parameter

## [5.3.14] - 2020-02-03
## [5.3.13] - 2020-01-31
## [5.3.12] - 2020-01-17
### Added
 - new property `Session.zone: string` - security zone. Always empty for SE
 - new server config parameters `security.zones` and `security.zonesAuthenticationMethods` (UB EE. Ignored in UB SE)
 - `getAppInfo` endpoint wil return `authMethods` restricted to `security.zonesAuthenticationMethods` (UB EE)  
 
## [5.3.11] - 2020-01-11
### Added
 - `App.endpointContext` - an empty object what can be used to store data for a single endpoint execution.
   Application logic can store here some data what required during single HTTP method call;
   Starting from UB@5.17.9 server reset `App.endpointContext` to {} after endpoint implementation execution,
   so in the beginning of execution it's always empty  

## [5.3.10] - 2019-12-27
## [5.3.9] - 2019-12-20
### Changed
 - Improved JSON schema for ubConfig.json: add support for `uiSetting.cspAllow`

## [5.3.8] - 2019-12-18
### Changed
  - UBAbort constructor now accept optional additional arguments, which will be passed down to client.
    Anticipated scenario of usage:
    ```
    throw new UB.UBAbort('<<<file_not_found>>>', 'bad_file.name')
    ```
    The "file_not_found" i18n string on client should be like `'File "{0}" is not found or not accessible'`.

## [5.3.3] - 2019-11-21
### Added
  - new server config parameter `security.excludeGroups: ["group1", ...]`
   Groups codes (uba_group.code) to EXCLUDE from available user groups during user logon.
   Useful in case a same DB is used by several server instances, and one of instance
   (private portal for example) should limit roles available to user.
   **WARNING** - roles what assigned directly to user (in uba_userroles) **NOT** filtered and remains available
   
### Changed
 - in case nginx is used as a reverse proxy (http.reverseProxy.kind === 'nginx' in app config)
 `/statics` endpoint on the UB level simply redirect to `/statics` nginx location.
 `ub-proxy.cfg` nginx config should be upgraded by `npx ubcli generateNginxCfg` (or rule for `location /statics` should be added manually)  

## [5.3.0] - 2019-10-18
### Added
 - new server config parameter `security.limitGroupsTo: ["group1", ...]`
  Groups codes (uba_group.code) to limit available user groups during user logon.
  Useful in case a same DB is used by several server instances, and one of instance
  (public portal for example) should limit roles available to user.
  **WARNING** - roles what assigned directly to user (in uba_userroles) **NOT** filtered and remains available   

 - `App.grantEndpointToRole(endpointName, roleCode)` - programmatically grant endpoint permission to specified role
 
### Changed
 - changes for UB server >= 5.17 (backward compatible):
   - data type of Session.id is changed form Number to String and retrieved lazy.
     In general this property should not be used in app code
   - `Session.runAsUser` will create a temporary session what live until the end of request (not persisted to sessionManager)
   
 
## [5.2.37] - 2019-09-28
### Fixed
 - `getDomainInfo` endpoint now compatible with UB server <= 5.16 (compatibility broken by @unitybase/ub@5.2.36) 

## [5.2.36] - 2019-09-22
### Fixed
 - `getDomainInfo` endpoint optimization: starting from UB 5.15.4 nativeGetDomainInfo can wrote domain
  directly into HTTP response instead of serializing it to/from JS engine. This save up to 70ms on huge domains
 - `authMock` property added (if server started with --authMock switch) to getAppInfo endpoint response 

## [5.2.35] - 2019-09-19
### Added
 - documented ability to set log file path (`logging.path`) to the specified file and disable log rotation by setting 
 `logging.rotationSizeInMB` to 0
 - `logging.threadingModel` is marked as deprecated
  
### Fixed
 - added a documentation for `model` configuration parameter for `aclRls` mixin 

## [5.2.32] - 2019-08-28
### Changed
 - for UB server >= 5.15 UBLDAP auth schema use [libcurl](https://curl.haxx.se/) for LDAP query;
 ubConfig `ldapCatalogs` configuration parameters is changed - see ubConfig schema for details. Example config:
```
"security": {
    "authenticationMethods": [
      "UB", "UBLDAP"//, "Negotiate"
    ],
    "ldapCatalogs": [{
        "name": "MYCOMPANY",
        "URL":  "ldaps://mycompany.main:636/OU=MyCompany,DC=mycompany,DC=main?cn?sub?(sAMAccountName=%)",
        "CAPath": "",
        "ignoreSSLCertificateErrors": false
      }
    ]
},
```  

## [5.2.29] - 2019-08-13
### Added
 - `uiSettings.adminUI.registrationURL` parameter.
 In case parameter is empty or not exists (default) then registration link do not displayed on the default
 authentication form (@unitybase/adminui-vue/views/ub-auth.html). Otherwise, a link to the specified URL is displayed
 
## [5.2.24] - 2019-07-10
### Fixed
 - `Session.runAsUser` & `Session.runAsAdmin` should restore original session even if one of `login` handler fails for passed user
 
### Changed
 - server-side UB.i18n now support formatting (like client side i18n). Sample:
```js
UB.i18nExtend({
  "en": { greeting: 'Hello {0}, welcome to {1}' },
  "ru": { greeting: 'Привет {0}, добро пожаловать в {1}' }
})
UB.i18n('greeting', 'Mark', 'Kiev') // in case current user language is en -> "Hello Mark, welcome to Kiev"
UB.i18n('greeting', 'uk', 'Mark', 'Kiev') // in case ru lang is supported -> "Привет Mark, добро пожаловать в Kiev"
```

### Added
 - new configuration key `security.domainMap` - rules for transformation of fully qualified domain names to NT4-style.
 To be used for Negotiate authentication under Linux in case domain name contains dots.
 For example to prevent transformation of `user@MYCOMPANY.COM` -> `MYCOMPANY\\user` (default behavior) the following can be configured:
 ```JSON5
{
  //....
  "security": {
    "authenticationMethods": ["UB", "Negotiate"],
    "domainMap": {
      "MYCOMPANY.COM": "MYCOMPANY.COM"
    }
  }
}
```    
 In this case Negotiated user name will be  `MYCOMPANY.COM\\user`

## [5.2.22] - 2019-07-04
### Added
 - update ubConfig JSON schema about new key `uiSettings.adminUI.pdfViewer.uriSuffix`

## [5.2.18] - 2019-06-19
### Added
 - `App.dbConnection['..'].savepointWrap` function: rollback a part of transaction for PostgreSQL.
 This fix [unitybase/ub-server#26] - see issue discussion for details

## [5.2.12] - 2019-04-28
### Added
 - new method `THTTPRequest.writeToFile(fullFilePath)` - write request body content (as binary) to a file.
 Return `true` on success. Can be used to bypass moving body content between native<->JS
 if conversion of the request body is not required.  

### Fixed
 - Windows: `UB.UBAbort` server-side exception fileName & lineNum now valid in case
 file name is absolute path starts with drive letter. Prev. implementation puts drive letter instead of fileName 


## [5.2.11] - 2019-04-07
### Added
 - Entity metadata merging: in case descendant model contains entity with the same name as
 original model they `*.meta` files will be **MERGED** (before this patch descendant overrides parent).
 This allow to **override only part of meta-file attributes/properties in descendants**.
 
## [5.2.5] - 2019-02-24
### Fixed
 - removed extra files from bundle

## [5.2.4] - 2019-02-14
### Changed
  - DocFlow specific server-side i18n are removed from @unitybase/ub
  
## [5.2.0] - 2019-01-13
### Added
 - extended `App.authFromRequest` - added optional Cookies for Negotiate authentication (UB server should be updated to 5.7.7+)
 - `THTTPResponse.getBodyForDebug` function
 - `App.globalCachePut` will accept `null` as 2nd parameter. In this case key will be removed from globalCache (UBserver@5.7.7+)  

## [5.1.1] - 2018-12-17
### Fixed
 - `DataStore.initialize` will correctly init store from a flatten format in case rowCount = 0 [unitybase/ubjs#31]

## [5.1.0] - 2018-12-12
### Changed
 - initial values of `Session.uData` now filled inside JS `Session._getRBACInfo` (`@unitybase/ub`)
 instead of duplication of code inside UB server and `@unitybase/uba` model
 - in case user is a member of **security group** (uba_group / uba_usergroup) then roles assigned 
 to this groups will be added to the user roles. ELS for such a roles will be also applied to user.
 **UB server must be upgraded to >= 5.7.3**
 - uData employeeShortFIO & employeeFullFIO now initialized from uba_user.firstName & uba_user.fullName.
 In case `org` model is in domain then it will override employeeShortFIO & employeeFullFIO
 
### Added
 - `Session.uData.groupIDs` property - an array of group IDs user id assigned to
 
## [5.0.45] - 2018-10-09
### Fixed
 - **CRITICAL** endpoints `models`, `clientRequire` & `static` will return `Bad Request` in case
 of access folder (not a file). 
 
 Explanation:
 
 This patch prevent exposing of internal location to caller in case `nginx` is used as a reverse proxy.
 The problem is how `nginx` handle `location` - see [last paragraph of nginx location documentation](http://nginx.org/en/docs/http/ngx_http_core_module.html#location).
 
 In case our endpoints return 200 with `X-Accel-Redirect: path/to/folder` inside internal location, then
 `nginx` will redirect client (return 301) to `path/to/folder` + `/` with internal location inside.
 
 For example without this patch request to `http://localhost/models/UB/schemas` will redirect client to 
 `https://localhost/ubstatic-unitybase-info/app/node_modules/@unitybase/ub/public/schemas/` with 404 and
 expose to caller our internal folders structure. 

## [5.2.30] - 2019-08-14
### Changed
 - explicitly disable audit for system entity ub_blobHistory 

## [5.0.44] - 2018-10-06
### Changed
 - `$.currentUserOrUserGroupInAdmSubtable` RLS macros will add all user roles including pseudo-roles `Everyone` `User` & `Anonymous`
 Previous implementation did not check pseudo-roles

## [5.0.43] - 2018-10-05
### Changed
- `docflow` related legacy code is removed from `RLS.js` (known as $ in "rls" mixin expression)
 
## [5.0.38] - 2018-09-25
### Fixed
- domain documentation generator fixed `ubcli generateDoc -u admin -p admin` 

## [5.0.37] - 2018-09-23
### Added
- `getAppInfo` endpoint return a application version in `appVersion` key.
 Version taken from application package.json version attribute.
 Client side can read it from `connection.appConfig.appVersion`.

## [5.0.23] - 2018-07-15
### Changed
- `allLocales` endpoint will join locales from all models (since login form localization moved to ub-pub
 we do not need to skip a adminui-pub localization anymore)

## [5.0.19] - 2018-06-27
### Changed
- values from locale folder merged to the ub-pub model localization

## [5.0.19] - 2018-06-27
### Added
- the `adminui.loginURL` setting described in `ubConfig.schema.json`
- the `httpServer.externalURL` configuration parameter is added to ubConfig.
 URL that the User from the internet will use to access your server.
 To be used in case server is behind a reverse proxy
- `App.externalURL` property added - either `httpServer.externalURL` of `App.serverURL` if external URL not configured

## [5.0.18] - 2018-06-21
### Fixed
- **CRITICAL** prevent transferring of application files to client in case `httpServer.inetPub` is empty in config
- THTTPResponse methods `badRequest`, `notFound` and `notImplemented` will return charset in
 Content-Type header as required by HTTP 1.0

## [5.0.16] - 2018-06-03
### Added
- new endpoint `allLocales` - return a single localization script bundled from all models public/locale/lang-${Session.userLang} scripts
 excluding adminui-pub what injected before login window

## [5.0.12] - 2018-05-18
### Added
- new function `App.blobStores.markRevisionAsPermanent` allows preventing
specified revision of historical store from deletion during history rotation

### Changed
- historical BLOB stores will put create a record in ub_blobHistory on a commit.
 In prev. implementation a record in history was added after the update

### Fixed
- `mdb` BLOB stores will automatically crate a folder in case
it's not exists(for example user create an ER diagram etc.)

## [5.0.8] - 2018-05-07
### Fixed
- fileSystemBlobStore will add an entropy to the persistent file name to prevent
 possible file name duplication for historical data
- fileSystemBlobStore rotateHistory will delete only revisions older when `store.historyDepth`
- fix UB4 store compatibility - automatic detection of store implementation in case blobStore.implementedBy not defined

## [5.0.0] - 2018-02-13
### Added
- `UB.blobStores` interface for working with BLOBs content
- new entity `ub_blobHistory` for storing BLOB store revision's information instead of *.fti files
- BLOB stores "Monthly" and "Daily" sizes"
- automatically creation of BLOB store structure - no need to call `ubcli createStore` anymore. 
  In case of DFS folders should be created/mounted manually
  
## [4.0.30] - 2017-05-17
### Added

### Fixed
- `mdb` virtual data store correctly handle models with a public path only 
- `clientRequire` endpoint return correct mime type for files (using mime-db)
- optimize `clientRequire` endpoint by caching resolved path's to globalCache
- UB.UBAbort server side exception stack trace now independent of UB.js placement
