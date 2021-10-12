/* global ncrc32, nsha256, TubList */
const assert = require('assert')

let l = new TubList()

l.arrVal = [-1, 0, 1, 2]
l.objVal = {}
l.objVal.ar = [-1, 1]
console.log(typeof l, l)

l.freeNative()
l = null

const c = ncrc32(0,'aaaabbbb')
assert.strictEqual(c, ncrc32(0, 'aaaabbbb'))
assert.strictEqual(c, ncrc32(ncrc32(0, 'aaaa'), 'bbbb'), 'ncrc32 calculation using initial value')

const SHA256 = require('@unitybase/cryptojs/sha256')

let s = 'salt'
for (let i = 0; i < 100; i++) {
  s = s + String.fromCharCode(i)
  assert.strictEqual(SHA256(s).toString(), nsha256(s), 'SHA256 fail on i =' + i)
}
console.time('sha'); for (let i = 0; i < 100; i++) { SHA256(s).toString() } console.timeEnd('sha')
console.time('Nsha'); for (let i = 0; i < 100; i++) { nsha256(s) } console.timeEnd('Nsha')
