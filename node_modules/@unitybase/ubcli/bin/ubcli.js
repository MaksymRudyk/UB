#!/usr/bin/env ub

const fs = require('fs')
const path = require('path')
// argv: executable ubcli command ...params
const command = process.argv[2]

/**
 * A simple CLI for scaffolding UnityBase projects.
 * Run `npx ubcli -help` in command line (or `ubcli --help` if installed globaly) for a full list of available commands
 *
 * @module @unitybase/ubcli
 */

/**
 * Show usage
 */
function showUsage () {
  let libsPath = path.join(__dirname, '..', 'lib')
  let commands = fs.readdirSync(libsPath)
  console.info('Possible commands:')
  for (let cmd of commands) {
    if (cmd.endsWith('.js')) {
      let shortDoc = ' ' + cmd.replace(/\.js$/, '').padEnd(20, ' ')
      try {
        let descr = require(path.join(libsPath, cmd)).shortDoc
        if (descr) shortDoc += ' - ' + descr
      } catch (e) {
      }
      console.log(shortDoc)
    }
  }
  console.log('Run ubcli commandName -? for a command help')
}

function ubcli () {
  if (!command || (['-?', '/?', '-help', '/help', '--help'].indexOf(command) !== -1)) {
    showUsage()
  } else {
    try {
      const resolved = require.resolve(`../lib/${command}`)
      //console.log('RESOLVED TO', resolved)
    } catch (e) {
      showUsage()
      console.error(`Invalid command "${command}". See above for possible commands`)
      return
    }
    const cmdModule = require(`../lib/${command}`)
    if (typeof cmdModule === 'function') cmdModule()
  }
}

module.exports = ubcli
