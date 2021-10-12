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

## [5.21.21] - 2021-09-24
### Fixed
 - `ubcli migrate` update an `ub_version.appliedAt` attribute using current date.
  Before this fix appliedAt is not updated (remains the same as on insertion)   

## [5.21.20] - 2021-09-16
### Fixed
 - do not logout user in case certificate is inserted - instead logout in case certificate is updated

## [5.21.19] - 2021-09-08
## [5.21.18] - 2021-09-02
## [5.21.17] - 2021-08-31
## [5.21.16] - 2021-08-18
## [5.21.15] - 2021-08-09
## [5.21.14] - 2021-08-04
## [5.21.13] - 2021-07-18
## [5.21.12] - 2021-07-08
## [5.21.11] - 2021-06-14
### Fixed
- `migrate` command now tolerate multiple records in `ub_version` table for the same model,
  it takes the most recent version

## [5.21.10] - 2021-05-24
### Fixed
- DDL generator includes `mi_tenantID` for unique indexes of multi-tenant entities

## [5.21.9] - 2021-05-13
## [5.21.8] - 2021-05-07
### Fixed
 - `ubcli generateDDL` for Oracle: fixed referential constraint generation in case referenced table is located in
  another schema (in such case constraint UNEXPECTEDLY owned by reference table schema)

## [5.21.7] - 2021-05-05
### Fixed
 - `ubcli generateDDL`: fixed referential constraint generation in case referenced entity,
   or it's primary key attribute has a mapping
- `ubcli generateDDL`: prevent reading of database / roles list in case neither `-drop` nor `-create` is passed.
  This allows to init an existed DB for user without DBA privileges

## [5.21.6] - 2021-04-24
## [5.21.5] - 2021-04-23
## [5.21.4] - 2021-04-22
## [5.21.3] - 2021-04-19
## [5.21.2] - 2021-04-19
### Added
 - `ubcli generateDDL` create a backup script in case previous DDL generation script exists (by adding .bak to file name)

### Changed
 - `ubcli generateDDL` for Oracle - dramatically speed up by reset a connection NLS_SORT and NLS_COMP to BINARY - 
   this allows Oracle to use indexes for queries over system views. 

### Fixed
 - `ubcli generateDDL` fixed for Oracle **sequences** defined in metadata `pkGenerator`:
    - prevents to create a **sequence** what accessible for connection but don't owned by it (synonyms etc).
      Fixed by read available sequences using `ALL_SEQUENCES` system view instead of `user_sequences`
    - prevent to create a sequence multiple times in case it used as `pkGenerator` for several entities  
    - prevent generate a DDLs for External/Virtual entities what referenced from models DDL generator is executed for
 - `ubcli generateDDL` - added table and field names to exception message in case of invalid or unsupported
   default value for Date/DateTime attribute is defined in metadata   

## [5.21.1] - 2021-04-16
## [5.21.0] - 2021-04-13
### Added
 - `ubcli generateNginxCfg` adds in-memory buffering of incoming requests and outgoing responses to nginx config.
   This prevents nginx to create temp files for buffering in most case
 - `tid` parameter for `ubcli migrate`, so that `ubcli migrate -noddl -tid 199` may be used for tenant initialization
   (will require @unitybase/ub-migrate@1.20+, with 1.19 will just ignore the param)

## [5.20.5] - 2021-04-02
### Fixed
 - **BREAKING** `ubcli generateDDL -m MODEL1,MODEL2` generates a DDL for entities what initially defined in the
  MODEL1 and MODEL2. Before this fix DDL generator skip entities defined in MODEL1 but overridden in MODEL_X (what not in -m list)

## [5.20.4] - 2021-04-01
## [5.20.3] - 2021-03-30
### Fixed
  - `ubcli migrate`: fix for parameter `-ddlfor`

## [5.20.2] - 2021-03-30
### Added
 - `ubcli migrate`: new parameter `-ddlfor model1,model2,...` - allows to specify
   a model list DDL generator is limited for. **For legacy apps**
   Option value is passed as a `--models` to `ubcli generateDDL`

## [5.20.1] - 2021-03-29
## [5.20.0] - 2021-03-25
## [5.19.8] - 2021-03-23
## [5.19.7] - 2021-03-17
### Changed
 - `ubcli convertDefFiles` produce simplified BLOB info (only origName is stored instead of JSON)

