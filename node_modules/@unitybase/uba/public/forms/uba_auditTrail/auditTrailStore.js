const UB = require('@unitybase/ub-pub')
const { lookups } = require('@unitybase/adminui-vue')
const { diffWords } = require('./diff')

module.exports = {
  state () {
    return {
      tableData: []
    }
  },

  getters: {
    oldData (state) {
      return parseDiffValue(state.data.fromValue)
    },

    newData (state) {
      return parseDiffValue(state.data.toValue)
    },

    attributesFromDiffs (state, getters) {
      return Array.from(
        new Set([
          ...Object.keys(getters.oldData),
          ...Object.keys(getters.newData)
        ])
      )
        .filter(attr => attr !== 'ID' && (attr === 'mi_wfState' || !attr.startsWith('mi_')))
    }
  },

  mutations: {
    SET_TABLE_DATA (state, tableData) {
      state.tableData.splice(0, state.tableData.length, ...tableData)
    }
  },

  actions: {
    async enrichTableData ({ state, getters, commit }) {
      const [updatedOldData, updatedNewData] = await transformData(
        state.data.entity,
        getters.attributesFromDiffs,
        getters.oldData,
        getters.newData
      )

      const tableData = getters.attributesFromDiffs
        .map(attr => {
          const row = {}
          row.attrName = buildLabel(state.data.entity, attr)
          const { oldValue, newValue } = diffWords(updatedOldData[attr], updatedNewData[attr])
          row.oldValue = oldValue
          row.newValue = newValue
          row.dataType = getAttrMeta(state.data.entity, attr).dataType

          return row
        })

      commit('SET_TABLE_DATA', tableData)
    }
  }
}

/**
 * Gets meta for attribute code in audit JSON (can be "caption", "caption_en^")
 *
 * @param {string} entityName Entity name
 * @param {string} attr Attribute code in audit JSON
 * @return {UBEntityAttribute} UB attribute meta
 */
function getAttrMeta (entityName, attr) {
  const L = attr.length
  if (attr[L - 1] === '^') {
    attr = attr.substring(0, L - 4)
  }
  return UB.connection.domain.get(entityName).attributes[attr]
}

/**
 * In case lang attrs then appends translated name of language in brackets.
 * For example "caption_en^" will converts to "Caption (English)" but "caption^" to "Caption"
 *
 * @param {string} entity Entity name
 * @param {string} attr Attr code
 * @return {string} Label
 */
function buildLabel (entity, attr) {
  const L = attr.length
  let attrLang = ''
  if (attr[L - 1] === '^') {
    attrLang = attr.substring(attr.lastIndexOf('_') + 1, L - 1)
    attr = attr.substring(0, L - 4)
  }
  let res = UB.i18n(`${entity}.${attr}`)
  if (attrLang) res += ` (${UB.i18n(attrLang)})`
  return res
}

/**
 * Transforms data by UBDataType's.
 *
 * @param {string} parentEntity Name of parent entity
 * @param {string[]} attrs Attrs codes
 * @param {object|null|undefined} oldData Old data
 * @param {object|null|undefined} newData New data
 *
 * @return {Promise<[object, object]>} Updated data
 */
async function transformData (parentEntity, attrs, oldData, newData) {
  const updatedOldData = Object.assign({}, oldData)
  const updatedNewData = Object.assign({}, newData)

  // Promise list to load lookups
  const requests = []
  // List of transformations for each response. All indexes equals with requests
  const responseTransforms = []
  for (const attr of attrs) {
    const attrMeta = getAttrMeta(parentEntity, attr)

    for (const data of [updatedOldData, updatedNewData]) {
      data[attr] = formatValue(data, attrMeta, attr, requests, responseTransforms)
    }

    if (attrMeta.dataType === 'Document') {
      // remove keys which has equal values
      const [
        updatedOldValue,
        updatedNewValue
      ] = cleanEqualsInDocumentAttrs(updatedOldData[attr], updatedNewData[attr])

      updatedOldData[attr] = updatedOldValue
      updatedNewData[attr] = updatedNewValue
    }
  }

  const responses = await Promise.all(requests)
  responses.forEach((response, index) => {
    responseTransforms[index](response)
  })

  return [updatedOldData, updatedNewData]
}

