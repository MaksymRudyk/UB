/* global ubs_settings uba_user uba_otp */
const http = require('http')

// eslint-disable-next-line no-useless-escape
const EMAIL_VALIDATION_RE = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const RECAPTCHA_SECRET_KEY = App.serverConfig.application.customSettings.reCAPTCHA
  ? App.serverConfig.application.customSettings.reCAPTCHA.secretKey
  : ''

const PR_SETTINGS = App.serverConfig.application.customSettings.publicRegistration || {}
const REG_KIND = PR_SETTINGS.kind
if (REG_KIND && !((REG_KIND === 'SMS') || (REG_KIND === 'EMail'))) {
  throw new Error('App.serverConfig.application.customSettings.publicRegistration.kind should be one of "SMS" or "EMail"')
}

const REG_CONFIRMATION_REDIRECT_URL = PR_SETTINGS.confirmationRedirectURI
if (REG_KIND && !REG_CONFIRMATION_REDIRECT_URL) {
  throw new Error('serverConfig.application.customSettings.publicRegistration.confirmationRedirectURI is required')
}

if ((REG_KIND === 'SMS') && (!App.serverConfig.application.customSettings.smsServiceProvider)) {
  throw new Error('for "SMS" kind of registration "serverConfig.customSettings.smsServiceProvider" should point to sms provider module')
}
const ALLOWED_PHONE_CODES = PR_SETTINGS.allowedPhoneCodes || []
const CONFIRMATION_EMAIL_SUBJECT = PR_SETTINGS.confirmationSubject || ''
if ((REG_KIND === 'EMail') && (!CONFIRMATION_EMAIL_SUBJECT)) {
  throw new Error('for "EMail" kind of registration "serverConfig.application.customSettings.publicRegistration.confirmationSubject" is required')
}

const CONFIRMATION_MESSAGE_REPORT_CODE = PR_SETTINGS.confirmationMessageReportCode
if (REG_KIND && !CONFIRMATION_MESSAGE_REPORT_CODE) {
  throw new Error('serverConfig.application.customSettings.publicRegistration.confirmationMessageReportCode is required')
}

module.exports = {
  publicRegistration,
  validateRecaptcha
}
/**
 * Two-step new user public registration **rest** endpoint. Optionally can use google Re-captcha.
 * To enable re-captcha on server side provide a valid [re-captcha SECRET](https://www.google.com/recaptcha/admin#list)
 *  in `serverConfig.application.customSettings.reCAPTCHA.secretKey` application config.
 *
 *  `serverConfig.application.customSettings.publicRegistration.kind` defines a registration kind. Possible values:
 *    - `EMail`: provided email become a user login, confirmation message will be sent using e-mail (`serverConfig.customSettings.mailerConfig` should be configured)
 *    - `SMS`: provided phone number become a user login, confirmation message will be sent using SMS (`serverConfig.customSettings.smsServiceProvider` should be configured)
 *    - `serverConfig.application.customSettings.publicRegistration.allowedPhoneCodes` optionally can contains array of strings phone should starts with.
 *      For example for Ukrainian numbers this can be ['+380']
 *
 * 1-st step: web page pass a registration parameters as JSON:
 *
 *      POST /rest/uba_user/publicRegistration
 *      {email: "<email>", phone: "", utmSource: '', utmCampaign: '', recaptcha: "googleRecaptchaValue"}
 *
 * Server will:
 *  - validate input and fires Session.registrationStart event. In this event app can do additional validations
 *  - creates a new uba_user (in pending state isPending===true) and generate a password for user. User login is either
 *    e-mail for EMail registration kind or phone number for SMS registration kind
 *  - generates OTP, and put a optional `utmSource` and `utmCampaign` parameters to the OTP uData
 *  - creates a e-mail using using report code, provided by `uba.user.publicRegistrationReportCode` ubs_setting key.
 *    Report take a parameters {login, password, activateUrl, appConfig}
 *  - schedules a confirmation e-mail or SMS (depending on registration kind) for user
 *
 * 2-nd step: user follow the link from e-mail
 *
 *      GET /rest/uba_user/publicRegistration?otp=<one time pwd value>&login=<user_login>
 *
 * Server will check the provided OTP and if it is valid:
 *  - remove a `pending` from uba_user row
 *  - fire a `registration` event for {@link Session}. In this event application developer can add a roles / groups to user
 *  - returns redirect to App.externalURL + serverConfig.application.customSettings.publicRegistration.confirmationRedirectURI
 *    with login (and password for SMS registration kind) in URL parameters
 *
 * Access to endpoint is restricted by default. To enable public registration developer should grant ELS access for
 * `uba_user.publicRegistration` method to `Anonymous` role.
 *
 * @param fake
 * @param {THTTPRequest} req
 * @param {THTTPResponse} resp
 * @method publicRegistration
 * @memberOf uba_user_ns.prototype
 * @memberOfModule @unitybase/uba
 * @published
 */
