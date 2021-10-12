/**
 * Command line module for creating folder with all static assets (models, modules) available for client using
 * `clientRequire` and `models` endpoints. Such folder can be served by nginx as a static folder.
 * This greatly reduce a UnityBase application logs size and speed up static files loading (about 1ms per file)
 * Command line usage:

 ubcli linkStatic -?

 * @author pavel.mash 2019-11-15
 * @module wwwStaticFolder
 * @memberOf module:@unitybase/ubcli
 */
const fs = require('fs')
const argv = require('@unitybase/base').argv
const options = require('@unitybase/base').options
const path = require('path')

const DEBUG = false
const WINDOWS = (process.platform === 'win32')
const COMMENT = WINDOWS ? 'REM' : '#'

module.exports = linkStatic
module.exports.shortDoc = 'Create directory with static assets'

function linkStatic (cfg) {
  console.time('Generate static content directory')
  if (!cfg) {
    const opts = options.describe('linkStatic',
      `Create folder with a static assets, which can be used by nginx
as drop-in replacement to /clientRequire and /models endpoints`,
      'ubcli'
    )
      .add({
        short: 't',
        long: 'target',
        param: 'target',
        defaultValue: '*',
        help: 'Target folder. Default is "inetPub" value from config'
      })
      .add({
        short: 'run',
        long: 'run',
        defaultValue: false,
        help: 'Execute a bash/cmd script after creation'
      })
    cfg = opts.parseVerbose({}, true)
    if (!cfg) return
  }
  const cfgFN = argv.getConfigFileName()
  const ubCfg = argv.getServerConfiguration()
  let target = cfg.target || ubCfg.httpServer.inetPub

  if (!target || (typeof target !== 'string')) {
    throw new Error('Target folder is not specified. Either set a "http.inetPub" value in config or pass switch --target path/to/target/folder')
  }
  if (!path.isAbsolute(target)) target = path.join(process.cwd(), target)

  const CLIENT_REQUIRE_TARGET_ALIAS = WINDOWS ? '%CRT%' : '$CRT'
  const NODE_MODULES_SOURCES_ALIAS = WINDOWS ? '%NMS%' : '$NMS'

  const domainModels = ubCfg.application.domain.models
  const realCfgPath = path.dirname(fs.realpathSync(cfgFN)) // config can be a symlink from /opt/unitybase/products
  const modulesPath = path.join(realCfgPath, 'node_modules')
  if (!fs.existsSync(modulesPath)) {
    throw new Error(`node_modules folder not found in the folder with app config. Expected "${modulesPath}". May be you miss "npm i" command?`)
  }
  const tm = fs.readdirSync(modulesPath)
  const commands = []
  const clientRequireTarget = path.join(target, 'clientRequire')
  commands.push({
    type: 'comment',
    text: 'Modules for /clientRequire endpoint replacement'
  })

  for (const m of tm) {
    if (m.startsWith('.')) continue
    if (m.startsWith('@')) { // namespace
      const ttm = fs.readdirSync(path.join(modulesPath, m))
      commands.push({
        type: 'mkdir',
        to: path.join(CLIENT_REQUIRE_TARGET_ALIAS, m)
      })
      const L = commands.length
      for (const sm of ttm) {
        if (!sm.startsWith('.')) {
          tryAddModule(modulesPath, NODE_MODULES_SOURCES_ALIAS, path.join(m, sm), commands, CLIENT_REQUIRE_TARGET_ALIAS)
        }
      }
      if (commands.length === L) {
        // no modules added - remove ns folder creation
        commands.pop()
      }
    } else {
      tryAddModule(modulesPath, NODE_MODULES_SOURCES_ALIAS, m, commands, CLIENT_REQUIRE_TARGET_ALIAS)
    }
  }

  // process models. In case model is already sym-linked for clientRequire - use a related link
  // TODO - This allow to copy full folder to remote fs
  const modelsTarget = path.join(clientRequireTarget, 'models')
  DEBUG && console.log(domainModels)
  commands.push({
    type: 'comment',
    text: 'Models for /model endpoint replacement'
  })

  for (const m of domainModels) {
    const packageJsonFn = path.join(m.realPath, 'package.json')
    const packageJSON = require(packageJsonFn)
    if (!packageJSON.config || !packageJSON.config.ubmodel || !packageJSON.config.ubmodel.name) {
      throw new Error(`package.json config for model ${m.name} should contains a section "config": {"ubmodel": {"name":...}`)
    }

    m.realPublicPath = packageJSON.config.ubmodel.isPublic
      ? m.realPath
      : path.join(m.realPath, 'public')
    m.packageJSON = packageJSON

    let rpp = m.realPublicPath
    if (rpp.endsWith('/') || rpp.endsWith('\\')) rpp = rpp.slice(0, -1)
    if (!fs.existsSync(rpp)) { // no public folder
      DEBUG && console.info(`Skip model ${m.Name} - no public folder ${rpp}`)
      continue
    }
    const moduleLink = commands.find(c => c.from === rpp)
    if (moduleLink) {
      commands.push({
        from: moduleLink.to,
        to: path.join(CLIENT_REQUIRE_TARGET_ALIAS, 'models', m.packageJSON.config.ubmodel.name),
        type: 'folder'
      })
    } else {
      commands.push({
        from: rpp,
        to: path.join(CLIENT_REQUIRE_TARGET_ALIAS, 'models', m.packageJSON.config.ubmodel.name),
        type: 'folder'
      })
    }
  }

  let script

  if (WINDOWS) {
    script = [
      '@ECHO OFF',
      `SET CRT=${clientRequireTarget}`,
      `SET NMS=${modulesPath}`,
      'RMDIR %CRT% /s /q', // prevent recursive symlinks
      'MKDIR %CRT%\\models'
    ]
  } else {
    script = [
      'err() { echo "err"; exit $?; }',
      `CRT=${clientRequireTarget}`,
      `NMS=${modulesPath}`,
      'rm -rf $CRT', // prevent recursive symlinks
      'mkdir -p $CRT',
      'mkdir -p $CRT/models'
    ]
  }

  for (const cmd of commands) {
    if (WINDOWS) {
      if (cmd.type === 'comment') {
        script.push(`REM ${cmd.text}`)
      } else if (cmd.type === 'mkdir') {
        script.push(`MKDIR ${cmd.to}`)
      } else if (cmd.type === 'folder') {
        script.push(`MKLINK /J /D ${cmd.to} ${cmd.from} || goto err`)
      } else if (cmd.type === 'file') {
        script.push(`if not exist ${cmd.to} MKLINK /H ${cmd.to} ${cmd.from} || goto err`)
      }
    } else {
      if (cmd.type === 'comment') {
        script.push(`# ${cmd.text}`)
      } else if (cmd.type === 'mkdir') {
        script.push(`mkdir -p ${cmd.to} || err`)
      } else if (cmd.type === 'folder') {
        script.push(`ln -s ${cmd.from} ${cmd.to} || err`)
      } else if (cmd.type === 'file') {
        script.push(`ln -s -f ${cmd.from} ${cmd.to} || err`)
      }
    }
  }

  const favIconTarget = path.join(target, 'favicon.ico')
  if (!fs.existsSync(favIconTarget)) {
    const ubModel = domainModels.find(m => m.name === 'UB')
    if (ubModel) {
      const favIconSrc = path.join(ubModel.realPublicPath, 'img', 'UBLogo16.ico')
      script.push(`${COMMENT} no favicon.ico found in target folder - use default favicon`)
      if (WINDOWS) {
        script.push(`MKLINK /H ${favIconTarget} ${favIconSrc}`)
      } else {
        script.push(`ln -s ${favIconSrc} ${favIconTarget}`)
      }
    }
  }
  script.push(`${COMMENT} update modification time for files in modules updated by npm`)
  if (WINDOWS) {
    script.push(`
if exist %NMS%\\@unitybase\\ub\\node_modules\\@unitybase (
  echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  echo Updating date for files in node_modules folder is skipped because symbolic links is detected between packages
  echo If you are on the development environment this is OK, if on PRODUCTION - REMOVE SYMBOLIC LINKS AND RERUN THIS SCRIPT
  echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 
) else (
  forfiles /P %NMS% /S /D -01/01/1986 /C "cmd /c Copy /B @path+,,"
)  
goto :eof
:err
 EXIT 1
:eof
`)
  } else {
    script.push('find -L $CRT -type f -not -path "*/node_modules/*" -not -newermt \'1986-01-01\' -exec touch -m {} +')
  }

  // win
  // forfiles /P .\node_modules /S /D -01.01.1986 /C "cmd /c Copy /B @path+,,"
  const resFn = path.join(process.cwd(), `.linkStatic.${WINDOWS ? 'cmd' : 'sh'}`)
  fs.writeFileSync(resFn, script.join('\n'))
  console.log(`

${WINDOWS ? 'CMD' : 'Bash'} script ${resFn} is created
  Review a script, take care about target folder and package list.
  In case some package should not be exposed to client add a section
        "config": {"ubmodel": {} } into corresponding package.json.
  Use a command:
    ${WINDOWS ? '.\\.linkStatic.cmd' : 'chmod +x ./.linkStatic.sh && ./.linkStatic.sh'}
  to link a static`)

  // let pjsPath = path.join(cfgPath, 'package.json')
  // if (!fs.existsSync(pjsPath)) {
  //   throw new Error(`package.json not found in the folder with app config. Expected path "${pjsPath}"`)
  // }
  // let appPackage = require(pjsPath)
  // console.log(domainModels)
  // console.log(appPackage)

  /*
  How to prevent server-side logic to be exposed for client

  First let's explain what packages are exposed:
    - packages without `config.ubmodel` section and packaged with `config.ubmodel.isPublic: true` inside package.json
      are exposed as is (sym-linked into ${httpServer.inetPub}/clientRequire)
    - for packages with `config.ubmodel && !config.ubmodel.isPublic` only `public` folder content and package.json itself
      is sym-linked into ${httpServer.inetPub}/clientRequire. All other model folders are hidden from client

  So, to hide all package files from client add a "config" : {"ubmodel": {} } section into package.json

   */
}