/**
 * For multi-language attributes uba_auditTrail values JSON can contains either "attr" or "attr^" for base language
 * and "attr_ln^" for other languages.
 *
 * This function parse JSON and normalize "attr^" -> "attr" to simplify future processing
 *
 * @param {*} value Json as string
 * @return {object} Parsed json
 */
function parseDiffValue (value) {
  if (typeof value !== 'string' || !value.length) return {}

  let v = JSON.parse(value)
  let attrs = Object.keys(v)
  attrs.forEach(attr => {
    const L = attr.length
    if (attr[L - 1] === '^') {
      if ((L > 4) && (attr[L - 4] !== '_')) {
        v[attr.substring(0, L - 1)] = v[attr]
        delete v[attr]
      }
    }
  })
  return v
}

/**
 * Returns document attrs which has just different keys.
 *
 * @param {string} from
 * @param {string} to
 * @return {string[]}
 */
function cleanEqualsInDocumentAttrs (from, to) {
  const oldJson = from === '' ? {} : JSON.parse(from)
  const newJson = to === '' ? {} : JSON.parse(to)

  const keysToDelete = Array.from(
    new Set([
      ...Object.keys(oldJson),
      ...Object.keys(newJson)
    ])
  )
    .filter(key => oldJson[key] === newJson[key])

  for (const key of keysToDelete) {
    delete oldJson[key]
    delete newJson[key]
  }

  function jsonStringify (json) {
    if (Object.keys(json).length) {
      return JSON.stringify(json, null, 2)
    } else {
      return ''
    }
  }

  return [
    jsonStringify(oldJson),
    jsonStringify(newJson)
  ]
}

/**
 * Format value by UBDataType and enrich lookups promises.
 *
 * @param {object} dataObject Data object
 * @param {UBEntityAttribute} attrMeta UB attribute
 * @param {string} attrCode Attr code
 * @param {promise[]} requests Requests to load lookups
 * @param {function[]} responseTransforms Transformations for each lookup request
 * @return {string} Formated value
 */
function formatValue (dataObject, attrMeta, attrCode, requests, responseTransforms) {
  const value = dataObject[attrCode]

  switch (attrMeta.dataType) {
    case 'String':
    case 'Text':
    case 'Number':
    case 'BigInt':
    case 'Boolean':
    case 'Currency':
    case 'Float':
    case 'ID':
    case 'Int':
    case 'Json':
    case 'Document':
      if (value === null || value === undefined) {
        return ''
      } else {
        return String(value)
      }

    case 'Date':
      return UB.formatter.formatDate(value, 'date')

    case 'DateTime':
    case 'TimeLog':
      return UB.formatter.formatDate(value, 'dateTime')

    case 'Enum':
      return lookups.getEnum(attrMeta.enumGroup, value) || ''

    case 'Entity': {
      if (value === undefined || value === null) return ''

      const { associatedEntity, associationAttr = 'ID' } = attrMeta
      const lookupEntity = UB.connection.domain.get(associatedEntity, false)
      if (!lookupEntity) return value ? String(value) : ''
      const descriptionAttribute = lookupEntity.getDescriptionAttribute(false)
      if (!descriptionAttribute) return value ? String(value) : ''
      const request = UB.Repository(associatedEntity)
        .attrs(
          ...new Set(['ID', associationAttr, descriptionAttribute])
        )
        .where(associationAttr, '=', value)
        .select()

      requests.push(request)
      responseTransforms.push(resultData => {
        dataObject[attrCode] = resultData.length > 0
          ? `${value} (${resultData[0][descriptionAttribute]})`
          : dataObject[attrCode] = ''
      })
    }
      break

    case 'Many': {
      if (!value) return ''

      const { associatedEntity, associationAttr = 'ID' } = attrMeta
      const descriptionAttribute = UB.connection.domain.get(associatedEntity).getDescriptionAttribute()
      const ids = value.split(',').map(id => Number(id))
      const request = UB.Repository(associatedEntity)
        .attrs(
          ...new Set(['ID', associationAttr, descriptionAttribute])
        )
        .where(associationAttr, 'in', ids)
        .select()

      requests.push(request)
      responseTransforms.push(resultData => {
        dataObject[attrCode] = resultData
          .map(row => `${row[associationAttr]} (${row[descriptionAttribute]})`)
          .join(', ')
      })
    }
      break

    default:
      return ''
  }
}
