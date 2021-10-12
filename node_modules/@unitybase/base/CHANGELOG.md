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

## [5.20.12] - 2021-09-24
### Added
 - ServerRepository: in `-dev` mode `selectSingle()` and `selectScalar()` methods will
 add a stack trace to error when more than one row is selected

### Fixed
 - jsdoc for DBConnection fixed - now it appears in generated HTML documentation. Added example for `DBConnection.savepointWrap` 

## [5.20.11] - 2021-09-08
## [5.20.10] - 2021-08-31
## [5.20.9] - 2021-08-18
### Changed
- Add `SyncConnection.addNew` and `SyncConnection.addNewAsObject`

### Fixed
 - **BREAKING** `SyncConnection.insert` return numeric value (instead of array) ONLY in case fieldList is === `['ID']` (as documented). 
   Before this fix numeric value is returned for any fieldList with ONE element.  

## [5.20.8] - 2021-07-08
## [5.20.7] - 2021-05-24
## [5.20.6] - 2021-05-13
## [5.20.5] - 2021-04-24
### Changed
 - ub server 5.20 compatibility - avoid global UB usage

## [5.20.4] - 2021-04-22
## [5.20.3] - 2021-04-16
## [5.20.2] - 2021-04-13
## [5.20.1] - 2021-04-02
## [5.20.0] - 2021-03-25
## [5.19.5] - 2021-03-23
## [5.19.4] - 2021-03-15
## [5.19.3] - 2021-03-03
## [5.19.2] - 2021-02-08
## [5.19.1] - 2021-02-03
## [5.19.0] - 2021-02-02
### Fixed
 - prevent unnecessary call to IncomingMessage.read() for responses with JSON content type (reduce memory usage)

## [5.4.17] - 2021-01-26
## [5.4.16] - 2021-01-19
## [5.4.15] - 2021-01-17
## [5.4.14] - 2020-12-28
### Added
 - `ServerRepository.selectSingle` & `ServerRepository.selectScalar` will output an error to console
   in case result row count > 1

## [5.4.13] - 2020-12-22
### Added
  - `SyncConnection.prototype.insertAsObject` & `SyncConnection.prototype.updateAsObject` - send an
    insert/update UBQL and return result (attributes listed in fieldList) with parsed Dates/Booleans etc. based
    on entity attributes data types as Object. The same as in `AsyncConnection` for browsers:
```javascript
const newRole = conn.updateAsObject({
  entity: 'uba_role',
  fieldList: ['ID', 'name', 'allowedAppMethods', 'mi_modifyDate'],
  execParams: {
      ID: 123,
      name: 'testRole61'
  }
}, {mi_modifyDate: 'modifiedAt'})
 console.log(newRole) // {ID: 332462911062017, name: 'testRole1', allowedAppMethods: 'runList', mi_modifyDate: 2020-12-21T15:45:01.000Z}
 console.log(newRole.modifiedAt instanceof Date) //true
```

## [5.4.12] - 2020-12-21
### Fixed
 - improved JSDoc (use @example tag for methods examples - it correctly rendered by both WebStorm and ub-jsdoc)

## [5.4.11] - 2020-12-20
## [5.4.10] - 2020-12-14
### Fixed
 - `options.switchValue` correctly returns option value started with `/` (for example: ubcli execSql -f /home/mpv/s.sql).
  Before this fix value starts with '/' recognized as switch index.

## [5.4.9] - 2020-11-25
## [5.4.8] - 2020-11-20
## [5.4.7] - 2020-11-19
## [5.4.6] - 2020-11-15
### Added
 - `DBConnection.selectParsedAsObject` for Postgres warning added: 
  Postgres return all field name in lower case if `AS "normalName"` is not specified, so better to write a query as such
  `select ID as "ID", modelName AS "modelName" from ..` instead of `select ID, modelName from ..`

### Changed
 - `ServerRepository.selectScalar()` optimized to use less JS memory

## [5.4.5] - 2020-11-14
### Added
 - `ServerRepository.selectAsArrayOfValues()` - for Repository with ONE attribute returns a flat array of attribute values
   ```javascript
    const usersIDs = UB.Repository('uba_user').attrs('ID').limit(100).selectAsArrayOfValues()
    // usersIDs is array of IDs [1, 2, 3, 4]
   ```
   
