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
### Added
 - `ubs_report` allows override reports by creating report with the same code in different models.
  Report form a last model (in order they defined in ubConfig) will be used

### Changed
- English (en) localization for desktop/shortcut captions: the words are
  capitalized according to English rules for captions
- navigation definition is moved from `_initialData` scripts to `03_navigation.yml`
  file in order to use `ub-migrate` for migration of the navigation data

## [5.20.24] - 2021-09-08
## [5.20.23] - 2021-09-02
## [5.20.22] - 2021-08-31
### Changed
 - Dutch localization correction

## [5.20.21] - 2021-08-18
## [5.20.20] - 2021-08-09
## [5.20.19] - 2021-08-04
### Added
 - Dutch (nl) localization

## [5.20.18] - 2021-07-18
### Added
 - Dutch (nl) localization

## [5.20.17] - 2021-07-08
## [5.20.16] - 2021-06-14
## [5.20.15] - 2021-05-24
## [5.20.14] - 2021-05-13
## [5.20.13] - 2021-05-07
### Removed
 - `@unitybase/ubs/modules/base64.js` is removed - not used. `Buffer.from(text, 'base64')` is used instead.

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
### Changed
 - migrate build to webpack5

## [5.19.9] - 2021-03-23
## [5.19.8] - 2021-03-17
## [5.19.7] - 2021-03-16
### Fixed
- Cleaned up `ubs_report` localization (ru, ka, tg) from non-existing attribute `mi_modifyDate`

## [5.19.6] - 2021-03-15
### Fixed
 - server-sire report rendering fixed (bug in ubs@5.19.5)

## [5.19.5] - 2021-03-15
### Added
 - `ubcli convertDefFiles` utility to convert a reports, forms and diagrams to new storage format (.ubrow) 

## [5.19.4] - 2021-03-03
### Changed
 - client side locales reformatted into JSON

## [5.19.3] - 2021-02-10
## [5.19.2] - 2021-02-08
## [5.19.1] - 2021-02-03
## [5.19.0] - 2021-02-02
## [5.4.55] - 2021-01-30
## [5.4.54] - 2021-01-28
## [5.4.53] - 2021-01-26
## [5.4.52] - 2021-01-19
## [5.4.51] - 2021-01-17
## [5.4.50] - 2021-01-11
### Fixed
 - Default report script now does not crash report execution with error 500

## [5.4.49] - 2020-12-30
## [5.4.48] - 2020-12-28
## [5.4.47] - 2020-12-22
## [5.4.46] - 2020-12-21
## [5.4.45] - 2020-12-20
## [5.4.44] - 2020-12-17
## [5.4.43] - 2020-12-16
## [5.4.42] - 2020-12-14
## [5.4.41] - 2020-12-09
## [5.4.40] - 2020-12-09
## [5.4.39] - 2020-12-02
## [5.4.38] - 2020-11-25
## [5.4.37] - 2020-11-20
## [5.4.36] - 2020-11-19
### Fixed
 - a client-side report builder `UBReport` uses a `/clientRequire` endpoint instead of `/getDocument` to obtain a report template.
   This fix 404 report template response on production deployment where models can be either inside
   app folder (`/opt/unitybase/apps/appName`) or inside appData folder (`var/opt/unitybase/apps/appName`)   

## [5.4.35] - 2020-11-15
## [5.4.34] - 2020-11-14
## [5.4.33] - 2020-11-12
## [5.4.32] - 2020-11-10
## [5.4.31] - 2020-11-08
## [5.4.30] - 2020-11-08
## [5.4.29] - 2020-11-05
## [5.4.28] - 2020-11-01
## [5.4.27] - 2020-10-20
## [5.4.26] - 2020-10-15
## [5.4.25] - 2020-09-23
## [5.4.24] - 2020-09-22
## [5.4.23] - 2020-09-21
## [5.4.22] - 2020-09-20
## [5.4.21] - 2020-09-08
## [5.4.20] - 2020-09-01
## [5.4.19] - 2020-08-31
## [5.4.18] - 2020-08-19
## [5.4.17] - 2020-08-19
### Added
 - Tajik locale translation

### Changed
- `ubs_message_edit-fm.vue`: refactored, fixed layouts and loading mask

### Removed
 - `cross-env` dependency removed 
 
