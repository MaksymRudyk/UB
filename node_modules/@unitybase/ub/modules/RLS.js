/* global TubDataStore */
const Session = require('./Session.js')
const Repository = require('@unitybase/base').ServerRepository.fabric
const uba_common = require('@unitybase/base').uba_common
/**
 * UnityBase Row Level Security routines. For use in rls mixin.
 * @author MPV
 * Comment by Felix: Внимание! Для Оракла НЕЛЬЗЯ начинать алиас таблицы с символа подчеркивания '_'
 */

/**
 * @namespace
 */
let RLS = global.RLS = {}
global['$'] = RLS

let roleCache // it's safe to cache roles here because uba_role table is readonly in production

RLS.initCache = function () {
  let rInst
  if (!roleCache) {
    roleCache = {}
    rInst = new TubDataStore('uba_role')
    // here is direct SQL because permission to uba_role dose not exist for non-supervisor user's
    rInst.runSQL('select ID, name FROM uba_role', {})
    while (!rInst.eof) {
      roleCache[rInst.get(1)] = rInst.get(0) // roleCaсhe['admin'] = 1 e.t.c.
      rInst.next()
    }
  }
}

RLS.currentOwner = function () {
  return `( [mi_owner] = :(${Session.userID}): )`
}

/**
 * todo - OPTIMIZE using role cache
 * @param user
 * @param groupname
 * @return {String}
 */
RLS.userInGroup = function (user, groupname) {
  return `exists (select 1 from UBA_USERROLE ur inner join UBA_ROLE r ON ur.RoleID = r.ID WHERE  r.name = :('${groupname}'): AND ur.UserID = :(${user}): )`
}

/**
 * is current ( Session.userID) user have role with name groupname
 * @param groupname group name from uba_role
 * @return {*}
 */
RLS.currentUserInGroup = function (sender, groupname) {
  RLS.initCache()
  const groupID = roleCache[groupname]
  if (groupID && (Session.uData.roleIDs.indexOf(groupID) !== -1)) {
    return '(1=1)'
  } else {
    return '(0=1)'
  }
}

/**
*   Check user in adm subtable
*   no user group check performed!
*/
RLS.userInAdmSubtable = function (sender, user) {
  return `exists (select 1 from ' + sender.entity.name + '_adm uast where uast.instanceID = [ID] and uast.admSubjID = :(${user}): )`
}

RLS.isOracle = function (entity) {
  return entity.connectionConfig.dialect.startsWith('Oracle')
}

/** Check user or any of user groups in adm subtable
/*  xmax using ORACLE
* _todo check oracle syntax!!
*/
RLS.userOrUserGroupInAdmSubtable = function (sender, user) {
  var result = `exists (select 1 from ${sender.entity.name}_adm ast where ast.instanceID = [ID] and ast.admSubjID in (select ur.RoleID from uba_userrole ur where ur.UserID = :(${user}): union select ${user}`
  if (RLS.isOracle(sender.entity)) {
    return result + ' from dual ))'
  } else {
    return result + '))'
  }
}

RLS.currentUserInAdmSubtable = function (sender) {
  return this.userInAdmSubtable(sender, Session.userID)
}

RLS.currentUserOrUserGroupInAdmSubtable = function (sender) {
  let subjects = `ast.admSubjID = :(${Session.userID}):`
  Session.uData.roleIDs.forEach(rID => {
    subjects += ` OR ast.admSubjID = :(${rID}):`
  })
  return `exists (select 1 from ${sender.entity.name}_adm ast where ast.instanceID = [ID] and (${subjects}))`
}

/**
 * For members of Admin group and for users `root` and `admin` do nothing.
 *
 * For other users adds condition what
 *  - either current user is a record owner
 *  - OR user or one of user role in `{$entity}_adm` sub-table
 *
 * @param {ubMethodParams} ctxt
 */
RLS.allowForAdminOwnerAndAdmTable = function (ctxt) {
  // skip RLS for admin and root and Admin group member
  if (uba_common.isSuperUser() || Session.uData.roleIDs.includes(uba_common.ROLES.ADMIN.ID)) return

  const mParams = ctxt.mParams
  let whereList = mParams.whereList
  if (!whereList) {
    mParams.whereList = {}
    // whereList = mParams.whereList = {} assign a {} to whereList instead of TubList instance
    whereList = mParams.whereList
  }
  // either current user is record owner
  const byOwner = whereList.getUniqKey()
  whereList[byOwner] = {
    expression: '[mi_owner]',
    condition: 'equal',
    value: Session.userID
  }
  // or User or one of user role in _adm sub-table
  const byAdm = whereList.getUniqKey()
  const eName = ctxt.dataStore.entity.name
  const subQ = Repository(`${eName}_adm`)
    .where('[admSubjID]', 'in', [Session.userID,...Session.uData.roleIDs, ...Session.uData.groupIDs])
    .correlation('instanceID', 'ID')
    .ubql()
  whereList[byAdm] = {
    expression: '',
    condition: 'subquery',
    subQueryType: 'exists',
    value: subQ
  }
  const logic = `([${byOwner}]) OR ([${byAdm}])`
  if (!mParams.logicalPredicates) {
    mParams.logicalPredicates = [logic]
  } else {
    // ubList.push NOT WORK!
    mParams.logicalPredicates = [...mParams.logicalPredicates, logic]
  }
}
