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

## [5.5.9] - 2021-09-08
## [5.5.8] - 2021-08-04
### Added
 - accept `attachName` (in addition to `atachName`) property of attaches object - property name
   (new is attachName) is fixed in ubq@5.20.19 

## [5.5.7] - 2021-07-08
## [5.5.6] - 2021-05-24
## [5.5.5] - 2021-04-24
## [5.5.4] - 2021-03-23
## [5.5.3] - 2021-03-15
### Changed
  - `ubm_desktop-scanerSettings-fm` increased the maximum value of page margins for the barcode 
    configuration to 999 pixels instead of 100 pixels [CUBDF-823]  

## [5.5.2] - 2021-02-08
## [5.5.1] - 2021-01-26
## [5.5.0] - 2021-01-17
### Added
  - TubMailSender.login method - must be called in case deferLogin === true in a constructor.
  - TubMailReceiver.login method - must be called in case deferLogin === true in a constructor.
  - temporary added a `Mailer:..` debug messages to locate a source of AV in sending mail
  - if compiled with -dMAILAV_TEST POP3/ST wrote additional logs into /tmp/ub_mailerlog.txt

### Changed
  - Linux: recompile module with FPC_SYNCMEM support (aligned memory allocations)

### Fixed
 - attachment `contentID` property(if specified) handled for both `Text` kind of attachment and `File` kind,
   not only for Text kind as before this fix. contentID property is used in HTML e-mails to
   identify pictures in HTML what placed in attachments.

## [5.4.2] - 2021-01-11
## [5.4.1] - 2020-11-25
## [5.4.0] - 2020-11-23
### Added
 - notes in the README about SSL setup for Linux
 - `UBMail.UBMailImap` class - receive mail using IMAP protocol
 - `UBMail.TubMailReceiverImap` - a direct replacement for `UBMail.TubMailReceiver` but uses IMAP instead of POP3  
 - `fullSSL` property added for `TubMailReceiver`, `TubMailSender` and `TubMailImap`.
   If `true` - setup TLS before any command to mail server. See README for OpenSSL requirements.
   
## [5.3.8] - 2020-11-19
## [5.3.7] - 2020-11-15
## [5.3.6] - 2020-11-14
## [5.3.5] - 2020-11-12
## [5.3.4] - 2020-08-19
## [5.3.3] - 2020-08-19
## [5.3.2] - 2020-07-26
### Changed
 - building of native code depend on LCL

### Removed
 - cross-compilation from Windows to Linux is removed - use linux build environment to build both Win64 & Linux targets

## [5.3.1] - 2020-07-19
## [5.3.0] - 2020-07-15
### Changed
 - building of native code does not depend on lazarus (fpc is enough)

### Fixed
  - remove exception `_bt is not defined` in case `@unitybase/mailer` is not compiled (lerna bootstrap on the machine where
   fpc is not installed). In this case server output warning `UBMail is not compiled` to console and continue execution.  

## [5.2.2] - 2020-06-14
## [5.2.1] - 2020-03-09
## [5.2.0] - 2020-02-29
## [5.1.27] - 2020-02-14
### Changed
 - binary compatibility with UB 5.17.14

## [5.1.26] - 2020-02-10
## [5.1.25] - 2020-02-08
## [5.1.24] - 2020-01-31
## [5.1.23] - 2020-01-13
### Added
 - optional `contentID` attribute for e-mail attachment. If contentID is defined for attachment it can be used in mail body
   for example to display embedded image as such:
 
   ```javascript
    const contentID = 'ub-generated-image-1'
    //inside e-mail body
    const eMailBody = `<img id="footer-logo" src="cid:${contentID}" alt="UB logo" title="UB logo" width="36" height="36" class="image_fix">`
   ```

## [5.1.22] - 2020-01-11
## [5.1.21] - 2019-12-17
### Fixed
 - linux build: links to valid `libsynmozjs52.so`

## [5.1.17] - 2019-11-30
### Fixed
 - force mailer instance to be destroyed by JS engine in the same thread it's created (JSCLASS_FOREGROUND_FINALIZE)

## [5.1.16] - 2019-11-19
### Fixed
 - prevent expose a package to client by adding `"config": {"ubmodel": {} }` into package.json
 
## [5.1.0] - 2018-08-29
### Fixed
- Ubuntu 18 support

## [5.0.13] - 2018-07-24
### Fixed
- fix adding of attachments in case it is a ArrayBufferView and sliced before adding

## [5.0.6] - 2018-04-24
### Changed
- @unitybase/mailer-ssl removed. @unitybase/mailer now can create ssl connection (openSSl must be installed)

## [5.0.0] - 2018-04-22
### Removed
 - UBMail.getBodyFromMessage is removed. Use `UBMail.getBodyPart(mimeMsg).read()` instead

### Added
 - `TMimePartBind.read` method - implement a UBReader
