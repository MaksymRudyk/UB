const _ = require('lodash')
const App = require('../modules/App')
const nativeApp = process.binding('ub_app')

/**
 * JavaScript mixins registration
 * @protected
 */
module.exports = {
  initializeMixins,
  registerMixinModule
}

/**
 * Interface for mixin modules
 *
 * @interface MixinModule
 */

/**
 * Called for each entity which have specified mixin. Task ot this function is to register methods / events for entity
 * what implements mixin functionality
 * @function
 * @name MixinModule#initEntity
 * @param {UBEntity} entity Entity for initialization
 * @param {UBEntityMixin} mixinCfg Mixin configuration from entity metafile
 */

/**
 * Called once for mixin just after domain is loaded but before App.emit('domainIsLoaded') event emitted
 * @function
 * @name MixinModule#initDomain
 */


/**
 * Array of registered mixins in order they are registered
 * @private
 * @type {Array<string>}
 */
const _orderedMixinNames = []
/**
 * A map of registered mixins. Keys are mixin name
 * @private
 * @type {Object<string, MixinModule>}
 */
const _mixinModulesMap = {}

/**
 * A way to add additional mixins into domain
 * @param {string} mixinName A name used as "mixins" section key inside entity *.meta file
 * @param {MixinModule} mixinModule A module what implements a {MixinModule} interface
 */
function registerMixinModule(mixinName, mixinModule) {
  if (_mixinModulesMap[mixinName]) {
    throw new Error(`Mixin module for ${mixinName} is already registered`)
  }
  _orderedMixinNames.push(mixinName)
  _mixinModulesMap[mixinName] = mixinModule
}

/**
 * Go though all the domain entities and call initialization for all its mixins.
 * Called by `UB.start()`
 * @protected
 */
function initializeMixins() {
  // initialize domain level mixin handlers
  _orderedMixinNames.forEach(mixinName => {
    const mixinModule = _mixinModulesMap[mixinName]
    if (typeof mixinModule.initDomain === 'function') {
      mixinModule.initDomain()
    }
  })
  for (const eName in App.domainInfo.entities) {
    const e = App.domainInfo.entities[eName]
    const enabledEntityMixins = Object.keys(e.mixins).filter(mn => e.mixins[mn].enabled !== false)
    // apply mixins in order they are registered
    _orderedMixinNames.forEach(mn => {
      if ((enabledEntityMixins.indexOf(mn) !== -1) &&
          (_mixinModulesMap[mn].initEntity)) {
        //console.debug(`Init mixin '${mn}' for ${e.name}' ...`)
        _mixinModulesMap[mn].initEntity(e, e.mixins[mn]) // initialize mixin for entity
      }
    })
    // verify all entity mixins are registered
    enabledEntityMixins.forEach(mn => {
      if (!_mixinModulesMap[mn]) {
        console.warn(`Mixin ${mn} configured for entity ${e.name} but not implemented in domain`)
      }
    })
  }
}

// Add native mixin names to _modulesMap to prevents possible naming conflicts between native and JS mixins
;(function(){
  if (typeof nativeApp._getRegisteredMixinNames !== 'function') {
    throw new Error('This version of @unitybase/ub package require UB server to be at last 5.19.0')
  }
  const mixinNames = nativeApp._getRegisteredMixinNames() || {}
  for (const mixinName of mixinNames) {
    _mixinModulesMap[mixinName] = {}
  }
})()
