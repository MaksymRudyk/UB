/* eslint-disable camelcase,no-unused-vars,new-cap,no-undef,comma-dangle */
// This file is generated automatically and contain definition for code insight.
// It ignored by UnityBase server because name start from "_".
// Do not modify this file directly. Run `ucli createCodeInsightHelper --help` for details

/**
 * UnityBase Administrative model. Define users, roles and permissions
 * @version 5.4.34
 * @module @unitybase/uba
 */

/**
 * Advanced security settings.
 * For any authentication type add binding of user to IP address. For CERT additionally adds a binding to device fingerprint
 * @extends EntityNamespace
 * @mixes mStorage
 */
class uba_advSecurity_ns extends EntityNamespace {}

/**
 * @typedef ubaAdvSecurityAttrs
 * @type {object}
 * @property {Number} ID
 * @property {Number|ubaUserAttrs} userID - User
 * @property {String} editCause - Cause of change
 * @property {String} allowedIP - Allowed IP address
 * @property {Boolean} refreshIP - Refresh allowed IP
 * @property {String} fp - Fingerprint
 * @property {Boolean} refreshFp - Refresh fingerprint
 * @property {String} keyMediaName - Key media name
 * @property {Boolean} refreshKeyMedia - Refresh key media name
 * @property {String} additional - Additional
 * @property {Number|ubaUserAttrs} mi_owner
 * @property {Date} mi_createDate
 * @property {Number|ubaUserAttrs} mi_createUser
 * @property {Date} mi_modifyDate
 * @property {Number|ubaUserAttrs} mi_modifyUser
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubaAdvSecurityAttrs}
 */
uba_advSecurity_ns.attrs = {}

/**
* Advanced security settings.
 * For any authentication type add binding of user to IP address. For CERT additionally adds a binding to device fingerprint
* @type {uba_advSecurity_ns}
*/
const uba_advSecurity = new uba_advSecurity_ns()
/**
 * Attribute level security
 * @extends EntityNamespace
 * @mixes mStorage
 */
class uba_als_ns extends EntityNamespace {}

/**
 * @typedef ubaAlsAttrs
 * @type {object}
 * @property {Number} ID
 * @property {String} entity - Entity
 * @property {String} attribute - Attribute
 * @property {String} state - State code
 * @property {String} roleName - Role name
 * @property {Number} actions - Allow actions
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubaAlsAttrs}
 */
uba_als_ns.attrs = {}

/**
* Attribute level security
* @type {uba_als_ns}
*/
const uba_als = new uba_als_ns()
/**
 * Security changes audit.
 * All changes to UBA model entities (except uba_als &amp; uba_subject) + user login related event are logged here
 * @extends EntityNamespace
 * @mixes mStorage
 */
class uba_audit_ns extends EntityNamespace {}

/**
 * @typedef ubaAuditAttrs
 * @type {object}
 * @property {Number} ID
 * @property {String} entity - Entity
 * @property {Number} entityinfo_id - Instance ID
 * @property {String|ubmEnumAttrs} actionType - Action
 * @property {String} actionUser - User
 * @property {Date} actionTime - Action time
 * @property {String} remoteIP - Remote IP
 * @property {String} targetUser - Target user
 * @property {String} targetGroup - Target group
 * @property {String} targetRole - Target role
 * @property {String} fromValue - Old values
 * @property {String} toValue - New values
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubaAuditAttrs}
 */
uba_audit_ns.attrs = {}

/**
* Security changes audit.
 * All changes to UBA model entities (except uba_als &amp; uba_subject) + user login related event are logged here
* @type {uba_audit_ns}
*/
const uba_audit = new uba_audit_ns()
/**
 * Data changes audit.
 * All DML statement for entity with mixin &#39;audit&#39; logged here
 * @extends EntityNamespace
 * @mixes mStorage
 */
class uba_auditTrail_ns extends EntityNamespace {}