function publicRegistration (fake, req, resp) {
  // required here to prevent dependency circle between uba and ubq/ubs models
  const mailQueue = require('@unitybase/ubq/modules/mail-queue')
  const UBReport = require('@unitybase/ubs/modules/UBServerReport')

  const publicRegistrationSubject = CONFIRMATION_EMAIL_SUBJECT || ubs_settings.loadKey('uba.user.publicRegistrationSubject')
  const publicRegistrationReportCode = CONFIRMATION_MESSAGE_REPORT_CODE || ubs_settings.loadKey('uba.user.publicRegistrationReportCode')

  const { otp, login } = req.parsedParameters
  const USER_STORE = UB.DataStore('uba_user')

  if (otp && login) {
    processRegistrationStep2(resp, otp, login)
    return
  }

  // 1-st step: web page pass a registration parameters as JSON
  const body = req.read('utf-8')
  const { email, phone, utmSource, utmCampaign, recaptcha } = JSON.parse(body)
  if (email && !validateEmail(email)) {
    throw new UB.UBAbort('<<<email address is invalid>>>')
  }
  let phoneNormalized
  if (phone) {
    phoneNormalized = normalizeAndValidatePhone(phone)
    if (!phoneNormalized) throw new UB.UBAbort('<<<phone number is invalid>>>')
    if (ALLOWED_PHONE_CODES.length) {
      if (!ALLOWED_PHONE_CODES.find(c => phoneNormalized.startsWith(c))) {
        throw new UB.UBAbort('<<phone country is not allowed>>>')
      }
    }
  }
  if ((REG_KIND === 'SMS') && !phoneNormalized) {
    throw new UB.UBAbort('<<<Phone number is required for SMS registration>>>')
  }
  if (!validateRecaptcha(recaptcha)) {
    throw new UB.UBAbort('reCAPTCHA check fail')
  }
  // fire `registrationStart` event. App can perform additional validations over email and phone, etc.
  Session.emit('registrationStart', {
    authType: 'UB',
    publicRegistration: true,
    params: { email, phone, utmSource, utmCampaign, recaptcha }
  })
  Session.runAsAdmin(function () {
    USER_STORE.run('insert', {
      execParams: {
        name: REG_KIND === 'SMS' ? phoneNormalized : email,
        email: email,
        phone: phoneNormalized,
        isPending: true,
        lastPasswordChangeDate: new Date()
      },
      fieldList: ['ID']
    })

    const userID = USER_STORE.get(0)
    const userOtp = uba_otp.generateOtp(REG_KIND, userID, { utmSource, utmCampaign })
    const registrationAddress = `${App.externalURL}rest/uba_user/publicRegistration?otp=${encodeURIComponent(userOtp)}&login=${encodeURIComponent(email)}`

    if (REG_KIND === 'SMS') { // try to send OTP to user phone, in case of error (SMS provider is unavailable) - schedule OTP sending
      const SMS_PROVIDER = require(App.serverConfig.application.customSettings.smsServiceProvider)
      // generate OTP message. password is ''
      const renderedReport = UBReport.makeReport(publicRegistrationReportCode, 'html', {
        kind: REG_KIND,
        login: phoneNormalized,
        otp: userOtp,
        activateUrl: registrationAddress,
        appConfig: App.serverConfig
      })
      const message = renderedReport.reportData
      if (!SMS_PROVIDER.send(phoneNormalized, message)) { // schedule SMS sending
        UB.DataStore('ubq_messages').run('insert', {
          execParams: {
            queueCode: 'sms',
            msgCmd: phoneNormalized,
            msgData: message,
            msgPriority: 0
          }
        })
      }
    } else { // email: generate random password for user and schedule email with password
      const password = (Math.random() * 100000000000 >>> 0).toString(24)
      uba_user.changePassword(userID, email, password)

      const reportResult = UBReport.makeReport(publicRegistrationReportCode, 'html', {
        kind: REG_KIND,
        login: email,
        password: password,
        activateUrl: registrationAddress,
        appConfig: App.serverConfig
      })
      const mailBody = reportResult.reportData

      mailQueue.queueMail({
        to: email,
        subject: publicRegistrationSubject,
        body: mailBody
      })
    }
  })
  resp.statusCode = 200
  resp.writeEnd({ success: true, message: `Thank you for your request! We have sent your access credentials via ${REG_KIND}. You should receive them very soon` })
}

