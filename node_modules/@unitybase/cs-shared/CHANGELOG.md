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

## [5.20.5] - 2021-09-24
### Changed
 - small speed-up of `CustomRepository.ubql()` by using `Object.assign` instead of `_.defaults`

## [5.20.4] - 2021-09-08
## [5.20.3] - 2021-08-31
### Added
 - `UBEntity.prototype.getDescriptionAttribute` - added parameter `raiseErrorIfNotExists` (true by default).
 If sets to `false` method do not throw and return `undefined` (the same behavior as in `UBDomain.get`)

## [5.20.2] - 2021-08-18
## [5.20.1] - 2021-05-13
## [5.20.0] - 2021-04-24
## [5.6.4] - 2021-04-22
### Fixed
 - `UBSession.crc32` will transform a string to UTF8 array before calc crc32.
   This allows to calc a CRC32 for string with non-english characters (used for example by CERT2 auth in non-simple mode)

## [5.6.3] - 2021-04-16
## [5.6.2] - 2021-04-13
## [5.6.1] - 2021-04-02
### Added
 -  new property `UBEntity.overriddenBy` - comma separated model names where entity is overridden

### Changed
 - **BREAKING** for overridden entities `UBEntity.modelName` property now contains an original model name instead of
  last override model name

## [5.6.0] - 2021-03-25
### Fixed
 - CustomRepository.fromUbql: prevents overriding of a default `method` in case Repository is created from JSON without method property
   `UB.Repository({entity: 'my_entity', fieldList: ['a', 'b']})`.  A better fix for !1048


## [5.5.20] - 2021-03-15
### Changed
 - `LocalDataStorage` - improve debugging experience by avoid using of anonymous functions
  and replacing `_.forEach` -> `for .. in`

### Fixed
 - `LocalDataStorage`: filter by `startWith`/`notStartWith` now case-insensitive (as in DB with _CI locales) 

## [5.5.19] - 2021-03-03
### Added
 - `LocalDataStore.doFiltration` accept a 3d optional argument `skipSubQueries`. If explicitly set to `true`, then `subquery`
  conditions are skipped (instead of throws) 

## [5.5.18] - 2021-02-03
### Fixed
 - fix typo in `UBDomain.prototype.get` error message in case entity does not exist

## [5.5.17] - 2021-01-19
## [5.5.16] - 2021-01-17
### Fixed
 - improved JSDoc

## [5.5.15] - 2020-12-28
## [5.5.14] - 2020-12-22
### Added
 - `LocalDataStore.convertResponseDataToJsTypes` - moved from AsyncConnection to LocalDataStorage to be
   used in SyncConnection also. AsyncConnection.convertResponseDataToJsTypes remains. 

## [5.5.13] - 2020-12-21
## [5.5.12] - 2020-12-20
### Added
 - `UBEntity.prototype.getDetailsForUI` - method returns an array of UBEntityAttribute what points to
   this entity (associatedEntity === this entity) and such relation should be visible in the UI "Details" menu 

## [5.5.11] - 2020-11-20
### Added
 - `UBEntityAttribute.privateSettings` & `UBEntity.privateSettings` properties.
    Can be defined in meta file and available in server-side domain. not available on client-side.
    Require UB server 5.18.20 and up. 

## [5.5.10] - 2020-11-15
## [5.5.9] - 2020-11-14
### Added
 - `CustomRepository.selectAsArrayOfValues()` - for Repository with ONE attribute returns a flat array of attribute values

## [5.5.8] - 2020-11-05
### Added
 - new properties `UBDomain.customerModels` & `UBDomain.vendorModels` - array of customer/vendor models names.
   Require UB server to be >= 5.18.17. For earlier versions returns empty arrays. 

### Fixed
 - DBConnectionConfig type definition: added missing `isDefault` property

## [5.5.7] - 2020-11-01
### Changed
 - ClientRepository Object result will force converting Enums attributes values to String.
   This fix a problem when enum value is number like (1 for example) and client got a numeric response.
   General recommendations is to set enum values to alphanumeric string. 

## [5.5.6] - 2020-10-15
### Changed
 - improved error message for `Repository.where` with unknown condition (wrong condition included in error text)

## [5.5.5] - 2020-09-23
### Changed
 - `formatByPattern.formatDate(d, 'dateFullLong')` year format changed to 4 digits
 to produce 'March 25, 2020' instead of 'March 25, 20' 

### Fixed
 - another dirty fix for prevent `formatByPattern` to use multiple collator instances. Prev.
 not works as expected.
 
## [5.5.4] - 2020-09-22
### Fixed
 - prevent `formatByPattern` to use multiple collator instances and prevents from
 sets default language to `unknown`. Current solution is a temporary DIRTY HACK.
 The reason of the problem is that `@unitybase/cs-shared` package is included into every compiled module
 (adminui-pub, adminui-vue, vendor packages etc.). The good solution is to be found.    