/**
 * Check module should be exposed and if yes, add command to "to" array
 * @param {string} modulesPath node_modules root
 * @param {string} MPT alias for modulesPath
 * @param {string} module Name of module to check
 * @param {array<object>} commands
 * @param {string} target Target folder
 */
function tryAddModule (modulesPath, MPT, module, commands, target) {
  const pPath = path.join(modulesPath, module, 'package.json')
  if (!fs.existsSync(pPath)) return
  const p = require(pPath)

  const hasUbModel = p.config && p.config.ubmodel
  if (!hasUbModel || (hasUbModel && p.config.ubmodel.isPublic)) { // packages without `config.ubmodel` and public packages
    if (!hasUbModel) {
      DEBUG && console.info(`Add common module "${module}"`)
    } else {
      DEBUG && console.info(`Add public model  "${module}"`)
    }
    commands.push({
      type: 'folder',
      from: path.join(MPT, module),
      to: path.join(target, module)
    })
    if (!hasUbModel) { // add link to module entry point to use in `index .entryPoint.js` nginx directive
      const pkgEntryPoint = path.join(modulesPath, module, p.main || 'index.js')
      // Check only files. Entry point can be a folder as in https://github.com/tarruda/has:  "main": "./src"
      // In such cases second call to linkStatic creates a File system loop
      // In any case such modules can't be requires by systemjs? so better to exclude it at all
      if (fs.isFile(pkgEntryPoint)) {
        commands.push({
          type: 'file',
          from: path.join(MPT, module, p.main || 'index.js'),
          to: path.join(target, module, '.entryPoint.js')
        })
      } else {
        DEBUG && console.warn(`Entry point ${pkgEntryPoint} not exists (or points to a folder). Skip linking of .entryPoint.js`)
      }
    }
  } else { // packages with `public` folder
    const pubPath = path.join(modulesPath, module, 'public')
    if (!fs.existsSync(pubPath)) {
      DEBUG && console.log(`Skip server-side "${module}"`)
      return
    }
    DEBUG && console.info(`Add public part  "${module}/public"`)
    commands.push({
      type: 'mkdir',
      to: path.join(target, module)
    })
    commands.push({
      type: 'folder',
      from: path.join(MPT, module, 'public'),
      to: path.join(target, module, 'public')
    })
    commands.push({
      from: path.join(MPT, module, 'package.json'),
      to: path.join(target, module, 'package.json'),
      type: 'file'
    })
  }
}
