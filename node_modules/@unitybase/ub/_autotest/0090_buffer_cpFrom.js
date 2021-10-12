const assert = require('assert')

const buf = Buffer.cpFrom('Привет!', 1251)
const mustBe = Buffer.from([0xcf,0xf0,0xe8,0xe2,0xe5,0xf2,0x21])

assert.strictEqual(buf.equals(mustBe), true, 'Buffer.cpFrom in 1251')
