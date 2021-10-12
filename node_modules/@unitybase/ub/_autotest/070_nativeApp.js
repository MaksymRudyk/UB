const assert = require('assert')

const nativeApp = process.binding('ub_app')

assert.equal(typeof(nativeApp), 'object', 'ub_app not provided')

assert.equal(typeof(nativeApp._getRegisteredMixinNames), 'function', 'ub_app._getRegisteredMixinNames not provided')

console.log('ub_app._getRegisteredMixinNames', nativeApp._getRegisteredMixinNames())