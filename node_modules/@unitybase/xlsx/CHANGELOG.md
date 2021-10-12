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

## [5.20.13] - 2021-09-24
## [5.20.12] - 2021-09-08
## [5.20.11] - 2021-08-31
## [5.20.10] - 2021-08-18
## [5.20.9] - 2021-07-08
## [5.20.8] - 2021-05-24
## [5.20.7] - 2021-05-13
## [5.20.6] - 2021-05-05
## [5.20.5] - 2021-04-24
## [5.20.4] - 2021-04-22
## [5.20.3] - 2021-04-16
## [5.20.2] - 2021-04-13
## [5.20.1] - 2021-04-02
## [5.20.0] - 2021-03-25
### Changed
 - migrate build to webpack5

## [5.19.5] - 2021-03-23
## [5.19.4] - 2021-03-15
## [5.19.3] - 2021-03-03
## [5.19.2] - 2021-02-08
## [5.19.1] - 2021-02-03
## [5.19.0] - 2021-02-02
## [5.1.61] - 2021-01-26
## [5.1.60] - 2021-01-19
## [5.1.59] - 2021-01-17
## [5.1.58] - 2021-01-11
### Changed
- improve bulding of `xf` and `alignment` tags (not add excessive spaces in the end) in order to
  provide safe parsing it by [xlsx](https://github.com/SheetJS/sheetjs/blob/master/README.md#parsing-functions)
  Earlier: `<xf xfId="0" applyFont="1"     ></xf>`, now: `<xf xfId="0" applyFont="1" ></xf>`

## [5.1.57] - 2020-12-28
## [5.1.56] - 2020-12-22
## [5.1.55] - 2020-12-21
## [5.1.54] - 2020-12-20
## [5.1.53] - 2020-12-14
## [5.1.52] - 2020-11-25
## [5.1.51] - 2020-11-20
## [5.1.50] - 2020-11-19
## [5.1.49] - 2020-11-15
## [5.1.48] - 2020-11-14
## [5.1.47] - 2020-11-12
## [5.1.46] - 2020-11-10
## [5.1.45] - 2020-11-08
## [5.1.44] - 2020-11-08
## [5.1.43] - 2020-11-05
## [5.1.42] - 2020-11-01
## [5.1.41] - 2020-10-15
## [5.1.40] - 2020-09-23
## [5.1.39] - 2020-09-22
## [5.1.38] - 2020-09-20
## [5.1.37] - 2020-09-01
## [5.1.36] - 2020-08-31
## [5.1.35] - 2020-08-19
## [5.1.34] - 2020-08-19
## [5.1.33] - 2020-07-26
## [5.1.32] - 2020-07-19
## [5.1.31] - 2020-07-01
## [5.1.30] - 2020-06-30
## [5.1.29] - 2020-06-14
## [5.1.28] - 2020-05-25
## [5.1.27] - 2020-05-22
## [5.1.26] - 2020-05-13
### Changed
 - reformat code according to ESLint rules (no functional changes)

## [5.1.0] - 2019-09-11
### Fixed
 - export to excel works without `Cannot read property 'length' of null` exception

## [5.0.45] - 2019-03-01
### Changed
 - use webpack4 for production build

## [5.0.41] - 2019-01-25
### Added
  - adding custom properties to the xlsx document
```
  wb.setCustomProperty('reportID', this.instanceID)
```
 - sheet protection (password is not currently supported)
```
  ws.setWorksheetProtection({
    objects: true,
    scenarios: true,
    formatColumns: false,
    formatRows: false,
    sort: false,
    autoFilter: false,
    pivotTables: false
  })
```

## [5.0.31] - 2018-11-15
### Added
 - preserve spaces is cells by default (required for creating indents)

### Fixed
 - columns properties was applied in incorrect order

## [5.0.26] - 2018-09-13
### Added
 - support of `th` tag during export HTML table to XLSX

## [5.0.16] - 2018-07-12
### Fixed
 - removing special symbols from sheet name. XLSX format does not allow symbols []/\?:* in sheet name

### Added
- support for <br/> tag

## [5.0.15] - 2018-07-06
### Added
- `ubmodel` section adedd to `package.json`, so @unitybase/xlsx model now
 can be added to the application congig in one line
 ```
  "domain": {
      "models": [
	...
        {
          "path": "./node_modules/@unitybase/xlsx"
        },
 ```

## [5.0.14] - 2018-06-10
### Fixed
- **BREAKING** `XLSXWorkbook.render` will return rendered data instead of Promise,
 because we use a synchronous version of JSZip
### Changed
- use external `lodash` library inside bundle (webpack config changed)

## [5.0.13] - 2018-06-03
### Fixed
- for environment with SystemJS (usually browser) package will expose
 `mustache` and `lodash` as SystemJS module to prevent double-loading

## [5.0.11] - 2018-05-24
### Fixed
- XLSXWorkbook.render will use jzsip.generate instead of unsupported in UB jszip.generateAsync

## [4.1.6] - 2018-02-17
### Added
- Converter from HTML to XLSX.

Simple example:
```
const {XLSXWorkbook, XLSXfromHTML} = require('xlsx')
const xmldom = require('xmldom')
const wb = new XLSXWorkbook({useSharedString: false})
const converter = new XLSXfromHTML(xmldom.DOMParser, wb, [{name: 'Лист'}])
converter.writeHtml({html: yourHtmlString})
let content = wb.render()
content = Buffer.from(content)
fs.writeFileSync('./testHtml.xlsx', content, 'binary')
```

Full example './_examples/testHtml.js'

## [4.1.0] - 2017-11-24
### Added
- Use javascript classes instead Ext.js classes
- Add rgb color in styles

```
wb.style.fills.add({fgColor: {rgb: 'FFCFE39D'}})
```

