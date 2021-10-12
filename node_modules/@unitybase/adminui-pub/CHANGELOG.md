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
## [5.20.25] - 2021-09-16
## [5.20.24] - 2021-09-08
### Fixed
 - `$App.scan()` will show an error with scan settings requirement instead of "unknown error" in case scanner
 not configured 

## [5.20.23] - 2021-09-02
### Added
 - added import of:
   - `UB.view.StatusWindow`
   - `UB.ux.tree.Column`
   - `Ext.ux.exporter.excelFormatter.*`
   - `Ext.ux.exporter.Base64`
   Classes are used by third-party projects

### Removed
 - `Ext.ux.exporter.wikiFormatter.WikiFormatter` not loaded by default (available for manual loading)

## [5.20.22] - 2021-08-31
### Added
 - `UMasterDetailView`: Added `BasePanel` based form support for preview mode.
 
### Changed
 - Dutch localization correction

## [5.20.21] - 2021-08-18
### Changed
 - `UBComboBox`: use custom method (if any) from `store.ubRequest.method` to load a display text of filtered out row. Before this fix `select` always used
 
## [5.20.20] - 2021-08-09
## [5.20.19] - 2021-08-04
### Added
 - Dutch (nl) localization

### Changed
 - forcibly disabled HTML page translator (Google Translate) for adminUI

### Removed
 - i18n for "serverIsBusy" (Server currently unavailable) is moved into ub-pub package

## [5.20.18] - 2021-07-18
### Fixed
 - `EntityGridPanel:` prevent error on grid refresh, when panel already closed [UBDF-13979] 

## [5.20.17] - 2021-07-08
## [5.20.16] - 2021-06-14
### Added
 - `UBBoxSelect`: added the ability to display entries that have been deleted or closed by the `History` mixin

## [5.20.15] - 2021-05-24
## [5.20.14] - 2021-05-13
### Added
- `UBPlanFactContainer`: added support for data type` Many`

## [5.20.13] - 2021-05-07
### Changed
 - i18n for current_[week|month|year] changed "This week" -> "Current week", "За цей тиждень" -> "Поточний тиждень" etc  

### Fixed
 - fix static file access error for `models/adminui-pub/themes/undefined/ubimages/scan-to-pdf.png`;
   `UBGrayTheme` should be used as a default instead of undefined

## [5.20.12] - 2021-05-05
### Fixed
 - Sidebar: prevent show en error in case user click on empty folder or on shortcut with empty command code,
   write error into console instead [LDOC-1434].

## [5.20.11] - 2021-04-24
## [5.20.10] - 2021-04-23
## [5.20.9] - 2021-04-22
## [5.20.8] - 2021-04-19
## [5.20.7] - 2021-04-19
### Changed
 - `UB.core.UBUtil.getEntityAttributesTreeData` HTML for attribute label improved for better UX 

## [5.20.6] - 2021-04-16
## [5.20.5] - 2021-04-13
## [5.20.4] - 2021-04-02
## [5.20.3] - 2021-04-01
## [5.20.2] - 2021-03-30
## [5.20.1] - 2021-03-29
## [5.20.0] - 2021-03-25
### Changed
 - migrate build to webpack5
 - loading of TinyMCE in production build implemented using webpack5 dynamic import feature

## [5.19.10] - 2021-03-23
## [5.19.9] - 2021-03-17
### Fixed
 - `UB.core.UBUtil.getNameMd5` uses `JSON.stringify` for tail parameters before calculation of MD5 sum.
   This fix ExtJS grid configuration save/load in case columns config is an array of object 

## [5.19.8] - 2021-03-16
## [5.19.7] - 2021-03-15
## [5.19.6] - 2021-03-15
### Fixed
 - use the same field list for `ubm_form` and `ubm_enum` in adminui-pub and adminui-vue

## [5.19.5] - 2021-03-03
### Added
- Checking `uiSettings.adminUI.disableScanner` config property in `BasePanel`.
  If it's set as true, then scan button would not show in form

### Changed
 - client-side locales reformatted to use a json 

## [5.19.4] - 2021-02-25
### Changed
- `showAuditTrail` select data by **parentEntityInfo_id** or **entityinfo_id** attributes instead of **parentEntityInfo_id**.
  Auditing on child records will now appear in the base entity audit form and the parent entity audit form.

## [5.19.3] - 2021-02-10
## [5.19.2] - 2021-02-08
### Changed
 - `UBBaseComboBox` - actions `EditItem` and `AddNewItem` use parent modal state (`this.up('basepanel').isModal`) to show item form.
   If parent is inside a modal dialog - form shows as modal, else - in the new tab.

   This behavior can be disabled by adding `appConfig.uiSettings.adminUI.forceModalsForEditForms: true` to ubConfig.

## [5.19.1] - 2021-02-03
## [5.19.0] - 2021-02-02
## [5.15.1] - 2021-01-30
### Fixed
 - for dirty documents `UBApp.downloadDocument` adds a `fileName` parameter to URL, so server can add a correct `Content-Type` header
 - PDF file are previewed correctly (fixed in @unitybase/blob-stores@5.6.0)

## [5.15.0] - 2021-01-28
### Added
 - new method `UBApp.downloadDocument` - Download a document from BLOB store directly into a file without
   loading it into memory as with `getDocument`. Can be used to download a huge documents what
   do not fit in the browser memory.  

### Changed
 - `Download` action of BasePanel `Document` menu uses new method `UBApp.downloadDocument` to save a document
   to the file system without loading it into browser memory.

### Fixed
 - set default width for multi-filter combobox

## [5.14.5] - 2021-01-26
### Added
- `BasePanel` uses `AsyncConnection.prototype.emitEntityChanged` to emit `${entityCode}:changed` event.

## [5.14.4] - 2021-01-19
## [5.14.3] - 2021-01-17
## [5.14.2] - 2021-01-11
## [5.14.1] - 2020-12-30
## [5.14.0] - 2020-12-28
### Added
 - **BREAKING** EntityGridPanel lookup column max row count is limited to `UB.LIMITS.LIMITS.lookupMaxRows` (10000).
   This prevents select for huge entities what can cause an out of memory on the server side. 
   
## [5.13.65] - 2020-12-22
## [5.13.64] - 2020-12-21
### Fixed
 - fixed details calculation for UBDetailTree (should be [] since entityName is undefined)

## [5.13.63] - 2020-12-20
### Added
 - support for `attribute.customSettings.hiddenInDetails` is added while building `Details` menu
   by using `UBEntity.prototype.getDetailsForUI`

### Removed
 - 21 IE8 specific CSS rules is are removed from UBGrayTheme for old adminUI

### Fixed
 - removed `>` sign from the left side of `Details` menu and `Details` menu items

## [5.13.62] - 2020-12-17
## [5.13.61] - 2020-12-16
### Added
 - UI Tag tracking for all forms and ExtJS tables what mounts as tab:
   - `$App.doCommand` generate a UI Tag for and assign it to uiTag property of central panel tabs
   - on tab activation `beforetabchange` event handler sets a `connection.setUiTag(tab.uiTag)`
   - `uitag=${uiTag}` is added to all `ubql` requests URL, so in the server logs the source of UBQL can be tracked   

## [5.13.60] - 2020-12-14
## [5.13.59] - 2020-12-09
## [5.13.58] - 2020-12-09
### Removed
 - i18n for `info`, `error`, `detail`, `login` and languages abbr: uk, ru, etc. moved into ub-pub to allow use it on the login form

## [5.13.57] - 2020-12-02
### Added
 - UBComboBox: new property `allowFilteredOut` (true by default).
   If sets to false - do not try to load a filtered out row (probably deleted or historically not actual)
   it with strikethrough. For UB 1.12 compatibility can be sets to `false`.  

