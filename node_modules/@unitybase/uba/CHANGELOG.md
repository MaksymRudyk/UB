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

## [5.20.26] - 2021-09-24
### Added
 - for UB@5.20.8 `changePassword` endpoint skip logging of HTTP request body (contains user password), `[DEDACTED]` logged instead 

## [5.20.25] - 2021-09-16
### Changed
- English (en) localization for desktop/shortcut captions: the words are
  capitalized according to English rules for captions

## [5.20.24] - 2021-09-08
## [5.20.23] - 2021-09-02
## [5.20.22] - 2021-08-31
### Changed
 - Dutch localization correction

### Fixed
 - `uba_auditTrail` form: in case modified attribute of type `Entity` is not accessible or does not have a `descriptionAttribute`
  show ID value instead of raise an error  

## [5.20.21] - 2021-08-18
## [5.20.20] - 2021-08-09
## [5.20.19] - 2021-08-04
### Added
 - Dutch (nl) localization

### Fixed
 - Ukrainian locale - removed test data for Administrator desktop caption

## [5.20.18] - 2021-07-18
### Added
 - Dutch (nl) localization

## [5.20.17] - 2021-07-08
## [5.20.16] - 2021-06-14
### Added
 - `uba_usercertificate` - added attributes `certParsed: Json` and `isForSigning: boolean`.
   Both are sets on certificate binary changes.
   Consider to use `uba_user.addCertificate` added by `@ub-d/crypto-api` method to add a binary certificate
   
 - `isForSigning` attribute added to the field list of Users->Certificates shortcut;

 - `uba_usercertificate.getCertificate` method. Can return:
    - any certificate if called as `rest/uba_usercertificate/getCertificate?ID=1231`
    - SIGNING certificate for current user if called w/o ID parameter `rest/uba_usercertificate/getCertificate`
    - if called as UBQL, certificate returned as base64 encoded string

### Changed
 - `uba_usercertificate` form is rewritten to Vue

### Removed
 - `@unitybase/uba` does not depend on `asn1js` and `pkijs` packages anymore, certificate parser is moved to server side `@ub-d/crypto-api` model  

## [5.20.15] - 2021-05-24
## [5.20.14] - 2021-05-13
### Fixed
 - fixed migrate with default lang az

## [5.20.13] - 2021-05-07
## [5.20.12] - 2021-05-05
## [5.20.11] - 2021-04-24
## [5.20.10] - 2021-04-23
## [5.20.9] - 2021-04-22
## [5.20.8] - 2021-04-19
## [5.20.7] - 2021-04-19
## [5.20.6] - 2021-04-16
## [5.20.5] - 2021-04-13
## [5.20.4] - 2021-04-02
## [5.20.3] - 2021-04-01
## [5.20.2] - 2021-03-30
## [5.20.1] - 2021-03-29
## [5.20.0] - 2021-03-25
## [5.19.7] - 2021-03-23
## [5.19.6] - 2021-03-17
### Added
 - *SECURITY* user will be logged out immediately if:
    - roles or groups for user is changed
    - certificate is removed or updated
    - uba_user.disabled is sets to true 

## [5.19.5] - 2021-03-15
### Added
 - implicitly disable multitenancy mixin for `uba_role`, `uba_rls` and `uba_els`

### Changed
 - UBA forms, reports and er-diagrams are converted to `ubrow` format

### Fixed
 - display `actionTime` for `uba_auditTrail` (both grid and form) and `uba_audit` (grid only, form TBD) with seconds resolution 

## [5.19.4] - 2021-03-03
### Added
 - advanced security check failures will be logged into uba_audit (throws `UB.ESecurityException` instead of `Error`) 

### Changed
 - client side locales reformatted into JSON

## [5.19.3] - 2021-02-10
## [5.19.2] - 2021-02-08
## [5.19.1] - 2021-02-03
### Changed
 - for UB@5.19.1 `loginFailed` event logs into `uba_audit.actionUser` name of user who tries to log-in.
  Before this changes `anonymous` is written there. For UB@5.19.0 `anonymous` is written as before this patch.

## [5.19.0] - 2021-02-02
### Changed
 - use new property `req.parsedParameters` instead of `queryString.parse(req.parameters)`

