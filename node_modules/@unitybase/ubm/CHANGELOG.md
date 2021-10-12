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
### Changed
- English (en) localization for desktop/shortcut captions: the words are
  capitalized according to English rules for captions

## [5.20.24] - 2021-09-08
## [5.20.23] - 2021-09-02
## [5.20.22] - 2021-08-31
### Changed
- ubm_query navigation shortcut now shows "Type" column

## [5.20.21] - 2021-08-18
### Added
 - form implementation for the `ubm_sysdictionary` entity to validate ubql for JSON
 - migration to fix `ubm_query.type` for old entries mapped from the ubm_sysdictionary

### Changed
 - make the form for the `ubm_query` similar with standard UAutoForm

### Fixed
 - fix typo in the ru localization for the system dictionaries shortcut

## [5.20.20] - 2021-08-09
## [5.20.19] - 2021-08-04
### Added
 - Dutch (nl) localization

### Fixed
 - prevent override adm_desktop defined by UDA model during migration
 - localization of the shortcut for `ubm_sysdictionary` entity
 - deny direct modification of UNITY `ubm_query`
 - disabling of editing `ubm_query.ubql` on the form
 - displaying of the control for editing of `ubm_sysdictionary.ubql` - remove `defaultView: false` for this attribute

## [5.20.18] - 2021-07-18
### Added
 - Dutch (nl) localization

## [5.20.17] - 2021-07-08
### Removed
 - `usrDict` value of the `UBM_QUERY_TYPE` enum

### Fixed
- default value for `type` attribute of the `ubm_sysdictionary` entity

## [5.20.16] - 2021-06-14
### Changed
 - improved template for new vue form

## [5.20.15] - 2021-05-24
## [5.20.14] - 2021-05-13
## [5.20.13] - 2021-05-07
## [5.20.12] - 2021-05-05
## [5.20.11] - 2021-04-24
## [5.20.10] - 2021-04-23
## [5.20.9] - 2021-04-22
## [5.20.8] - 2021-04-19
## [5.20.7] - 2021-04-19
### Changed
 - `ubm_navshortcut` form layout changed to `u-grid` + attributes tree UI improved

## [5.20.6] - 2021-04-16
## [5.20.5] - 2021-04-13
## [5.20.4] - 2021-04-02
### Fixed
 - ubm_query JSON to clob migration (for Oracle) not fails during migration from a version where  ubm_query table does not exists

## [5.20.3] - 2021-04-01
## [5.20.2] - 2021-03-30
## [5.20.1] - 2021-03-29
## [5.20.0] - 2021-03-25
### Added
- `ubm_sysdictionary` entity, navigation shortcut for the entity (the auto form is used).
  This entity is a copy of the old `ubm_query` entity that contains information about system dictionaries.

### Changed
- **BREAKING** `ubm_query` entity is used only as a unity entity for others now. Adding to
  `ubm_sysdictionary` now is equivalent to adding to `ubm_query` table. So if you add entries
  using `ub-migrate` for example, it should be tweaked as described below:
```yml
$context:
  type: ubm_query

region:
  name: {en: Regions, ru: Регионы, uk: Регіони}
  ...
```
to:
```yml
$context:
  type: ubm_sysdictionary

region:
  name: {en: Regions, ru: Регионы, uk: Регіони}
  ...
```

- UBM model now uses `ub-migrate` for adding/updating enums, navigation items and roles
- 'UBM_READ_USERS' & 'UBM_READ_EVERYONE' ELS rules removed in flavor of UBM_READ_USER added by ub-migrate

## [5.19.9] - 2021-03-23
## [5.19.8] - 2021-03-17
## [5.19.7] - 2021-03-16
### Fixed
- Cleaned up `ubm_diagram` and `ubm_form` localization (ru, ka, tg) from non-existing attribute

## [5.19.6] - 2021-03-15
## [5.19.5] - 2021-03-15
### Added
 - implicitly disable multitenancy mixin for `ubm_desktop`, `ubm_enum` and `ubm_navshortcut`

### Changed
 - UBM forms, reports and er-diagrams are converted to `ubrow` format

### Fixed
- scanner settings form - `Multiple page` checkbox becomes disabled in case `JPEG` format is selected
- `ubm_navhortcut` form: 
   - attributes tree is filled for both JSON and JS shortcut code type (`"entity": ".."` and `entityName: '...'`).
     Before this fix only double quotes is recognized
   - form layout changed do be more compact (internally rewritten to u-grid + u-auto-field)  

## [5.19.4] - 2021-03-03
### Changed
 - client side locales reformatted into JSON

### Removed
 - i18n for FR related scanner (recognition) settings is remover (FR not used anymore)