## [5.13.56] - 2020-11-25
## [5.13.55] - 2020-11-23
## [5.13.54] - 2020-11-20
## [5.13.53] - 2020-11-19
## [5.13.52] - 2020-11-15
## [5.13.51] - 2020-11-14
### Changed
 - `UBCodeMirror` - use `esversion: 8` (async functions) as default for linter

## [5.13.50] - 2020-11-12
## [5.13.49] - 2020-11-10
## [5.13.48] - 2020-11-08
## [5.13.47] - 2020-11-08
## [5.13.46] - 2020-11-05
## [5.13.45] - 2020-11-01
## [5.13.44] - 2020-10-20
### Fixed
 - Ext based grid multi-filter: checking date value is valid before filtering into `ubdetailgrid`

## [5.13.43] - 2020-10-15
### Added
 - `$App.showAuditTrail` method added - used in both adminui-vue and adminui-pub to show audit trail for instance

### Changed
 - instance audit trail list now filtered by `parentEntityInfo_id`, so shows audit for all related entities
 where `parentIdentifier` & `parentEntity` is configured
 - transformation timeout for `/ocr/transform` XHR request for `$App.scan()` increased to 10 minutes (from default 2 minutes).
   This allows recognizing big or complex documents.

### Fixed
 - `shortcut form`: error on change data of shortcut which has type "folder"

## [5.13.42] - 2020-09-23
## [5.13.41] - 2020-09-22
## [5.13.40] - 2020-09-21
## [5.13.39] - 2020-09-20
## [5.13.38] - 2020-09-09
## [5.13.37] - 2020-09-08
## [5.13.36] - 2020-09-01
## [5.13.35] - 2020-08-31
## [5.13.34] - 2020-08-20
### Fixed
 - in case `title` property is defined in nav shortcut JSON - use it, otherwise - use a `ubm_navshortcut.caption` for title.
 Before this fix `ubm_navshortcut.caption` always overrides title.     

## [5.13.33] - 2020-08-19
## [5.13.32] - 2020-08-19
### Added
 - Tajik locale translation
 
### Removed
 - `cross-env` dependency removed

### Fixed
- typo in Ukrainian translation for key `doYouWantFillOtherAttr`, removed quotes for unnecessarily quoted properties
 
## [5.13.31] - 2020-08-03
## [5.13.30] - 2020-07-29
## [5.13.29] - 2020-07-28
## [5.13.28] - 2020-07-26
### Changed
 - double-click on entity inside ER Diagram opens Vue base entity editor `ubm_form-entityEdit`.
 Previous implementation did such only in case UBDEV model (obsolete) is in the domain.   

### Removed
 - ExtJS based entity editor is removed (obsolete) in flavor of Vue based `ubm_form-entityEdit`
 
## [5.13.27] - 2020-07-19
## [5.13.26] - 2020-07-16
### Fixed
- fixed removing two rows in `ubDetailGrid` after execute `delete` action in row created by `addNewByCurrent` action

## [5.13.25] - 2020-07-15
### Fixed
 - correct layout re-rendering after window orientation changed in Safari(iOS)
 - `$App.scan` can accept 'TIFF' or 'PDF' as second parameter (in addition to 'JPEG') - this allows override
 default scn result type

## [5.13.24] - 2020-07-08
### Changed
  - optimization: removed global `selectstart` listener (ExtJS legacy for IE)
  
## [5.13.23] - 2020-07-01
## [5.13.22] - 2020-06-30
### Added
  - `UB.core.UBStoreManager.updateNavshortcutCacheForItem` method to refresh a nav-shortcut command cache for specific item

## [5.13.21] - 2020-06-24
## [5.13.20] - 2020-06-21
## [5.13.19] - 2020-06-15
## [5.13.18] - 2020-06-15
## [5.13.17] - 2020-06-14
### Changed
 - if `uiSettings.adminUI.useVueTables` is empty or `false` in ubConfig then "Select from the dictionary" action
 of ExtJS based UBComboBox will show ExtJS based dictionary
   
### Fixed
 - `UBComboBox`: prevent a `monkeyRequestsDetected` error in case 2 combobox are on the same form with the same filters

## [5.13.16] - 2020-05-31
### Fixed
  - en i18n: "Select from dictionary" -> "Select from the dictionary"
  - for `UBBaseComboBox` with applied filters (new Ext.util.Filter) applied "Select from the dictionary" action will
    filter Vue based dictionary in the same way as in the ComboBox store (the same behavior as with obsolete Ext-based dictionary)

## [5.13.15] - 2020-05-27
### Added
 - `UBCommand/getNavshortcutCommandText` param shortcutCode in returned commandConfig 

## [5.13.14] - 2020-05-25
## [5.13.13] - 2020-05-22
## [5.13.12] - 2020-05-21
### Changed
 - `UBCommand/showForm` provide shortcut caption to cmdCode. Now tab title will be equal to the caption of the shortcut

### Fixed
 - `UB.ux.UBImg`: image content is scaled to maintain its aspect ratio while fitting within the element's content box
 - `UBCommand.showList`: **detailAttribute** should be added to **fieldList** as object with **visibility:false**, 
   to prevent lookup queries for this field
 - icon class for `MenuItem.Details`. Changed from **u-icon-arrow-down** to **u-icon-arrow-right** 
 - `ubfieldset`: use icon class `fa-angle-down|right` for expand a button - `u-icon-dows` too large there

## [5.13.11] - 2020-05-17
### Changed
 - replace most font-awesome and element-ui to UB icons analog

### Fixed
- `UBMultiSelectBox`: changed **orderList** structure from Array<Object> to Object for compatibility wit `UB@5.18+`

## [5.13.10] - 2020-05-13
## [5.13.9] - 2020-05-06
## [5.13.8] - 2020-04-24
### Fixed
 - Ext grid: change "load filter configuration" icon to `far fa-folder-open` `fa fa-folder` is missing in FontAwesome5  
 - Ext `ComboBox` "Select from dictionary" action will show Vue based dictionary with "Select" button (before this patch "Select" button is missing)

## [5.13.7] - 2020-04-10
### Fixed
 - random invalid session signature calculation (in @unitybase/csShared/UBSession.js) what cause a 401 server response
 and re-logon for UB authentication schema of self-circling for Kerberos.
 The root of problem is variable declaration (`let/const`) inside `switch` block - such construction **MUST NOT BE USED**
 
## [5.13.6] - 2020-04-03
### Changed
 - Ext based forms label text weight changed from 600 to 400 (better looks with new Roboto font)
 - for all Ext controls (except for labels) text weight changed from 600 to 500 (better looks with new Roboto font)
 - Colors according blue theme. Repainted to primary blue:
   - grid selected cell
   - toolbar buttons

### Fixed
 - use `fas fa-box-open` as Drop Zone icon (fa fa-dropbox not present in font awesome 5)

## [5.13.5] - 2020-03-30
### Changed
  - rename i18n key `vseDeystviya` -> `allActions` 

### Fixed
 - `UBCommand.showForm` will accept `instanceId` parameter in case it defined (prefer over `instanceID`). This fix opening form from `magic links`

## [5.13.4] - 2020-03-20
## [5.13.3] - 2020-03-17
### Fixed
- 'UBText.MultiLangForm' should set a lock on `BasePanel` when changing to avoid errors
  (Entry with ID = XXXXXXXX for "my_entity" is not blocked) when the form is saved.

## [5.13.2] - 2020-03-09
### Added
- fake parameter **_ rc=documentRevision** into `getDocument` request for `ubDocument` component
  The reason is to prevent unexpected content caching by proxies in case content changed by the server.
  Used by "caching servers" in multi-region UB deployment 