## [5.4.4] - 2020-11-12
## [5.4.3] - 2020-11-10
### Added
 - `argv.establishConnectionFromCmdLineAttributes`: default value for -host parameter is changed to `auto`.
 if `-host auto` or UB_HOST=auto env variable is defined then host will be taken from application config
  
## [5.4.2] - 2020-11-08
### Added
 - `DBCOnnection.selectParsedAsObject` for Oracle warning added: 
  Oracle return all field name in UPPER case if `AS "normalName"` is not specified, so better to write a query as such
  `select ID, modelName AS "modelName" from ..` instead of `select ID, modelName from ..`

## [5.4.1] - 2020-11-08
### Changed
 - `options.parseVerbose` ( a command line parameters parser) will throw in case of invalid / missed parameters.
   This returns a 1 exit code to caller and, for example, can prevent batch script from further execution. 

## [5.4.0] - 2020-11-05
### Added
 - `createDBConnectionPool` adds connection with name `DEFAULT` for easy access to default DB connection
 - in case `DBConnection.genID` called with `undefined` it return ID for connection. If with entity code - for specified entity.
 - `argv.establishConnectionFromCmdLineAttributes` will always uses 'ROOT' auth schema if user is 'root'. Before this fix 
   'ROOT' schema is used if user is root AND server is started by this session.
    

### Changed
 - `createDBConnectionPool` will re-use previously created pool

### Fixed
 - added missing {ubRequest} type definition

## [5.3.6] - 2020-11-01
## [5.3.5] - 2020-10-15
## [5.3.4] - 2020-09-23
## [5.3.3] - 2020-09-22
## [5.3.2] - 2020-09-20
## [5.3.1] - 2020-09-01
## [5.3.0] - 2020-08-31
### Added
 - config parser enhancements - see server 5.18.12 changelog for details
  - `//#ifdef(%VAR_NAME%)..//#endif` & `//#ifndef(%VAR_NAME%)..//#endif`
  - `//#ifdef(%VAR_NAME%=someValue)`
  - `%VARNAME||default%`
  - support for `vendorModels` and `customerModels`
  - [trailing commas](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Trailing_commas) now supported
    in config and meta files
  - partial configs for models
 - `argv.setServerConfiguration` method - allows to set a config for native part
   
### Changed
 - ubConfig parser implementation is moved into UB.js (compiled as resource into ub server)

## [5.2.16] - 2020-08-19
## [5.2.15] - 2020-08-19
### Added
 - support for `#ifdef..#endif` & `#ifndef..#endif` in ubConfig

## [5.2.14] - 2020-07-26
## [5.2.13] - 2020-07-19
## [5.2.12] - 2020-07-01
## [5.2.11] - 2020-06-30
### Changed
 - `-p` parameter for `argv.establishConnectionFromCmdLineAttributes` marked as non-required to allow
 connecting under root without a password. For non-root users -p must be passed as before.  

### Fixed
 - `csv` parser parse negative numbers to float (before this patch it returns negative numbers as strings)

## [5.2.10] - 2020-06-14
### Fixed
 - `SyncConnection`: prevent sending of second `/auth` request for UBIP authentication schema

## [5.2.9] - 2020-05-25
## [5.2.8] - 2020-05-22
## [5.2.7] - 2020-05-13
## [5.2.6] - 2020-04-24
## [5.2.5] - 2020-04-10
### Added
 - `DBConnection.selectParsedAsObject(sql, params)` method - the same as `runParsed` but
 returns Array<Object> instead of String

### Changed
 - DBConnection unit moved into @unitybase/base from @unitybase/ub; This allows to use it in shell scripts
 (App.dbConnections available as before)

## [5.2.4] - 2020-03-20
### Fixed
 - `SyncConnection.getDomainInfo` will reset a cached domain in case isExtended parameter is changed.
   This fix a case like:
  ```
  const dSimple = conn.getDomainInfo(); // get not extended domain
  const dExtended = conn.getDomainInfo(true); // request for extended domain, but before this fix got non-extended cached instance
  ``` 

## [5.2.3] - 2020-03-17
### Added
 - ubConfig parser what replace environment variables placeholders now replace variables with empty values (`var=`) by empty strings
 - in case environment variable is undefined ubConfig parser will output error message with variable name 

### Fixed
  - for UBBaseCombobox will enable only accessible actions after setReadOnly(true)/setReadOnly(false) calls.
  Before this patch all actions become enabled

