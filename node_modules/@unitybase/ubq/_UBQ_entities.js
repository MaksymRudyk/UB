/* eslint-disable camelcase,no-unused-vars,new-cap,no-undef,comma-dangle */
// This file is generated automatically and contain definition for code insight.
// It ignored by UnityBase server because name start from "_".
// Do not modify this file directly. Run `ucli createCodeInsightHelper --help` for details

/**
 * Asynchronous task queue persisted into database. Contains jobs for sending e-mail and updating FTS indexes
 * @version 5.4.6
 * @module @unitybase/ubq
 */

/**
 * Message queue.
 * Store messages posted by producers. Consumers read messages from this table and run corresponding tasks
 * @extends EntityNamespace
 * @mixes mStorage
 */
class ubq_messages_ns extends EntityNamespace {}

/**
 * @typedef ubqMessagesAttrs
 * @type {object}
 * @property {Number} ID
 * @property {String} queueCode - Queue code
 * @property {String} msgCmd - Command
 * @property {String} msgData - Message data
 * @property {Number} msgPriority - Priority
 * @property {Date} completeDate - Complete date
 * @property {Number|ubaUserAttrs} mi_owner
 * @property {Date} mi_createDate
 * @property {Number|ubaUserAttrs} mi_createUser
 * @property {Date} mi_modifyDate
 * @property {Number|ubaUserAttrs} mi_modifyUser
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubqMessagesAttrs}
 */
ubq_messages_ns.attrs = {}

/**
* Message queue.
 * Store messages posted by producers. Consumers read messages from this table and run corresponding tasks
* @type {ubq_messages_ns}
*/
const ubq_messages = new ubq_messages_ns()
/**
 * Scheduler run statistic.
 * Statistic for every scheduler item run and result
 * @extends EntityNamespace
 * @mixes mStorage
 */
class ubq_runstat_ns extends EntityNamespace {}

/**
 * @typedef ubqRunstatAttrs
 * @type {object}
 * @property {Number} ID
 * @property {String} appName - Application name
 * @property {String} schedulerName - Scheduler name
 * @property {Date} startTime - Time of start scheduler item
 * @property {Date} endTime - Time of end scheduler item
 * @property {String} logText - Log from runned script about all actions
 * @property {Number} resultError - Result error code. 0&#x3D;No error
 * @property {String} resultErrorMsg - Error text message if resultError &gt; 1
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubqRunstatAttrs}
 */
ubq_runstat_ns.attrs = {}

/**
* Scheduler run statistic.
 * Statistic for every scheduler item run and result
* @type {ubq_runstat_ns}
*/
const ubq_runstat = new ubq_runstat_ns()
/**
 * Scheduled jobs.
 * Virtual entity for show configured schedulers. Schedulers are placed in files MODEL_FOLDER&#x2F;_schedulers.json. To override a existed scheduler do not modify it directly, instead create the scheduler with the same name inside your model
 * @extends EntityNamespace
 */
class ubq_scheduler_ns extends EntityNamespace {}

/**
 * @typedef ubqSchedulerAttrs
 * @type {object}
 * @property {Number} ID - ID
 * @property {String} name - Job name
 * @property {String} schedulingCondition - Condition to schedule a job
 * @property {String} cron - Cron record
 * @property {String} description - Description
 * @property {String} command - Command
 * @property {String} module - Module
 * @property {Boolean} singleton - Singleton
 * @property {String} runAs - runAs
 * @property {Boolean} logSuccessful - Log a Successful execution
 * @property {Boolean} overridden - Overridden
 * @property {String} originalModel - OriginalModel
 * @property {String} actualModel - Actual model
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubqSchedulerAttrs}
 */
ubq_scheduler_ns.attrs = {}

/**
* Scheduled jobs.
 * Virtual entity for show configured schedulers. Schedulers are placed in files MODEL_FOLDER&#x2F;_schedulers.json. To override a existed scheduler do not modify it directly, instead create the scheduler with the same name inside your model
* @type {ubq_scheduler_ns}
*/
const ubq_scheduler = new ubq_scheduler_ns()