/**
 * Check provided Email is look like Email address
 * @private
 * @param {string} email
 * @returns {boolean}
 */
function validateEmail (email) {
  return email && (email.length < 60) && EMAIL_VALIDATION_RE.test(email)
}

/**
 * Check phone is look like phone number, remove all chars except `+` and numbers
 * and return normalized value on success or empty string on error.
 *
 * @private
 * @param {string} phone
 * @return {string}
 */
function normalizeAndValidatePhone (phone) {
  const NUM_REPLACE_RE = /[\D]/g
  const valid = phone && (phone.length < 22)
  if (!valid) return ''
  const res = phone.replace(NUM_REPLACE_RE, '')
  if (!res || (res.length < 12)) return ''
  return '+' + res
}

/**
 * Validate a reCAPTCHA from client request. See <a href="https://developers.google.com/recaptcha/docs/verify"reCAPTCHA doc</a>
 * If `serverConfig.application.customSettings.reCAPTCHA.secretKey` not defined - returns true
 * @private
 * @param {string} recaptcha
 * @returns {boolean}
 */
function validateRecaptcha (recaptcha) {
  if (!RECAPTCHA_SECRET_KEY) return true
  const resp = http.request({
    URL: `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${recaptcha}`,
    method: 'POST',
    sendTimeout: 30000,
    receiveTimeout: 30000,
    keepAlive: true,
    compressionEnable: true
  }).end('')
  const data = JSON.parse(resp.read())
  return data.success
}

/**
 * Process a user registration step 2 - OneTime password received
 * @private
 * @param {THTTPResponse} resp
 * @param {string} otp One Time Password
 * @param {string} login user login
 */
function processRegistrationStep2 (resp, otp, login) {
  let userID
  let userOtpData = null
  const store = UB.DataStore('uba_user')
  uba_otp.authAndExecute(otp, REG_KIND, function (uData) {
    userID = Session.userID
    userOtpData = uData
  })
  let password
  if (userID) {
    Session.runAsAdmin(function () {
      UB.Repository('uba_user').attrs(['name', 'mi_modifyDate']).where('ID', '=', userID).select(store)
      login = store.get('name')
      // remove pending
      store.run('update', {
        execParams: {
          ID: userID,
          isPending: false,
          lastPasswordChangeDate: new Date(),
          mi_modifyDate: store.get('mi_modifyDate')
        }
      })
      if (REG_KIND === 'SMS') { // for SMS registration type generate password after receiving valid OPT
        password = (Math.random() * 100000000000 >>> 0).toString(24)
        uba_user.changePassword(userID, login, password)
      }
    })

    Session.emit('registration', {
      authType: 'UB',
      publicRegistration: true,
      userID,
      login,
      userOtpData
    })
  } else {
    // check that login is correct
    Session.runAsAdmin(function () {
      UB.Repository('uba_user').attrs(['ID']).where('name', '=', login)
        .select(store)
    })

    if (store.eof) {
      throw new UB.UBAbort('Invalid OTP')
    }
  }
  if (REG_KIND === 'EMail') {
    resp.writeHead(`Location: ${App.externalURL + REG_CONFIRMATION_REDIRECT_URL}?login=${encodeURIComponent(login)}`)
    resp.statusCode = 302
  } else {
    resp.statusCode = 200
    resp.writeEnd({
      status: 'OK',
      login: login,
      password: password
    })
  }
}