## [5.4.58] - 2021-01-30
## [5.4.57] - 2021-01-26
### Fixed
  - copying of master record and all collection items - collection item attributes are assigned with ID of the copy of the master record in case
    they point to the master entity record (not just entity)
  - correct `ru` and `tg` localization of the caption for `Models versions` shortcut
  - Audit Trail form: fixed `Cannot read property 'dataType' of undefined` for audit records what contains a 
    multi-language column diffs [UBDF-12673]
  - Audit Trail form: exclude `mi_wfState` from attributes hidden in diff (ID && mi_* except mi_wfState are hidden) [UBDF-12673]

## [5.4.56] - 2021-01-19
## [5.4.55] - 2021-01-17
## [5.4.54] - 2020-12-30
## [5.4.53] - 2020-12-28
## [5.4.52] - 2020-12-22
## [5.4.51] - 2020-12-21
## [5.4.50] - 2020-12-20
## [5.4.49] - 2020-12-14
## [5.4.48] - 2020-12-09
## [5.4.47] - 2020-12-02
### Fixed
 - Password change dialog - prevent displaying of error message twice when server declines a password [ERC-1145]
 - User certificates form - can be opened without parentContext (from user certificates list for example) [UBDF-12773]

## [5.4.46] - 2020-11-25
## [5.4.45] - 2020-11-20
## [5.4.44] - 2020-11-19
## [5.4.43] - 2020-11-15
## [5.4.42] - 2020-11-14
## [5.4.41] - 2020-11-12
## [5.4.40] - 2020-11-10
## [5.4.39] - 2020-11-08
## [5.4.38] - 2020-11-08
## [5.4.37] - 2020-11-05
### Added
 - Nav Shortcuts: `Migrations` folder with `Models versions` and `Applied files` shortcuts

## [5.4.36] - 2020-11-01
## [5.4.35] - 2020-10-20
## [5.4.34] - 2020-10-15
### Added
 - `uba_advSecurity`: ukrainian localization
 - `uba_group`: azerbaijani localization
 - `Audit Trail` shortcut: added columns `Parent entity name`, `Request ID` and `Parent instance ID`
 - an optional parameter `userId` added to `uba_opt.verifyTotp` function.
   This allows verifying TOTP for user other when currently logged in.   
 
### Changed
 - uba* navshotrcut initialization uses ub-migrate instead of handmade script
 - `Audit Trail form` rewrite from Ext to Vue

### Fixed
- `uba_group-fm.def`: title and description localization

## [5.4.33] - 2020-09-23
### Fixed
  - 'Record modified by another user' localization string typo fixed for ru and ky langs

## [5.4.32] - 2020-09-22
## [5.4.31] - 2020-09-20
## [5.4.30] - 2020-09-08
## [5.4.29] - 2020-09-01
## [5.4.28] - 2020-08-31
## [5.4.27] - 2020-08-19
## [5.4.26] - 2020-08-19
## [5.4.25] - 2020-08-03
## [5.4.24] - 2020-07-28
### Fixed
  - TOTP (Google Authenticator) One Time Password verification fixed to allow up to (inclusive) 90 second shift between the server and a caller.
  Because of arithmetic mistake previous implementation validate correctly only up to (but not inclusive) +-30 second shift.   
  
## [5.4.23] - 2020-07-26
## [5.4.22] - 2020-07-19
## [5.4.21] - 2020-07-16
## [5.4.20] - 2020-07-15
## [5.4.19] - 2020-07-08
## [5.4.18] - 2020-07-01
## [5.4.17] - 2020-06-30
## [5.4.16] - 2020-06-21
## [5.4.15] - 2020-06-15
## [5.4.14] - 2020-06-15
## [5.4.13] - 2020-06-14
## [5.4.12] - 2020-05-25
## [5.4.11] - 2020-05-22
## [5.4.10] - 2020-05-17
### Changed
 - replace most font-awesome and element-ui to UB icons analog
 
## [5.4.9] - 2020-05-13
## [5.4.8] - 2020-05-06
### Added
 - **BREAKING** this version of @unitybase/uba require UB server to be at last 5.18.1 ("attribute restriction" feature used)
 - **SECURITY** access to `uba_user.uPasswordHashHexa` is disallowed from client (restricted for all)
 - **SECURITY** access to `uba_user` `disabled`, `isPending` and `trustedIP` attributes are allowed only for members of 
 `Supervisor` role; For other roles actual values is replaced by `*****` for trustedIP and `null` for `disabled`, `isPending`
 - SMS registration handler added to `uba_user.publicRegistration` rest method. Registration kind can be defined
  in `serverConfig.application.customSettings.publicRegistration.kind` application config key.
  See `uba_user.publicRegistration` documentation for details.