## [5.4.16] - 2020-08-03
## [5.4.15] - 2020-07-29
## [5.4.14] - 2020-07-28
## [5.4.13] - 2020-07-26
## [5.4.12] - 2020-07-19
## [5.4.11] - 2020-07-16
## [5.4.10] - 2020-07-15
## [5.4.9] - 2020-07-08
## [5.4.8] - 2020-07-01
## [5.4.7] - 2020-06-30
## [5.4.6] - 2020-06-24
### Fixed
 - report template rendering: in case format function is called inside CONDITION block over primitive (number/string/Date)
 value first argument is ignored. This allows rendering blocks like this (all 3 line below is the same
 in case `dateObj.dInner` is of Date type:
 ```
 {{#dateObj.dInner}}Terms: {{#$f}}"dateObj.dInner","dateTime"{{/$f}}{{/dateObj.dInner}}
 {{#dateObj.dInner}}Terms: {{#$f}}"IGNORED AND CAN BE EMPTY","dateTime"{{/$f}}{{/dateObj.dInner}}
 {{#dateObj.dInner}}Terms: {{#$f}}"","dateTime"{{/$f}}{{/dateObj.dInner}}
 ``` 

## [5.4.5] - 2020-06-21
## [5.4.4] - 2020-06-15
## [5.4.3] - 2020-06-15
## [5.4.2] - 2020-06-14
### Fixed
 - `ubs_messages.addUserFilters` method is use UBQLv2 syntax for parameters (no functional changes) 

## [5.4.1] - 2020-05-25
## [5.4.0] - 2020-05-22
### Deprecated
 - usage of `@unitybase/ubs/public/formatByPattern.js` is deprecated.
   `require('@unitybase/cs-shared').formatByPattern` should be used instead.

## [5.3.10] - 2020-05-17
### Changed
 - replace most font-awesome and element-ui to UB icons analog

## [5.3.9] - 2020-05-13
## [5.3.8] - 2020-05-06
### Fixed
 - fix ESLint warnings in initial JS template for ubs_report (no functional changes) 

## [5.3.7] - 2020-04-24
## [5.3.6] - 2020-04-10
## [5.3.5] - 2020-03-30
## [5.3.4] - 2020-03-20
## [5.3.3] - 2020-03-17
## [5.3.2] - 2020-03-09
## [5.3.1] - 2020-03-04
## [5.3.0] - 2020-02-29
### Changed
 - entities localization files (*.meta.??) are moved to `meta_locale` folder
 
## [5.2.75] - 2020-02-23
## [5.2.74] - 2020-02-18
## [5.2.73] - 2020-02-13
## [5.2.72] - 2020-02-10
## [5.2.71] - 2020-02-08
## [5.2.70] - 2020-02-03
## [5.2.69] - 2020-01-31
## [5.2.68] - 2020-01-17
### Changed
 - rewrote `020_create_UBS_navshortcuts.js` config for rendering ubs forms on vue

## [5.2.67] - 2020-01-11
## [5.2.66] - 2020-01-03
## [5.2.65] - 2020-01-02
## [5.2.64] - 2019-12-30
## [5.2.63] - 2019-12-27
## [5.2.62] - 2019-12-20
## [5.2.61] - 2019-12-18
### Fixed
- `@unitybase/pdf` && `@unitybase/xslx` packages are moved back into "dependencies" - neither "peerDependencies" nor
 "optionalDependencies" not works as expected for initial `lerna bootstrap` 
  
## [5.2.60] - 2019-12-17

## [5.2.59] - 2019-12-12
### Changed
 - `@unitybase/pdf` && `@unitybase/xslx` packages are moved into "peerDependencies" - "optionalDependencies" handled by 
  lerna in the same way as "dependencies"

## [5.2.58] - 2019-12-12
### Changed
 - `@unitybase/pdf` && `@unitybase/xslx` packages are moved into "optionalDependencies" package/.json section.
 This prevent `lerna` from publishing `@unitybase/ubs` and all their dependencies each time pdf or xlsx changed
 
## [5.2.52] - 2019-11-15
### Changed
 - Report names are localizable now - "Click sample" report is an example

## [5.2.45] - 2019-10-02
### Changed
 - `ubs_numcounter.getRegnum` optimization
   - new attribute ubs_numcounter.fakeLock added for select for update emulatin
   - settings key `ubs.numcounter.autoRegWithDeletedNumber` reads once 

## [5.2.25] - 2019-07-22
### Changed
 - all meta files and they localization transformed to array-of-attributes format

## [5.2.24] - 2019-07-11
### Added
 - scheduler job `ubsSoftLockCleanup` added to the UBS model.
 Will delete all expired non persistent lock from `ubs_softLock` table. By default scheduled to run every day at 05:15:25

### Fixed
 - keys for SOFTLOCK_TYPE enum changed `ltNone->None` `ltPersist->Persist` `ltTemp->Temp`
 - ExtJS based messages sending form (bell on toolbar) is removed - only Vue form is left

## [5.2.23] - 2019-07-08
### Changed
 - 'UBS.MessageBar' is deleted. New implementation is inside `@unitybase/adminui-vue` model 
 
## [5.2.22] - 2019-07-05
### Fixed
 - Vue based user messages notification widget do not throw `ELS - access deny` error for non-privileged users

## [5.2.12] - 2019-05-21
### Changed
 - `optionalDependencies` are moved to `devDependencies` to prevent install it even when `NODE_ENV=production`
 
## [5.2.3] - 2019-02-26
### Added
 - navshortcuts access initialization for Supervisor role
 - added vue form 'Messages history'
 - added vue form 'Send message'

### Changed
 - use webpack4 for production build

## [5.2.0] - 2019-02-13
### Added
 - new handler `onAfterRender` for reports. Will be called by ReportViewer just after HTML report result is rendered
 - new property `ReportViewer.contextMenu` - can be used to show menu while user click on hyperlink inside rendered HTML report
   See [click_sample.js](https://git-pub.intecracy.com/unitybase/ubjs/blob/master/packages/ubs/public/reports/click_sample.js#L42) 
   for usage example
  
### Changed
 - for HTML report `this` inside `onReportClick` handler now instance of ReportViewer
 
### Fixed
 - prevent clean of report template data in case only code block of report is updated 
 
## [5.1.41] - 2019-01-03
### Added
 - Report editor form: show warning for server-side test and report reload in case server / client not in dev mode 

## [5.1.40] - 2018-12-28
### Fixed
 - Report editor form: fix unexpected report code cleanup on saving report
 - Report editor form: add a TIP about changing report code; set a report code to read-only for existing reports
  
### Added
 - `ubs_globalCache` virtual entity - expose a server-side global cache content (for debugging purpose)

### Changed
 - add a warning about unnecessary `@report_code` and `@ID` metadata in the report template files; 
  ubs_report virtual entity ignore this template attributes and calculate it from template file name  
 - `ubs_report` cache now flushed for all thread in case insert or update is called. This solve possible
  error when report created in one thread not visible to other until server restart
  
## [5.1.39] - 2018-12-27
### Fixed
 - syntax errors in the report initial template
 - report saving

## [5.1.37] - 2018-12-14
### Added 
 - in case `reportOptions.showParamForm` is true, `reportViewer` will always display the report parameters form, 
   otherwise, the report parameters form will be displayed only if the report option `reportParams` is empty 
   (false by default) 
 ```javascript
$App.doCommand({
  cmdType: 'showReport',
  cmdData: {
    reportCode: 'your-report-code',
    reportType: 'html',
    reportParams: {a: 'b'},
    reportOptions: {
      showParamForm: true
    }
  }
})
```

## [5.1.26] - 2018-11-04
### Changed
 - `ubs.numcounter.autoIncrementalCodeLen` default value decreased from 12 to 6 - codes length `000001` is enough in most case 

## [5.1.25] - 2018-10-17
### Changed
 - `ReportViewer` - styles for `td,th` is removed, so now table header will use body style (see ReportViewer.js line 6)

## [5.1.17] - 2018-09-24
### Changed
 - `reportOptions.allowExportToExcel` allowed value changed from to 'xls' or 'xlsx'. ('xlsx' by default)
   For 'xls' report will be saved as html but with **xls** extension - excel will convert such files on open
   otherwise report will be regenerated as native **xlsx** file
 ```javascript
$App.doCommand({
  cmdType: 'showReport',
  cmdData: {
    reportCode: 'your-report-code',
    reportType: 'html',
    reportParams: {a: 'b'},
    reportOptions: {
      allowExportToExcel: 'xls'
    }
  }
})
```

## [5.1.15] - 2018-09-13
### Added 
 - excel export button added to the ReportViewer in case `allowExportToExcel` report option is true (false by default) 
 ```javascript
$App.doCommand({
  cmdType: 'showReport',
  cmdData: {
    reportCode: 'your-report-code',
    reportType: 'html',
    reportParams: {a: 'b'},
    reportOptions: {
      allowExportToExcel: true
    }
  }
})
```

## [5.1.13] - 2018-09-11
### Fixed
- UBReport: in case `$fn` function argument is empty return empty string instead of `null`
- UBReportViewer: prevent multiple injection of the same CSS for HTML reports 
- UBReportViewer: CSS for hiding header/footer and adding 1cm margins

## [5.1.12] - 2018-09-10
### Fixed
- UBReport: HTML report will replace `<!-- pagebreak -->` placeholder to special element before print
 as in previous TinyMCE implementation  

## [5.1.11] - 2018-09-05
### Fixed
- UBReport: in case `$fn` function argument is empty return empty string instead of `null`

## [5.1.7] - 2018-08-28
### Added 
- in HTML reports `$fs` function will display negative numbers using red text color
  
## [5.1.6] - 2018-08-28
### Fixed
- fix case when reportParams not passed to $App.doCommand for `showReport`
   
## [5.1.5] - 2018-08-27
### Added
- `showReport` command can silently (without asking used for input)
create parametrised report in case `reportParams` parameter contains non-empty object

```javascript
$App.doCommand({
  "cmdType": "showReport",
  "description": "OPTIONAL report form caption",
  "cmdData": {
    "reportCode": "test",
    "reportType": "html",
    "reportParams": {
      "name": "Mark",
      "birthday": new Date(),
      "limitation": 2
    }
  }
})
``` 

## [5.1.0] - 2018-08-11
### Changed
- dramatically increase HTML report viewer by replacing TinyMCE to plain iframe
- report code module now required once in the same manner forms are required
- HMR now works for report code modules

### Added
- generic mechanism for follow hyperlink (drill down) is added to report builder. 
 See report with code click_sample for usage example    

## [5.0.30] - 2018-07-18
### Fixed
- ubs_settings.loadKey & ubs_settings.loadKeys will convert values for keys of type int and number to number using parseInt

## [5.0.23] - 2018-07-05
### Changed
- adminUI will await while ubs model finish query to `ubs_setting` entity for UBS.Settings.findByKey work correctly

## [4.1.49] - 2018-06-18
### Changed
- New parameter 'language' for UBServerReport

## [5.0.18] - 2018-06-06
### Fixed
- `UBS.MessageBar` will be bundled into `@unitybase/ubs`

## [5.0.17] - 2018-06-03
### Fixed
- package will expose and `mustache` as SystemJS module to prevent double-loading

## [5.0.16] - 2018-05-29
### Changed
- speed up UBS.ReportViewer during HTML reports rendering
- removed 15px margins in UBS.ReportViewer

### Fixed
- mustache formatting function **$fs and $fd** (aka Format Sum / Date) will
 format according to current user locale

## [5.0.15] - 2018-05-25
### Fixed
- Collapsing animation of `UBS.ReportParamForm` removed (fixed wrong report align)

## [5.0.14] - 2018-05-24
### Changed
- Report parameter form `UBS.ReportParamForm` now collapsible by default.
  To disable developed should implicitly define `collapsible: false` in
  `UBS.ReportParamForm` descendant inside report code block:

```
exports.reportCode = {
  buildReport: function (reportParams) {
...
  },
  onParamPanelConfig: function () {
    let paramForm = Ext.create('UBS.ReportParamForm', {
      collapsible: false,
      ...
```
- UBS.ReportParamForm now will collapse after BuildReport button pressed

## [5.0.7] - 2018-05-04
### Added
 - introduce method `ubs_numcounter.generateAutoIncrementalCode` - to be used in `insert:before`
 handlers for generation unique codes for entities natural primary key attribute.
 See cdn_profession.js for usage sample.
 - new ubs_settings key `ubs.numcounter.autoIncrementalCodeLen` - resulting length of
 auto incremental code created by `ubs_numcounter.generateAutoIncrementalCode` function

## [4.1.49] - 2018-06-18
### Changed
- New parameter 'language' for UBServerReport

## [4.1.47] - 2018-03-05
### Added
 - ubs_settings.addOrUpdateKey function 
 
## [4.1.43] - 2018-02-17
### Added
- New report type 'xlsx'. For detail see report 'xlsxExample'
- New function for format data types "number" and "date" as string
 for reports. List of function see in formatFunction.js

## [4.1.41] - 2018-01-25
### Changed
- ubs_report.ID now calculated as crc32(file-name-without-extension) as in ubm_form

## [4.1.38] - 2017-12-12
### Added
- report code unique check

## [4.1.25] - 2017-08-16
### Fixed
- Prevent use a browser cache template/code block in report edit form (ubs_report)

## [4.1.20] - 2017-05-17
### Changed
- add ability to pass a <a href> onclick event to HTML report