## [5.5.3] - 2020-09-20
### Fixed
 - `formatByPattern.setDefaultLang` correctly sets `en` default language.
   Before this fix in case user default language is `en` `undegined` is sets instead of `en`. 
   This allows calling `formatByPattern.formatNumber` and `formatByPattern.formatDate` on the client side without 3rd `lang` argument:
 ```
   const n = 2305.1
   // on client can be called without 3rd lang parameter - will be formatted for user default lang (for uk "2 305,10")
   formatByPattern.formatNumber(n, 'sum')
 ```

## [5.5.2] - 2020-09-01
### Removed
 - `packageJSON` property is removed from extended domain

## [5.5.1] - 2020-07-26
### Added
 - documentation for `__skipSelectBeforeUpdate` `CustomRepository.misc` flag (added in UB@5.18.9)
 
### Fixed
 - force `numeric: true` for `Intl.Collator(lang, { numeric: true })`. For `en` this is not necessary, but for `uk`
  without forcing numeric numbers compared as strings. 

## [5.5.0] - 2020-07-19
### Added
 - `@unitybase/cs-shared/formatByPattern.setDefaultLang` function - set a default language. Called by AsyncConnection 
 automatically.
 - `@unitybase/cs-shared/formatByPattern.collationCompare` function - compare two value using default language.
 This function allows correct string sorting for non-english languages. 
   
### Changed
 - `formatByPattern.formatNumber` & `formatByPattern.formatDate` without language parameter uses default language 
 defined by call to `formatByPattern.setDefaultLang` 

## [5.4.1] - 2020-07-01
### Added
 - `UBEntity.isManyManyRef` property added. `true` in case this is many-to-many relation table for storing values of attributes of "Many" type.

## [5.4.0] - 2020-06-14
### Added
 - for server-side UBEntity a mixins list include `rls` and `audit` mixin definition if they defined for entity.
   Both `rls` and `audit` are hidden from client side for security reason. Before this patch `rls` and `audit`
   were unavailable even to the server side UBDomain.
   
## [5.3.1] - 2020-05-25
### Added
 - `formatByPattern.setLang2LocaleHook` function added - allows override default UB language to ICU locale transformation rules 

### Changed
 - `formatByPattern.formatDate` now accept any type as a value. For `!value` returns '', for non-date value creates a Date using new Date(value)  
 - `formatByPattern.formatNumber` now accept any type as a value. For `!value`(except 0) and `NaN` returns '', for non-number value uses `parseFloat()` 

## [5.3.0] - 2020-05-22
### Added
 - `formatByPattern` module with `formatNumber` and `formatDate` functions using cached **Intl** instances.
   This module is moved from `@unitybase/ubs` to be used in apps what not require a UBS model.

## [5.2.7] - 2020-05-13
### Added
 - link to tutorial for an array bindings from `CustomRepository.where()`
 
## [5.2.6] - 2020-04-24
## [5.2.5] - 2020-04-10
### Fixed
 - random invalid session signature calculation what cause a 401 server response and re-logon for
 UB authentication schema of self-circling for Kerberos.
 The root of problem is variable declaration (`let/const`) inside `switch` block - such construction **MUST NOT BE USED**  

## [5.2.4] - 2020-03-20
## [5.2.3] - 2020-03-17
### Fixed
 - `Repository.fromUbql(original)` will deep clone original UBQL instead of referencing to it elements.
 This prevent unexpected mutations of new Repository when original UBQL is mutated.

## [5.2.2] - 2020-03-09
### Added
 - 4th parameter of `CustomRepository.where()` can be either string for clause name or Object with optional properties
 `{clauseName: string, clearable: boolean}`. If `clearable === false` then `CustomRepository.clearWhereList()`
 will skip removing this where condition
 
## [5.2.1] - 2020-03-04
### Added
 - LocalDataStore will exports `whereListToFunctions` method

## [5.2.0] - 2020-02-29
### Changed
 - ESLint warnings fixed (mostly let -> const)
 
## [5.1.17] - 2020-02-03
### Changed
 - `Repository.joinCondition` will throw in case clause name already in jointAs

## [5.1.16] - 2020-01-31
## [5.1.15] - 2020-01-17
### Added
 - new private method `CustomRepository.fromUbql` - used in UB.Repository() constructor to create Repository from UBQL
 - `Repository.withTotal` can accept optional boolean parameter. If `false` total requirements will be removed from repository
 - `Repository.limit(rowsLimit)` will remove limit in case rowsLimit === 0   
  
### Changed
 - in case expression passed to `Repository.orderBy` already exists in order list it direction will be changed;
 Before this patch the same order expression was added that led to errors with duplicates in `order by`
    
## [5.1.14] - 2019-12-17
### Added
 - new method `CustomRepository.clearWhereList` - remove all where conditions from Repository.
 Should be used instead of direct access to the private CustomRepository.whereList property   

## [5.1.11] - 2019-10-09
### Added
  - remove code duplication for `Date` parsing functions (truncTimeToUtcNull & iso8601ParseAsDate are moved to LocalDataStorage) 

## [5.1.9] - 2019-09-24
### Added
 - `UBSession.signature` can return a fake signature if `authMock` parameter is true

