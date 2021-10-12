const UB = require('@unitybase/ub-pub')
const defaultType = require('./type-definitions/default')
const defaultCellTemplate = require('./cell-templates/default.vue').default

/**
 * Module provides column settings, cell and filter templates by UB data types.
 * Different types can have same templates or settings.
 *
 * Entity attributes with dataType `Text`, `BLOB`, `TimeLog` did not have default render component,
 * If you need to render this dataTypeProvider render it by named column slots.
 * You need to decide to display this column type with great caution because this column can creates large server requests.
 */
const TypeProvider = {
  _types: {},

  /**
   * Register new type
   *
   * @param {string} type Type from UBDomain.ubDataTypeProvider
   * @param {UTableColumnSettings} settings Column settings
   * @param {Vue.Component} [cellTemplate] Cell template
   * @param {object<string, UTableColumnFilter>} [filters={}] Filters templates
   */
  registerType ({ type, settings, cellTemplate: template = defaultCellTemplate, filters = {} }) {
    this._types[type] = {
      definition: { ...settings },
      template,
      filters
    }
  },

  /**
   * Get column definition
   *
   * @param {UBDomain.ubDataTypes} type Type from UBDomain.ubDataTypeProvider
   */
  get (type) {
    if (this._types[type]) {
      return this._types[type]
    } else {
      return Object.assign({}, defaultType)
    }
  }
}

TypeProvider.registerType({
  type: 'String',
  settings: require('./type-definitions/string'),
  filters: {
    startWith: {
      label: 'startWith',
      template: require('./filter-templates/string/startWith.vue').default
    },
    equal: {
      label: 'equal',
      template: require('./filter-templates/string/equal.vue').default
    },
    contains: {
      label: 'contains',
      template: require('./filter-templates/string/contains.vue').default
    },
    isNull: {
      label: 'isNull',
      template: require('./filter-templates/string/isNull.vue').default
    }
  }
})

TypeProvider.registerType({
  type: 'Json',
  settings: require('./type-definitions/string')
})

TypeProvider.registerType({
  type: 'Boolean',
  settings: require('./type-definitions/boolean'),
  filters: {
    isTrue: {
      label: 'Yes',
      template: require('./filter-templates/boolean/isTrue.vue').default
    },
    isFalse: {
      label: 'No',
      template: require('./filter-templates/boolean/isFalse.vue').default
    },
    isNull: {
      label: 'isNull',
      template: require('./filter-templates/boolean/isNull.vue').default
    }
  }
})

TypeProvider.registerType({
  type: 'Entity',
  settings: require('./type-definitions/entity'),
  filters: {
    equal: {
      label: 'equal',
      template: require('./filter-templates/entity/equal.vue').default
    },
    contains: {
      label: 'contains',
      template: require('./filter-templates/entity/contains.vue').default
    },
    isNull: {
      label: 'isNull',
      template: require('./filter-templates/entity/isNull.vue').default
    },
    notEqual: {
      label: 'notEqual',
      template: require('./filter-templates/entity/notEqual.vue').default
    },
    notContains: {
      label: 'notContains',
      template: require('./filter-templates/entity/notContains.vue').default
    }
  }
})

TypeProvider.registerType({
  type: 'Many',
  settings: require('./type-definitions/many'),
  filters: {
    contains: {
      label: 'contains',
      template: require('./filter-templates/many/contains.vue').default
    },
    isNull: {
      label: 'isNull',
      template: require('./filter-templates/many/isNull.vue').default
    }
  }
})

TypeProvider.registerType({
  type: 'Enum',
  settings: require('./type-definitions/enum'),
  filters: {
    equal: {
      label: 'equal',
      template: require('./filter-templates/enum/equal.vue').default
    },
    contains: {
      label: 'contains',
      template: require('./filter-templates/enum/contains.vue').default
    },
    isNull: {
      label: 'isNull',
      template: require('./filter-templates/enum/isNull.vue').default
    },
    notEqual: {
      label: 'notEqual',
      template: require('./filter-templates/enum/notEqual.vue').default
    },
    notContains: {
      label: 'notContains',
      template: require('./filter-templates/enum/notContains.vue').default
    }
  }
})

const dateFilters = {
  range: {
    label: 'range',
    template: require('./filter-templates/date/range.vue').default
  },
  fromDate: {
    label: 'from_date',
    template: require('./filter-templates/date/fromDate.vue').default
  },
  onDate: {
    label: 'date',
    template: require('./filter-templates/date/onDate.vue').default
  },
  toDate: {
    label: 'to_date',
    template: require('./filter-templates/date/toDate.vue').default
  },
  isNull: {
    label: 'isNull',
    template: require('./filter-templates/date/isNull.vue').default
  }
}

TypeProvider.registerType({
  type: 'Date',
  settings: {
    minWidth: 120,
    sortable: true,
    format ({ value }) {
      return UB.formatter.formatDate(value, 'date')
    }
  },
  filters: dateFilters
})

TypeProvider.registerType({
  type: 'DateTime',
  settings: {
    minWidth: 190, // en: 05/23/2020, 1:14 PM
    sortable: true,
    format ({ value }) {
      return UB.formatter.formatDate(value, 'dateTime')
    }
  },
  filters: dateFilters
})

const numberFilter = {
  equal: {
    label: 'equal',
    template: require('./filter-templates/number/equal.vue').default
  },
  more: {
    label: 'more',
    template: require('./filter-templates/number/more.vue').default
  },
  less: {
    label: 'less',
    template: require('./filter-templates/number/less.vue').default
  },
  range: {
    label: 'range',
    template: require('./filter-templates/number/range.vue').default
  },
  isNull: {
    label: 'isNull',
    template: require('./filter-templates/number/isNull.vue').default
  }
}

TypeProvider.registerType({
  type: 'ID',
  settings: require('./type-definitions/id'),
  filters: numberFilter
})

const NUMBER_SETTINGS = require('./type-definitions/number')
TypeProvider.registerType({
  type: 'BigInt',
  settings: NUMBER_SETTINGS,
  filters: numberFilter
})

TypeProvider.registerType({
  type: 'Currency',
  settings: {
    ...NUMBER_SETTINGS,
    format: ({ value }) => {
      return UB.formatter.formatNumber(value, 'sum')
    }
  },
  filters: numberFilter
})

TypeProvider.registerType({
  type: 'Float',
  settings: NUMBER_SETTINGS,
  filters: numberFilter
})

TypeProvider.registerType({
  type: 'Int',
  settings: NUMBER_SETTINGS,
  filters: numberFilter
})

TypeProvider.registerType({
  type: 'Document',
  settings: {
    sortable: false
  },
  cellTemplate: require('./cell-templates/document.vue').default
})

TypeProvider.registerType({
  type: 'Text',
  settings: require('./type-definitions/string'),
  cellTemplate: renderWarning('Text')
})

TypeProvider.registerType({
  type: 'BLOB',
  settings: require('./type-definitions/string'),
  cellTemplate: renderWarning('BLOB')
})

TypeProvider.registerType({
  type: 'TimeLog',
  settings: require('./type-definitions/string'),
  cellTemplate: renderWarning('TimeLog')
})

function renderWarning (type) {
  return () => {
    console.warn(`By default don't have renderer for type "${type}". You need to decide to display this column type with great caution because this column can creates large server requests`)
  }
}

module.exports = TypeProvider
