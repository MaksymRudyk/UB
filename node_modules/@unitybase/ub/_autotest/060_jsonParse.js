var argv = require('@unitybase/base').argv
var assert = require('assert')
var path = require('path')
var fixturesDir = path.join(__dirname, 'fixtures')
var obj = argv.safeParseJSONfile(path.join(fixturesDir, 'jsonParser.json'))
assert.equal(obj.path, '\\\\fs\\Share\\')