## [5.13.1] - 2020-03-04
### Fixed
 - tinyMCE base URL should not ends with `/` (prevent URLs like //skins/*)
 - Ukrainian No i18n - replace english **i** with Ukrainian

## [5.13.0] - 2020-02-29
### Removed
- `UBOnlyOffice` editor. Moved to a separate package '@unitybase/only-office'

## [5.12.33] - 2020-02-23
### Changed
 - in case server require user to change password during re-logon default behavior changed to reload app
 and point user into login page. Note: this situation should not happen in real life scenario's 
 
### Removed
 - obsolete `UB.view.cryptoUI.ReadPK`, `UB.view.cryptoUI.SelectCert` is removed. Private key reading is implemented inside 
 pki provider interface defined in `uiSettings.adminUI.encryptionImplementation` server config section
  
### Fixed
 - fixed `iconCls` for `ubDetailTree` actions (**moveUp|moveDown**) 
 
## [5.12.32] - 2020-02-18
### Changed
 - i18n messages about certificate registration moved from `adminui-pub` into `ub-pub` to be used inside non-admin UI

## [5.12.31] - 2020-02-13
### Fixed
 - ExtJS based stores will smart merge orderList passed from Operations (EntityGridPanel for example) and
 original request order list. In case order by the attribute already in serverRequest.orderList - override it.
 This prevents multiple orderBy on the same columns what cause an DB exception at last on MS SQL

## [5.12.30] - 2020-02-10
## [5.12.29] - 2020-02-08
### Changed
 - i18n for `UserWithoutOrgEmployeeNotAllowed` is moved from adminui-pub into ub-pub

### Fixed
 - prevent self-circling on Negotiate authentication in case silence kerberos logon is `true` and second auth response
 contains invalid session number (error occurs at last with invalid Kerio Control proxy configuration)

## [5.12.28] - 2020-02-03
## [5.12.27] - 2020-01-31
### Added
 - translations for Firefox UBExtension setup 

## [5.12.26] - 2020-01-17
### Changed
 - `locale/uk -> closeOther` added missing word "tabs" simplified in other languages

### Fixed
 - `Audit` for different auditable instances should be opened in different tabs  (fixed **tabId** generation in `BasePanel.onAudit`)
 - `showForm` command will use `description` from command config (if defined) as a form caption. Compatibility fix for UB4  
 
## [5.12.25] - 2020-01-11
## [5.12.24] - 2020-01-03
## [5.12.23] - 2020-01-02
### Fixed
 - UDetailTree refresh icon (fas fa-refresh -> fas fa-sync)

## [5.12.22] - 2020-01-02
## [5.12.21] - 2019-12-30
## [5.12.20] - 2019-12-27
### Changed
- **BREAKING** `UB.core.UBUtil.glyphs` is removed. See below.
 - **BREAKING** adminUI migrates from FontAwesome4 to "Font Awesome 5 free". For migrating Ext based forms please,
 replace all `glyph` properties to `iconCls` (the simplest way is to search all `glyphs.` occurrences). Example:
 ```
   // OLD code
   glyph: UB.core.UBUtil.glyphs.faFilter,
   // should become 
   iconCls: 'fa fa-filter',
 ```   
   - all occurrences of "font-awesome" in all package.json should be removed  

## [5.12.19] - 2019-12-20
### Fixed
 - `audit` action for Ext based forms (BasePanel descendants) will be shown in Tab in case form shown in tab

## [5.12.18] - 2019-12-18
### Fixed
 - `EntityGridPanel` audit action
 - `BasePanel` audit action
 
## [5.12.17] - 2019-12-17
### Added
 - support for new attribute `uba_auditTrail.actionUserName`

## [5.12.9] - 2019-12-04
### Fixed
 - prevent "brain split" of Vue global instance onto 2 part in production version

## [5.12.8] - 2019-11-29
### Fixed
 - EntityGridPanel: in case entity descriptionAttribute type <> string use value of first column for deletion confirmation message [UBDF-8061]

## [5.12.7] - 2019-11-21
### Changed
  - index.html template will expect `favicon.ico` is placed in the root of `httpServer.inetPub` folder. 
  In case `${httpServer.inetPub}/favicon.ico` not exists `npx ubcli linkStatic` will sym-lynk it from 
  `@unitybase/ub/public/img/UBLogo16.ico`

## [5.12.6] - 2019-11-15
### Changed
 - An ability to translate report name added: a key from localization file should be provided
   in @name field of report definition in order to have localizable report form title
 - Add translation for mi_createDate term, just like there is for mi_modifyDate

### Added
 - `UBConfig` property `uiSettings.adminUI.useVueTables` which replace all ext grids showList by UTableEntity component
 - `$App.doCommand({ cmdType: 'showList' })` new parameter `renderer` which override `uiSettings.adminUI.useVueTables`
   option for a current grid. For a case when you need replace all grids to new, but want to set some grids renderer as ext  

## [5.12.5] - 2019-11-01
### Added
 - Registration component for authentication form


## [5.12.2] - 2019-10-09
### Fixed
 - `adminUI is not defined` during initial page load (missed semicolon in index.html)
 
## [5.12.1] - 2019-10-07
### Changed
 - green spinner on a startup - symbolizes only evergreen browser are supported by adminUI :)
  
## [5.12.0] - 2019-10-07
### Changed
 - winXP (Chrome 48 / FireFox 52 / IE ) support is removed, including following polyfills:
   - `bluebird-q` - was exposed as `window.Q` 
   - `es6-promise`- was adds Promises support for IE  
   - `Promise.prototype.fin` (used previously in Q promises) polyfill is removed. 
     Native `finally` should be used instead
   - `Promise.prototype.done` (used previously in Q promises) polyfill is removed.
     Native `then` or `catch` should be used instead
   Boundle size reduced by 100Kb  
 - Q promises usage is removed from UBOrgChart
 
## [5.11.1] - 2019-09-30
###Fixed
 - prevent an error with `BasePanel.maskForm` in case of saving detail record, when master record is locked.

### Added
 - new configuration parameter `adminUI.recognitionEndpoint`, used for recognize scanned documents. 
 An example of valid name is `ocr/` - this is for **Tesseract** recognition implemented by `@ub-e/ocr` package.

## [5.11.0] - 2019-09-28
### Changed
 - several patches for winXP (Chrome 48 / FireFox 52) compatibility:
   - replacing DOMElement.append -> DOMElement.appendChild
   - Promise.fin -> Promise.finally + Promise.finally polyfill for old browsers
   - Promise.done(..) -> Promise.then(..); Promise.done() -> nothing to do - just removed such calls  
   - object rest spread ( {...obj} ) -> Object.assign({}, obj)
 - **5.11.x is the LAST version what supports WinXP**. `Q`, `bluebird`, `Promise.fin`, `Promise.done`
  and `unhandledpromiserejection` polyfills will be removed in `@unitybase/adminui-pub` versions what > 5.11.x   

### Added
 - new property `BasePanel.lockOnSave` to change a default `softLock` mixin behavior:
   - if `true` then `lock()` is called JUST BEFORE save operation and `unlock()` is called just after save operation
   - if `false|undefined` `lock()` is called when user starts to edit form or creates a new record.
     While user edit a form lock renewed until form is opened and while the form is in edit mode

## [5.10.20] - 2019-09-11
### Fixed
 - in case `uiSettings.adminUI.pdfViewer` is not defined do not add a `undefined` to the end of PDF viewer URL
   
## [5.10.19] - 2019-09-09
### Fixed
 - tinymce version fixed to 4.9.5. In version 4.9.6 there is a problem `tinymce detected as amd but didn't execute correctly`
 