## [5.19.6] - 2021-03-15
### Added
 - added multitenancy support for `generateDDL`
 - implemented generateDDL multitenancy support for Postgres
 - `ubcli generateNginxCfg` support multitenancy (by adding a *. for `server_name` directive)

### Fixed
 - `ubcli generateNginxCfg` consider default for `serverConfig.metrics.enabled` is true, so correctly adds
   allow rules for `metrics` endpoint as configured in `serverConfig.metrics.allowedFrom`

## [5.19.5] - 2021-03-03
## [5.19.4] - 2021-02-25
### Added
 - `ubcli execSql` command accept `-v` parameter for a verbose mode.
   In the verbose mode each executed SQL statement will be logged into console 
 - `ubcli migrate`  command accept `-v` parameter for a verbose mode and `-p` parameter for progress.
   Both a passed to execSql, this allows output all executed SQL statement into a console (SQL statement logging) 

## [5.19.3] - 2021-02-10
## [5.19.2] - 2021-02-08
## [5.19.1] - 2021-02-03
## [5.19.0] - 2021-02-02
## [5.12.5] - 2021-01-30
## [5.12.4] - 2021-01-26
## [5.12.3] - 2021-01-19
## [5.12.2] - 2021-01-17
## [5.12.1] - 2020-12-30
### Fixed
 - `execSql` (also used in generateDDL) in optimistic mode will explicitly rollback transaction on errors.
   This prevents `current transaction is aborted, commands ignored until end of transaction block` error
   for subsequent queries on Postgres. 
   
