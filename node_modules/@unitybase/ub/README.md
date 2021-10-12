[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

This model is a main entry point for a UnityBase server application.

## Application

In terms of UnityBase application is defined by:
 - configuration (ubConfig.json by default): file what
 describe settings for http server, logging, authorization methods,
 Domain, etc. See [server config json schema](https://unitybase.info/docson/index.html#https://unitybase.info/models/UB/schemas/ubConfig.schema.json)
 for full description;
 - `package.json` - npm/yarn configuration used to give information to
 package manager that allows it to identify the project as well as
 handle the project's dependencies

Inside `package.json` the [main field](https://docs.npmjs.com/files/package.json#main)
is a primary entry point of UnityBase application. In most case entry point
file content is:

```javascript
const UB = require('@unitybase/ub')
UB.start()
```

## Application initialization
### once on server startup (single thread mode, http server do not accent connections)
 This stage is added in UB@5.18.0 to allow custom Domain transformation before any other steps is performed.
 
 Just after UB starts in server mode it creates a single-thread JavaScript runtime and use a `@unitybase/ub/metadataTransformation.js`
 script as an entry point for Domain loading. Script loads all `*.meta` and `*.meta.lang` files into memory, merge files with the same names
 and calls a `_hookMetadataTransformation.js` hook from models folders (if available) with two parameters `(domainJSON, serverConfig)`
 
 Metadata transformation hook can mutate a Domain JSON, for example - adds additional attributes to the entities and lang files, etc     
 
 Files are merged and hooks are called in order models appears in `application.domain.models` server config section.
 
 After all hooks are called resulting domainJSON is passed back to UB to initialize a Domain classes.
 
 UB server:
  - initialize internal Domain
  - evaluate an application entry-point script (see UB.js below)
  - initialize ELS (since all models scripts is evaluated on this point all entity-level methods and endpoints
    are in Domain, so server can build an access matrix for methods and roles)
 
 UB server switches to multi-thread mode and can accept HTTP requests
    
### JS working thread (multi-thread mode)
  In multi-thread mode UB uses a thread pool of size `threadPoolSize` from ubConfig.
  Threads in pool are created lazy - in case there is no free thread to accept an incoming request new thread is spawned
  until thread poll is not full.
     
  Every new working thread use `UB.js` as entry point.
  
  UB.js script content is embedded into executable, but it sources is also available in `@unitybase/stubs/UB.js`.
  The task of UB.js script is to require and run an application entry point script (main from package.json). 
  
  As described above entry point script will execute a UB.start() and   
    
{@link module:@unitybase/ub~start UB.start} method of `@unitybase/ub` package will perform a steps below
 (actually for every working thread):
     - for each model from `application.domain.models` folders (except ones marked as `_public_only_`)
      load a model (see below)
     - register build-in UnityBase {@link module:@unitybase/ub.module:endpoints endpoints}
     - emit {@link class:App#domainIsLoaded App.domainIsLoaded} event

## Model
### Server-side
Model is a commonJS module with logically grouped set of entities + server side code + client-side code.
In the application config (ubConfig.json) application.domain.models section contains an array of models, required by application.

Model is loaded in server thread memory(in order they defined in `application.domain.models` config section) in three steps:
 - {@link EntityNamespace entity namespaces} (global objects) are created for all `*.meta` files from this model
 - `require` is called for all `*.js` files paired with `*.meta`
 - `require` is called for model entry point defined in `package.json` placed in the model folder

To simplify a ubConfig model `package.json` can contain `config.ubmodel` section what describe the
model name and (optionally) ``"isPublic": true` for "browser-only" model

```json
"config": {
    "ubmodel": {
      "name": "UBS"
    }
  },
```

for "browser-only" model:
```json
  "config": {
    "ubmodel": {
      "name": "adminui-pub",
      "isPublic": true
    }
  },
```

For such models only path to model should be added to the `application.domain.models` section of ubConfig.json:
```json
	"application": {
        ...
		"domain": {
			"models": [
			    ...
				{
					"path": "./node_modules/@unitybase/ubs"
				},
```

### Client-side (adminUI)
Model can contain a "browser-side" part. In this case model `package.json` should contains `browser` section
what point to the model initialization script for browser:

 - In case model is a published module (placed in the node_modules folder) path should be relative to the `package.json`:

 ```json
 "browser": "./public/initModel.js"
 ```

 - or for dev/prod scripts

 ```json
  "browser": {
    "dev": "./public/devEntryPoint.js"
    "prod": "./public/dist/modelBundle.js"
  }
 ```

 - In case model is in `models` folder p[ath must be absolute
 ```json
   "browser": "/clientRequire/models/TST/initModel.js",
 ```


## Endpoints
UnityBase comes with simple one-level routing.
{@link class:App#registerEndpoint App.registerEndpoint} method will add a handlers
functions for a first level of routing:

```javascript
const fs = require('fs')
/**
 * Write a custom request body to file FIXTURES/req and echo file back to client
 * @param {THTTPRequest} req
 * @param {THTTPResponse} resp
 */
function echoToFile(req, resp) {
   fs.writeFileSync(FIXTURES + 'req', req.read('bin'))
   resp.statusCode = 200
   resp.writeEnd(fs.readFileSync(FIXTURES + 'req', {encoding: 'bin'}))
}
App.registerEndpoint('echoToFile', echoToFile)
```

More deep routing can be implemented inside the endpoint handler, as we
did inside build-in UnityBase {@link module:@unitybase/ub.module:endpoints endpoints}

## JSON schemas
`@unitybase/ub/public/schemas` folder contains JSON schemas for server config, entity meta file and scheduler config.
It's a good idea to configure your IDE for JSON schema support.
See [WebStorm IDE configuratuion manual](https://git-pub.intecracy.com/unitybase/ubjs/wikis/configuring-webstorm)