## [5.10.18] - 2019-09-04
### Added
 - new configuration parameter `adminUI.pdfViewer.customURI`. If defined then specified URL expected to be an html page URL
 what can be loaded inside iframe and display a PDF. Inside URL following placeholders can be used:
   - {0}: will be replaced by encodeURIComponent(blobUrl);
   - {1} - user language;
   - {2} - instanceID
   
 Examples:
   - PDFJs viewer: `/clientRequire/@docflow/doc/public/node_modules/pdfjs/web/viewer.html?file={0}#locale={1}`
   - PDF with annotations: `/clientRequire/@docflow/pdf-annotate/dist/index.html?file={0}&docID={2}#locale={1}`

## [5.10.16] - 2019-08-22
### Fixed
 - silenceKerberosLogin now handled by adminui-pub instead of AsyncConnection. This fix [UBDF-9903] && #64
 - allow calling `EntityGridPanel.doShowDetail` for instances of EntityGridPanel with stateId and title `undefined` 
 - if `formCode` passed to `$App.doCommand` is a function then tabId algorithm will use word 'func', instead of function source code

## [5.10.15] - 2019-08-19
### Changed
 - set default value [] for EntityGridPanel.hideActions; prevent override it by `undefined` in UBCommand

### Added
 - new method `$App.generateTabId()` for tabId generation
 - $App.generateTabId() will include a formCode into tabId - this allows to open several different forms for the same instance
    
## [5.10.14] - 2019-08-14
### Changed
 - for entities with `softLock` mixin BasePanel will send a single select request with `lockType: 'None'` instead of
 two request - one for select and one for `isLocked`. UB server >= 5.14.0 correctly handle `lockType: 'None'` requests.  

### Added
 - in case localStorage key UB.LDS_KEYS.PREVENT_CALL_LOGOUT_ON_UNLOAD is set to `"true"` `document.onbeforeunload` handler
 don't call `$App.logout`. This solves unexpected logout in case document opened using WebDav
   
## [5.10.11] - 2019-08-10
### Added
 - new localization key `apply`
 
## [5.10.10] - 2019-08-09
### Changed
  - introduced lazy data loading for `UBDetailTree` in case it is placed onto inactive tab (as `UBDetailGrid`).
  `UBDetailTree.forceDataLoad` must be set to ** true ** to load data immediately. 

## [5.10.9] - 2019-08-01
### Fixed
  - loading the `ubDetailGrid`, which refers to the empty "masterField" value. (For example, when opening a form to create a new record)
  
## [5.10.5] - 2019-07-26
### Fixed
  - enable Action ('del') after add first row in grid

## [5.10.4] - 2019-07-24
### Changed
 - added new methods `getRepository` and `getAttrCode` to `UB.ux.UBOrgChart`
 Can be overrated by other model in case org structure uses some other unity entity (`hr_staffUnit` for example)

### Fixed
 - prevent open second tab for forms what not a BasePanel descendant;
 Implemented by using selector `panel[tabID=${cfg.tabId}]` instead of `basepanel[...]` to find what form is already opened
    
## [5.10.2] - 2019-07-11
### Changed
 - rename `pokazatPrevu` -> `showPreview`, `neNaidenShablon` -> `nodeTemplateNotFound` in i18n
 
### Fixed
 - return back `UB.core.UBUtilTree` (used in udisk)  

## [5.10.1] - 2019-07-08
### Fixed
 - sidebar width should be max 240px and should not depend on shortcut text length

## [5.10.0] - 2019-07-08
### Changed
 - **BREAKING** `adminui-pub` model does not create a navbar and sidebar anymore.
 Consider either to add a `@unitybase/adminui-vue` to the domain or write your own navbar and sidebar
 - **BREAKING** `UB.view.LoginWindow` is removed. External HTML form should be used for initial login
 (already implemented in `@unitybase/adminui-vue`).
 Re-login form can be added by call to `UB.connection.setRequestAuthParamsFunction()` (already done in adminui-vue).    
 - sidebar mount point now a div with ID `sidebar-placeholder`
 - Ext components removed: 'UB.view.FullTextSearchWidget', 'UB.view.LeftPanel', 'UB.view.MainToolbar',
 'UB.view.NavigationPanel', 'UB.view.SelectPeriodDialog', 'UB.view.ToolbarMenu', 'UB.view.ToolbarMenuButton',
 'UB.view.ToolbarUser', "UB.view.ToolbarWidget"
 - viewport internal HTML layout is simplified (unneeded nested divs are removed)
 - `customSidebar` and `customNavbar` adminUI configuration keys are removed from application config (always true)
 
### Fixed
 - fix invalid use of this in `UBStore.load` what cause a unexpected limit by 25 rows (introduced in 5.9.0) 

## [5.9.0] - 2019-07-03
### Changed
 - **BREAKING** `UBStore.load` will return a native Promise instead of Q.Promise from bluebird-q
 - `UBStore.reload` will return a native Promise instead of Q.Promise. **WARNING** `UBStore.reload` clears an entity cache
 and should be used VERY RARELY. For example to refresh store because of changes in ubRequest `store.load()` is enough.
 Even in case store is already loaded it will be refreshed during load() call.

