const __loadedScript = {}
const __head = (typeof document !== 'undefined') && document.getElementsByTagName('head')[0]

/**
 * Exports client side injections
 * @module injectin
 * @memberOf module:@unitybase/ub-pub
 */

/**
 * see docs in ub-pub main module
 * @private
 * @param {String} url either *js* or *css* resource to load
 * @param {String} [charset]
 * @return {Promise}
 */
module.exports.inject = function inject (url, charset) {
  let res
  if (__loadedScript[url]) {
    res = __loadedScript[url]
  } else {
    // Create and inject script tag at end of DOM body and load the external script
    // attach event listeners that will trigger the Deferred.
    res = __loadedScript[url] = new Promise(function (resolve, reject) {
      let elm = null
      const isCSS = /\.css(?:\?|$)/.test(url)
      if (isCSS) {
        elm = document.createElement('link')
        elm.rel = 'stylesheet'
        elm.async = true
      } else {
        elm = document.createElement('script')
        elm.type = 'text/javascript'
        if (charset) {
          elm.charset = charset
        }
        elm.async = true
      }
      elm.onerror = function (oError) {
        const reason = 'Required ' + (oError.target.href || oError.target.src) + ' is not accessible'
        delete __loadedScript[url]
        elm.onerror = elm.onload = elm.onreadystatechange = null
        reject(new Error(reason))
      }

      elm.onload = function () {
        elm.onerror = elm.onload = elm.onreadystatechange = null
        setTimeout(function () { // script must evaluate first
          const _elm = elm
          resolve()
          // Remove the script (do not remove CSS) ???
          if (_elm.parentNode && !_elm.rel) {
            _elm.parentNode.removeChild(elm)
            elm = null
          }
        }, 0)
      }

      __head.appendChild(elm)
      // src must be set AFTER onload && onerror && appendChild
      if (isCSS) {
        elm.href = addResourceVersion(url)
      } else {
        elm.src = addResourceVersion(url)
      }
    })
  }
  return res
}

/**
 * In case window contains __ubVersion property {@link addResourceVersion addResourceVersion} will add
 * version parameter to scripts inside models.
 *
 * @private
 */
const __ubVersion = (typeof window !== 'undefined') && window.__ubVersion
const MODEL_RE = new RegExp('models/(.+?)/') // speculative search. w/o ? found maximum string length

/**
 * Search for resource version in the  window.__ubVersion global const
 * IF any,  return 'ver=version' else ''
 * @private
 * @param {String} uri
 * @returns {String}
 */
function getResourceVersion (uri) {
  const modelName = MODEL_RE.test(uri) ? MODEL_RE.exec(uri)[1] : '_web'
  return (__ubVersion && __ubVersion[modelName])
    ? 'ubver=' + __ubVersion[modelName]
    : ''
}

/**
 * Append UnityBase model version to the URL
 * @private
 * @param {String} uri
 * @returns {String} uri with added resource version
 */
function addResourceVersion (uri) {
  const ver = getResourceVersion(uri)
  if (!ver) return uri
  const separator = (uri.indexOf('?') === -1) ? '?' : '&'
  return uri + separator + ver
}
module.exports.addResourceVersion = addResourceVersion