### Changed
 - **BREAKING** `uba_otp.generateOtp` will generate a 6 digits random string instead of GUID

### Fixed
 - characters `,.[]{}?` added to password policy complexity check.
 Checking is carried out in case ubs_settings `UBA.passwordPolicy.checkCmplexity` value is set to `true`.  
 - i18n added for `uba_auditTrail.actionUserName` attribute

## [5.4.7] - 2020-04-24
## [5.4.6] - 2020-04-10
## [5.4.5] - 2020-03-30
## [5.4.4] - 2020-03-20
## [5.4.3] - 2020-03-17
## [5.4.2] - 2020-03-09
## [5.4.1] - 2020-03-04
## [5.4.0] - 2020-02-29
### Changed
 - replace all occurrences of `store.asJSONObject` -> `store.getAsTextInObjectNotation()` according to latest changes in DataStore
 - entities localization files (*.meta.??) are moved to `meta_locale` folder 

## [5.3.32] - 2020-02-23
### Added
 - `uba_user-changeUserPassword`: opportunity to influence password policy validators from the admin panel
 - `uba_user-changeUserPassword`: new validator for matching new password with login

### Changed
 - `changePassword` endpoint will accept old password in plain text (instead of hashed) to allow server to apply a
 custom hashing algorithm from `Session._buildPasswordHash`
 - in case `UBA.passwordPolicy.allowMatchWithLogin` set to `true` (default) `changePassword` endpoint will check
 password do not **include** user login. Before this changes **equality** is verified  

### Removed
 - ability to change password for other user using `changePassword` endpoint for members of `admin` group is removed.
 `uba_user.changeOtherUserPassword` method should be used instead. By default access to this method is granted
 to members or `Supervisor` role   

### Fixed
 - change password form will load correct setting key (UBA.passwordPolicy.minLength) fro minimum pwd length 
 and use `UBS.Settings.loadKey` instead of UB.Repository 

## [5.3.31] - 2020-02-18
## [5.3.30] - 2020-02-13
## [5.3.29] - 2020-02-10
## [5.3.28] - 2020-02-08
## [5.3.27] - 2020-02-03
### Changed
 - `uba_user.trustedIP` attribute size increased to 2000

### Fixed
 - ALS form: allow to change newly added record by enabling Save & SaveDiffInFile

## [5.3.26] - 2020-01-31
## [5.3.25] - 2020-01-17
### Changed
 - rewrote `010_create_navshortcuts.js` config for rendering uba forms on vue

### Fixed
 - `uba_user-changeUserPassword`: added a separate method for changing own and someone else's password

## [5.3.24] - 2020-01-11
## [5.3.23] - 2020-01-02
## [5.3.22] - 2019-12-27
### Added
 - icon for administrator desktop
 - description for administrator desktop (+localization)

## [5.3.21] - 2019-12-20
## [5.3.20] - 2019-12-18
## [5.3.19] - 2019-12-17
### Added
 - new attribute `uba_auditTrail.actionUserName`
  
### Changed
  - `uba_auditTrail.actionUser` attribute data type is changed form `Entity->uba_user` to `ID`.
  This prevents DDL generator from creating a check constraint to uba_user table and  allow to
  move uba_auditTrail to other Database by overriding a `uba_auditTrail.connectionName` (applicable for huge audits) 
  
## [5.3.16] - 2019-12-02
### Fixed
 - ALS edit form: fix broken layout for table with pinned header/column by replacing render component from `ElTable` to `UTable`

## [5.3.13] - 2019-11-07
### Fixed
 - prevent bug when inserting a new role at the multilingual instance
 - increased the size of `uba_subject.name` attribute to 256 characters, for compatibility with a `uba_role.description`

## [5.3.9] - 2019-10-12
### Fixed
 - prevent hangs of ALS form for huge ALS rules sets 

## [5.3.3] - 2019-09-19
### Added
 - Azery localization for uba_usergroup.meta
  
## [5.3.0] - 2019-08-31
### Added
 - TOTP (Google Authenticator) One Time Password generation and verification methods added into uba_otp
 
### Changed
 - HTTP request headers logged into `uba_audit` during user logon now truncated to 512 characters   

## [5.2.6] - 2019-08-19
### Added
 - Auditing rights provided to Supervisor role

## [5.2.5] - 2019-08-12
### Fixed
  - removes the hardcoded check for "accountAdmins" group inside changePassword endpoint.
  To change password for other used new method `uba_user.changeOtherUserPassword` is added. 
  Supervisor role is allowed to call it.
  
