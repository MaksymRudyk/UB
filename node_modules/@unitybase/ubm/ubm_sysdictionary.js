const { Repository, App } = require('@unitybase/ub')

const me = global.ubm_sysdictionary

me.on('insert:before', ctx => {
  autoGenerateUbql(ctx)
})

me.on('update:before', ctx => {
  autoGenerateUbql(ctx)
})

/**
 * @param {ubMethodParams} ctx
 */
function autoGenerateUbql (ctx) {
  if (ctx.mParams.execParams.ubql) {
    return
  }

  const { mParams, dataStore } = ctx
  let { code } = mParams.execParams

  if (!code && !dataStore.eof) {
    const originStoreName = dataStore.currentDataName

    try {
      dataStore.currentDataName = 'selectBeforeUpdate'
      code = dataStore.get('code')
    } finally {
      dataStore.currentDataName = originStoreName
    }
  }

  if (!code) {
    return
  }

  const { descriptionAttribute } = App.domainInfo.get(code, false) || {}

  if (!descriptionAttribute) {
    return
  }

  ctx.mParams.execParams.ubql = JSON.stringify(
    Repository(code)
      .attrs('ID', descriptionAttribute)
      .orderBy(descriptionAttribute)
      .ubql()
  )
}
