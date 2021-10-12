/* eslint-disable camelcase,no-unused-vars,new-cap,no-undef,comma-dangle */
// This file is generated automatically and contain definition for code insight.
// It ignored by UnityBase server because name start from "_".
// Do not modify this file directly. Run `ucli createCodeInsightHelper --help` for details

/**
 * Set of entities for constructing a dynamically generated UnityBase UI. Enumerations, navigation desktops &amp; shortcuts, forms, ER diagrams
 * @version 5.4.19
 * @module @unitybase/ubm
 */

/**
 * Administering of desktops
 * @extends EntityNamespace
 * @mixes mStorage
 */
class ubm_desktop_adm_ns extends EntityNamespace {}

/**
 * @typedef ubmDesktopAdmAttrs
 * @type {object}
 * @property {Number} ID
 * @property {Number|ubmDesktopAttrs} instanceID - Desktop
 * @property {Number|ubaSubjectAttrs} admSubjID - Admin subject
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubmDesktopAdmAttrs}
 */
ubm_desktop_adm_ns.attrs = {}

/**
* Administering of desktops
* @type {ubm_desktop_adm_ns}
*/
const ubm_desktop_adm = new ubm_desktop_adm_ns()
/**
 * Entity relation diagrams
 * @extends EntityNamespace
 */
class ubm_diagram_ns extends EntityNamespace {}

/**
 * @typedef ubmDiagramAttrs
 * @type {object}
 * @property {Number} ID - ID
 * @property {String} model - Model
 * @property {String} name - Name
 * @property {String} document - Entity diagram
 * @property {Date} mi_modifyDate - Modification date
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubmDiagramAttrs}
 */
ubm_diagram_ns.attrs = {}

/**
* Entity relation diagrams
* @type {ubm_diagram_ns}
*/
const ubm_diagram = new ubm_diagram_ns()
/**
 * Enumerated values.
 * On the UI used as a lookup for attributes with dataType &#x60;Enum&#x60;
 * @extends EntityNamespace
 * @mixes mStorage
 */
class ubm_enum_ns extends EntityNamespace {}

/**
 * @typedef ubmEnumAttrs
 * @type {object}
 * @property {Number} ID
 * @property {String} eGroup - Group
 * @property {String} code - Code
 * @property {String} shortName - Short name
 * @property {String} name - Value name
 * @property {Number} sortOrder - Order #
 * @property {Number|ubaUserAttrs} mi_owner
 * @property {Date} mi_createDate
 * @property {Number|ubaUserAttrs} mi_createUser
 * @property {Date} mi_modifyDate
 * @property {Number|ubaUserAttrs} mi_modifyUser
 * @property {Date} mi_deleteDate
 * @property {Number|ubaUserAttrs} mi_deleteUser
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubmEnumAttrs}
 */
ubm_enum_ns.attrs = {}

/**
* Enumerated values.
 * On the UI used as a lookup for attributes with dataType &#x60;Enum&#x60;
* @type {ubm_enum_ns}
*/
const ubm_enum = new ubm_enum_ns()
/**
 * Definition of interface forms
 * @extends EntityNamespace
 */
class ubm_form_ns extends EntityNamespace {}

/**
 * @typedef ubmFormAttrs
 * @type {object}
 * @property {Number} ID - ID
 * @property {String} code - Form code
 * @property {String} description - Description
 * @property {String} caption - Form title
 * @property {String|ubmEnumAttrs} formType - Form type
 * @property {String} formDef - Form definition
 * @property {String} formCode - Form script
 * @property {String} model - Model
 * @property {String} entity - Entity
 * @property {Boolean} isDefault - By default
 * @property {Date} mi_modifyDate - Modification date
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubmFormAttrs}
 */
ubm_form_ns.attrs = {}

/**
* Definition of interface forms
* @type {ubm_form_ns}
*/
const ubm_form = new ubm_form_ns()
/**
 * Metadata for build navbars
 * @extends EntityNamespace
 * @mixes mStorage
 * @mixes tree
 */
class ubm_navshortcut_ns extends EntityNamespace {}

/**
 * @typedef ubmNavshortcutAttrs
 * @type {object}
 * @property {Number} ID
 * @property {Number|ubmDesktopAttrs} desktopID - Desktop
 * @property {Number|ubmNavshortcutAttrs} parentID - Shortcut folder
 * @property {String} code - Code
 * @property {Boolean} isFolder - Is folder?
 * @property {String} caption - Shortcut caption
 * @property {String} cmdCode - Command code
 * @property {Boolean} inWindow - In new window
 * @property {Boolean} isCollapsed - Collapse
 * @property {Number} displayOrder - Order #
 * @property {String} iconCls - Icon (CSS class)
 * @property {String} description - Shortcut description
 * @property {String} keywords - Search keywords
 * @property {String} mi_treePath
 * @property {Number|ubaUserAttrs} mi_owner
 * @property {Date} mi_createDate
 * @property {Number|ubaUserAttrs} mi_createUser
 * @property {Date} mi_modifyDate
 * @property {Number|ubaUserAttrs} mi_modifyUser
 * @property {Date} mi_deleteDate
 * @property {Number|ubaUserAttrs} mi_deleteUser
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubmNavshortcutAttrs}
 */
ubm_navshortcut_ns.attrs = {}

/**
* Metadata for build navbars
* @type {ubm_navshortcut_ns}
*/
const ubm_navshortcut = new ubm_navshortcut_ns()
/**
 * Description.
 * This entity used by $.currentUserOrUserGroupInAdmSubtable RLS macro
 * @extends EntityNamespace
 * @mixes mStorage
 */
class ubm_navshortcut_adm_ns extends EntityNamespace {}

/**
 * @typedef ubmNavshortcutAdmAttrs
 * @type {object}
 * @property {Number} ID
 * @property {Number|ubmNavshortcutAttrs} instanceID - Shortcut
 * @property {Number|ubaSubjectAttrs} admSubjID - Subject of administration
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubmNavshortcutAdmAttrs}
 */
ubm_navshortcut_adm_ns.attrs = {}

/**
* Description.
 * This entity used by $.currentUserOrUserGroupInAdmSubtable RLS macro
* @type {ubm_navshortcut_adm_ns}
*/
const ubm_navshortcut_adm = new ubm_navshortcut_adm_ns()
/**
 * Data Queries
 * @extends EntityNamespace
 * @mixes mStorage
 */
class ubm_query_ns extends EntityNamespace {}

/**
 * @typedef ubmQueryAttrs
 * @type {object}
 * @property {Number} ID
 * @property {String} code - Code
 * @property {String} name - Name
 * @property {*} ubql - UBQL (JSON)
 * @property {Number|ubaUserAttrs} mi_owner
 * @property {Date} mi_createDate
 * @property {Number|ubaUserAttrs} mi_createUser
 * @property {Date} mi_modifyDate
 * @property {Number|ubaUserAttrs} mi_modifyUser
 * @property {Date} mi_deleteDate
 * @property {Number|ubaUserAttrs} mi_deleteUser
 */

/**
 * Attributes defined in metadata. Property does not exists in real life and added for IDE
 * @type {ubmQueryAttrs}
 */
ubm_query_ns.attrs = {}

/**
* Data Queries
* @type {ubm_query_ns}
*/
const ubm_query = new ubm_query_ns()