## [5.2.3] - 2020-03-17
## [5.2.2] - 2020-03-09
## [5.2.1] - 2020-03-04
### Changed
 - FileBasedStoreLoader - fix ESLint errors (mostly let -> const)

## [5.2.0] - 2020-02-29
### Added
 - new attribute `model.realPath` is added to each model collection item returned by `argv.getServerConfiguration()`.
 Contains a full file system path to the model folder

### Changed
 - fix ESLint warnings (mostly about let -> const)
 - `ServerRepository.selectAsObject()` and `ServerRepository.selectAsArray()` will internally use new UB feature
 `TubDataStore.getAsJsObject/TubDataStore.getAsJsArray` to convert store content into JS representation instead of
 `JSON.parse(store.asJSON*)` which require serializing store into string -> pass string from native code into JS runtime -> parse it using JSON.parse.
 
 This give a 20% performance boots for `store to JS object` operation.       

## [5.1.44] - 2020-02-10
## [5.1.43] - 2020-02-08
## [5.1.42] - 2020-02-03
## [5.1.41] - 2020-01-31
## [5.1.40] - 2020-01-17
### Added
  - `SyncConnection.prototype.Reposiroty` fabric function can now accept a UBQL passed in parameter as object while
  keeping an ability to pass entity code as string
   
    
## [5.1.34] - 2019-11-19
### Added
 - argv.getServerConfiguration() will resolve a httpServer.inetPub location to absolute path

## [5.1.33] - 2019-11-07
### Fixed
 - prevent an error in `dataLoader.localizeEntity` when running initialization scripts on entities with `softLock` mixin

## [5.1.29] - 2019-10-01
### Fixed
 - csv parser: in case parse called with one argument, force default comma to be `;`;
 This fix a case if previous call to parse(text, ',') overrides default separator globally
 
## [5.1.28] - 2019-09-28
### Added
  -  `@unitybase/base.ubVersionNum` property - a Numeric representation of process.version.
  For example if process.version === 'v5.14.1' then ubVersionNum === 5014001; Useful for feature check
  
## [5.1.23] - 2019-08-13
### Changed
 - `csv` module: reformatting & fix ESLint warnings  
 
## [5.1.18] - 2019-07-10
### Changed
 - added support of UBQLv2 for `DataLoader.localizeEntity`
  
## [5.1.16] - 2019-06-25
### Fixed
 - `ServerRepository.using('methodOtherWhenSelect')` now work as expected. Before this patch using is ignored and `select` is called
 
## [5.1.11] - 2019-05-22
### Fixed
 - ServerRepository will check UBQLv2 compatibility core both remote and local connection.
 This fix issue `where item with condition "equal" must contains "values" part"` in case ub server version is <5.10 but
 package `@unitybase/ub` is >=5.2.11  

## [5.1.9] - 2019-05-14
### Fixed
 - ServerRepository.clone() - prevent deep cloning of connection property

## [5.1.8] - 2019-04-10
### Changed
 - in case response body is empty `SyncConnection.xhr` will return null even if `Content-Type` header is iset to `*json`

## [5.1.7] - 2019-04-02
### Added
 - optional parameter **fieldAliases** for `ServerRepository.selectById` method 

## [5.1.5] - 2019-03-06
### Fixed
 - @unitybase/base.options will accept `--help` for show help (also `-help` and `-?` is supported)
 - better formatting for `ubcli command --help`

## [5.1.1] - 2018-12-29
### Added
 - `GC_KEYS` dictionary to store all known by UB global cache keys (ot prefixes) in the single place

## [5.1.0] - 2018-12-12
### Added
 - handling of new authentication schema 'ROOT' in `argv.establishConnectionFromCmdLineAttributes`.
 Can be used in case client and server is the same process (client explicitly call `startServer()`)

## [5.0.32] - 2018-12-09
### Changed
 - `SyncConnection.setDocument` can accept optional `dataEncoding` parameter.
 Set it to `base64` if content is a base64 encoded binary.

### Added
 - default value (X-Conn-ID) for new `reverseProxy.remoteConnIDHeader` is added
 to `argv.getServerConfiguration`

## [5.0.28] - 2018-12-05
### Changed
  - `UBA_COMMON.isSuperUser` method now return `true` only is user is exactly `admin` or `root`.
    Prev. implementation return `true` for any user what member of `admin` role. Method is useful 
    for example to prevent Session.on(`login`) event handlers for DDL generations
