const UB = require('@unitybase/ub')
const _ = require('lodash')
const App = UB.App

/**
 * Used by scheduler to build a full text search index.
 * Read queue with code **ASYNCFTS** (by portion of 1000 queue rows at once) and rebuild FTS indexes.
 *
 * Expect msgCmd value in form: {"entity":"tst_document","ID":3000000005908,"operation":"DELETE"}
 * Possible operation is 'INSERT' 'UPDATE' 'DELETE'
 *
 * @module ubqFTSJob
 * @memberOf module:@unitybase/ubq
 */
module.exports = function () {
  console.log('Call JS scheduler method: UB.UBQ.FTSReindexFromQueue')

  const cmdStore = UB.Repository('ubq_messages')
    .attrs(['ID', 'queueCode', 'msgCmd'])
    .where('[queueCode]', '=', 'ASYNCFTS')
    .where('[completeDate]', 'isNull')
    .limit(1000)
    .select()

  const cmdArray = []
  const messageIDs = []
  let operationCount = 0
  while (!cmdStore.eof) {
    cmdArray.push(JSON.parse(cmdStore.get('msgCmd')))
    messageIDs.push(cmdStore.get('ID'))
    cmdStore.next()
  }
  // prevent multiple index update on the same instanceID
  // in case delete operation exists - we must delete from index, in case not - update index
  // group by entity {tst_document: [], other_entity: [], ...}
  const groupedByEntity = _.groupBy(cmdArray, 'entity')
  _.forEach(groupedByEntity, function (commandsForEntity, entityName) {
    if (!App.domainInfo.has(entityName)) {
      console.warn(`Entity "${entityName}" scheduled in FTS operation is not in domain. Skips`)
      return
    }
    const byID = _.groupBy(commandsForEntity, 'ID')
    _.forEach(byID, function (commandsForID, instanceIDStr) {
      const instanceID = parseInt(instanceIDStr) // converto from string
      if (_.find(commandsForID, { operation: 'DELETE' })) {
        if (!_.find(commandsForID, { operation: 'INSERT' })) { // if insert exists delete is not necessary (no data in index yet)
          console.debug('AYNC_FTS: delete', entityName, instanceID)
          App.deleteFromFTSIndex(entityName, instanceID)
          operationCount++
        } else {
          console.debug('AYNC_FTS: delete+insert - skip', entityName, instanceID)
        }
      } else {
        console.debug('AYNC_FTS: update', entityName, instanceID)
        App.updateFTSIndex(entityName, instanceID)
        operationCount++
      }
    })
  })
  // mark all ubq_messages as complete
  messageIDs.forEach(function (msgID) {
    cmdStore.run('success', {
      ID: msgID
    })
  })

  // cmdStore.entity.connection.commit();
  return 'Make ' + operationCount + ' FTS modifications'
}