## [5.19.3] - 2021-02-10
## [5.19.2] - 2021-02-08
## [5.19.1] - 2021-02-03
## [5.19.0] - 2021-02-02
## [5.4.49] - 2021-01-30
## [5.4.48] - 2021-01-28
## [5.4.47] - 2021-01-26
## [5.4.46] - 2021-01-19
### Added
 - shortcut editor - added template (Ctrl + Q) for Vue based `showList` command

## [5.4.45] - 2021-01-17
## [5.4.44] - 2021-01-11
## [5.4.43] - 2020-12-30
## [5.4.42] - 2020-12-28
## [5.4.41] - 2020-12-22
## [5.4.40] - 2020-12-21
## [5.4.39] - 2020-12-20
## [5.4.38] - 2020-12-17
## [5.4.37] - 2020-12-16
## [5.4.36] - 2020-12-14
### Added
 - Oracle: added migration to transform ubm_query json attribute from NVARCHAR to CLOB 

## [5.4.35] - 2020-12-09
## [5.4.34] - 2020-12-09
## [5.4.33] - 2020-12-02
## [5.4.32] - 2020-11-25
## [5.4.31] - 2020-11-23
## [5.4.30] - 2020-11-20
## [5.4.29] - 2020-11-19
## [5.4.28] - 2020-11-15
## [5.4.27] - 2020-11-14
## [5.4.26] - 2020-11-12
### Fixed
- fix last used scanner and supplement type for UBScan on scanner settings form
 
## [5.4.25] - 2020-11-10
### Fixed
- `ubm_desktop-scanerSettings-fm`: fixed correct settings saving and localization [UBDF-12670], [LDOC-1010],
    [LDOC-1041], [LDOC-1011], [LDOC-1015]

## [5.4.24] - 2020-11-08
## [5.4.23] - 2020-11-08
## [5.4.22] - 2020-11-05
## [5.4.21] - 2020-11-01
## [5.4.20] - 2020-10-20
## [5.4.19] - 2020-10-15
### Changed
 - scanner settings form rewritten to vue

### Deprecated
 - ABBY settings is removed from scanner settings form - use OCR service instead of ABBY 

## [5.4.18] - 2020-09-23
## [5.4.17] - 2020-09-22
## [5.4.16] - 2020-09-21
## [5.4.15] - 2020-09-20
## [5.4.14] - 2020-09-08
## [5.4.13] - 2020-09-01
## [5.4.12] - 2020-08-31
## [5.4.11] - 2020-08-19
## [5.4.10] - 2020-08-19
### Added
 - Tajik locale translation
 
## [5.4.9] - 2020-08-03
## [5.4.8] - 2020-07-29
## [5.4.7] - 2020-07-28
## [5.4.6] - 2020-07-26
## [5.4.5] - 2020-07-19
## [5.4.4] - 2020-07-16
## [5.4.3] - 2020-07-15
## [5.4.2] - 2020-07-08
## [5.4.1] - 2020-07-01
## [5.4.0] - 2020-06-30
### Changed
 - ub-migrate `_data` formats.js changed to use export function  

## [5.3.17] - 2020-06-24
## [5.3.16] - 2020-06-21
## [5.3.15] - 2020-06-15
## [5.3.14] - 2020-06-15
## [5.3.13] - 2020-06-14
### Changed
 - ubm_desktop & ubm_navshortcut now use a "functional RLS" (require UB@5.18.4) 
  
## [5.3.12] - 2020-05-25
## [5.3.11] - 2020-05-22
## [5.3.10] - 2020-05-17
### Changed
 - replace most font-awesome and element-ui to UB icons analog
 
## [5.3.9] - 2020-05-13
## [5.3.8] - 2020-05-06
## [5.3.7] - 2020-04-24
### Changed
 - `ubm_navshotrcut.iconCls` property caption changed from "icon css class name" -> "Icon (CSS class)" (also for ru and uk) 

## [5.3.6] - 2020-04-10
### Changed
 - ubm_navshortcut.isFolder i18n changed for uk/ru `Папка -> Группа` 

## [5.3.5] - 2020-03-30
## [5.3.4] - 2020-03-20
## [5.3.3] - 2020-03-17
## [5.3.2] - 2020-03-09
## [5.3.1] - 2020-03-04
## [5.3.0] - 2020-02-29
### Changed
 - entities localization files (*.meta.??) are moved to `meta_locale` folder
 
## [5.2.53] - 2020-02-23
### Added
 - scanner settings - adds a PDF/A output format - to be used in nm-scanner plugin 

### Fixed
 - shortcut editor will recognize both `"entity": "entityCode"` & `"entityName": "entityCode"` while parsing
 a command text for building attributes tree 