```
const UBA_COMMON = require('@unitybase/base').uba_common
Session.on('login', () => {
  if (UBA_COMMON.isSuperUser()) return
  // get data from other tables what may not exists while DDL is not ready
})
```

### Added
 - `UBA_COMMON.haveAdminRole` method is added - check logged in user is a member of `admin` role
   
  
## [5.0.27] - 2018-10-20
### Added
  - add `name` property to Worker for better debugging experience
  
## [5.0.27] - 2018-10-20
### Changed
- `argv.getServerConfiguration` will transform `blobStore.path` & `blobStore.tempPath` to absolute path
 If path is relative it will be transformed to absolute starting from `process.configPath`.
 So now paths inside `App.serverConfig.application.blobStores` is absolutes.
- `argv.getServerConfiguration` will add default for `httpServer.externalURL`
- if `reverseProxy.kind` === `nginx` then default values for reverse proxy config are:
  - `reverseProxy.remoteIPHeader`: 'X-Real-IP'
  - `reverseProxy.sendFileHeader`: 'X-Accel-Redirect'
  - `reverseProxy.sendFileLocationRoot`: HTTPServer.externalURL.hostname with dots replaced to '-' (http://myhost.com - > myhost-com)

  Please, **upgrade ub server to at last 5.4.2** to default values work properly.


## [5.0.26] - 2018-10-20
### Changed
- ServerRepository.selectSingle now accepts an optional fieldAliases parameter, which works just like in selectAsObject

## [5.0.17] - 2018-07-25
### Fixed
- ServerRepository.selectAsObject now accept two optional parameters
  `selectAsObject(fieldAliases, resultInPlainText)` to be compatible with ClientRepository.

  **WARNING** using fieldAliases on server side cause a little performance degradation

## [5.0.10] - 2018-05-13
### Changed
- argv.getServerConfiguration during parsing ubConfig application.domain.models
 config will take model parameters from model package.json config.ubmodel
 object in case model `name` is omitted in config. This allow simplify a config as such:

 ```
 "models": [
    {
      "path": "./node_modules/@unitybase/ub"
    }, {
      "path": "./node_modules/@unitybase/uba"
    }, ...
  ```

## [5.0.6] - 2018-05-04
### Changed
- change default value of `-host` command line parameter from http://localhost:888 to http://localhost:8881

## [5.0.0] - 2018-01-15
### Added
- UBEntity.isUnity property added
- SyncConnection.getDocument method

## [4.2.27] - 2018-01-08
### Changed
- allow blank for mi_dateTo record history mixin attribute on browser side
 (but for DDL generator mi_dateTo must be not null, so for non-browser keep it as is)

## [4.2.26] - 2018-01-08
### Fixed
- entity localization files `*.meta.lang` now can contains `attributes` section 
defined as array 
```
"attributes": [{"name": "arrtCode", ...}, ...]
```
(object also supported)

## [4.2.24] - 2018-01-03
### Added
- `dataLoader` module, method lookup now supports optional parameter `doNotUseCache`, which allows
  loading hierarchical data, with references to itself, when each next row may point to previous rows in CSV or array.
  NOTE: use transLen = 1 for such scenarios, otherwise it won't work, because lookup would happen before parent rows inserted

## [4.2.23] - 2017-10-26
### Added
- `FileBaseStoreLoader` now use a `CRC32(fileDate.toString())` to calculate a cache version (UB only).
Prev. implementation based on max file modification date fails in 
case we updated something backwards.

## [4.2.21] - 2017-10-05
### Added
- `argv.establishConnectionFromCmdLineAttributes` can accept a `-timeout` command line which
 set a connection receive timeout. Default timeout increased to 120 sec to
 allow a long-live script execution.

## [4.2.20] - 2017-09-22
### Added
- UBDoman iterator callbacks described as @callback for better code insight

## [4.2.17] - 2017-09-13
### Fixed
- prevent ORA-00932 error - in case `Repository.where(attr, 'in', undefined)` -> replace it by (0=1) SQL statement

## [4.1.0] - 2018-09-27
### Added
- `argv.getConfigFileName` take a config from UB_CFG environment variable if `-cfg` cmd line switch omitted
- `FileBaseStoreLoader.load()` now return data version in TubDataCache. 
  To be used in file-based entities selects instead of version calculation individually in each entity
- `SyncConnection.setDocument` method for convenient uploading content to temp store, for example in model initialization or
  data update/migration scripts

### Fixed
- LocalDataStore sometimes not filter by ID (known bug in TubList)
