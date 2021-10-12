/*
 * User certificates
 * @author xmax
 */
const UB = require('@unitybase/ub')
const Session = UB.Session
/* global uba_usercertificate */
// eslint-disable-next-line camelcase
const me = uba_usercertificate
me.on('insert:before', setBlob)
me.on('update:before', setBlob)
me.on('delete.before', logoutUserBeforeCertDelete)
me.on('insert:after', clearBlob)
me.on('update:after', clearBlobAndLogoutAUser)
me.entity.addMethod('getCertificate')

/**
 * @private
 * @param {ubMethodParams} ctxt
 */
function setBlob (ctxt) {
  const execParams = ctxt.mParams.execParams
  Object.keys(execParams)
  if (execParams.certificate) {
    const iitCrypto = require('@ub-d/iit-crypto')
    const certBin = Buffer.from(execParams.certificate, 'base64')
    const certJson = iitCrypto.parseCertificate(certBin)
    execParams.setBLOBValue('certificate', certBin)
    execParams.certParsed = JSON.stringify(certJson)
    execParams.serial = certJson.Serial
    execParams.issuer_serial = certJson.Issuer
    execParams.issuer_cn = certJson.IssuerCN
    execParams.isForSigning = certJson.KeyUsage && (certJson.KeyUsage.indexOf('ЕЦП') !== -1)
  }
}

/**
 * @private
 * @param {ubMethodParams} ctxt
 */
function logoutUserBeforeCertDelete (ctxt) {
  const rowID = ctxt.mParams.execParams.ID
  const userID = UB.Repository(me.entity.name).attrs('userID').where('ID', '=', rowID).selectScalar()
  App.removeUserSessions(userID)
}

/**
 * @private
 * @param {ubMethodParams} ctxt
 */
function clearBlobAndLogoutAUser (ctxt) {
  const execParams = ctxt.mParams.execParams
  if (execParams.certificate) {
    execParams.certificate = ''
  }
  let userID = execParams.userID
  if (!userID) {
    userID = UB.Repository(me.entity.name).attrs('userID').where('ID', '=', execParams.ID).selectScalar()
  }
  App.removeUserSessions(userID)
}

/**
 * @private
 * @param {ubMethodParams} ctxt
 */
function clearBlob (ctxt) {
  const execParams = ctxt.mParams.execParams
  if (execParams.certificate) {
    execParams.certificate = ''
  }
}

/**
 * Get user *SIGNING* certificate
 * @method getCurrentUserCertificate
 * @public
 * @param {number} [userID]
 * @param {boolean} [forSigning=true]
 * @return {ArrayBuffer|null} certificate binary or null if actual certificate is not found
 */
function getCurrentUserCertificate (userID, forSigning = true) {
  const store = UB.Repository('uba_usercertificate')
    .attrs(['certificate'])
    .where('userID', '=', userID || Session.userID)
    .whereIf(forSigning, 'isForSigning', '=', true)
    .where('disabled', '=', false)
    .where('revoked', '=', false)
    .selectAsStore()
  if (store.eof) return null
  return store.getAsBuffer('certificate')
}

/**
 * Retrieve certificate as:
 *  - base64 encoded string, if called as ubql
 *  - binary, if called as REST `/rest/uba_usercertificate/getCertificate?ID=223`
 *  - if called w/o ID, current user *SIGNING* certificate is returned
 *
 * @param {ubMethodParams} [ctxt]
 * @param {number} [ctxt.mParams.ID]
 * @param {THTTPRequest} [req]
 * @param {THTTPResponse} [resp]
 * @method getCertificate
 * @memberOf uba_usercertificate_ns.prototype
 * @memberOfModule @unitybase/uba
 * @published
 */
me.getCertificate = function (ctxt, req, resp) {
  let certID
  if (req) { // endpoint is called as rest/uba_usercertificate/getCertificate?ID=1231
    certID = req.parsedParameters.ID
  } else {
    certID = ctxt.mParams.ID
  }
  let certificate
  if (certID) {
    const store = UB.Repository('uba_usercertificate')
      .attrs(['ID', 'certificate'])
      .where('ID', '=', certID)
      .select()

    if (store.eof) throw new Error('not found')
    certificate = store.getAsBuffer('certificate')
  } else {
    certificate = getCurrentUserCertificate()
    if (!certificate) throw new Error('not found')
  }

  if (req) {
    resp.writeEnd(certificate)
    resp.writeHead('Content-Type: application/x-x509-user-cert')
    resp.statusCode = 200
  } else {
    certificate = Buffer.from(certificate)
    certificate = certificate.toString('base64')
    ctxt.dataStore.initialize({ fieldCount: 1, values: ['certificate', certificate], rowCount: 1 })
  }
}

me.getCurrentUserCertificate = getCurrentUserCertificate
