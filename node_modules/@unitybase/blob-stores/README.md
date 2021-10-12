## BLOB stores (attributes of type `Document` on ORM level)

**Entity attribute** of `Document` type with `storeName` property for
this attribute should be defined. Content (data stored in the database) of
such attributes is a meta-information about file - a serialized
{@link BlobStoreItem} object, not an actual file content.

In case entity is stored in the database using {@link mStorage} mixin, DDL generator
create nvarchar(2000) field in database and store there {@link BlobStoreItem} serialized to JSON.

For Virtual entity developer should implement `select` method and fill {@link BlobStoreItem} manually
(for example by parsing file content as done in **ubm_form**).

In the store definition section of application config developer describe stores. Each store must implement interface described below.

The store class itself provide storing and retrieving file content (based on meta-information stored in the entity attribute).

From client-side POV uploading files to server is separated onto two part. Like in gmail when you send mail with
attachment you can attach a file, and gmail send it to server, but you do not send mail itself yet - this is first stage.
Result of this stage is information about where file is stored on the server side.
When you send email client pass to server email attributes, body and information about attached files.
This is the same UnityBase do in the second stage.

### Server side usage:

```javascript
// get dirty (not committed yet) content of my_entity.docAttribute with ID = 12312 as ArrayBuffer
let tmpContent = App.blobStores.getContent(
   {ID: 12312, entity: 'my_entity', attribute: 'blobAttribute', isDirty: true},
   {encoding: 'bin'}
)

// get BLOB content of my_entity.docAttribute with ID = 12312 as base64 string
let base64Content = App.blobStores.getContent(
  {ID: 12312, entity: 'my_entity', attribute: 'blobAttribute'},
  {encoding: 'base64'}
)

// get BLOB content of my_entity.docAttribute with ID = 12312 as string
let base64Content = App.blobStores.getContent(
  {ID: 12312, entity: 'my_entity', attribute: 'blobAttribute'},
  {encoding: 'utf8'}
)

// read file and but it to BLOB store (not committed yet)
let content = fs.readFileSync(__filename, {encoding: 'bin'})
let fn = path.basename(__filename)
let blobItem = App.blobStores.putContent(
  {ID: 12312, entity: 'my_entity', attribute: 'blobAttribute'},
  content
)

// commit blob store
let dataStore = UB.DataStore(my_entity)
dataStore.run('update', {
  execParams: {
	ID: 12312,
	blobAttribute: JSON.stringify(blobItem)
  }
})
```

### Upload file to server

In UnityBase upload file to server is performed in two stages:

1. Upload file to temporary store - on this stage client call setDocument app level method and
pass file content to server with an additional parameter **isDirty=true**, server store file in the temporary place.

2. Client execute `insert` or `update` entity method and pass (with other attributes) string, returned on the first stage as a value of `Document`
type attribute. On this stage server see what user want to update/insert Document and, based on *Domain* information, know
what type of store is used for this attribute. Server:

3. Finally, UnityBase update entity and commit database transaction (in case entity is non-virtual)

### Download file from server

For download file from server client call `getDocument` endpoint