### Added
 - new key in ubConfig `uiSettings.adminUI.pdfViewer.uriSuffix` - value passed directly to the PDF viewer URL.
 See [PDF open parameters](https://www.adobe.com/content/dam/acom/en/devnet/acrobat/pdfs/pdf_open_parameters.pdf) documentation for possible values.
 Default is `#view=Fit`   
  
## [5.8.29] - 2019-07-01
### Fixed
 - prevent changing of zIndex according to current Vue zIndex for forms with both `isModel: true` and `target` defined.
 Actually this is not a modal form, but rather form embedded into another form.

## [5.8.25] - 2019-06-24
### Fixed
 - do not show error in case user click on empty sidebar folder
 - while checking what tab is already opened inside Viewport `basepanel.tabId` will be used for **Ext** forms and `html element id` for **Vue** forms.
 Heuristic what use `basepanel.instanceID` is removed    
 
## [5.8.24] - 2019-06-19
### Changed
 - sidebar collapsed width changed from 76px to 50px

## [5.8.23] - 2019-06-18
### Changed
 - huge cleanup of i18n keys: most translit keys are removed; unused keys are removed 

## [5.8.21] - 2019-06-12
### Added
 - VueJS form mount () will be called with additional config `rootComponent: exports.default` 

## [5.8.19] - 2019-06-10
### Added
  - UBDocument will create CodeMirror for `text/javascript` & `script/x-vue` MIME types
  - UBCodeMirror recognize `sctipt/x-vue` / `text/x-vue` content types - Vue style will be used in this case

## [5.8.17] - 2019-06-02
### Fixed
 - remove exception then user press Tab on last element inside BasePanel

## [5.8.16] - 2019-06-02
### Changed
 - EntityGrinPanel will skip columns auto fit in case column width (or flex) is already defined 

## [5.8.15] - 2019-05-29
### Fixed
 - update `UBExtension.crx` to allow install Chrome extension for Chrome >= 74 in offline mode

## [5.8.14] - 2019-05-24
### Fixed
 - master-detail where expression transformation fixed for cases when server do not support UBQLv2
 
## [5.8.13] - 2019-05-24
### Fixed
 - UBProxy where expression transformation fixed for cases when server do not support UBQLv2 
 
## [5.8.12] - 2019-05-24
### Fixed
 - enum combobox will use UBQLv2 if accessible
 - UBProxy will skip disabled store filters while building UBQL from filter list.
 Previous implementation adds wrong empty filter in this case
 - in `UBDetailTree.onDeleteItem` confirm dialog **Ext.Msg.confirm(...)** is replased to **$App.dialogYesNo(...)**
   for compatibility with `@unitybase/adminui-vue` 

### Changed
 - change zIndex for Ext forms only in case `appConfig.uiSettings.adminUI.vueAutoForms` is set to `true`.
 In other case all Vue forms will be on front of Ext forms 
 
## [5.8.11] - 2019-05-21
### Changed
 - add support for UBQLv2 into `UBDetailGrid` and `UBProxy` (use value in where expression instead of values: {})
 - ExtJS store filter with `null` value will be transformed to `IsNull` / `NotIsNull` UBQL condition   

## [5.8.10] - 2019-05-21
### Changed
 - `optionalDependencies` are moved to `devDependencies` to prevent install it even when `NODE_ENV=production`    

## [5.8.9] - 2019-05-20
### Fixed
 - fixed z index manager on click dropdown or datepicker in UB dialogs
 
### Added
 - support for UBQL v2 (value instead of values in whereList)

## [5.8.8] - 2019-05-14
### Fixed
 - potential error inside BasePanel.getFieldList for custom forms
 
## [5.8.7] - 2019-04-29
### Fixed
 - prevent two server query for Audit Trail grid by moving sort to the UBQL
 
## [5.8.4] - 2019-03-22
### Changed
 - upgrade mustache 2.3.0 -> 3.0.1 

### Added 
 - `isModal` parameter for vue forms

### Fixed
 - removed stacked width in customSidebar option

## [5.8.3] - 2019-03-10
### Fixed
 - `$App.doCommand` instantiate form with type `module` by calling `mount` function (as for vue form)
  
### Changed 
 - i18 key `oshibkaVvoda` renamed to `fieldValidationError` and moved to up-pub
 - changed 'notValidForColumns' message template for all locales
 
### Added
 - new alias `instanceId` for `$App.showForm` command can be used instead of `instanceID`.
 Useful inside data attributes (see "magic links" in adminui-vue) 
 
## [5.8.2] - 2019-03-04
### Changed
 - tabId parameter of `$App.doCommand` should be of type string.
 Explicit typecast of `tabId` to string added to prevent "unclosable" tab error 
 - **BREAKING** `vue` forms definition extension changed from `js` to `vue`. Existed `vue` forms should be renamed manually 
 `git mv my_entity-fm.js my_entity-fm.vue`
 
### Added
 - Font color selection button added to `UB.ux.form.HtmlEditor`
 - Preview in PDF button now enabled in `UB.ux.form.HtmlEditor` (package @unitybase/pdf should be in package.json for this feature)
  
## [5.8.1] - 2019-03-02
### Changed
 - remove preset-es215-without-strict from webpack config - webpack4 do all well w/o this preset

## [5.8.0] - 2019-03-01
### Added
 - `element-ui` library registered is SystemJS.map (used in DEV mode of adminui-vue)

### Changed
 - **BREAKING** `window.JSZip` is removed
 - UBTheme.css removed (deprecated)
 - css for Right-To-Left locales are removed (nobody uses it)
 - packages updated `bluebird 3.4.6 -> 3.5.3`, `codemirror 5.20.2 -> 5.44.0`, `es6-promise 4.1.1 -> 4.2.6`
 - webpack@4 is used for production build
 - all production css are optimized using -O2 optimization level
 - CodeMirror & mxGraph now not included in boundle and loaded on demand from their own packages
 - removed most of IE11- hacks from Ext-all (-4Kb)
 - `Ext.data.proxy.Rest`, `Ext.data.reader.Xml`, `Ext.data.writer.Xml`, and `Ext.data.XmlStore` are removed
 - support for IE < 11 is removed from Ext.Array

## [5.7.0] - 2019-02-18
### Changed
 - left navigation panel aligned to full screen height
 - all toolbars (application top bar and form's toolbar) color changed to white
 - border around toolbar buttons is removed

### Fixed
 - fix opening form constructor in form settings

## [5.6.26] - 2019-02-14
### Added
 - UB favicon.ico added to adminui-pub

### Fixed
 - fix opening form from link (check viewport is exists) 
 
### Changed
 - base panel does not send `needAls: false` parameter for `select/insert/update` in case entity do not have ALS mixin
 
## [5.6.25] - 2019-02-13
### Changed
- `ubdetailgrid` with RowEditing plugin : Changed data validation on the event `validateedit`

## [5.6.24] - 2019-01-30
### Fixed
 - potential error with invalid characters in scanned file name (,). Chrome72 do not allow `,` in Content-Disposition header 

## [5.6.23] - 2019-01-27
### Fixed
 - [unitybase/ubjs#41] - float field validator should allow numbers with total char count > 17, for example `10,000,000.000001`
 - [unitybase/ubjs#42] - select row count on grid refresh only if rowCount calculation is turned ON either in ubRequest 
 or by pressing Total button on PaginationToolbar
 - clear "soft deletion" mark for combobox in case ubRequest is changed and newly selected record is not longer deleted

## [5.6.20] - 2019-01-10
### Fixed
 - [unitybase/ubjs#36] - all exporters (Excel / CSV / HTML) will call a grid column render() function
 with parameters `col.renderer(value, null, record, rowIndex, colIndex, store)`

## [5.6.19] - 2018-12-28
### Changed
 - sped-up `index.html` generation by replacing resource versions calculation algorithm from md5 to `version` from package.json

## [5.6.18] - 2018-12-26
### Fixed
 - error during table insertion in the ReportBuilder UI component
 
### Changed
 - modal dialogs mask left-top position explicitly set to 0,0 - see [unitybase/ubjs!244] for details
   
## [5.6.17] - 2018-12-17
### Changed
  - if several default (isDefault=true) forms exists for an entity
  `UBFormLoader.getFormByEntity` will return a form from model with the biggest model order.
  This allows to override default forms in descending models [unitybase/ubjs#30]  

### Fixed
  - allow negative values for fields with dataType `currency` or `float`
    
## [5.6.15] - 2018-12-07
### Changed
  - use a new function `AsyncConnection.setDocument` for files uploading
   
## [5.6.13] - 2018-12-03
### Changed
  - prevent entering a string with all whitespaces for **required** text fields by 
   setting `allowOnlyWhitespace` to false for `Ext.form.field.Text` descendants 
   inside `Ext.form.field.Text.setAllowBlank` overrided handler
  - default precision for **Float** attribute set to 6 (instead of 4)
  - default UI control for **Float** attribute now validate input
  - vue loader registration is moved form `adminui-vue` to `adminui-pub` 
         
## [5.6.12] - 2018-11-28
### Added
 - vue based form `mount` function accept `commandConfig` as a parameter
 ```javascript
$App.doCommand({
  "cmdType": "showForm",
  "formCode": "ubdev_metadata",
  "cmdData": {
    "entityCode": objectCode
  }
})
```

## [5.6.10] - 2018-11-20
### Fixed
 - add nonce for unhandled rejection polyfill script to bypass a CSP rules in production mode  

## [5.6.9] - 2018-11-19
### Fixed
 - BasePanel toolbar icon appearance for tool buttons without text but with drop-down 

## [5.6.8] - 2018-11-16
### Changed
 - in case default form for entity is not defined and exists several forms
 `UB.core.UBFormLoader.getFormByEntity` will return form with smallest code (in alphabetic order)

### Added
 - add UbExtension.crx to the adminui-pub/ub-extension folder.
 Used by a client who do not have access to the internet but need to install extension into Google Chrome.

### Fixed
 - add polyfill for Promise unhandledrejection event (for FireFox browser).
 Without this polyfill Admin-ui can't show unhandledrejection's reason in message box
   
## [5.6.6] - 2018-11-13
### Fixed
 - EntityGridPanel - prevent monkey request in Refresh action by removing reloading of
   EntityGridPanel.stores, because they already will be reloaded by UBStore.linkedItemsLoadList 
 
## [5.6.5] - 2018-10-31
### Fixed
 - visibility of ExtJS SVG based charts internal content (lines, dots, etc).
  Prevented CSS conflict between normalize.css & Ext chart svg's
 - exporting of grids to Excel in case grid contains UBBadge columns

## [5.6.4] - 2018-10-25
### Changed
 - **BREAKING** change - `UBStore.reload(callback)` is obsolete and will throw error.
     Promise style call should be used instead `store.reload().then(...)`.

### Fixed
 - UBStore will load `linkedItemsLoadList` before loading main store data. This fix displaying of empty lookup columns
 in EntityGridPanel in case depended stores (for lookup data) query is slower when query to the store.
 - remove potential second query for UBStore from EntityGridPanel `boxready` handler by set store.loading = true 
  
## [5.6.2] - 2018-10-05
### Fixed
 - grid export to HTML - empty (null) Float/Currency/Int now exported as empty cell instead of "NaN"
 - regression in generation grid column caption for `EntityGrinPanel`

## [5.6.0] - 2018-09-30
### Added
 - attributes of type `Json` now supported by adminUI
 - New @cfg `valueIsJson` added to `UBCodeMirror`. If true value can be plain JS object. In other case - string 

### Fixed
 - grid export to HTML - empty (null) date now exported as empty cell instead of 1970 year
 - cached entity filtration by a boolean attribute from EntityGridPanel filter widget:
 filtration value should be `true/false` instead `1/0`
 
## [5.5.8] - 2018-09-26
### Fixed
 - new version creation for *cached* entities with `dataHistory` mixin
 
## [5.5.7] - 2018-09-22
### Added
 - `UploadFileAjax` component can optionally limit file extensions allowed for selection
 ```
Ext.create('UB.view.UploadFileAjax', {
  ...
  accept: '.cer',
  ...
``` 
 - application version (from package.json) is shown below login window (new feature `connection.appConfig.appVersion`) 
 
## [5.5.5] - 2018-09-14
### Fixed
 - allow passing of null/undefined into basePanel.hideActions array item
 - certificates related i18 keys is moved into ub-pub
 
### Added
 - support for `CERT2` auth
 
## [5.5.3] - 2018-09-11
### Fixed
 - UBOrgChart: fix node child's visualisation in case full child tree contains > 100 elements
 
### Changed
- BasePanel action `showOriginal` (used in toolbar for Document type attributes) is removed (obsolete)  

## [5.5.1] - 2018-09-04
### Fixed
- **CRITICAL** EntityGridPanel: prevent memory leak by destroying grid popup menu
- **CRITICAL** Multifilter: prevent memory leak by destroying all Multifilter panels on destroy
- **CRITICAL** Multifilter: prevent memory leak for filter label toolbar (moved to data-qtip)

### Changed
- all calls to `Q` in BasePanel replaced by native `Promise` 
- `Ext.picker.Date` now use CSS shadow instead of creation div element
- optimization: prevent creation of div's for floating elements shadow - all shadows are made using pure CSS
- optimization: lazy loading of components required by form / shortcut editor (`app/view/CommandBuilder/*`)
- optimization: remove unused `AdvancedTextArea` control  
- optimization: BasePanel - prevent flashing layout twice in `onFormDataReady` handler
- use `UBConnection.getDocument` in BasePanel to download document  

## [5.5.0] - 2018-09-02
### Fixed
- **CRITICAL** EntityGridPanel: prevent memory leak by destroying pagination bar if created
- **CRITICAL** EntityGridPanel (`Multifilter`): prevent memory leak by destroying attributes menu if created

### Changed
- EntityGridPanel initial rendering speed up (**up to 2 second!**):
  - preventing insertion of empty Mutlifilter description panel in case filters are empty (~100ms)
  - preventing re-layout for each column width changing during call to `optimizeColumnWidth` (~100ms)
  - prevent re-rendering during disable/enable actions in  if action already enabled/disabled
  - **BREAKING** pagination toolbar  (`UB.view.PagingToolbar` `xtype: pagingtb`) is completely rewritten.
    In rared case this component is used outside `adminui-pub` code should be rewriting
  - lazy creation of PaginationToolbar (not created at all if store not require it) (~100ms)
  - lazy creation of `Mutlifilter` attributes menu (10ms)
  - `disableAutoSelectRow` set to `true` by default   

## [5.4.10] - 2018-08-29
### Changed
 ***please, do nou use this revision - upgrade to 5.5.0***

  
## [5.4.7] - 2018-08-25
### Fixed
 - add logicalPredicates for request when choose "selectFromDictionary" on `ubcombobox`

## [5.4.5] - 2018-08-14
### Fixed
 - required label asterisk: aligned to left in case label on top; removed for checkbox
 
## [5.4.4] - 2018-08-14
### Added
 - `ubConfig.uiSettings.adminUI.customSidebar` & `ubConfig.uiSettings.adminUI.customSidebar` config properties added.
 In case explicitly set to true, then adminUI will not create navbar/sidebar 
 
## [5.4.3] - 2018-08-13
### Changed
 - es6 syntax in code editors is enabled by default
  
## [5.4.2] - 2018-08-06
### Changed
 - remove unused Ext classes `Ext.direct.*; Ext.data.jsonp; Ext.form.action.DirectLoad; Ext.data.flash.BinaryXhr; Ext.flash.Component`

## [5.4.1] - 2018-08-06
### Fixed
- prevent SystemJS to override global window.onerror handler defined by ub-pub by removing `nonce-` rule from SystemJS config

## [5.4.0] - 2018-08-03
### Changed
- **BREAKING** more strict Content Security Policy header: script-src 'unsafe-inline' directive is removed in flavor of 'nonce-...'
- prevent redirect to custom login page in case of silenceKerberosLogin is true in localStorage
- use

### Fixed
- added property `$App.__scanService: UBNativeScanner`
- increase left panel desktop select height to 3rem for fit 2-line caption [UBDF-7808]
- #2 - refs to attributes of "many" type should not be displayed in Details for EntityGridPanel.
 As a side effect - entities without accessible `select` should not be displayed also.
- reload store for combobox before row edit on ubdetailgrid

## [5.3.4] - 2018-07-29
### Fixed
 - long terming bug with select/date control border disappears if page are scaled

## [5.3.3] - 2018-07-23
### Added
- ubdetailgrid with RowEditing plugin will fire "changeData" when user cancel editing

### Fixed
- login window logo css fixed in way logo looks the same on adminui-vue adn adminui login window

### Changed
- remove IE9 specific CSS selectors from UBGrayTheme
- remove invalid background images CSS selectors from UBGrayTheme

## [5.3.2] - 2018-07-22
### Fixed
- fix error 404 Not Found during request to /clientRequire/systemjs-hmr.
 systemjs-hmr is moved from devDependencies to dependencies section of package.json

## [5.3.1] - 2018-07-20
### Changed
- `tabsCountLimitExceeded` message type changed from error to information

### Fixed
- Issue #6 ALS screws up attributes by prevent calling of BasePanel.updateAls if record.resultAls is undefined

## [5.3.0] - 2018-07-19
### Changed
- **BREAKING** `custom` (pure ExtJS) forms must export a entry point class name.
 
 For example if form `*-fm.def` contains `Ext.define("UBM.userSettings", ...` then line
 `exports.formDef = 'UBM.userSettings'` must be added to the beginning of file

- **BREAKING** `custom` && `auto` forms definition are not parsed for `requires: [...]` && 'uses: [...]' sections.
 All required components must be loaded using direct `require('pathToComponentImplementation')` calls.

 For example if form `*-fm.def` contains section
 ```
 requires: ['UB.ux.designer.VisualDesigner']
 ```
 then VisualDesigner implementation must be required either in model initialization script or inside component file (recommended)
 ```
 require('@unitybase/adminui-pub/_src/app/ux/designer/VisualDesigner')
 ```

- **BREAKING** forms caching is moved to the HTTP cache level, localStorage is not used anymore for form cache
- all forms are loading using SystemJS.import:
  - form definition can use `require('something')` and it will be parsed synchronously as expected
  - forms are cached on HTTP level (in case of reverse proxy). local storage based cache not used for cache forms anymore

### Added
 - Hot Module Replacements for forms (work only for client in `dev` mode).
 See [ub-hrm server](https://git-pub.intecracy.com/unitybase/ubjs/tree/v5.x/packages/hmr) for details


## [5.2.1] - 2018-07-19
### Fixed
- skip destroying `tinymce` when it is not defined yet

### Added
- method `cmdCommand.showList` sets attribute value **description** as tabs caption

## [5.2.0] - 2018-07-16
### Fixed
- adminui-pub locales can be injected to environments what do not use ExtJS
- added add/remove class to required field label on change of allowBlank

### Changed
- UBGrayTheme now use font-size (14px) and font-family (Segoe UI) defined on body level
- all "bold" weights changed to 600 (more lighter)
- [normalize.css](https://github.com/necolas/normalize.css/) added
- Tab borders is set to `1 1 1 1`


## [5.1.4] - 2018-07-13
### Changed
- for a "required" attributes changed style to display the asterisk after delimiter, not before and align on the right side
- remove placeholder "fill value" for a "required" attributes
- "Add As" action renamed to "Copy". Glyph changed to `faCopy`
- max open tabs now 40 by default (can be changed back to 10 by `ubConfig.uiSettings.adminUI.maxMainWindowTabOpened: 10`)

## [5.1.3] - 2018-07-12
### Fixed
- remove displaying of "undefined" in UBDetailTree in minified version of adminUI

## [5.1.2] - 2018-07-08
### Changed
- unhandled errors now will be redirected to error reporter by `ub-pub`
- silence Kerberos login will be handled by `ub-pub`
- use new feature `ub-pub.setErrorReporter`

## [5.1.1] - 2018-07-06
### Fixed
- '@unitybase/ub-pub'.Repository (i.e. UB.Repository) will be defined inside `ub-pub` instead of `adminUI`

## [5.1.0] - 2018-07-05
### Changed
- Model public path initialization do not require creation of `/public/initModel.js` script.
 Instead `package.json` can contain section "browser" what point either to the model initialization script for browser

 In case model is a published module (placed in the node_modules folder) path should be relative to the `package.json`:

 ```package.json
 "browser": "./public/initModel.js"
 ```

 or for dev/prod scripts

 ```package.json
  "browser": {
    "dev": "./public/devEntryPoint.js"
    "prod": "./public/dist/modelBundle.js"
  }
 ```

 In case model is in `models` folder p[ath must be absolute
 ```package.json
   "browser": "/clientRequire/models/TST/initModel.js",
 ```


### Added
- $App.modelLoadedPromise promise added to indicate model public part is completely loaded
  In case model require asynchronous operation during loading it should add a chain to this promise.
  Next model will await chain resolving.

## [5.0.23] - 2018-07-03
### Changed
- adminUI left navbar:
 - arrow color changed to the same color as menu text
 - arrow style changed from fa-angle-left to fa-caret-right
 - increase padding (+4 px) between left arrow and workspace

### Fixed
-  set whereList property for ubcombobox when use row editing in ubdetailgrid

## [5.0.22] - 2018-06-26
### Fixed
- handle entity attribute readOnly property on adminUI as documented (regression)
- added support for `adminui.loginURL` parameter. If parameter is set, then all unauthorized users will be redirected to
  that page for authentication. Page itself should create a UBConnection with `allowSessionPersistent`
  and do a `UBConnection.connect()`. See login page example in [autotest app](https://git-pub.intecracy.com/unitybase/ubjs/blob/master/apps/autotest/inetPub/login.html)

### Changed
- add a red asterisk for required field's labels

## [5.0.21] - 2018-06-21
### Changed
- made metadata diagrams correlate with terms used in UML diagram
  - association (was "relation") - removed the diamond
  - added a whole new type of link "composition" - with diamong("cascadeDelete" is used to determine if link is "association" or "composition")
  - removed weird oval from start of "inheritance" link

## [5.0.19] - 2018-06-07
### Fixed
- package will expose 'file-saver' as SystemJS module to prevent double-loading

## [5.0.17] - 2018-06-03
### Fixed
- package will expose itself and 'lodash', 'bluebird-q' and '@unitybase/cs-shared'
 as SystemJS module to prevent double-loading

### Changed
- `adminui-pub` will inject all localization script at once using new `allLocales` endpoint.
Will speed up startup for applications with several models

## [5.0.15] - 2018-05-28
### Changed
- TinyMCE upgraded to 4.7.13

## [4.3.2] - 2018-04-11
### Fixed 
- ubdetailgrid does not load store on boxready event if forceDataLoad is true 
- ubboxselect erorr on getValue

## [4.2.56] - 2018-04-06
### Fixed 
 - in case value is empty during form refresh, `ubboxselet.value` will be set to null
- use custom fieldList for grid when choose "select From Dictionary" on ubcombobox for row editing grid
- in UBComboBox remove clearValue when call doSetValue 

### Added
- property BasePanel.formWasSaved. Becomes 'true' in case opened form was saved

### Changed
- removed execution of ubboxselect.setFocuse after store is loaded


## [4.2.54] - 2018-03-21
### Fixed 
 - prevent double downloading of document when clicking on document link
 - prevent opening of new tab browser when click on document link in the inserting mode
- `ubboxselect` can be used for attributes with dataType: Enum (will use this.valueField for data)


## [4.2.53] - 2018-03-03
### Fixed 
 - setValue in ubcobbobox on ubdetailgrid with rowEditing plugin if use 'Select from dictionary'
 - clear Value in ubcobbobox befor row edit on ubdetailgrid with rowEditing plugin
 - fix coping of line numbering for rowEditing ubdetailgrid

## [4.2.52] - 2018-02-28
### Fixed
- fix value serialization for attributes of type Many (BoxSelect, UBBoxSelect) - remove space inside CSV
- ubdetailgrid: fix bug on validateedit event for row row editing grid

## [4.2.49] - 2018-02-16
### Added
- new @cfg parameter for ubdetailgrid - `forceDataLoad`. If set to true will force grid 
 to create and load underline store even if grin is placed onto inactive tab

## [4.2.48] - 2018-01-30
### Added
- add line numbering for rowEditing ubdetailgrid

### Fixed 
- setValue() in ubcobbobox on ubdetailgrid with rowEditing plugin if use 'Select from dictionary' 
- clearValue() in ubcobbobox befor row edit on ubdetailgrid with rowEditing plugin
- entitygridpanel filters configuraion loading in case no filters is stored

## [4.2.45] - 2018-01-10
### Changed
- UBDocument.forceMIME is DEPRECATED and not handled anymore.
- UBApp.runShortcutCommand now can accept a shortcut code to run
```
   $App.runShortcutCommand('tst_document')
   //or
   $App.runShortcutCommand(30000012312)
```
To use in ubm_navshortcut place this code to the `ubm_navshortcut.cmdCode` attribute:
```
  {cmdType: 'showForm', formCode: function () { $App.runShortcutCommand('sia_docPayOrderOut') }}
```

### Fixed
- EntityGridPanel `Export to Excel` action now enabled even in standard edition,
 since `xlsx` module added to `adminui-pub` as chunk

## [4.2.45] - 2018-01-10
### Changed
- `ubm_navshortcut` not not load `cmdData` attribute during startup, because this is CLOB,
and fetching all CLOBS from table is very slow (at last for Oracle)

### Added
- Firing of BasePanel `beforeRefresh` event
- ubdetailgrid: set allowBlank=false for row editor fields in case allowNull===false in meta files
- ubcombobox: function getFieldValue - Get field value by name from fieldList
- set `hideTrigger: true` by default for auto generated componets for numeric attributes

## [4.2.44] - 2018-01-04
### Fixed
- set currency sign to '' for all languages to pass form validation for Currency attributes

## [4.2.43] - 2018-01-03
### Fixed
- fix "Change's history" action executed from entityGridPanel in case fieldList
 already contains mi_date[From|To] in extended format {name: 'mi_dateFrom', description: UB.i18n('mi_dateFrom')} 

### Changed
- in case entityGridPanel columns caption is empty set it to UB.i18n(attributeCode)
 Usable for translating mixin's attributes like `mi_date*` etc.

### Added
- translation for `mi_modifyDate` to global level of i18n    

## [4.2.41] - 2017-12-12
### Fixed
- errors associated with editing data in the grid
- errors associated with add new record from ubcombobox

## [4.2.40] - 2017-11-29
### Added
- new CSS class .iconPdf to display a PDF file icon
- BasePanel.aftersave event fired with with 2 parameters: `(me, result)`
 where `result` is a record state AFTER server side updating 

## [4.2.37] - 2017-11-17
### Added
  - `EntityGridPanled` can be configured to allow editing at a row level for a Grid 
  by setting `rowEditing: true` configuration property. Or in the showList or navigation shortcut:
  
  ```
  {
  	"cmdType": "showList",
	"cmpInitConfig": {"rowEditing": true},
  	"cmdData": {    
  	  "params": [
  	    {
  	      "entity": "tst_document",
  ```

### Fixed
  - prevent storing of `undefined` as a form value to localStore in case server is unavailable
   
### Changed
  - Editor for attributes mapped to Currency type changed from spin edit to edit 
  - display value for Currency type will be formated accoding to [Ext.util.Format.currency](http://docs.sencha.com/extjs/4.2.2/#!/api/Ext.util.Format-method-currency)
   rules. Localization applied in `packages/adminui-pub/locale/lang-*.js`
 
 
## [4.2.35] - 2017-10-25
### Added
 - `BasePanel.on('manualsaving')` events added.
 Fires just after **USER** manually call `save` action (press save button or Ctrl+S shortcut)
 but **before** data passed to a server for update/insert.

## [4.2.34] - 2017-10-24
### Added
 - Developer can intercept data, returned from server as a result to select method, executed by BasePanel.
 
 To do this `BasePanel.on('recordloaded')` event handler now called with 2 parameters `(record, data)`, where 
 **record** is instance of Ext.data.Model for current form and **data** is a raw server result  
 
 - Developer can intercept data, passed by `BasePanel` to entity insert/update method 
 just before it's going to server by subscribe to `BasePanel.on('beforesave')` event.
 Event handler accept 2 parameters `(me: BasePanel, request: UBQL)`. Developer can modify `request` inside handler.    
  

## [4.2.33] - 2017-10-13
### Added
- UBBadge control, pulled and adopted code originally developed for "bpm" subsystem.

  Display an enum attribute as a badge on a form:

	```
	{attributeName: 'status', xtype: 'ub-badge'}
	```

  When need to use badge as a static label, not linked to attribute and / or enum,
  use configuration like the following:

	```
 	{
	  xtype: 'ub-badge',
	  itemId: 'overdueBadge',
	  text: UB.i18n('bpm_Task_overdue'),
	  invert: true,
	  cssClass: 'red'
	}
	```
   For this to work, an `initModel.js` file (there must be one for your model) shall contain the following initialization code:
 	```
 	UB.ux.UBBadge.setCssMap(
	  'MY_ENTITY_STATUS',
	  {
	    'pending': 'blue',
	    'in-progress': 'yellow',
	    'error': 'red',
	  },
 	  // Use invert style
	  true
 	)
	```
   To use it in grid:

	```
	initComponent: function () {
	  var myGridComponent = this.items[5] // reference to grid
	  var fieldList = UB.Utils.convertFieldListToExtended(myGridComponent.fieldList)
	  UB.ux.UBBadge.setupRenderer(fieldList, 'status', 'MY_ENTITY_STATUS')
	  this.callParent(arguments)
	},
	```


## [4.2.29] - 2017-09-14
### Added
 - new BasePanel.postOnlySimpleAttributes property 
   
   If `true` form will post only values of modified attributes
   which do not contain a dot.
   
   Exapmle: in case def is
   ```
   items:[
     { attributeName: "nullDict_ID"},
     { attributeName: "nullDict_ID.code", readOnly: true},
     { attributeName: "nullDict_ID.caption", readOnly: true}
   ]
   ```
   
   Values of nullDict_ID.code &  nullDict_ID.caption will not be send to update/insert execParams

### Changed
 - Not-null attributes in the form builder now displayed as bold
 - `showForm` command will use a `ubm_form.caption` as a form caption (instead of description as in prev. version) 


## [4.2.25] - 2017-08-29
### Added
 - Allow localizing application name on `adminUI` login form by specifying `applicationName` in `ubConfig` as an object with keys=locale instead of string. Thanks to Sergey.Severyn for contribution

## [4.2.24] - 2017-08-22
### Added
 - Simple certificate authentication support in adminui. Password is not needed. The user name is extracted from the certificate or entered by the user.

### Changed
 - The ability to use different libraries for certificate authorization.

## [4.2.22] - 2017-08-09
### Added
 - new `uiSettings.adminUI.favoriteCategoryCount` config property allow to set up to three favotite column (star) colors

### Fixed
 - Show unhandled Promise rejection messages in dialog box (replace when->es6-promise Promise polufill)

## [4.2.20] - 2017-08-08
### Fixed
 - UB.ux.form.field.UBDateTime. Prevent exception when picker opened and button TAB pressed. [UB-1862]


## [4.2.18] - 2017-06-18
### Added
 - Editors for OrgChart available in UB EE is moved into standard edition (this package)
 - Add `.x-grid-row-bold` css class for mark grid rows as **bold**
 - Add property `UB.view.ColumnFavorites.allowedCategoryCount` for configure allowed values count in favorite column.

###Fixed
- fix bag in cyclical opening of modal forms.(`org_staffunit` -> `org_employeeinstaff` -> `org_staffunit`)

## [4.2.17] - 2017-05-26
### Fixed
- allow UBComboBox.setValueById to use `valueField` instead of hardcoded 'ID'
- "Remember me" feature for Negotiate authentication now don't hung a app
- "unable to change password at first logon" issue fixed 

## [4.2.15] - 2017-04-14

### Fixed
-  prevent open the same command in separate tabs in case it's opened from left or top menu
-  set `UBStore.loading = true` in method **UBStore.reload** before call **UBStore.clearCache()**.

### Changed
- enum combobox now sort enum captions by `orderNum` attribute (instead of name)
- remove ER diagram background image (not background is white )
- ignore attributes with property `defaultView: false` for automatically generated forms

## [4.2.13] - 2017-04-07
### Fixed
- UBReportEditor now draw a dashed border around sections (both paragraph and table row)

## [4.2.12] - 2017-03-30
### Added
- AdminUI: In case of first login attempt LoginWindow will activate a tab for a first auth method from server config `security.authenticationMethods` array

### Fixed
- fix systemjs version to `0.20.10-scoped` - pathced vwrsion what allow scoped modules loading without map configuration

## [4.2.11] - 2017-03-30
### Added
- UBBoxSelect now accept ubRequest as a config parameter (for store creation)
- UBReportEditor can insert image from file (Insert -> Image -> click on button with photo)
- UBReportEditor added build-in image editor (click on image to actiate)

### Fixed
- since form definitian now evaluated only once (HMR) both `EntityGridPanel` & `ubdetailgrid` now accept `customActionas` as a Ext.Action config (not a class instance)