/**
 * @typedef ubaAuditTrailAttrs
 * @type {object}
 * @property {Number} ID
 * @property {String} entity - Entity
 * @property {Number} entityinfo_id - Instance ID
 * @property {String|ubmEnumAttrs} actionType - Action
 * @property {Number} actionUser - User
 * @property {String} actionUserName - Login
 * @property {Date} actionTime - Action time
 * @property {String} remoteIP - Remote IP
 * @property {String} parentEntity - Parent entity name
 * @property {Number} parentEntityInfo_id - Parent instance ID
 * @property {Number} request_id - Request ID
 * @property {String} fromValue - Old values
 * @property {String} toValue - New values
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubaAuditTrailAttrs}
 */
uba_auditTrail_ns.attrs = {}

/**
* Data changes audit.
 * All DML statement for entity with mixin &#39;audit&#39; logged here
* @type {uba_auditTrail_ns}
*/
const uba_auditTrail = new uba_auditTrail_ns()
/**
 * Describe, which role have access permissions to Entities methods.
 * Administering of entity level. The system checks the access by the rule &quot;Allowed and NOT Prohibited&quot;
 * @extends EntityNamespace
 * @mixes mStorage
 */
class uba_els_ns extends EntityNamespace {}

/**
 * @typedef ubaElsAttrs
 * @type {object}
 * @property {Number} ID
 * @property {String} code - Rule code
 * @property {String} description - Description
 * @property {Boolean} disabled - Disabled
 * @property {String} entityMask - Entity mask
 * @property {String} methodMask - Method mask
 * @property {String|ubmEnumAttrs} ruleType - Rule type
 * @property {Number|ubaRoleAttrs} ruleRole - Role
 * @property {Number|ubaUserAttrs} mi_owner
 * @property {Date} mi_createDate
 * @property {Number|ubaUserAttrs} mi_createUser
 * @property {Date} mi_modifyDate
 * @property {Number|ubaUserAttrs} mi_modifyUser
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubaElsAttrs}
 */
uba_els_ns.attrs = {}

/**
* Describe, which role have access permissions to Entities methods.
 * Administering of entity level. The system checks the access by the rule &quot;Allowed and NOT Prohibited&quot;
* @type {uba_els_ns}
*/
const uba_els = new uba_els_ns()
/**
 * User groups
 * @extends EntityNamespace
 * @mixes mStorage
 * @mixes unity
 */
class uba_group_ns extends EntityNamespace {}

/**
 * @typedef ubaGroupAttrs
 * @type {object}
 * @property {Number|ubaSubjectAttrs} ID
 * @property {String} code - Code
 * @property {String} name - Name
 * @property {String} description - Description
 * @property {Number|ubaUserAttrs} mi_owner
 * @property {Date} mi_createDate
 * @property {Number|ubaUserAttrs} mi_createUser
 * @property {Date} mi_modifyDate
 * @property {Number|ubaUserAttrs} mi_modifyUser
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubaGroupAttrs}
 */
uba_group_ns.attrs = {}

/**
* User groups
* @type {uba_group_ns}
*/
const uba_group = new uba_group_ns()
/**
 * Roles assigned to groups
 * @extends EntityNamespace
 * @mixes mStorage
 */
class uba_grouprole_ns extends EntityNamespace {}

/**
 * @typedef ubaGrouproleAttrs
 * @type {object}
 * @property {Number} ID
 * @property {Number|ubaGroupAttrs} groupID - Group
 * @property {Number|ubaRoleAttrs} roleID - Role
 * @property {Number|ubaUserAttrs} mi_owner
 * @property {Date} mi_createDate
 * @property {Number|ubaUserAttrs} mi_createUser
 * @property {Date} mi_modifyDate
 * @property {Number|ubaUserAttrs} mi_modifyUser
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubaGrouproleAttrs}
 */
uba_grouprole_ns.attrs = {}

/**
* Roles assigned to groups
* @type {uba_grouprole_ns}
*/
const uba_grouprole = new uba_grouprole_ns()
/**
 * One time passwords.
 * One-time-password generation and verification
 * @extends EntityNamespace
 * @mixes mStorage
 */