## [5.12.0] - 2020-12-28
### Added
 - `ubcli generateNginxCfg` will add `includes` directives into generated config - this allows to extend application reverse proxy 
   configuration without modifying of generated `conf` file.
   See [Extending autogenerated config](https://unitybase.info/api/server-v5/tutorial-reverse_proxy_nginx.html#extending-autogenerated-config)
   section of Reverse Proxy tutorial.

### Changed
 - `ubcli generateDDL` SUFFIXES index - avoid create an index organized table (clustered PK for (tail, sourceID) on SQL Server),
   because it causes a deadlock on hi-load. Instead, create two separate index - one on `sourceID` and one on `tail`.

### Fixed
 - `ubcli generateNginxCfg` - use `$remote_addr` instead of `$realip_remote_addr` to set a remoteIPHeader (X-Real-IP by default).
   This allows to use a [ngx_http_realip_module](http://nginx.org/en/docs/http/ngx_http_realip_module.html) to
   correctly define a real client IP address - see example in 
   [Extending autogenerated config](https://unitybase.info/api/server-v5/tutorial-reverse_proxy_nginx.html#extending-autogenerated-config)
   section of reverse proxy tutorial

## [5.11.5] - 2020-12-22
### Added
 - allow to specify a folder (or file for single-sile) migration name in dotted notation for better human readability.
   Such versions are transformed to 9-digits notation just after reading a file names and
   all other operations (sorting, comparing, inserting in ub_migration table) are done with normalized file names.
   
   So instead of `001001001-initial.sql` `1.01.01-initial.sql` or even `1.1.1-initial.sql`(not recommended)
   can be used (the same with folder names).
   
   Existed migrations can be safely renamed even if they are already applied, because names are normalized **before**
   they written/compared with DB versions. Full Backward compatibility - no breaking changes.


## [5.11.4] - 2020-12-21
## [5.11.3] - 2020-12-20
### Added
 - `ubcli migrate` will skip files what intended for migrate to the model version prior to the current DB state.
   For example if ub_version table contains row with `modelName=UBA` and `version=005018021` all files and folders in
   `@unitybase/uba/_migrate` folder what starts from 9 digits what smaller than 005018021 are skipped.

   This prevents to apply an outdated migrations what do the same things `ubcli initialize` already did for new application.  

## [5.11.2] - 2020-12-16
### Fixed
 - SQL Server DDL generation - fix error ` Property 'MS_Description' already exists` by using `sp_updateextendedproperty` if previous comment is ''.

## [5.11.1] - 2020-12-14
### Added
 - `migrate`: a new hook `_beforeDDLc_` (_hooks.beforeGenerateDDLc) is added - called after `_beforeDDL_` but before
  generateDDL. The difference from `__beforeDDL_` - an HTTP connection to server (conn parameter) is available for this hook.   

### Changed
 - DDL generator uses the same sources for all RDBMS to generate an `update` statement for fields with `not null` and for
  fields with `defaultValue`

### Fixed
 - `changePassword` endpoint - deprecated `forUser` parameter is removed. To change a password for other user by `Supervisor`
   `uba_user.changeOtherUserPassword` method should be used everywhere (as it is already done on uba_user form)
 - `ubcli migrate` will check `ub_migration` table exists before applying a `_beforeDDL_` hooks.
   If table does not exist, it will be created, so names of `_beforeDDL_` hooks files can be inserted into `ub_migration` table.

## [5.11.0] - 2020-12-09
### Added
 - `ubcli generateNginxCfg` - added `/metrics` endpoint restriction generation using
   ubConfig `metrics.allowedFrom` setting. 

### Changed
 - Oracle: DDL generator creates CLOB field for attributes of type `JSON`.

  **WARNING** manual migration of  `_beforeDDL_` type is required for each JSON attribute.
  Create a file named `010_beforeDDL_OraVarchar2CLOB.sql` (${TBL} and ${ATTR} should be replaced
  by entity and attribute for JSON attributes):    
  ```
<% if (conn.dialect.startsWith('Oracle')) { %>
    ALTER TABLE ${TBL} ADD (${ATTR}_c CLOB);
    --
    UPDATE ${TBL} SET ${ATTR}_c = ${ATTR} WHERE 1=1;
    --
    ALTER TABLE ${TBL} DROP COLUMN ${ATTR};
    --
    ALTER TABLE ${TBL} RENAME COLUMN ${ATTR}_c TO ${ATTR};
<% } %>
  ``` 


### Fixed
 - `ubcli generateNginxCfg` - `/clientRequire` location will try `$uri` `$uri/.entryPoint.js` `$uri.js` (`$uri/.entryPoint.js` added).
  This prevents an unnecessary redirect for folders, for example `GET http://localhost/clientRequire/asn1js`
  will return `inetpub/clientRequire/asn1js/entryPoint.js` instead of redirect to `http://localhost/clientRequire/asn1js/`. 

## [5.10.2] - 2020-12-02
### Changed
 - `ubcli generateDDL` - default value for `-host` changed to `auto` as in all other `ubcli` commands
- `ubcli genSuffixesIndexInitScript` -  default value for `-host` changed to `auto`

### Fixed
 - Postgres DDL generator: prevent re-create default value constraint for `Json` attributes with `defaultValue` (fix #109) 

## [5.10.1] - 2020-11-25
## [5.10.0] - 2020-11-23
### Added
  - `ubcli execSql`: `-withResult` option added - if passed then expect last statement in the batch to be a statement what
     returns a result, exec it using runSQL and returns a result as JSON
     
  ```shell script
   ubcli execSql -sql 'select * from uba_user' -withResult
   # run a statement and output colored beautified result
   ubcli execSql -sql 'select * from uba_user' -withResult -noLogo | sed -n "/--BEGIN/,/--END/p" | tail -n +2 | head -n -2 | jq -r .
  ```   
      
## [5.9.8] - 2020-11-20
### Added
 - `ubcli generateNginxCfg` - added internal location `location /{{sendFileLocationRoot}}/models`
   mdb BLOB store redirect to it a `getDocument` requests. This fix problem on production deployment
   when `cmodels` is located in the `/var/opt/..`.
  
## [5.9.7] - 2020-11-19
## [5.9.6] - 2020-11-15
### Fixed
 - `ubcli migrate` - prevent duplicate model insertion into `ub_version` for Postgres.
 For Postgres direct query execution using `DBConnection.selectParsedAsObject` without filed aliases in SQL 
 returns field names in lower case, so `select ID, modelName...` returns `[{id: 1, modelname: "}, ..]`).
 The solution is to specify alias  `select ID ad "ID", modelName as "modelName" ....` - in this case result will be
 as expected `[{ID: 1, modelName: "}, ..]`.
 
 Notes - for Oracle fields without aliases is UPPERCASE'S, so alias is mandatory for cross-db solutions.

## [5.9.5] - 2020-11-14
### Added
 - `ubcli generateNginxCfg`: new parameter `-nginxPort` - a port for nginx `listen` directive. If not specified then equal to
 `httpServer.externalURL` port (if specified, like http://server.com:8083, of 80/443 for short notation of externalUrl).
 
 Use this parameter in 2-proxy configurations. 

## [5.9.4] - 2020-11-12
### Changed
 - `ubcli generateNgingCfg`: a final message for CentOS propose to link config to `/etc/nginx/conf.d`
   instead of `/etc/nginx/sites-available` for Ubuntu

## [5.9.3] - 2020-11-10
### Added
  - all `ubcli` command what accept -host parameter now automatically discovers a server URL from ubConfig 
  if `-host auto` (or UB_HOST=auto env var) is not explicitly defined. This helps to use `ubcli` in CI script.
   
### Changed
 - `ubcli execSql` will log first 30 chars of statement for `-sql` mode instead of `-sql` word

## [5.9.2] - 2020-11-08
### Changed
 - removed many unnecessary logging messages form `ubcli` tools output. 

## [5.9.1] - 2020-11-08
### Changed
 - `ubcli createStore`: minimize console output by notify only for newly created directory path 
 - `ubcli execSql` mute per-statement exception in case it contains `--@optimistic` comment somewhere in text.
   In example below in case table1 already exists exception wil be muted. For table2 - will be raised (`--@optimistic` not in statement text).
```
--@optimistic
create table1 ....
--
create table2...
```

### Fixed
 - `ubcli migrate`: command line doc added
 - `ubcli linkStatic`: skip creation of `.entryPoint.js` for modules with **folder** entry-point
   For example: `"main": "./src"` in package.json.
   Such links create a file system loop. In any case they can't be required from client side by systemJS.
 - if invalid arguments is passed to the `ubcli` command it exits with exit code 1.
   This prevents a batch script from further execution in case of invalid command.

## [5.9.0] - 2020-11-05
### Added
 - `ubcli execSql`: new option `-sql script` added for execute SQL script from string. Usage sample:
```shell script
ubcli execSql -sql 
### Fixed
- DDL generator will skip attributes mapped to another existed attribute
BEGIN\n import_users.do_import;\n END;--\n delete from aa where 1=0;'
``` 

 - `ubcli migrate` - see [Version migrations tutorial](https://unitybase.info/api/server-v5/tutorial-migrations.html)
 - `ubcli initialize` will fill `ub_version` table by versions of the models on the moment of initialization

### Changed
 - `linkStatic` command uses realpath for a config to search for `node_modules`.
   This allows using `linkStatic` in product based apps, where config is sym-linked from `/opt/unitybase/products`.
 - generateDDL: prevent unnecessary warning for SQLite3 default constraint changing
 - generateDDL: removed unnecessary logout after generateDDL function is ends. Consider generateDDL always executed as local root (-u root) 

## [5.8.0] - 2020-11-01
### Added
 - new `generateDDL` parameter `-c connectionName`. If passed DDL generator works only for entities for specified connection.
 - new command `ubcli execSql -c connectionName -f path/to/script.sql`.
   Exec a multi-statement SQL script in specified connection without starting a server, so can be used to apply some patches.
   Can be used as a module:
   ```javascript
   const execSql = require('@unitybase/ubcli/lib/execSql')
   execSql({
     connection: 'main',
     file: './myScript.sql',
     optimistic: true
   })
   ```

 - In case UB > 5.18.15 DDL generator will execute result script using `@unitybase/ubcli/lib/execSql` - 
   split a result file into parts and directly execute SQL statements instead of using runSQL endpoint.
   
### Changed
 - DDL generator result will join all object annotation (comment on) into one SQL statement - this speed up database generation a lot
 - DDL generator for Oracle moves sequence incrementation calls into annotation block, so all of them are executed as a single call 
 
### Fixed
 - `genSuffixesIndexInitScript` fixed to generate an SQL with valid argument for `dbo.strTails`
 - DDL generator: remove warning from a console in case entity metadata is congruence with the database for connection

## [5.7.7] - 2020-10-20
### Added
 - DDL generator: added storage table generation for SUFFIX indexes. 
 - added a SUFFIX indexes initialization script generator (SQL SERVER for a while)
   ```
   ub ./node_modules/@unitybase/ubcli/lib/flow/genSuffixesIndexInitScript.js -u root [-env ubConfig.env] [-e entity] [-m models] [-cfg path/to/ubConfig.json]
   ```

- `ubcli createCodeInsightHelper` added types definition for entity attributes. The type name is `_.camelCase(entityName) + Attr` (uba_auditTrail -> ubaAuditTrailAttr).
   This allows to declare a variable as:
   ```
   /** @type ubaUserAttrs */
   const userExecParams = {}
   useruserExecParams.name = 12333
   ``` 
   and IDE (at last in WebStorm) adds a code insight and type checking

### Fixed
 - SQL Server: prevent create FullText Catalogue in case `IsFullTextInstalled` is false (localDB for example)

## [5.7.6] - 2020-10-15
### Added
 - `ubcli generateDDL` now support CATALOGUE indexes for MS SQL Server database. See [turning query performance tutorial](https://unitybase.info/api/server-v5/tutorial-database_tuning.html#optimizing-%60like%60-queries)
   for details. 

## [5.7.5] - 2020-09-23
## [5.7.4] - 2020-09-22
## [5.7.3] - 2020-09-20
## [5.7.2] - 2020-09-08
### Changed
 - `ubcli inidDB -create` skips database(role for Oracle, schema for Postgres, file for SQLite3)
 creation in case database already exists 
 
## [5.7.1] - 2020-09-01
## [5.7.0] - 2020-08-31
### Changed
 - `ubcli initDb` command execute all SQL statements from a command line script.
  This allows not to start a server and prevents fake config creation.
  
### Fixed
 - `ubcli createStore` creates a `tempPath` even in case path is empty (for example for mdb store) 

## [5.6.5] - 2020-08-19
## [5.6.4] - 2020-08-19
### Deprecated
 - `ubcli prepareGZIP` command is removed (obsolete). For a production environment `generateNgingCfg & linkStatic`
  should be used instead.

## [5.6.3] - 2020-07-28
## [5.6.2] - 2020-07-26
## [5.6.1] - 2020-07-19
## [5.6.0] - 2020-07-16
### Fixed
 - `ubcli generateNginxCfg`: in case `httpServer.host` is a Unix Domain Socket (unix:/path/to/file.socket) move
 it to nginx upstream config as is (without trying to url.parse it)
 - `ubcli generateNginxCfg`: adds `Access-Control-Allow-Origin` for internal location in case CORS is allowed and
 client request contains `Origin:` header. Without these changes internal location ignores `Access-Control-*` headers
 generated by server, so cross origin clients can't retrieve a document content.   


## [5.5.21] - 2020-07-15
## [5.5.20] - 2020-07-08
## [5.5.19] - 2020-07-01
### Fixed
 - prevent generation of many-to-many table (storage for attributes of "Many" type) twice in case `associationManyData`
  property starts with entity name 

## [5.5.18] - 2020-06-30
## [5.5.17] - 2020-06-21
## [5.5.16] - 2020-06-15
## [5.5.15] - 2020-06-15
## [5.5.14] - 2020-06-14
### Fixed
 - `ubcli initialize` command: added missed `/` in file path inside error message "File ... does not export function" 

## [5.5.13] - 2020-06-09
### Changed
- `linkStatic` command now does not start ub server and does not require `user` and `password` command line parameters
  anymore, but still requires `ubConfig.json` file.

## [5.5.12] - 2020-05-25
## [5.5.11] - 2020-05-22
## [5.5.10] - 2020-05-17
## [5.5.9] - 2020-05-13
### Added
 - detailed explanation of database creation in initDB - see https://unitybase.info/api/server-v5/module-initDB.html
 for tips how to create a database manually

## [5.5.8] - 2020-05-06
## [5.5.7] - 2020-04-24
## [5.5.6] - 2020-04-10
## [5.5.5] - 2020-03-30
## [5.5.4] - 2020-03-20
## [5.5.3] - 2020-03-17
## [5.5.2] - 2020-03-09
## [5.5.1] - 2020-03-04
### Added
 - `ubcli meta-tr` will transform entity level mapping to object (missed in prev. version)
 - `ubcli meta-tr` will fix mapping dialect AnsiSql -> AnsiSQL (many such mistakes in old UB projects)

### Fixed
 - `ubcli meta-tr` will show line and column in case of invalid meta file JSON

## [5.5.0] - 2020-02-29
### Changed
 - use `model.realPath` in `ubcli` scripts instead of calculating absolute models path manually
   
## [5.4.21] - 2020-02-23
### Fixed
 - `npx ubcli generateNginxCfg` - expires 600; should be added to `/clientRequire`, `/models` and `/static` locations
  to prevent Google Chrome cache heuristic to take a `js` files from a disk cache even if they modified on server 

## [5.4.20] - 2020-02-18
### Changed
 - ESLint errors and warnings fixed (no functional changes)

## [5.4.19] - 2020-02-14
### Added
 - new command line option `-su` (skipUndocumented) for `ubcli generateDoc`. If passed then undocumented API methods
 will be excluded from documentation.
 Example: `npx ubcli generateDoc -u admin -p admin -su`
  
### Fixed
  - `npx ubcli generateDoc` now works on Windows platform 

## [5.4.18] - 2020-02-13
## [5.4.17] - 2020-02-10
### Added
 - `npx ubcli generateDoc` now understand entity level method documentation in format
```
/**
 * Forms and returns array of dynamical entity's roles
 * @param {ubMethodParams} runparams
 * @return {Boolean}
 */
me.addAllDynRoles = function(ctx) {...}
```
in addition to
```
/**
 * Forms and returns array of dynamical entity's roles
 * @param {ubMethodParams} runparams
 * @return {Boolean}
 * @memberOf contr_contractdoc_ns.prototype
 * @memberOfModule @docflow/contr
 * @published
 */
function addAllDynRoles(ctx) {...}
me.addAllDynRoles = addAllDynRoles
```
 - `npx ubcli generateDoc` will look into 1 level depth sub-folders of model folders for sources
 - `npx ubcli generateDoc` will skip 'public', '_migration' and '_autotest' folders while generating jsdoc snippets
  
## [5.4.16] - 2020-02-08
### Added
 - `npx ubcli generateDoc` command will parse a domain models jsdoc and adds a entity methods description and
   parameters into documentation

## [5.4.15] - 2020-02-03
## [5.4.14] - 2020-01-31
## [5.4.13] - 2020-01-17
## [5.4.12] - 2020-01-11
## [5.4.11] - 2019-12-27
## [5.4.10] - 2019-12-20
## [5.4.9] - 2019-12-19
### Fixed
- DDL generation for PostgreSQL 12 and UP; DDL generator now use `pg_get_constraintdef(oid)` for getting check constraints instead of obsolette `pg_constraint.consrc`

## [5.4.8] - 2019-12-18
## [5.4.7] - 2019-12-17
## [5.4.6] - 2019-12-17
### Changed
 - `ubcli generateNginxCfg` will force adding redirect 80 -> 443 in case external URL is https

## [5.4.5] - 2019-12-12
### Added
 - `ubcli linkStatic` can generate cmd script if executed under Windows

## [5.4.4] - 2019-12-11
### Fixed
 - `ubcli generateNginxCfg` will always use `/` in staticRoot locations path independently of platform
 
## [5.4.0] - 2019-11-21
### Added
 - new command `ubcli linkStatic`: creating folder with all static assets (models, modules) what should be available
   for client using `/clientRequire` and `/models` endpoints. Such folder can be served by nginx as a static folder.
   See tutorial [Serving static assets by nginx](https://unitybase.info/api/server-v5/tutorial-reverse_proxy_nginx.html#serving-static-assets-by-nginx)
   for details
 - `npx ubcli generateNginxCfg` will add a location `/statics` what points to `httpServer.inetPub` folder
 - `npx ubcli generateNginxCfg` will add a locations `/clientRequire` and `/models` to nginx config
   in case reverseProxy.serveStatic is true (default)  
   
### Fixed
 - prevent expose a package to client by adding `"config": {"ubmodel": {} }` into package.json
 
## [5.3.42] - 2019-09-17
### Fixed
 - Oracle DDL generator - do not wrap enum group into quotes when update a value for enum column from `null` to `not null`
 
## [5.3.41] - 2019-09-16
### Fixed
 - Oracle DDL generator - do not wrap enum group into quotes when update a value for enum column with `not null`
   
## [5.3.38] - 2019-08-28
### Changed
 - speed up command `ubcli checkStoreIntegrity` by removing `attribute not null` expression from SQL and 
 check attachment is exist in JS

## [5.3.37] - 2019-08-27
### Added
 - `ubcli generateDoc` will add's API methods available for entities; HTML output is formatted using bootstrap  

## [5.3.36] - 2019-08-23
### Fixed
 - DDL generator will correctly add a JSON columns with `allowNull: false` and without default value;
 For such case estimated value for updating existed rows is set to `{}`
 
## [5.3.35] - 2019-08-20
### Fixed
 - DDL generator: in case database connection does not contains entities for DDL generation (all entities is marked as External for example)
 ubcli generateDDL will skip loading of DB metadata for such connections.
 This fix issue for read-only Oracle connections in which DDL generator try to create a stored procedure and speed up generation for other RDBMS    


## [5.3.30] - 2019-07-23
### Added
 - new command `ubcli checkStoreIntegrity` for validate blobStore consistency by checking equality of the
 md5 checksum stored in the database with actual file MD5
```bash
npx ubcli checkStgoreIntegrity -u ... -p ... -entity tst_document -attribute fileStoreSimple
``` 
see `npx ubcli checkStoreIntegrity --help` for details
   

## [5.3.29] - 2019-07-22
### Fixed
 - in case executed for folder `ubcli meta-tr` will skip files what contains meta in name but not a metafile itself (bla-bla.metadata for example)

## [5.3.28] - 2019-07-17
### Changed
 - `MSSQL2012` dialect will use `NVARCHAR(MAX)` instead of `NVARCHAR(4000)` for JSON 

## [5.3.22] - 2019-06-20
### Added
 - Now `meta-tr` supports path to file or directory contained `*.meta*` files as parameter 
 ```
 npx ubcli meta-tr -m C:\myFolder\myApp\models\tstModel
 ```

## [5.3.19] - 2019-05-29
### Fixed
 - in case ID attribute explicitly specified in meta file and mapped to another attribute whose isUnique===false
  then the primary key for such an entity is not created 

## [5.3.12] - 2019-04-04
### Added
 - support for Oracle Text and CTXCAT indexes (require Oracle Text to be enabled - see https://docs.oracle.com/cd/E11882_01/install.112/e27508/initmedia.htm#DFSIG269)

## [5.3.11] - 2019-03-11
### Fixed
 - `npx ubcli meta-tr` command now work correctly. Meta content encoding before using `JSON.parse()` was fixed

### Added
 - `npx ubcli generateNginxCfg` will add a Clickjacking/sniffing/XSS protections for /app internal URL.
 This protect both login page (custom and build-in) form such kinds of attacks. 
 - new option `-t` or `tests` for `npx ubcli autotest` allows to specify a comma separated tests files to execute
 
## [5.3.0] - 2018-12-12
### Changed
 - `generateDDL` command now work under `root` system account and can be executed only locally.
 `-u` and `-p` command line switches not used anymore.
```
npx ubcli generateDDL -cfg $UB_CFG -autorun
```
  Since `root` auth schema do not fire `Session.on('logon')` event developers can remove conditions for
  DDL generation (when database is not fully created yet) 
```
 if (Session.userID === UBA_COMMON.USERS.ADMIN.ID) return
```
  from `Session.on('logon')` handlers
  
## [5.2.6] - 2018-12-09
### Added
 - `generateNginxCfg` now support `reverseProxy.remoteConnIDHeader` and in case
  it is not empty adds a `proxy_set_header {{remoteConnIDHeader}} $connection;`
  section to nginx config

### Changed
 - in case invalid command is passed to `ubcli` human readable error will be shown

## [5.2.4] - 2018-12-04
### Changed
 - **BREAKING** change default floating scale precision from 4 to 6
 - `initDB` will ignore `-host` parameter (always used a host from config)
 - `initDB` will ignore `-u` parameter (always used a `admin`)
 - `initDB` will set a default password for user `admin` as specified in `-p` command line parameter.
   Previous implementation always set the `admin` password to `admin`  
 
### Added 
 - DDl generator will use floating scale precision from UBDomain.FLOATING_SCALE_PRECISION constant
 (6 by default)  

## [5.2.2] - 2018-11-22
### Fixed
 - `npx ubcli generateNgingCfg` will generate correct `ssl_ciphers` list
 - `npx ubcli generateNgingCfg` will add `listen 443 ssl;` in case external URL is HTTPS
 
### Changed
 - `npx ubcli generateNgingCfg` will enable **HTTP 2.0** in case external URL is HTTPS  
 - `ln -s` sample for nginx config will change config file name to the site host name. 
   This help to manage a big productions configs.  

## [5.2.0] - 2018-11-19
### Added 
 - `npx ubcli` will display short commands descriptions in addition to command names
 - new command `meta-tr` added to `ubcli` to be used to transform *.meta attributes from Object to Array as
 required by latest Entity JSON schema:
```bash
 npx ubcli meta-tr -m /home/mpv/dev/ubjs/apps/autotest/models/TST/tst_document.meta
```   
  
## [5.1.4] - 2018-10-18
### Fixed 
 - `ubcli initDB -drop` for SQLite3 will also delete possible WAL logs (-wal and -shm files)
 - `ubcli generateNginxConfig` will add `expire` and `Cache-Control` for
  internal locations to force browser to check resources on server is actual. For DEV modes
  set expires to 0 in `../app` internal location

### Changed
 - `ubcli generateNginxConfig` now use `httpServer.externalURL` from server config for
 generation of nginx proxy server_name.
  - many improvements to nginx config generated `ubcli generateNginxConfig` - 
  **we recommend to recreate reverse proxy configs** after upgrading ub server and all packages.

## [5.1.2] - 2018-10-05
### Fixed 
 - [unitybase/ubjs#15] - Postgre DDl generator must use `SELECT nextval('${sequenceObj}')`
 for sequence incrementing

## [5.1.0] - 2018-10-03
### Added
- `ubcli generateDDL` now support Json type attributes

### Fixed
 - database initialization scripts will create DDL for uba_els.code & uba_els.ruleType 
 as NVARCHAR instead of VARCHAR as in current metadata
 - return back creation of sequences for cached entities (lost during ub1.12 -> ub5 migration).
  This patch speed up getting of cached entities cache version (especially for large tables)
   and fix [unitybase/ubjs#15] for all DB except SQLite3 

## [5.0.40] - 2018-09-07
### Fixed
- `ubcli generateDDL` will skip DDL generation for entities without `mStorage` mixin [unitybase/ubjs#11]
- When create a new DB using `ubcli initDB -create` command, the created user for
  SQL Server database have correct default schema `dbo` [unitybase/ubjs#12]

## [5.0.30] - 2018-07-27
### Fixed
- fixed [unitybase/ubjs#9] DDL SQLite3 "Error: this.DDL.dropColumn.push is not a function"

## [5.0.29] - 2018-07-25
### Fixed
- fixed [unitybase/ubjs#7] - missing genCodeDropPK in SQL Server DDl generator

## [5.0.28] - 2018-07-21
### Fixed
- Fixed [unitybase/ubjs#5] - DDL generation will drop and re-create indexes of columns if column type is changed

## [5.0.19] - 2018-06-21
### Fixed
- PostgreSQL DDL generator will ignore functional ("func") index definition in `dbExtensions`
 section (should be applied only for Oracle as documented)
- PostgreSQL DDL generator will generate single-quoter string for estimation update of newly
 added not null attributes of string type

## [5.0.18] - 2018-06-06
### Fixed
- `ubcli createStore` will create temp path even if it is relative.
 In this case we consider path is relative to config path

## [5.0.16] - 2018-05-31
### Fixed
- fix retrieve foreign key metadata from PostgreSQL (BOOL column type not handled properly by ZEOS 7.2)

## [5.0.9] - 2018-05-11
### Fixed
 - createCodeInsightHelper will ignore models with "_public_only_" paths

## [5.0.7] - 2018-05-06
### Changed
 - stubs created by `createCodeInsightHelper` now include documentation specified in entity meta files

## [5.0.6] - 2018-04-29
### Changed
- createCodeInsightHelper command now generate stubs using ES6 syntax
- createCodeInsightHelper create [entityCode]_ns stub class for each entity
  and define e global variable [entityCode] = new [entityCode]_ns()

## [1.3.2] - 2018-04-15
### Fixed
- correctly generate a check constraints defined in `dbExtensions` section of entity metadata

## [1.2.7] - 2018-02-01
### Fixed 
- PostgreSQL DDL generator: DROP INDEX script syntax

## [1.2.3] - 2017-11-28
### Fixed
- Database metadata for PostgreSQL now loaded for a current_schema instead of current_user
- Added missed ; in the end of DDL script block

## [1.2.0] - 2017-10-23
### Added
- DDL generation for PostgreSQL including latest PostgreSQL 10 release. Required UB >= 4.1.0beta.8

## [1.0.41] - 2017-10-07
### Changed
- ublci `createCodeInsightHelper` command now generate entities stubs using **standard JS** code style

## [1.0.36] - 2017-09-12
### Added
- maximum database identifier length (table/constraint names etc) now depend on dialect. 30 for oracle, 116 for SQL Server

## [1.0.34] - 2017-08-28
### Fixed
- prepareGZIP command now work properly (adding @unitybase/compressors dependency)


## [1.0.28] - 2017-05-18
### Added
- ability to create a empty database for non-default connection using `-conn` initDB parameter: `ubcli initDB -conn connectionName -create -drop`. 

### Fixed
- show a connection name during database drop/create operations

## [1.0.26] - 2017-04-28
### Added

### Fixed
- DDL generator will skip attributes mapped to another existed attribute
