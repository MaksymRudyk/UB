const cmdLineOpt = require('@unitybase/base/options')
const path = require('path')
const fs = require('fs')

const fileList = []

const META_RE = /\.meta($|\...$)/
/**
 * Creates a file path list for a directory (recursively)
 * @param {string} initialDirectory - path of initial directory
 */
function readDirectoryFiles (initialDirectory) {
  const directoryContent = fs.readdirSync(initialDirectory)
  directoryContent.forEach(element => {
    const elementPath = path.join(initialDirectory, element)
    if (fs.statSync(elementPath).isDirectory()) {
      readDirectoryFiles(elementPath)
    }
    if (fs.statSync(elementPath).isFile() && META_RE.test(elementPath)) {
      fileList.push(elementPath)
    }
  })
}

/**
 * Mutate obj.mapping property to array of object. Fix AnsiSql -> AnsiSQL
 * @param obj
 */
function transformMapping (obj) {
  if (!obj.mapping || Array.isArray(obj.mapping)) return // already array
  const newMappings = []
  for (const dialectName in obj.mapping) {
    // noinspection JSUnfilteredForInLoop
    const oldDialect = obj.mapping[dialectName]
    let newDialectName = dialectName
    if (newDialectName === 'AnsiSql') newDialectName = 'AnsiSQL' // UB5 is case sensitive here
    const newDialect = Object.assign({ name: newDialectName }, oldDialect)
    newMappings.push(newDialect)
  }
  obj.mapping = newMappings
}

module.exports = function metaTr (options) {
  if (!options) {
    const opts = cmdLineOpt.describe('meta-tr', '*.meta transformation to fit a latest meta JSON schema', 'ub')
      .add({
        short: 'm', long: 'meta', param: 'metaFile', help: `Path to *.meta or *.meta.lang file or to the folder;
       In case of folder all *.meta* files will be transformed recursively`
      })
    options = opts.parseVerbose({}, true)
    if (!options) return
  }

  if (fs.statSync(options.meta).isFile()) {
    fileList.push(options.meta)
  } else if (fs.statSync(options.meta).isDirectory()) {
    readDirectoryFiles(options.meta)
  } else {
    console.info(`${options.meta} - not valid path to file or directory`)
    return
  }

  console.info(`Start convert files:\n ${fileList.join('\n')}`)
  const readyConvertedFiles = []
  fileList.forEach(filePath => {
    try {
      let metaContent = fs.readFileSync(filePath, { encoding: 'utf-8' })
      // remove all comments from JSON
      metaContent = metaContent.replace(/(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm, '')
      const jsonC = JSON.parse(metaContent)
      if (Array.isArray(jsonC.attributes)) {
        readyConvertedFiles.push(filePath.replace(options.meta, ''))
        return
      }
      transformMapping(jsonC)
      const newAttributes = []
      for (const attrName in jsonC.attributes) {
        const oldAttr = jsonC.attributes[attrName]
        const attr = Object.assign({ name: attrName }, oldAttr)
        transformMapping(attr)
        newAttributes.push(attr)
      }
      jsonC.attributes = newAttributes
      metaContent = JSON.stringify(jsonC, null, '  ')
      fs.writeFileSync(filePath, metaContent)
    } catch (e) {
      console.error(`!!!Error converting: ${filePath}`)
      throw e
    }
  })
  if (readyConvertedFiles.length) {
    console.info(`Meta-file attributes are already converted to array:\n${readyConvertedFiles.join(';')}`)
  }
}

module.exports.shortDoc =
`Transform *.meta file attributes from Object to Array
\t\t\trepresentation as defined in latest entity JSON schema`