class uba_otp_ns extends EntityNamespace {}

/**
 * @typedef ubaOtpAttrs
 * @type {object}
 * @property {Number} ID
 * @property {String} otp - OTP
 * @property {Number|ubaUserAttrs} userID - User
 * @property {String} uData - uData
 * @property {Date} expiredDate - Expired date
 * @property {String|ubmEnumAttrs} otpKind - Otp kind
 * @property {Number|ubaUserAttrs} mi_owner
 * @property {Date} mi_createDate
 * @property {Number|ubaUserAttrs} mi_createUser
 * @property {Date} mi_modifyDate
 * @property {Number|ubaUserAttrs} mi_modifyUser
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubaOtpAttrs}
 */
uba_otp_ns.attrs = {}

/**
* One time passwords.
 * One-time-password generation and verification
* @type {uba_otp_ns}
*/
const uba_otp = new uba_otp_ns()
/**
 * Previous passwords hashes
 * @extends EntityNamespace
 * @mixes mStorage
 */
class uba_prevPasswordsHash_ns extends EntityNamespace {}

/**
 * @typedef ubaPrevPasswordsHashAttrs
 * @type {object}
 * @property {Number} ID
 * @property {Number|ubaUserAttrs} userID - User
 * @property {String} uPasswordHashHexa - Password hash
 * @property {Number|ubaUserAttrs} mi_owner
 * @property {Date} mi_createDate
 * @property {Number|ubaUserAttrs} mi_createUser
 * @property {Date} mi_modifyDate
 * @property {Number|ubaUserAttrs} mi_modifyUser
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubaPrevPasswordsHashAttrs}
 */
uba_prevPasswordsHash_ns.attrs = {}

/**
* Previous passwords hashes
* @type {uba_prevPasswordsHash_ns}
*/
const uba_prevPasswordsHash = new uba_prevPasswordsHash_ns()
/**
 * Administering subsystem roles
 * @extends EntityNamespace
 * @mixes mStorage
 * @mixes unity
 */
class uba_role_ns extends EntityNamespace {}

/**
 * @typedef ubaRoleAttrs
 * @type {object}
 * @property {Number|ubaSubjectAttrs} ID
 * @property {String} name - Role
 * @property {String} description - Description
 * @property {Number} sessionTimeout - Session duration
 * @property {String} allowedAppMethods - Which application level methods are allowed
 * @property {Number|ubaUserAttrs} mi_owner
 * @property {Date} mi_createDate
 * @property {Number|ubaUserAttrs} mi_createUser
 * @property {Date} mi_modifyDate
 * @property {Number|ubaUserAttrs} mi_modifyUser
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubaRoleAttrs}
 */
uba_role_ns.attrs = {}

/**
* Administering subsystem roles
* @type {uba_role_ns}
*/
const uba_role = new uba_role_ns()
/**
 * Administration subjects
 * @extends EntityNamespace
 * @mixes mStorage
 */
class uba_subject_ns extends EntityNamespace {}

/**
 * @typedef ubaSubjectAttrs
 * @type {object}
 * @property {Number} ID
 * @property {String} code - Code
 * @property {String} name - Login
 * @property {String} sType - Subject type
 * @property {String} mi_unityEntity
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubaSubjectAttrs}
 */
uba_subject_ns.attrs = {}

/**
* Administration subjects
* @type {uba_subject_ns}
*/
const uba_subject = new uba_subject_ns()
/**
 * Users
 * @extends EntityNamespace
 * @mixes mStorage
 * @mixes unity
 */
class uba_user_ns extends EntityNamespace {}

