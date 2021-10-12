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

## [5.2.3] - 2021-09-08
### Added
 - `TimesNewRoman_Cyr`: Hyphen and dashes added (0x2010 - 0x2014)

## [5.2.2] - 2021-08-18
## [5.2.1] - 2021-08-09
### Added
 - `TimesNewRoman_Cyr`: added `&nbsp` `§` and `®` signs
 - font mapping feature added. Allows to use a font subset for specified fonts to reduce PDF size without
   change a PDF generation source code. See README for details

## [5.2.0] - 2021-08-04
### Added
 - TimesNewRoman_Cyr font added - a subset of TimesNewRoman with English, Cyrillic and punctuation only. Can be used to create small (-350Kb) Cyrillic PDFs.

   Included characters are: 
   ```!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_abcdefghijklmnopqrstuvwxyz{|}~©«´»ЁЂЃЄЅІЇЈЉЊЋЌЍЎЏАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюяѐёђѓєѕіїҌҍҐґ‘’‚‛“”„‟′″‴‵‶‷‸‹›№```

## [5.1.0] - 2021-03-25
### Changed
 - migrate build to a webpack5

## [5.0.31] - 2020-04-10
### Fixed
 - fix potential invalid position calculation in HTLMToPdf (invalid use of let inside switch)

## [5.0.30] - 2020-03-09
## [5.0.29] - 2020-01-31
## [5.0.28] - 2019-12-17

## [5.0.27] - 2019-12-12
### Fixed
 - long text box now correctly spilled onto more when 2 pages (PDFtextBox)

## [5.0.26] - 2019-12-11
### Fixed
 - PDFtextBox with textIndent incorrect split on page

## [5.0.25] - 2019-12-11
### Fixed
 - invalid size of text-indent attribute in htmlToPDF transformation 

## [5.0.22] - 2019-08-13
### Fixed
 - invalid PDF file format in case `ArialBoldItalic` font is used

## [5.0.20] - 2019-05-21
### Changed
 - `optionalDependencies` are moved to `devDependencies` to prevent install it even when `NODE_ENV=production`    

## [5.0.18] - 2019-03-01
### Changed
 - use webpack4 for production build

## [5.0.16] - 2019-02-15
### Added
- New font [Tryzub](http://artalbum.org.ua/ru/font#Tryzub) for Ukrainian state symbols

## [5.0.14] - 2018-12-27
### Added
- Arial GEO bold italic registration corrected

## [5.0.13] - 2018-12-14
### Added
- New font set with Georgian language support for formatted pdf generation - Arial GEO

## [5.0.12] - 2018-11-27
### Added
- Font SylfaenNormal with georgian characters

## [5.0.10] - 2018-08-08
### Fixed
- `PrintToPDF.requireFonts` documentation
- parameter "compress" of constructor PrintToPdf was not enable content compression

## [5.0.7] - 2018-06-26
### Added
- `ubmodel` section added to `package.json`, so @unitybase/pdf model now
 can be added to the application config in one line
 ```
  "domain": {
      "models": [
	...
        {
          "path": "./node_modules/@unitybase/pdf"
        },
 ```

## [5.0.7] - 2018-06-26
### Fixed
- invalid PDF file format in case timesNewRomanBoldItalic font is used

## [5.0.6] - 2018-05-24
### Fixed
- unicode-text plugin will require `lodash` instead of using lodash from global

## [1.1.22] - 2017-09-14
### Fixed
 - module PDF: Module throw error when html contains &frac14; 

## [1.1.17] - 2017-06-01
### Fixed
 - module PDF: If textBox has defined high and sptitOnPage=true it will split not correct

## [1.1.15] - 2017-04-27
### Fixed
- HTML2PDF: Fix exception when convert broken HTML to PDF at server side. The HTML has invalid colspan value.


## [1.1.14] - 2017-04-12
### Added
- HTML2PDF: handle TimesNewRoman Bolt + Italic font (new font added)
- add Deflater compression

### Fixed
- HTML2PDF: fixed incorrect justify align in case block element contains several fonts 