### Changed
 - `uba_usercertificates.serial` attribute is marked as unique    

## [5.2.4] - 2019-08-09
### Fixed
 - added ELS rule for Supervisor to allow reading roles (uba_role;select;A)

## [5.2.2] - 2019-07-29
### Changed
 - save certificates grid state in the User form (uba_user) 

## [5.2.0] - 2019-07-10
### Changed
 - all meta files and they localization transformed to array-of-attributes format
 
## [5.1.35] - 2019-07-22
### Added
 - Administration subjects names (uba_subject.name) support localization (multilang)
 - Roles descriptions (uba_role.description) and Groups names (uba_group.name) supports localization (multilang)
 - build-in roles localization for uk & ru
 - icons added for shortcuts from Security group 

### Fixed
 - localization of tabs for uba_user form [#51]
 - "name" property for attributes moved to the first line of attribute object for all `uba_*.meta`   

## [5.1.20] - 2019-03-24
### Added
 - `uba_auditTrail.request_id` attribute - a unique request identifier.
  Can be used eg for revert all changes made by a single `ubql` call. Require ub sevrer@5.7.18.

## [5.1.17] - 2019-02-26
### Added
 - navshortcuts access initialization for Supervisor role
 
## [5.1.15] - 2019-02-14
### Added
 - new API method `uba_user.setUDataKey(key, value)` - set key value inside `uba_user.uData` and store new JSON do DB
 
## [5.1.14] - 2019-02-12
### Added
 - **Attribute Level Security editor** (can be executed from ALS grid).
 This editor is a direct replacement of desktop ALS application.
 `adminui-vue` model must be added to application domain for this feature.

## [5.1.12] - 2019-01-27
### Fixed
 - allow Supervisor role to manage uba_grouprole
 - allow Supervisor role read uba_userrole, uba_usergroup and uba_grouprole [unitybase/ubjs#33]
 
### Changed
 - add warning to ELS form about insecure usage of method mask in ELS rules [unitybase/ubjs#38]

## [5.1.7] - 2018-12-11
### Fixed
- Write to security audit when group gets or lost a role
- Write to security audit when user is added/removed to/from group
- Added localization to `uba_group` entity for en/uk/ru

### Changed
 - UBA model `Session.on('login')` handler now check advanced security only. All required uData properties 
 are filled in UB model `Session._getRBACInfo` method (called by server during authorization stage) 

## [5.1.3] - 2018-11-27
### Fixed
 - uba_user.name attribute Georgian translation changed

## [5.1.1] - 2018-11-15
### Fixed 
 - fix update/insert of uba_usercertificate (setBlob method)

## [5.1.0] - 2018-10-06
### Fixed 
 - fix logging of security violation in case user without admin role try
 to change password for another user

### Changed
 - Pseudo roles Everyone, Anonymous (if user is not logged in) or User (if logged in)
  are added to `Session.uData.roles` & `Session.uData.roleIDs`. In prev. implementation `uData` not contains this roles

## [5.0.32] - 2018-09-05
### Fixed
- `uba_auditTrail-fm` fixed bug in case show changed values by attribute of type **document**

## [5.0.19] - 2018-06-28
### Changed
- `uba_user.publicRegistration` rest endpoint will use a App.externalURL  for a callbacks (in case server is behind a reverse proxy)

## [5.0.6] - 2018-04-23
### Changed
- put user name into uba_audit.actionuser for login/loginFail operations

## [4.1.32] - 2017-10-12
### Changed
- `uba_als.code` length increased to 128 to allow developer to create a unique ELS rule codes based on code = role.name + entity.name + method.name pattern

## [4.1.22] - 2017-08-03
### Added
- new attribute `uba_usercertificate.revocationDate` - not null in case certificate is revoked

## [4.1.21] - 2017-08-03
### Added
- new entity uba_advSecurity: advanced security (Associating a user with a keyMedia, IP address & device fingerprint) + new version 1.0.0.7 of IITCrypto feature [UB-1817] [UB-1818] [UB-1819]
- new shortcut `Advanced security`
- Session.on('logon') event now take a req: THTTPRequest input param
- grant rights to uba_advSecurity for Supervisor role
- store a request headers during uba_audit LOGIN event
- user can upload certificate in user form 

### Fixed
--set **uba_user.lastPasswordChangeDate = maxDate** in case create domain users.
