--############## start script for connection "main" #######
/*
 $$$$$$$$$$$ Attantion! Achtung! Vnimanie!


Attempt to alter a column uba_subject.name as (typeChanged: false, sizeChanged: true, allowNullChanged: false
Attempt to alter a column uba_user.trustedIP as (typeChanged: false, sizeChanged: true, allowNullChanged: false

 $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ 
*/

 
-- Create tables
--######################################
CREATE TABLE req_depart (
	ID BIGINT NOT NULL PRIMARY KEY,
	name VARCHAR(255) NOT NULL, --Department Name
	postAddr VARCHAR(255) NOT NULL, --Department Address
	phoneNum VARCHAR(255) NOT NULL --Department Phone
);
--
CREATE TABLE req_reqList (
	ID BIGINT NOT NULL PRIMARY KEY,
	reqDate DATETIME NOT NULL, --Request Date
	applicantPhone VARCHAR(255) NOT NULL, --Applicant`s phone
	applicantInfo VARCHAR(255) NOT NULL, --Applicant`s contact info
	department BIGINT NOT NULL, --Department
	subDepartment BIGINT NULL, --SubDepartment
	reqText TEXT NOT NULL, --Text of request
	reqDoc VARCHAR(4000) NULL, --doc
	answer TEXT NULL, --Request answer
	status VARCHAR(32) NOT NULL --Status
	, CONSTRAINT FK_REQ_DEPARTMENT_REF_REQ_DEPART FOREIGN KEY (DEPARTMENT) REFERENCES req_depart(ID)	
	, CONSTRAINT FK_REQ_SUBDEPARTMENT_REF_REQ_SUBDEPART FOREIGN KEY (SUBDEPARTMENT) REFERENCES req_subDepart(ID)	
);
--
CREATE TABLE req_subDepart (
	ID BIGINT NOT NULL PRIMARY KEY,
	name VARCHAR(255) NOT NULL, --Department Name
	department BIGINT NOT NULL --department
	, CONSTRAINT FK_REQ_SUBDEPART_DEPARTMENT_REF_REQ_DEPART FOREIGN KEY (DEPARTMENT) REFERENCES req_depart(ID)	
);
--
CREATE TABLE ub_blobHistory (
	ID BIGINT NOT NULL PRIMARY KEY,
	instance BIGINT NOT NULL, --InstanceID
	entity VARCHAR(40) NULL, --Entity
	attribute VARCHAR(20) NULL, --Attribute
	revision INTEGER DEFAULT (1) NOT NULL, --Revision
	permanent SMALLINT(1) DEFAULT (0) NOT NULL CHECK (permanent IN (0,1) ), --isPermanent
	createdAt DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NULL, --Created at
	blobInfo VARCHAR(2000) NOT NULL --blobInfo
);
--
CREATE TABLE ub_migration (
	ID BIGINT NOT NULL PRIMARY KEY,
	modelName VARCHAR(32) NOT NULL, --Model code
	filePath VARCHAR(256) NOT NULL, --file path (relative to model _migrate folder)
	fileSha VARCHAR(64) NOT NULL, --SHA256 of file
	appliedAt DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL --Applied at
);
--
CREATE TABLE ub_version (
	ID BIGINT NOT NULL PRIMARY KEY,
	modelName VARCHAR(32) NOT NULL, --Model code
	version VARCHAR(12) NOT NULL, --model version as a string in format XXXYYYZZZ where: XXX-major, YYY-minor ZZZ-patch. All parts are padded by 0 to be a three letter; Example: 2.15.1 = 002015001
	appliedAt DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL --Applied at
);
--
CREATE TABLE uba_advSecurity (
	ID BIGINT NOT NULL PRIMARY KEY,
	userID BIGINT NOT NULL, --User
	editCause VARCHAR(2000) NOT NULL, --Cause of change
	allowedIP VARCHAR(256) NULL, --Allowed IP address
	refreshIP SMALLINT(1) DEFAULT (0) NOT NULL CHECK (refreshIP IN (0,1) ), --Refresh allowed IP
	fp VARCHAR(256) NULL, --Fingerprint
	refreshFp SMALLINT(1) DEFAULT (0) NOT NULL CHECK (refreshFp IN (0,1) ), --Refresh fingerprint
	keyMediaName VARCHAR(32) NULL, --Key media name
	refreshKeyMedia SMALLINT(1) DEFAULT (0) NOT NULL CHECK (refreshKeyMedia IN (0,1) ), --Refresh key media name
	additional VARCHAR(2000) NULL, --JSON with advanced settings
	mi_owner BIGINT NOT NULL, --Row owner
	mi_createDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Creation date
	mi_createUser BIGINT NOT NULL, --User who create row
	mi_modifyDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Modification date
	mi_modifyUser BIGINT NOT NULL --User who modify row
	, CONSTRAINT FK_UBA_ADVSECURITY_USERID_REF_USR FOREIGN KEY (USERID) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_UBA_ADVSECURITY_MI_OWNER_REF_USR FOREIGN KEY (MI_OWNER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_UBA_ADVSECURITY_MI_CREATEUSER_REF_USR FOREIGN KEY (MI_CREATEUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_UBA_ADVSECURITY_MI_MODIFYUSER_REF_USR FOREIGN KEY (MI_MODIFYUSER) REFERENCES uba_user(ID)	
);
--
CREATE TABLE uba_auditTrail (
	ID BIGINT NOT NULL PRIMARY KEY,
	entity VARCHAR(32) NOT NULL, --Entity
	entityinfo_id BIGINT NOT NULL, --Instance ID
	actionType VARCHAR(32) NOT NULL, --Action
	actionUser BIGINT NOT NULL, --User
	actionUserName VARCHAR(128) NULL, --Login
	actionTime DATETIME NOT NULL, --Action time
	remoteIP VARCHAR(40) NULL, --Remote IP
	parentEntity VARCHAR(32) NULL, --Parent entity name
	parentEntityInfo_id BIGINT NULL, --Parent instance ID
	request_id BIGINT NULL, --Request ID
	fromValue TEXT NULL, --Old values
	toValue TEXT NULL --New values
);
--
CREATE TABLE uba_group (
	ID BIGINT NOT NULL PRIMARY KEY,
	code VARCHAR(50) NOT NULL, --Group code
	name VARCHAR(128) NOT NULL, --Name
	name_uk VARCHAR(128) NOT NULL, --Name
	description VARCHAR(256) NULL, --Description
	mi_owner BIGINT NOT NULL, --Row owner
	mi_createDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Creation date
	mi_createUser BIGINT NOT NULL, --User who create row
	mi_modifyDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Modification date
	mi_modifyUser BIGINT NOT NULL --User who modify row
	, CONSTRAINT FK_GR_MI_OWNER_REF_USR FOREIGN KEY (MI_OWNER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_GR_MI_CREATEUSER_REF_USR FOREIGN KEY (MI_CREATEUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_GR_MI_MODIFYUSER_REF_USR FOREIGN KEY (MI_MODIFYUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_GR_ID_REF_SUBJ FOREIGN KEY (ID) REFERENCES uba_subject(ID)	
);
--
CREATE TABLE uba_grouprole (
	ID BIGINT NOT NULL PRIMARY KEY,
	groupID BIGINT NOT NULL, --Group
	roleID BIGINT NOT NULL, --Role
	mi_owner BIGINT NOT NULL, --Row owner
	mi_createDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Creation date
	mi_createUser BIGINT NOT NULL, --User who create row
	mi_modifyDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Modification date
	mi_modifyUser BIGINT NOT NULL --User who modify row
	, CONSTRAINT FK_UBA_GROUPROLE_GROUPID_REF_GR FOREIGN KEY (GROUPID) REFERENCES uba_group(ID)	
	, CONSTRAINT FK_UBA_GROUPROLE_ROLEID_REF_ROLE FOREIGN KEY (ROLEID) REFERENCES uba_role(ID)	
	, CONSTRAINT FK_UBA_GROUPROLE_MI_OWNER_REF_USR FOREIGN KEY (MI_OWNER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_UBA_GROUPROLE_MI_CREATEUSER_REF_USR FOREIGN KEY (MI_CREATEUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_UBA_GROUPROLE_MI_MODIFYUSER_REF_USR FOREIGN KEY (MI_MODIFYUSER) REFERENCES uba_user(ID)	
);
--
CREATE TABLE uba_otp (
	ID BIGINT NOT NULL PRIMARY KEY,
	otp VARCHAR(40) NOT NULL, --Generated one time password
	userID BIGINT NOT NULL, --User for which password was generated
	uData VARCHAR(2000) NULL, --Additional  data
	expiredDate DATETIME NOT NULL, --Expired date
	otpKind VARCHAR(32) NOT NULL, --Kind of otp(Email, SMS etc)
	mi_owner BIGINT NOT NULL, --Row owner
	mi_createDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Creation date
	mi_createUser BIGINT NOT NULL, --User who create row
	mi_modifyDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Modification date
	mi_modifyUser BIGINT NOT NULL --User who modify row
	, CONSTRAINT FK_OTP_USERID_REF_USR FOREIGN KEY (USERID) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_OTP_MI_OWNER_REF_USR FOREIGN KEY (MI_OWNER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_OTP_MI_CREATEUSER_REF_USR FOREIGN KEY (MI_CREATEUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_OTP_MI_MODIFYUSER_REF_USR FOREIGN KEY (MI_MODIFYUSER) REFERENCES uba_user(ID)	
);
--
CREATE TABLE uba_prevPasswordsHash (
	ID BIGINT NOT NULL PRIMARY KEY,
	userID BIGINT NOT NULL, --User
	uPasswordHashHexa VARCHAR(64) NULL, --Password hash
	mi_owner BIGINT NOT NULL, --Row owner
	mi_createDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Creation date
	mi_createUser BIGINT NOT NULL, --User who create row
	mi_modifyDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Modification date
	mi_modifyUser BIGINT NOT NULL --User who modify row
	, CONSTRAINT FK_PREVP_USERID_REF_USR FOREIGN KEY (USERID) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_PREVP_MI_OWNER_REF_USR FOREIGN KEY (MI_OWNER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_PREVP_MI_CREATEUSER_REF_USR FOREIGN KEY (MI_CREATEUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_PREVP_MI_MODIFYUSER_REF_USR FOREIGN KEY (MI_MODIFYUSER) REFERENCES uba_user(ID)	
);
--
CREATE TABLE uba_usercertificate (
	ID BIGINT NOT NULL PRIMARY KEY,
	userID BIGINT NOT NULL, --User
	issuer_serial VARCHAR(512) NOT NULL, --Issuer tag of certificate
	issuer_cn VARCHAR(512) NULL, --Issuer caption
	serial VARCHAR(100) NOT NULL, --Certificate serial number
	certificate BLOB NOT NULL, --Certificate binary data
	certParsed JSON(4000) NULL, --Parsed certificate in JSON format
	isForSigning SMALLINT(1) DEFAULT (0) NOT NULL CHECK (isForSigning IN (0,1) ), --Is this certificate applicable for signing operations
	description VARCHAR(512) NULL, --Description
	disabled SMALLINT(1) DEFAULT (0) NOT NULL CHECK (disabled IN (0,1) ), --disabled
	revoked SMALLINT(1) DEFAULT (0) NOT NULL CHECK (revoked IN (0,1) ), --Revoked
	revocationDate DATETIME NULL, --Revocation date
	mi_owner BIGINT NOT NULL, --Row owner
	mi_createDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Creation date
	mi_createUser BIGINT NOT NULL, --User who create row
	mi_modifyDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Modification date
	mi_modifyUser BIGINT NOT NULL --User who modify row
	, CONSTRAINT FK_USRCER_USERID_REF_USR FOREIGN KEY (USERID) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_USRCER_MI_OWNER_REF_USR FOREIGN KEY (MI_OWNER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_USRCER_MI_CREATEUSER_REF_USR FOREIGN KEY (MI_CREATEUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_USRCER_MI_MODIFYUSER_REF_USR FOREIGN KEY (MI_MODIFYUSER) REFERENCES uba_user(ID)	
);
--
CREATE TABLE uba_usergroup (
	ID BIGINT NOT NULL PRIMARY KEY,
	userID BIGINT NOT NULL, --User
	groupID BIGINT NOT NULL, --Group
	mi_owner BIGINT NOT NULL, --Row owner
	mi_createDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Creation date
	mi_createUser BIGINT NOT NULL, --User who create row
	mi_modifyDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Modification date
	mi_modifyUser BIGINT NOT NULL --User who modify row
	, CONSTRAINT FK_USRGROUP_USERID_REF_USR FOREIGN KEY (USERID) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_USRGROUP_GROUPID_REF_GR FOREIGN KEY (GROUPID) REFERENCES uba_group(ID)	
	, CONSTRAINT FK_USRGROUP_MI_OWNER_REF_USR FOREIGN KEY (MI_OWNER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_USRGROUP_MI_CREATEUSER_REF_USR FOREIGN KEY (MI_CREATEUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_USRGROUP_MI_MODIFYUSER_REF_USR FOREIGN KEY (MI_MODIFYUSER) REFERENCES uba_user(ID)	
);
--
CREATE TABLE ubm_desktop (
	ID BIGINT NOT NULL PRIMARY KEY,
	caption VARCHAR(255) NOT NULL, --Desktop name
	caption_uk VARCHAR(255) NOT NULL, --Desktop name
	code VARCHAR(50) NOT NULL, --Code
	description VARCHAR(255) NULL, --Desktop description
	description_uk VARCHAR(255) NULL, --Desktop description
	iconCls VARCHAR(255) DEFAULT ('u-icon-desktop') NOT NULL, --Desktop icon
	url VARCHAR(255) NULL, --Static server page URL which is displayed in screen centre of selected desktop
	isDefault SMALLINT(1) DEFAULT (0) NOT NULL CHECK (isDefault IN (0,1) ), --By default?
	displayOrder INTEGER DEFAULT (1000) NOT NULL, --Display order
	mi_owner BIGINT NOT NULL, --Row owner
	mi_createDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Creation date
	mi_createUser BIGINT NOT NULL, --User who create row
	mi_modifyDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Modification date
	mi_modifyUser BIGINT NOT NULL, --User who modify row
	mi_deleteDate DATETIME DEFAULT ('9999-12-31') NOT NULL, --Deletion date
	mi_deleteUser BIGINT NULL --User who delete row
	, CONSTRAINT FK_DESK_MI_OWNER_REF_USR FOREIGN KEY (MI_OWNER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_DESK_MI_CREATEUSER_REF_USR FOREIGN KEY (MI_CREATEUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_DESK_MI_MODIFYUSER_REF_USR FOREIGN KEY (MI_MODIFYUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_DESK_MI_DELETEUSER_REF_USR FOREIGN KEY (MI_DELETEUSER) REFERENCES uba_user(ID)	
);
--
CREATE TABLE ubm_desktop_adm (
	ID BIGINT NOT NULL PRIMARY KEY,
	instanceID BIGINT NOT NULL, --Desktop
	admSubjID BIGINT NOT NULL --Admin subject
	, CONSTRAINT FK_ADMDESK_INSTANCEID_REF_DESK FOREIGN KEY (INSTANCEID) REFERENCES ubm_desktop(ID)	
	, CONSTRAINT FK_ADMDESK_ADMSUBJID_REF_SUBJ FOREIGN KEY (ADMSUBJID) REFERENCES uba_subject(ID)	
);
--
CREATE TABLE ubm_enum (
	ID BIGINT NOT NULL PRIMARY KEY,
	eGroup VARCHAR(32) NOT NULL, --Group
	code VARCHAR(32) NOT NULL, --Value code
	shortName VARCHAR(128) NULL, --Short name
	shortName_uk VARCHAR(128) NULL, --Short name
	name VARCHAR(255) NOT NULL, --Value name
	name_uk VARCHAR(255) NOT NULL, --Value name
	sortOrder INTEGER DEFAULT (100) NOT NULL, --Order #
	mi_owner BIGINT NOT NULL, --Row owner
	mi_createDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Creation date
	mi_createUser BIGINT NOT NULL, --User who create row
	mi_modifyDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Modification date
	mi_modifyUser BIGINT NOT NULL, --User who modify row
	mi_deleteDate DATETIME DEFAULT ('9999-12-31') NOT NULL, --Deletion date
	mi_deleteUser BIGINT NULL --User who delete row
	, CONSTRAINT FK_ENU_MI_OWNER_REF_USR FOREIGN KEY (MI_OWNER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_ENU_MI_CREATEUSER_REF_USR FOREIGN KEY (MI_CREATEUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_ENU_MI_MODIFYUSER_REF_USR FOREIGN KEY (MI_MODIFYUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_ENU_MI_DELETEUSER_REF_USR FOREIGN KEY (MI_DELETEUSER) REFERENCES uba_user(ID)	
);
--
CREATE TABLE ubm_navshortcut (
	ID BIGINT NOT NULL PRIMARY KEY,
	desktopID BIGINT NOT NULL, --Desktop
	parentID BIGINT NULL, --Shortcut folder
	code VARCHAR(50) NOT NULL, --Code
	isFolder SMALLINT(1) DEFAULT (0) NOT NULL CHECK (isFolder IN (0,1) ), --Is folder?
	caption VARCHAR(255) NOT NULL, --Shortcut caption
	caption_uk VARCHAR(255) NOT NULL, --Shortcut caption
	cmdCode TEXT NULL, --Command code
	inWindow SMALLINT(1) DEFAULT (0) NOT NULL CHECK (inWindow IN (0,1) ), --Display in new window
	isCollapsed SMALLINT(1) DEFAULT (0) NOT NULL CHECK (isCollapsed IN (0,1) ), --Show collapsed at the first start
	displayOrder INTEGER DEFAULT (1000) NOT NULL, --Display order (in current node)
	iconCls VARCHAR(50) NULL, --Icon (CSS class)
	description VARCHAR(256) NULL, --Shortcut description
	description_uk VARCHAR(256) NULL, --Shortcut description
	keywords VARCHAR(512) NULL, --Search keywords
	keywords_uk VARCHAR(512) NULL, --Search keywords
	mi_treePath VARCHAR(450) NOT NULL,
	mi_owner BIGINT NOT NULL, --Row owner
	mi_createDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Creation date
	mi_createUser BIGINT NOT NULL, --User who create row
	mi_modifyDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Modification date
	mi_modifyUser BIGINT NOT NULL, --User who modify row
	mi_deleteDate DATETIME DEFAULT ('9999-12-31') NOT NULL, --Deletion date
	mi_deleteUser BIGINT NULL --User who delete row
	, CONSTRAINT FK_NAVSH_DESKTOPID_REF_DESK FOREIGN KEY (DESKTOPID) REFERENCES ubm_desktop(ID)	
	, CONSTRAINT FK_NAVSH_PARENTID_REF_NAVSH FOREIGN KEY (PARENTID) REFERENCES ubm_navshortcut(ID)	
	, CONSTRAINT FK_NAVSH_MI_OWNER_REF_USR FOREIGN KEY (MI_OWNER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_NAVSH_MI_CREATEUSER_REF_USR FOREIGN KEY (MI_CREATEUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_NAVSH_MI_MODIFYUSER_REF_USR FOREIGN KEY (MI_MODIFYUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_NAVSH_MI_DELETEUSER_REF_USR FOREIGN KEY (MI_DELETEUSER) REFERENCES uba_user(ID)	
);
--
CREATE TABLE ubm_navshortcut_adm (
	ID BIGINT NOT NULL PRIMARY KEY,
	instanceID BIGINT NOT NULL, --Shortcut
	admSubjID BIGINT NOT NULL --Subject of administration
	, CONSTRAINT FK_ADMNAV_INSTANCEID_REF_NAVSH FOREIGN KEY (INSTANCEID) REFERENCES ubm_navshortcut(ID)	
	, CONSTRAINT FK_ADMNAV_ADMSUBJID_REF_SUBJ FOREIGN KEY (ADMSUBJID) REFERENCES uba_subject(ID)	
);
--
CREATE TABLE ubm_query (
	ID BIGINT NOT NULL PRIMARY KEY,
	code VARCHAR(50) NOT NULL, --Code
	name VARCHAR(256) NOT NULL, --Name
	name_uk VARCHAR(256) NOT NULL, --Name
	ubql JSON(4000) NOT NULL, --UBQL (JSON)
	type VARCHAR(32) NOT NULL, --Type
	mi_unityEntity VARCHAR(64) NOT NULL,
	mi_owner BIGINT NOT NULL, --Row owner
	mi_createDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Creation date
	mi_createUser BIGINT NOT NULL, --User who create row
	mi_modifyDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Modification date
	mi_modifyUser BIGINT NOT NULL, --User who modify row
	mi_deleteDate DATETIME DEFAULT ('9999-12-31') NOT NULL, --Deletion date
	mi_deleteUser BIGINT NULL --User who delete row
	, CONSTRAINT FK_UBMQR_MI_OWNER_REF_USR FOREIGN KEY (MI_OWNER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_UBMQR_MI_CREATEUSER_REF_USR FOREIGN KEY (MI_CREATEUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_UBMQR_MI_MODIFYUSER_REF_USR FOREIGN KEY (MI_MODIFYUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_UBMQR_MI_DELETEUSER_REF_USR FOREIGN KEY (MI_DELETEUSER) REFERENCES uba_user(ID)	
);
--
CREATE TABLE ubm_sysdictionary (
	ID BIGINT NOT NULL PRIMARY KEY,
	code VARCHAR(50) NOT NULL, --Code
	name VARCHAR(256) NOT NULL, --Name
	name_uk VARCHAR(256) NOT NULL, --Name
	ubql JSON(4000) NOT NULL, --UBQL (JSON)
	mi_owner BIGINT NOT NULL, --Row owner
	mi_createDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Creation date
	mi_createUser BIGINT NOT NULL, --User who create row
	mi_modifyDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Modification date
	mi_modifyUser BIGINT NOT NULL, --User who modify row
	mi_deleteDate DATETIME DEFAULT ('9999-12-31') NOT NULL, --Deletion date
	mi_deleteUser BIGINT NULL --User who delete row
	, CONSTRAINT FK_UBMSD_MI_OWNER_REF_USR FOREIGN KEY (MI_OWNER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_UBMSD_MI_CREATEUSER_REF_USR FOREIGN KEY (MI_CREATEUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_UBMSD_MI_MODIFYUSER_REF_USR FOREIGN KEY (MI_MODIFYUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_UBMSD_MI_DELETEUSER_REF_USR FOREIGN KEY (MI_DELETEUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_UBMSD_ID_REF_UBMQR FOREIGN KEY (ID) REFERENCES ubm_query(ID)	
);
--
CREATE TABLE ubs_filter (
	ID BIGINT NOT NULL PRIMARY KEY,
	code VARCHAR(100) NOT NULL, --Code of filter group
	name VARCHAR(250) NOT NULL, --Filter name
	filter TEXT NOT NULL, --filter
	isGlobal SMALLINT(1) NOT NULL CHECK (isGlobal IN (0,1) ), --Is this filter accessible for all users
	owner BIGINT NOT NULL, --Filter owner
	mi_owner BIGINT NOT NULL, --Row owner
	mi_createDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Creation date
	mi_createUser BIGINT NOT NULL, --User who create row
	mi_modifyDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Modification date
	mi_modifyUser BIGINT NOT NULL --User who modify row
	, CONSTRAINT FK_SFILTER_OWNER_REF_USR FOREIGN KEY (OWNER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_SFILTER_MI_OWNER_REF_USR FOREIGN KEY (MI_OWNER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_SFILTER_MI_CREATEUSER_REF_USR FOREIGN KEY (MI_CREATEUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_SFILTER_MI_MODIFYUSER_REF_USR FOREIGN KEY (MI_MODIFYUSER) REFERENCES uba_user(ID)	
);
--
CREATE TABLE ubs_message (
	ID BIGINT NOT NULL PRIMARY KEY,
	messageBody TEXT NULL, --Message
	complete SMALLINT(1) DEFAULT (0) NOT NULL CHECK (complete IN (0,1) ), --Submitted
	messageType VARCHAR(32) NOT NULL, --Type
	startDate DATETIME NOT NULL, --Valid from
	expireDate DATETIME NOT NULL, --Valid to
	mi_owner BIGINT NOT NULL, --Row owner
	mi_createDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Creation date
	mi_createUser BIGINT NOT NULL, --User who create row
	mi_modifyDate DATETIME DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')) NOT NULL, --Modification date
	mi_modifyUser BIGINT NOT NULL, --User who modify row
	mi_deleteDate DATETIME DEFAULT ('9999-12-31') NOT NULL, --Deletion date
	mi_deleteUser BIGINT NULL --User who delete row
	, CONSTRAINT FK_MSG_MI_OWNER_REF_USR FOREIGN KEY (MI_OWNER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_MSG_MI_CREATEUSER_REF_USR FOREIGN KEY (MI_CREATEUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_MSG_MI_MODIFYUSER_REF_USR FOREIGN KEY (MI_MODIFYUSER) REFERENCES uba_user(ID)	
	, CONSTRAINT FK_MSG_MI_DELETEUSER_REF_USR FOREIGN KEY (MI_DELETEUSER) REFERENCES uba_user(ID)	
);
--
CREATE TABLE ubs_message_recipient (
	ID BIGINT NOT NULL PRIMARY KEY,
	messageID BIGINT NOT NULL, --Message
	userID BIGINT NOT NULL, --User
	acceptDate DATETIME NULL --Accept date
	, CONSTRAINT FK_MSG_RC_MESSAGEID_REF_MSG FOREIGN KEY (MESSAGEID) REFERENCES ubs_message(ID)	
	, CONSTRAINT FK_MSG_RC_USERID_REF_USR FOREIGN KEY (USERID) REFERENCES uba_user(ID)	
);
--
CREATE TABLE ubs_numcounter (
	ID BIGINT NOT NULL PRIMARY KEY,
	regKey VARCHAR(255) NOT NULL, --Registration key
	counter BIGINT NOT NULL, --Counter
	fakeLock INTEGER NULL --Used internally
);
--
CREATE TABLE ubs_numcounterreserv (
	ID BIGINT NOT NULL PRIMARY KEY,
	regKey VARCHAR(255) NOT NULL, --Registration key
	counter BIGINT NOT NULL, --Counter
	reservedDate VARCHAR(255) NULL, --Reserved date for document
	note VARCHAR(255) NULL --Description of reserved number (Department name, etc)
);
--
CREATE TABLE ubs_softLock (
	ID BIGINT NOT NULL PRIMARY KEY,
	entity VARCHAR(32) NOT NULL, --Entity
	lockID BIGINT NOT NULL, --Instance ID
	lockUser BIGINT NOT NULL, --User, who locking record
	lockType VARCHAR(32) NOT NULL, --Lock type
	lockTime DATETIME NOT NULL --Lock time
	, CONSTRAINT FK_SLOCK_LOCKUSER_REF_USR FOREIGN KEY (LOCKUSER) REFERENCES uba_user(ID)	
);
--
 
-- Add columns
--######################################
ALTER TABLE uba_audit ADD targetGroup VARCHAR(128) NULL;
--
ALTER TABLE uba_role ADD description_uk VARCHAR(256) NULL;
--
ALTER TABLE uba_subject ADD name_uk VARCHAR(256) NULL;
--
ALTER TABLE uba_user ADD firstName VARCHAR(64) NULL;
--
ALTER TABLE uba_user ADD lastName VARCHAR(64) NULL;
--
ALTER TABLE uba_user ADD fullName VARCHAR(128) NULL;
--
ALTER TABLE uba_user ADD gender VARCHAR(32) NULL;
--
ALTER TABLE uba_user ADD email VARCHAR(64) NULL;
--
ALTER TABLE uba_user ADD phone VARCHAR(32) NULL;
--
ALTER TABLE uba_user ADD avatar VARCHAR(4000) NULL;
--
ALTER TABLE ubs_settings ADD name_uk VARCHAR(150) NULL;
--
ALTER TABLE ubs_settings ADD description_uk VARCHAR(1024) NULL;
--
ALTER TABLE ubs_settings ADD settingValue_uk VARCHAR(2000) NULL;
--
ALTER TABLE ubs_settings ADD defaultValue_uk VARCHAR(150) NULL;
--
 
-- ! update values for known or estimated changes
--######################################
UPDATE uba_role SET description_uk = description WHERE (1 = 1);
--
UPDATE uba_subject SET name_uk = name WHERE (1 = 1);
--
UPDATE ubs_settings SET name_uk = name WHERE (1 = 1);
--
UPDATE ubs_settings SET description_uk = description WHERE (1 = 1);
--
UPDATE ubs_settings SET settingValue_uk = settingValue WHERE (1 = 1);
--
UPDATE ubs_settings SET defaultValue_uk = defaultValue WHERE (1 = 1);
--
 
-- Create indexes
--######################################
CREATE UNIQUE INDEX UIDX_REQ_DEPART_NAME ON req_depart(NAME) ;
--
CREATE INDEX IDX_REQ_DEPARTMENT ON req_reqList(DEPARTMENT) ;
--
CREATE INDEX IDX_REQ_SUBDEPARTMENT ON req_reqList(SUBDEPARTMENT) ;
--
CREATE INDEX IDX_REQ_SUBDEPART_DEPARTMENT ON req_subDepart(DEPARTMENT) ;
--
CREATE UNIQUE INDEX UIDX_BHIST_IAR ON ub_blobHistory(INSTANCE,ATTRIBUTE,REVISION) ;
--
CREATE UNIQUE INDEX UIDX_UBA_ADVSECURITY_USERID ON uba_advSecurity(USERID) ;
--
CREATE INDEX IDX_UBA_ADVSECURITY_MI_OWNER ON uba_advSecurity(MI_OWNER) ;
--
CREATE INDEX IDX_UBA_ADVSECURITY_MI_CREATEUSER ON uba_advSecurity(MI_CREATEUSER) ;
--
CREATE INDEX IDX_UBA_ADVSECURITY_MI_MODIFYUSER ON uba_advSecurity(MI_MODIFYUSER) ;
--
CREATE UNIQUE INDEX UK_UBA_ALS_EASR ON uba_als(ENTITY,ATTRIBUTE,STATE,ROLENAME) ;
--
CREATE INDEX idx_saud_targetUser ON uba_audit(TARGETUSER) ;
--
CREATE INDEX idx_audtr_entity ON uba_auditTrail(ENTITYINFO_ID) ;
--
CREATE INDEX idx_audtr_parententinfoid ON uba_auditTrail(PARENTENTITYINFO_ID) ;
--
CREATE INDEX IDX_ELS_RULEROLE ON uba_els(RULEROLE) ;
--
CREATE INDEX IDX_ELS_MI_OWNER ON uba_els(MI_OWNER) ;
--
CREATE INDEX IDX_ELS_MI_CREATEUSER ON uba_els(MI_CREATEUSER) ;
--
CREATE INDEX IDX_ELS_MI_MODIFYUSER ON uba_els(MI_MODIFYUSER) ;
--
CREATE UNIQUE INDEX UIDX_GR_CODE ON uba_group(CODE) ;
--
CREATE UNIQUE INDEX UIDX_GR_NAME ON uba_group(NAME) ;
--
CREATE UNIQUE INDEX UIDX_GR_NAME_UK ON uba_group(NAME_UK) ;
--
CREATE INDEX IDX_GR_MI_OWNER ON uba_group(MI_OWNER) ;
--
CREATE INDEX IDX_GR_MI_CREATEUSER ON uba_group(MI_CREATEUSER) ;
--
CREATE INDEX IDX_GR_MI_MODIFYUSER ON uba_group(MI_MODIFYUSER) ;
--
CREATE INDEX IDX_UBA_GROUPROLE_GROUPID ON uba_grouprole(GROUPID) ;
--
CREATE INDEX IDX_UBA_GROUPROLE_ROLEID ON uba_grouprole(ROLEID) ;
--
CREATE INDEX IDX_UBA_GROUPROLE_MI_OWNER ON uba_grouprole(MI_OWNER) ;
--
CREATE INDEX IDX_UBA_GROUPROLE_MI_CREATEUSER ON uba_grouprole(MI_CREATEUSER) ;
--
CREATE INDEX IDX_UBA_GROUPROLE_MI_MODIFYUSER ON uba_grouprole(MI_MODIFYUSER) ;
--
CREATE UNIQUE INDEX UK_GRPROLE_USER_ROLE ON uba_grouprole(GROUPID,ROLEID) ;
--
CREATE INDEX IDX_OTP_USERID ON uba_otp(USERID) ;
--
CREATE INDEX IDX_OTP_MI_OWNER ON uba_otp(MI_OWNER) ;
--
CREATE INDEX IDX_OTP_MI_CREATEUSER ON uba_otp(MI_CREATEUSER) ;
--
CREATE INDEX IDX_OTP_MI_MODIFYUSER ON uba_otp(MI_MODIFYUSER) ;
--
CREATE UNIQUE INDEX uidx_otp ON uba_otp(OTP) ;
--
CREATE INDEX IDX_PREVP_USERID ON uba_prevPasswordsHash(USERID) ;
--
CREATE INDEX IDX_PREVP_MI_OWNER ON uba_prevPasswordsHash(MI_OWNER) ;
--
CREATE INDEX IDX_PREVP_MI_CREATEUSER ON uba_prevPasswordsHash(MI_CREATEUSER) ;
--
CREATE INDEX IDX_PREVP_MI_MODIFYUSER ON uba_prevPasswordsHash(MI_MODIFYUSER) ;
--
CREATE UNIQUE INDEX UIDX_ROLE_NAME ON uba_role(NAME) ;
--
CREATE INDEX IDX_ROLE_MI_OWNER ON uba_role(MI_OWNER) ;
--
CREATE INDEX IDX_ROLE_MI_CREATEUSER ON uba_role(MI_CREATEUSER) ;
--
CREATE INDEX IDX_ROLE_MI_MODIFYUSER ON uba_role(MI_MODIFYUSER) ;
--
CREATE INDEX IDX_SUBJ_NAME ON uba_subject(NAME) ;
--
CREATE UNIQUE INDEX UIDX_USR_NAME ON uba_user(NAME) ;
--
CREATE INDEX IDX_USR_MI_OWNER ON uba_user(MI_OWNER) ;
--
CREATE INDEX IDX_USR_MI_CREATEUSER ON uba_user(MI_CREATEUSER) ;
--
CREATE INDEX IDX_USR_MI_MODIFYUSER ON uba_user(MI_MODIFYUSER) ;
--
CREATE INDEX IDX_USRCER_USERID ON uba_usercertificate(USERID) ;
--
CREATE UNIQUE INDEX UIDX_USRCER_SERIAL ON uba_usercertificate(SERIAL) ;
--
CREATE INDEX IDX_USRCER_MI_OWNER ON uba_usercertificate(MI_OWNER) ;
--
CREATE INDEX IDX_USRCER_MI_CREATEUSER ON uba_usercertificate(MI_CREATEUSER) ;
--
CREATE INDEX IDX_USRCER_MI_MODIFYUSER ON uba_usercertificate(MI_MODIFYUSER) ;
--
CREATE UNIQUE INDEX uidx_usercert ON uba_usercertificate(SERIAL,ISSUER_SERIAL,USERID) ;
--
CREATE INDEX IDX_USRGROUP_USERID ON uba_usergroup(USERID) ;
--
CREATE INDEX IDX_USRGROUP_GROUPID ON uba_usergroup(GROUPID) ;
--
CREATE INDEX IDX_USRGROUP_MI_OWNER ON uba_usergroup(MI_OWNER) ;
--
CREATE INDEX IDX_USRGROUP_MI_CREATEUSER ON uba_usergroup(MI_CREATEUSER) ;
--
CREATE INDEX IDX_USRGROUP_MI_MODIFYUSER ON uba_usergroup(MI_MODIFYUSER) ;
--
CREATE UNIQUE INDEX UK_USRGROUP_USER_GROUP ON uba_usergroup(USERID,GROUPID) ;
--
CREATE INDEX IDX_USROLE_USERID ON uba_userrole(USERID) ;
--
CREATE INDEX IDX_USROLE_ROLEID ON uba_userrole(ROLEID) ;
--
CREATE INDEX IDX_USROLE_MI_OWNER ON uba_userrole(MI_OWNER) ;
--
CREATE INDEX IDX_USROLE_MI_CREATEUSER ON uba_userrole(MI_CREATEUSER) ;
--
CREATE INDEX IDX_USROLE_MI_MODIFYUSER ON uba_userrole(MI_MODIFYUSER) ;
--
CREATE UNIQUE INDEX UK_USRROLE_USER_ROLE ON uba_userrole(USERID,ROLEID) ;
--
CREATE UNIQUE INDEX UIDX_DESK_CODE ON ubm_desktop(CODE,MI_DELETEDATE) ;
--
CREATE INDEX IDX_DESK_MI_OWNER ON ubm_desktop(MI_OWNER) ;
--
CREATE INDEX IDX_DESK_MI_CREATEUSER ON ubm_desktop(MI_CREATEUSER) ;
--
CREATE INDEX IDX_DESK_MI_MODIFYUSER ON ubm_desktop(MI_MODIFYUSER) ;
--
CREATE INDEX IDX_DESK_MI_DELETEUSER ON ubm_desktop(MI_DELETEUSER) ;
--
CREATE INDEX IDX_ADMDESK_INSTANCEID ON ubm_desktop_adm(INSTANCEID) ;
--
CREATE INDEX IDX_ADMDESK_ADMSUBJID ON ubm_desktop_adm(ADMSUBJID) ;
--
CREATE UNIQUE INDEX UK_ADMDESC_INST_ADMSUBJ ON ubm_desktop_adm(INSTANCEID,ADMSUBJID) ;
--
CREATE INDEX IDX_ENU_MI_OWNER ON ubm_enum(MI_OWNER) ;
--
CREATE INDEX IDX_ENU_MI_CREATEUSER ON ubm_enum(MI_CREATEUSER) ;
--
CREATE INDEX IDX_ENU_MI_MODIFYUSER ON ubm_enum(MI_MODIFYUSER) ;
--
CREATE INDEX IDX_ENU_MI_DELETEUSER ON ubm_enum(MI_DELETEUSER) ;
--
CREATE UNIQUE INDEX UK_UBM_ENUM_GROUPCODE ON ubm_enum(EGROUP,CODE,MI_DELETEDATE) ;
--
CREATE INDEX IDX_NAVSH_DESKTOPID ON ubm_navshortcut(DESKTOPID) ;
--
CREATE INDEX IDX_NAVSH_PARENTID ON ubm_navshortcut(PARENTID) ;
--
CREATE UNIQUE INDEX UIDX_NAVSH_CODE ON ubm_navshortcut(CODE,MI_DELETEDATE) ;
--
CREATE INDEX IDX_NAVSH_MI_OWNER ON ubm_navshortcut(MI_OWNER) ;
--
CREATE INDEX IDX_NAVSH_MI_CREATEUSER ON ubm_navshortcut(MI_CREATEUSER) ;
--
CREATE INDEX IDX_NAVSH_MI_MODIFYUSER ON ubm_navshortcut(MI_MODIFYUSER) ;
--
CREATE INDEX IDX_NAVSH_MI_DELETEUSER ON ubm_navshortcut(MI_DELETEUSER) ;
--
CREATE INDEX IDX_NAVSH_TREEPATH ON ubm_navshortcut(MI_TREEPATH) ;
--
CREATE INDEX IDX_ADMNAV_INSTANCEID ON ubm_navshortcut_adm(INSTANCEID) ;
--
CREATE INDEX IDX_ADMNAV_ADMSUBJID ON ubm_navshortcut_adm(ADMSUBJID) ;
--
CREATE UNIQUE INDEX UK_ADMNAV_INST_ADMSUBJ ON ubm_navshortcut_adm(INSTANCEID,ADMSUBJID) ;
--
CREATE UNIQUE INDEX UIDX_UBMQR_CODE ON ubm_query(CODE,MI_DELETEDATE) ;
--
CREATE INDEX IDX_UBMQR_MI_OWNER ON ubm_query(MI_OWNER) ;
--
CREATE INDEX IDX_UBMQR_MI_CREATEUSER ON ubm_query(MI_CREATEUSER) ;
--
CREATE INDEX IDX_UBMQR_MI_MODIFYUSER ON ubm_query(MI_MODIFYUSER) ;
--
CREATE INDEX IDX_UBMQR_MI_DELETEUSER ON ubm_query(MI_DELETEUSER) ;
--
CREATE UNIQUE INDEX UIDX_UBMSD_CODE ON ubm_sysdictionary(CODE,MI_DELETEDATE) ;
--
CREATE INDEX IDX_UBMSD_MI_OWNER ON ubm_sysdictionary(MI_OWNER) ;
--
CREATE INDEX IDX_UBMSD_MI_CREATEUSER ON ubm_sysdictionary(MI_CREATEUSER) ;
--
CREATE INDEX IDX_UBMSD_MI_MODIFYUSER ON ubm_sysdictionary(MI_MODIFYUSER) ;
--
CREATE INDEX IDX_UBMSD_MI_DELETEUSER ON ubm_sysdictionary(MI_DELETEUSER) ;
--
CREATE INDEX IDX_SFILTER_OWNER ON ubs_filter(OWNER) ;
--
CREATE INDEX IDX_SFILTER_MI_OWNER ON ubs_filter(MI_OWNER) ;
--
CREATE INDEX IDX_SFILTER_MI_CREATEUSER ON ubs_filter(MI_CREATEUSER) ;
--
CREATE INDEX IDX_SFILTER_MI_MODIFYUSER ON ubs_filter(MI_MODIFYUSER) ;
--
CREATE UNIQUE INDEX uix_ubs_filter ON ubs_filter(CODE,OWNER,NAME) ;
--
CREATE INDEX ix_ubs_filter_code ON ubs_filter(CODE) ;
--
CREATE INDEX IDX_MSG_MI_OWNER ON ubs_message(MI_OWNER) ;
--
CREATE INDEX IDX_MSG_MI_CREATEUSER ON ubs_message(MI_CREATEUSER) ;
--
CREATE INDEX IDX_MSG_MI_MODIFYUSER ON ubs_message(MI_MODIFYUSER) ;
--
CREATE INDEX IDX_MSG_MI_DELETEUSER ON ubs_message(MI_DELETEUSER) ;
--
CREATE INDEX idx_ubsmsg_period ON ubs_message(STARTDATE,EXPIREDATE) ;
--
CREATE INDEX IDX_MSG_RC_MESSAGEID ON ubs_message_recipient(MESSAGEID) ;
--
CREATE INDEX IDX_MSG_RC_USERID ON ubs_message_recipient(USERID) ;
--
CREATE INDEX uidx_ubsmsg_rc ON ubs_message_recipient(MESSAGEID,USERID) ;
--
CREATE UNIQUE INDEX UIDX_NUCO_REGKEY ON ubs_numcounter(REGKEY) ;
--
CREATE UNIQUE INDEX UK_UBS_NUMCOUNT_RKC ON ubs_numcounterreserv(REGKEY,COUNTER) ;
--
CREATE UNIQUE INDEX UIDX_STNGS_SETTINGKEY ON ubs_settings(SETTINGKEY) ;
--
CREATE INDEX IDX_STNGS_MI_OWNER ON ubs_settings(MI_OWNER) ;
--
CREATE INDEX IDX_STNGS_MI_CREATEUSER ON ubs_settings(MI_CREATEUSER) ;
--
CREATE INDEX IDX_STNGS_MI_MODIFYUSER ON ubs_settings(MI_MODIFYUSER) ;
--
CREATE INDEX IDX_SLOCK_LOCKUSER ON ubs_softLock(LOCKUSER) ;
--
CREATE UNIQUE INDEX UIDX_SOFTLOCK_LOENT ON ubs_softLock(LOCKID,ENTITY) ;
--