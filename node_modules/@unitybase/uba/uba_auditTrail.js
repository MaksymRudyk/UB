/* global uba_auditTrail */
// eslint-disable-next-line camelcase
const me = uba_auditTrail
me.on('update:before', function () {
  throw new Error('<<< Deletion from audit entity is not allowed. Use database level access instead >>>')
})

me.on('delete:before', function () {
  throw new Error('<<< Audit update is impossible >>>')
})