/**
 * @typedef ubaUserAttrs
 * @type {object}
 * @property {Number|ubaSubjectAttrs} ID
 * @property {String} name - Login
 * @property {String} firstName - First Name
 * @property {String} lastName - Last Name
 * @property {String} fullName - Full Name
 * @property {String|ubmEnumAttrs} gender - User gender
 * @property {String} email - Email
 * @property {String} phone - Phone
 * @property {String} avatar - Avatar
 * @property {String} description - Description
 * @property {String} uData - uData
 * @property {Boolean} disabled - Disabled
 * @property {Boolean} isPending - Registration pending
 * @property {String} trustedIP - trusted IPs
 * @property {String} uPasswordHashHexa - Password hash
 * @property {Date} lastPasswordChangeDate - Last password change date
 * @property {Number|ubaUserAttrs} mi_owner
 * @property {Date} mi_createDate
 * @property {Number|ubaUserAttrs} mi_createUser
 * @property {Date} mi_modifyDate
 * @property {Number|ubaUserAttrs} mi_modifyUser
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubaUserAttrs}
 */
uba_user_ns.attrs = {}

/**
* Users
* @type {uba_user_ns}
*/
const uba_user = new uba_user_ns()
/**
 * User certificates.
 * used for Certificate authentication 
 * @extends EntityNamespace
 * @mixes mStorage
 */
class uba_usercertificate_ns extends EntityNamespace {}

/**
 * @typedef ubaUsercertificateAttrs
 * @type {object}
 * @property {Number} ID
 * @property {Number|ubaUserAttrs} userID - User
 * @property {String} issuer_serial - Issuer serial number
 * @property {String} issuer_cn - Issuer caption
 * @property {String} serial - Serial number
 * @property {ArrayBuffer} certificate - Certificate
 * @property {String} description - Description
 * @property {Boolean} disabled - Disabled
 * @property {Boolean} revoked - Revoked
 * @property {Date} revocationDate - Revocation date
 * @property {Number|ubaUserAttrs} mi_owner
 * @property {Date} mi_createDate
 * @property {Number|ubaUserAttrs} mi_createUser
 * @property {Date} mi_modifyDate
 * @property {Number|ubaUserAttrs} mi_modifyUser
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubaUsercertificateAttrs}
 */
uba_usercertificate_ns.attrs = {}

/**
* User certificates.
 * used for Certificate authentication 
* @type {uba_usercertificate_ns}
*/
const uba_usercertificate = new uba_usercertificate_ns()
/**
 * User memberships in groups
 * @extends EntityNamespace
 * @mixes mStorage
 */
class uba_usergroup_ns extends EntityNamespace {}

/**
 * @typedef ubaUsergroupAttrs
 * @type {object}
 * @property {Number} ID
 * @property {Number|ubaUserAttrs} userID - User
 * @property {Number|ubaGroupAttrs} groupID - Group
 * @property {Number|ubaUserAttrs} mi_owner
 * @property {Date} mi_createDate
 * @property {Number|ubaUserAttrs} mi_createUser
 * @property {Date} mi_modifyDate
 * @property {Number|ubaUserAttrs} mi_modifyUser
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubaUsergroupAttrs}
 */
uba_usergroup_ns.attrs = {}

/**
* User memberships in groups
* @type {uba_usergroup_ns}
*/
const uba_usergroup = new uba_usergroup_ns()
/**
 * Roles assigned to user
 * @extends EntityNamespace
 * @mixes mStorage
 */
class uba_userrole_ns extends EntityNamespace {}

/**
 * @typedef ubaUserroleAttrs
 * @type {object}
 * @property {Number} ID
 * @property {Number|ubaUserAttrs} userID - User
 * @property {Number|ubaRoleAttrs} roleID - Role
 * @property {Number|ubaUserAttrs} mi_owner
 * @property {Date} mi_createDate
 * @property {Number|ubaUserAttrs} mi_createUser
 * @property {Date} mi_modifyDate
 * @property {Number|ubaUserAttrs} mi_modifyUser
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubaUserroleAttrs}
 */
uba_userrole_ns.attrs = {}

/**
* Roles assigned to user
* @type {uba_userrole_ns}
*/
const uba_userrole = new uba_userrole_ns()