## [5.2.52] - 2020-02-18
## [5.2.51] - 2020-02-13
## [5.2.50] - 2020-02-10
## [5.2.49] - 2020-02-08
## [5.2.48] - 2020-02-03
## [5.2.47] - 2020-01-31
## [5.2.46] - 2020-01-17
### Changed
 - rewrote `010_create_navshortcuts.js` config for rendering ubm forms on vue

## [5.2.45] - 2020-01-11
## [5.2.44] - 2020-01-03
## [5.2.43] - 2020-01-02
### Added
 - `ubm_desktop-fm` form rewritten to Vue
 - `ubm_desktop` new attribute `displayOrder` - desktop display order in the sidebar

## [5.2.42] - 2019-12-30
## [5.2.41] - 2019-12-27
## [5.2.40] - 2019-12-20
## [5.2.39] - 2019-12-18
## [5.2.38] - 2019-12-17
### Added
 - Vue form template now adds component name for form component (name: 'form-code'). This simplify debugging using VueDevTools
 - double click on attribute in form editor will add `<u-auto-field>` to the form JS for Vue forms
   
## [5.2.32] - 2019-12-09
### Added
 - `ubm_query` entity, navigation shortcut for the entity (autoform is used).  The entity is intended to be used as
   as "dictionary of dictionaries" and contain actual UBQL (as a JSON attribute) to be executed.  Useful for any sort
   of custom fields, which need to refer system dictionaries.

## [5.2.30] - 2019-10-12
### Added
 - `ubm_desktop` props `description` and `iconCls`. Now can set description and icon for desktop which will show in sidebar desktop selector
 - `ubm_navshortcut` optional prop `description` not used yet, but will later be displayed in the sidebar
 - `ubm_navshortcut` optional prop `keywords` it needed to improve search

## [5.2.16] - 2019-09-20
### Fixed
 - added localization for shortcut form editor caption

## [5.2.0] - 2019-07-22
### Changed
 - all meta files and they localization transformed to array-of-attributes format

## [5.1.33] - 2019-07-06
### Fixed
 - icon selection in umb_navshortcur form now works in fireFox 

## [5.1.27] - 2019-06-20
### Changed
 - shortcut editor form: highlight currently selected folder in ShortcutTree control
 - Entity metadata editor is moved form ubdev model into UMB. double-click on entity inside diagram opens entity metadata editor 

## [5.1.26] - 2019-06-15
### Changed
 - UBM model lang files are converted to array-of-object format

## [5.1.25] - 2019-06-14
### Changed
 - Shortcut edit/creation form now showed in tab instead of modal window 
 
## [5.1.24] - 2019-06-12
### Fixed
 - added missed caption for `ubm_navshortcut` form
 - VueJS form template modified according to current form boilerplate

## [5.1.22] - 2019-06-10
### Fixed
 - Form editor now recognize a Vue form syntax (mixed HTML + js) 

## [5.1.21] - 2019-06-09
### Changed
 - `ubm_navshortcut` form rewritten to Vue

## [5.1.11] - 2019-03-11
### Fixed
 - insertion of form with type `module` do not throw error

## [5.1.10] - 2019-03-06
### Changed
- **BREAKING** `vue` forms definition extension changed from `js` to `vue`. Existed `vue` forms should be renamed manually 
 `git mv my_entity-fm.js my_entity-fm.vue`
 
## [5.1.7] - 2019-02-23
### Changed
 - ubm_form.ID calculated as `crc32(form_code + form_model)` instead of `crc32(form_code)` to prevent
 ID's conflict between overrated forms
 
## [5.1.0] - 2018-12-29
### Changed
 - `ubm_form` & `ubm_diagram` cache now flushed for all thread in case insert or update is called. This solve possible
 error when form/diagram created in one thread not visible to other until server restart  
 
## [5.0.66] - 2018-11-18
### Added
 - In PRODUCTION mode form editor will show warning box about page reloading for applying changes  

## [5.0.61] - 2018-10-06
### Changed
 - because of fix in `$.currentUserOrUserGroupInAdmSubtable` RLS macros rights for `ubm_navshortcut` & `ubm_desktop` 
 now can be granted to `Everyone` `User` `Anonymous` 

## [5.0.12] - 2018-05-18
### Fixed
- fix creation of a new pureExtJS form from adminUI

## [4.0.48] - 2018-01-10
### Changed
- `ubm_navshortcut` now not cached on entity level (admin UI cache it using it own mechanism)
This change is required to prevent massive CLOB fetching (cmdData attribute)

## [4.0.39] - 2017-09-14
### Added
 - useful code snippets added to a form builder for def and js parts

## [4.0.36] - 2017-09-06
### Added
 - new shortcut form now contains a comment about code snippet usage
 - showReport code snippet added to shortcut form

## [4.0.27] - 2017-05-11

### Fixed
- added unique index for instanceID + admSubjectID for ubm_desktop_adm.meta & ubm_navshortcut_adm.meta 