## [5.1.7] - 2019-08-27
### Added
 - extended property UBDomain.UBModel.packageJSON added to the extended domain; Property value is parsed model `package.json`  
 
## [5.1.5] - 2019-07-28
### Added
 - documentation for 'lockType' flag of `CustomRepository.misc` method

## [5.1.3] - 2019-06-21
### Fixed
 - `UBEntity.asPlainJSON` will exclude `hasCatalogueIndex` computed property

## [5.1.1] - 2019-05-30
### Fixed
 - error in LocalDataStore filter fabric for `isNull`/`isNotNull` conditions (used inside filtering of cached entities on the client side)   
 
## [5.1.0] - 2019-05-20
### Added
  - support for UBQL v2 (value instead of values in whereList)

## [5.0.22] - 2019-05-14
### Fixed
 - CustomRepository.clone() - prevent deep cloning of connection property
 - error message for filtering by non-existed attribute in LocalDataStore will include entity name 

## [5.0.19] - 2019-03-11
### Fixed
 - addingCondition now checked in `CustomRepository.miscIf` 
 
### Added
 - `CustomRepository.clone()` method
 ```javascript
  let repo1 = UB.Repository('uba_user').attrs('ID', 'code').where('ID', '>', 15, 'byID')
  let repo2 = repo1.clone()
  repo1.orderBy('code')
  repo1.selectAsObject() // return ordered users with ID > 15

  repo2.attrs('name').where('ID', '>', 100, 'byID')
  repo2.selectAsObject() // return unordered users with their names and ID > 100
 ```
 
### Changed
 - `CustomRepository.misc` `will remove option in case it value is `false` instead of setting it to `false`
 This reduce resulting UBQL size
 
 - `CustomRepository.orderBy(attrd, direction)` accept null as `direction`.
  In this case ordering by `attr` will be removed
  ```javascript
   let repo = UB.Repository('my_entity').attrs('ID').orderBy('code')
   let orderedData = await repo.selectAsObject() // ordered. await is for client-side only
   repo.orderBy('code', null) // remove order by code
   let unorderedData = await repo.selectAsObject() // NOT ordered
  ```
 
## [5.0.18] - 2019-03-04
### Added
 - new method asPlainJSON() for UBEntity & UBEntityAttribute - return a 
 JSON representation WITHOUT properties which have default values.
 Very close to data stored in meta file
 - helper `Repository.attrsIf()`
    ```javascript
    let isPessimisticLock = !!UB.connection.domain.get('uba_user').attributes.mi_modifyDate
    // with whereIf
    let repo = UB.Repository('uba_user').attrs('ID').attrsIf(isPessimisticLock, 'mi_modifyDate')
    //without whereIf
    let repo = UB.Repository('uba_user').attrs('ID')
    if (isPessimisticLock) repo = repo.attrs('mi_modifyDate')  
    ```
 - helper `Repository.whereIf()`
    ```javascript
    let filterString = 'foundAllLikeThis' // or may be empty string
    // with whereIf
    let repo = UB.Repository('my_entity').attrs('ID')
      .whereIf(filterString, 'myAttr', 'like', filterString)
    
    //without whereIf
    let repo = UB.Repository('my_entity').attrs('ID')
    if (filterString) repo = repo.where('myAttr', 'like', filterString)
    ```
 - helper `Repository.miscIf()`  
 
### Changed
 - remove obsolete UBEntity & UBEntityAttribute `asJSON` method
 
## [5.0.15] - 2018-12-12
### Added
 - support for new authentication schema 'ROOT'. Server side in-proc server only

## [5.0.14] - 2018-12-04
### Added
 - client side `UBDomain` will throw error in case attribute exists in i18n but not defined in entity. Output sample:
```
Error: Invalid i18n for entity "tst_document" - attribute "superOld" not exist in meta or it's dataType is empty
```
 - new constant UBDomain.FLOATING_SCALE_PRECISION === 6 to be used for DDL generation and UI scale precision 
 for attributes of type **Float**

## [5.0.12] - 2018-10-23
### Added
 - `UBModel.version` attribute added. Accessible inside client and server.
 Version is taken from model package.json `version` key.
 Empty in case package.json not found or version is not specified.
 **UB server must be >= 5.4.3**  
 
## [5.0.10] - 2018-09-30
### Added
 - new convert rule is added for attributes of type `Json` in `getConvertRules` function  

## [5.0.9] - 2018-09-29
### Added 
 - `UBEntity.getEntityAttributeInfo` in case of request to inner keys of Json type attribute
 will return actual Json attribute in `parentAttribute` and `attribute: ubndefined`
 
### Changed
 - `UBEntity.getEntityAttributeInfo` speed up from x10 to x100 (avoid calling String.split if not necessary)
 - `UBEntity.getEntityAttributeInfo` will return additional parameter `parentAttribute`

### Fixed 
 - `UBEntity.getEntityAttributeInfo` will return correct entity (listed after @) for
 cases `domain.get('org_unit').getEntityAttributeInfo('parentID.code@org_department')`.
 Previous implementation return `org_unit` for such query. 

