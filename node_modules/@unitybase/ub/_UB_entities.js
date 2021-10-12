/* eslint-disable camelcase,no-unused-vars,new-cap,no-undef,comma-dangle */
// This file is generated automatically and contain definition for code insight.
// It ignored by UnityBase server because name start from "_".
// Do not modify this file directly. Run `ucli createCodeInsightHelper --help` for details

/**
 * Build-in UnityBase model
 * @version 5.6.6
 * @module @unitybase/ub
 */

/**
 * File BLOB history.
 * Store historical data for all file based BLOB stores
 * @extends EntityNamespace
 * @mixes mStorage
 */
class ub_blobHistory_ns extends EntityNamespace {}

/**
 * @typedef ubBlobHistoryAttrs
 * @type {object}
 * @property {Number} ID
 * @property {Number} instance - InstanceID
 * @property {String} attribute - Attribute
 * @property {Number} revision - Revision
 * @property {Boolean} permanent - isPermanent
 * @property {String} blobInfo - blobInfo
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubBlobHistoryAttrs}
 */
ub_blobHistory_ns.attrs = {}

/**
* File BLOB history.
 * Store historical data for all file based BLOB stores
* @type {ub_blobHistory_ns}
*/
const ub_blobHistory = new ub_blobHistory_ns()
