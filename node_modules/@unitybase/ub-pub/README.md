[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Data layer for accessing UnityBase server from Browser or NodeJS

## NodeJS example

```javascript
global.XMLHttpRequest = require('xhr2')
const UB = require('@unitybase/ub-pub')

const HOST = process.env.UB_HOST || 'http://localhost:8881'
const USER = process.env.UB_USER || 'admin'
const PWD = process.env.UB_PWD || 'admin'

async function call_ub () {
  const conn = await UB.connect({
    host: HOST,
    onCredentialRequired: function (conn, isRepeat) {
      if (isRepeat) {
        throw new UB.UBAbortError('invalid credential')
      } else {
        return Promise.resolve({authSchema: 'UB', login: USER, password: PWD})
      }
    },
    onAuthorizationFail: function (reason) {
      console.error(reason)
    }
  })

  console.log(`
Hello, ${conn.userLogin()}!
We know that you are ${JSON.stringify(conn.userData(), null, ' ')}
`)

  conn.get('stat').then(function (statResp) {
    console.log('Current server statistics:', statResp.data)
  })

  const items = await conn.Repository('ubm_navshortcut').attrs(['ID', 'code', 'caption'])
   .limit(2)
      .selectAsObject()
      .then(function (data) {
        console.log('First 2 adminUI shortcuts:')
        console.log(JSON.stringify(data, null, '\t'))
      })
  console.table(items)
}

try {
  call_ub()
} catch (e) {
  console.error(e)
}
```

The same code as above will work in browser (just comment first line
where XMLHttpRequest is required).

## Connecting to UB server
The main entry point is {@link connect connect} method.

```javascript
  const UB = require('@unitybase/ub-pub')
  const conn = UB.connect({
    host: 'https://myserver.com',
    onCredentialRequired: function(conn, isRepeat){
       if (isRepeat){
           throw new UB.UBAbortError('invalid credential')
       } else {
           return Promise.resolve({authSchema: 'UB', login: 'myuser', password: 'mypassword'})
       }
    },
    onAuthorizationFail:  function(reason){
       alert(reason)
    }
  })
```

After connecting {@link UBConnection UBConnection} class cares about reconnect, data cashing,
request buffering and proper data serialization.

## Session

Connection contains the information about currently logged-in user.
The application logic on the server side can add any custom properties
required for application when user is already logged-in.
Such properties are available on the client in {@link class:UBConnection#userData connection.userData()}}

```javascript
  console.log(`
    Hello, ${conn.userLogin()}!
    We know that you are ${JSON.stringify(conn.userData())}
  `)
```

## Domain
{@link class:UBConnection#domain connection.domain} contains information about the
application domain - the list of models, entities, entities' attributes and methods.
Domain is already localized to the language of logged-in user.

This information should be used by the client application during building the UI.
For example:

```javascript
let usersEntity = conn.domain.get('uba_user')
// localized caption of entity uba_user
console.log(usersEntity.caption)
// localized
console.log(`Input control for user name
  should be of type ${usersEntity.attributes.name.dataType}
  and with label ${usersEntity.attributes.name.caption}
`)
console.log(`Control for selecting the user from the list
  should use ${usersEntity.getDescriptionAttribute()}
  as a list content attribute`)

console.log(`Currently logged-in user
  ${u.haveAccessToMethod('update') ? 'can' : 'can not'} edit uba_user`)
```

## Querying data

In most cases client retrieves data from the server using {@link UBQL UBQL} (UnityBase Query Language) JSON.

{@link class:UBConnection#Repository connection.Repository} fabric function is a helper
for building {@link UBQL UBQL} JSON

```javascript
conn.Repository('my_entity').attrs(['ID', 'code'])
 .attrs('attrOfEntityType.caption') // JOIN to other table
 .where('code', 'in', ['1', '2', '3'])  // code in ('1', '2', '3')
 .where('name', 'contains', 'Homer'). // name like '%homer%'
 //(birthday >= '2012-01-01') AND (birthday <= '2012-01-02')
 .where('birthday', 'geq', new Date()).where('birthday', 'leq', new Date() + 10)
 .where('[age] -10', '>=', {age: 15}, 'byAge') // (age + 10 >= 15)
 .where('', 'match', 'myvalue') // FTS query
 .selectAsObject().then(function(response){
    // here response is in [{ID: 10, code: 'value1'}, .... {}] format
 })
```

See Repository method documentation in {@link ClientRepository ClientRepository}

## Buffering

Several UI controls can simultaneously send queries using one connection.
In this case several queries that come in the same 20ms period of time will
be buffered and sent to the server as a single HTTP request to reduce
network bandwidth and latency.

This happens **automatically** - just write the code as usual and let the connection
care about network performance. Run the code below in console and look into the Network -
you will see the single HTTP request

```javascript
Promise.all([
  conn.Repository('uba_user').attrs('ID').selectAsArray(),
  conn.Repository('uba_group').attrs('ID').selectAsObject()
]).then(UB.logDebug)
```

## Caching
Server-side developer can decide that some of the entities are changed infrequently and
contain small amount of data. In this case such entities are marked as cached.
The repository is aware of such entities by using the information from Domain, and can return data
without sending HTTP request over the wire. Internally the repository uses
{@link module:@unitybase/cs-shared:LocalDataStorage LocalDataStorage} to filter and sort data locally.

Test it from the console:
```javascript
// first call to cached entity will get data from server
UB.Repository('ubm_enum').attrs(['ID', 'code'])
 .where('code', 'startsWith', 'I').selectAsObject()
 .then(UB.logDebug)
// second - filter data locally, even if filter condition is changed
UB.Repository('ubm_enum').attrs(['ID', 'code'])
 .where('code', 'startsWith', 'UPD').selectAsObject()
 .then(UB.logDebug)
```

## Promisified XHR
As a side effect @unitybase/ub-pub module contains "Promisified" API for HTTP request:
- {@link module:@unitybase/ub-pub#xhr xhr}: An asynchronous HTTP request. Returns a {Promise} object
- {@link module:@unitybase/ub-pub#get get}: simplified `xhr` for GET
- {@link module:@unitybase/ub-pub#post post}: simplified `xhr` for POST

So you do not need axios etc. Just use a `UB.xhr`, `UB.get` or `UB.post`:

```javascript
  const UB = require('@unitybase/ub-pub')
  UB.get('https://unitybase.info').then(resp => console.log(resp.data))
```
