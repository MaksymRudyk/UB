require('./UBAppConfig')
require('./UBUtil')
/**
 * Файл: UB.core.UBStoreManager.js
 * Автор: Игорь Ноженко
 *
 * Менеджер store'ов уровня приложения
 */
Ext.define('UB.core.UBStoreManager', {
  singleton: true,

  /**
   *
   * @param {String} entityName
   * @param {String[]} fieldList (optional)
   * @param {Object} [whereList] (optional)
   * @return {Ext.data.Store}
   */
  getStore: function (entityName, fieldList, whereList) {
    return Ext.data.StoreManager.lookup(UB.core.UBUtil.getNameMd5(entityName, fieldList, whereList))
  },

  /**
   *
   * @param {String} systemEntity
   * @return {String}
   */
  getSystemEntityStoreGetterName: function (systemEntity) {
    return 'get' + Ext.String.capitalize(systemEntity) + 'Store'
  },

  /**
   *
   * @param {String} systemEntity
   * @return {Ext.data.Store}
   */
  getSystemEntityStore: function (systemEntity) {
    return this[this.getSystemEntityStoreGetterName(systemEntity)]()
  },

  /**
   * in-memory cache of ubm_navshortcut cmdData values. Key is shortcut ID
   */
  shortcutCommandCache: {},
  shortcutAttributes: ['ID', 'desktopID', 'parentID', 'code', 'isFolder', 'caption', 'inWindow', 'isCollapsed', 'displayOrder', 'iconCls'],
  formAttributes: ['ID', 'code', 'description', 'caption', 'formType', 'formDef', 'formCode', 'entity', 'model', 'isDefault'],
  enumAttributes: ['ID', "eGroup", "code", "name", "shortName", "sortOrder"],

  /**
   * Update internal navshortcut cache for specified item
   * @param {object} cmd ubm_navshortcut row
   * @param {boolean} [force=true] Add command to cache if not exists
   * @return {null|undefined}
   */
  updateNavshortcutCacheForItem: function (cmd, force = true) {
    if (!cmd.cmdCode) return
    const parsedCmdCode = Ext.JSON.decode(cmd.cmdCode)
    if (!parsedCmdCode.title) parsedCmdCode.title = cmd.caption
    parsedCmdCode.shortcutCode = cmd.code
    if (UB.core.UBStoreManager.shortcutCommandCache[cmd.ID] || force) {
      UB.core.UBStoreManager.shortcutCommandCache[cmd.ID] = parsedCmdCode
    }
    return parsedCmdCode
  },
  /**
   * Load a nav. shortcut command text from cache or from server
   * @param {number} shortcutID
   * @return {Promise} command code
   */
  async getNavshortcutCommandText (shortcutID) {
    const cmdCode = UB.core.UBStoreManager.shortcutCommandCache[shortcutID]
    if (cmdCode) {
      return cmdCode
    } else {
      return UB.Repository('ubm_navshortcut')
        .attrs(['ID', 'cmdCode', 'caption', 'code'])
        .where('ID', '=', shortcutID)
        .selectSingle()
        .then(this.updateNavshortcutCacheForItem)
    }
  },
  /**
   *
   * @return {Ext.data.Store}
   */
  getNavigationShortcutStore: function () {
    return this.getStore('ubm_navshortcut', this.shortcutAttributes)
  },

  /**
   *
   * @return {Ext.data.Store}
   */
  getFormStore: function () {
    return this.getStore('ubm_form', this.formAttributes)
  },

  /**
   *
   * @return {Ext.data.Store}
   */
  getEnumStore: function () {
    return this.getStore('ubm_enum', this.enumAttributes)
  },
  /**
   *
   * @return {Ext.data.Store}
   */
  get_enum_Store: function () {
    return this.getEnumStore()
  }
})
