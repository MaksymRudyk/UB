/**
 * Generate include for NGINX config based on `reverseProxy` section of application config:
 *
 *  - add proxy_pass directive to the URL from specified ubConfig
 *  - add host and client IP passthrow using `reverseProxy.remoteIPHeader` from NGINX to UB
 *  - in case `reverseProxy.sendFileHeader` if configured - add a internal locations for app and all defined BLOB stores
 *
 *
 * Result can be included to the main NGINX config using `include path-to-generated-config.conf` directive (inside the `server` directive)
 *
 * Usage from a command line:

 npx ubcli generateNginxCfg -?

 * @author pavel.mash 2018-04-07
 * @module generateNginxCfg
 * @memberOf module:@unitybase/ubcli
 */
const fs = require('fs')
const path = require('path')
const url = require('url')
const { options, argv } = require('@unitybase/base')
const mustache = require('mustache')

module.exports = function generateNginxCfg (cfg) {
  if (!cfg) {
    const opts = options.describe('generateNginxCfg',
      `Generate include for NGINX config based on reverseProxy section of application config.
 host for nginx is taken from httpServer.externalURL parameter`,
      'ubcli'
    )
      .add({ short: 'cfg', long: 'cfg', param: 'localServerConfig', defaultValue: 'ubConfig.json', searchInEnv: true, help: 'Path to UB server config' })
      .add({ short: 'l', long: 'lb', param: 'enableLoadBalancing', defaultValue: false, searchInEnv: false, help: 'Add this key to add upstream config for load balancing' })
      .add({ short: 'r', long: 'sslRedirect', param: 'sslRedirect', defaultValue: false, help: 'In case externalURL is https adds permanent redirect from http to https' })
      .add({ short: 'sslkey', long: 'sslkey', param: 'pathToSSLKey', defaultValue: '', help: 'For https - full path to ssl private key *.key file' })
      .add({ short: 'sslcert', long: 'sslcert', param: 'pathToSSLCert', defaultValue: '', help: 'For https - full path to ssl public certificate key *.pem file' })
      .add({ short: 'ipv6', long: 'ipv6', defaultValue: false, help: 'Bind to IPv6 address' })
      .add({ short: 'maxDocBody', long: 'maxDocBody', param: 'maxDocBodySize', defaultValue: '5m', help: 'Max body size for setDocument endpoint. See http://nginx.org/en/docs/http/ngx_http_core_module.html#client_max_body_size' })
      .add({ short: 'nginxPort', long: 'nginxPort', param: 'nginxPort', defaultValue: '', help: 'Specify port for nginx other when externalURL port. Useful in case externalURL handled by external load balancer' })
      .add({ short: 'out', long: 'out', param: 'outputPath', defaultValue: path.join(process.cwd(), 'ub-proxy.conf'), help: 'Full path to output file' })
    cfg = opts.parseVerbose({}, true)
    if (!cfg) return
  }
  const cfgPath = path.dirname(argv.getConfigFileName())
  const serverConfig = argv.getServerConfiguration()
  const reverseProxyCfg = serverConfig.httpServer.reverseProxy
  if (reverseProxyCfg.kind !== 'nginx') {
    console.error('httpServer.reverseProxy.kind !== \'nginx\' in server config. Terminated')
    return
  }
  if (!serverConfig.httpServer.externalURL) {
    console.error('httpServer.externalURL is not defined in server config. Terminated')
    return
  }
  const externalURL = url.parse(serverConfig.httpServer.externalURL)
  if (!externalURL.port) externalURL.port = (externalURL.protocol === 'https:') ? '443' : '80'
  if (externalURL.port === '443') externalURL.port = '443 ssl http2'
  if (externalURL.protocol === 'https:') {
    if (!cfg.sslkey) console.warn('external URL is configured to use https but sslkey parameter not passed - don\'t forgot to set it manually')
    if (!cfg.sslcert) console.warn('external URL is configured to use https but sslcert parameter not passed - don\'t forgot to set it manually')
    if (!cfg.sslRedirect) {
      console.warn('external URL is configured to use https - force adding a redirect 80 -> 443 for host\n')
      cfg.sslRedirect = true
    }
  }
  let ubURL
  if (serverConfig.httpServer && serverConfig.httpServer.host && serverConfig.httpServer.host.startsWith('unix:')) {
    ubURL = {
      host: serverConfig.httpServer.host
    }
  } else {
    ubURL = url.parse(argv.serverURLFromConfig(serverConfig))
  }
  if (!ubURL.port) ubURL.port = (ubURL.protocol === 'https:') ? '443' : '80'
  if (!reverseProxyCfg.sendFileHeader) console.warn('`reverseProxy.sendFileHeader` not defined in ub config. Skip internal locations generation')
  const nginxPort = cfg.nginxPort || externalURL.port
  if (!serverConfig.metrics) {
    serverConfig.metrics = {
      enabled: true,
      allowedFrom: ''
    }
  }
  let metricsAllowedFrom = []
  if ((serverConfig.metrics.enabled !== false) && serverConfig.metrics.allowedFrom) {
    metricsAllowedFrom = serverConfig.metrics.allowedFrom.split(';')
  }
  const sharedUbAppsFolder = process.platform === 'win32'
    ? 'C:/ProgramData/unitybase/shared'
    : '/var/opt/unitybase/shared'
  const vars = {
    ubURL: ubURL,
    externalURL: externalURL,
    nginxPort,
    appPath: cfgPath.replace(/\\/g, '/'),
    sslRedirect: Boolean(cfg.sslRedirect),
    sslkey: cfg.sslkey,
    sslcert: cfg.sslcert,
    ipv6: cfg.ipv6,
    lb: cfg.lb,
    wsRoot: serverConfig.wsServer ? serverConfig.wsServer.path : '',
    remoteIPHeader: reverseProxyCfg.remoteIPHeader,
    remoteConnIDHeader: reverseProxyCfg.remoteConnIDHeader,
    maxDocBodySize: cfg.maxDocBody,
    sendFileHeader: reverseProxyCfg.sendFileHeader,
    sendFileLocationRoot: reverseProxyCfg.sendFileLocationRoot,
    sharedUbAppsFolder,
    serveStatic: reverseProxyCfg.serveStatic,
    staticRoot: '',
    allowCORSFrom: serverConfig.httpServer.allowCORSFrom,
    metricsAllowedFrom,
    blobStores: [],
    multitenancy: (serverConfig.security.multitenancy && serverConfig.security.multitenancy.enabled)
     ? 'yes'
     : ''
  }
  if (reverseProxyCfg.serveStatic) {
    if (!serverConfig.httpServer.inetPub) {
      throw new Error('"httpServer.inetPub" should be defined in app config in case "httpServer.reverseProxy.serveStatic" is true')
    }
    vars.staticRoot = serverConfig.httpServer.inetPub.replace(/\\/g, '/')
  }
  const configuredStores = serverConfig.application.blobStores
  if (configuredStores) {
    configuredStores.forEach((storeCfg) => {
      if (storeCfg.path) {
        let pathForConfig = path.isAbsolute(storeCfg.path) ? storeCfg.path : path.join(cfgPath, storeCfg.path)
        pathForConfig = pathForConfig.replace(/\\/g, '/')
        vars.blobStores.push({
          storeName: storeCfg.name,
          storePath: pathForConfig
        })
      }
    })
  }
  const tpl = fs.readFileSync(path.join(__dirname, 'templates', 'nginx-cfg.mustache'), 'utf8')

  const rendered = mustache.render(tpl, vars)
  if (!fs.writeFileSync(cfg.out, rendered)) {
    console.error(`Write to file ${cfg.out} fail`)
  }
  const linkAsFileName = externalURL.host + '.conf'
  if (process.platform === 'win32') {
    console.info(`
Config generated and can be included inside nginx.conf: 
  include ${cfg.out.replace(/\\/g, '/')};`)
  } else {
    if (fs.existsSync('/etc/nginx/sites-enabled')) {
      console.info(`
Config generated and can be linked to /etc/nginx/sites-enabled:
  sudo ln -s ${cfg.out.replace(/\\\\/g, '/')} /etc/nginx/sites-available/${linkAsFileName}
  sudo ln -s /etc/nginx/sites-available/${linkAsFileName} /etc/nginx/sites-enabled
  sudo nginx -s reload
    `)
    } else {
      console.info(`Config generated and can be linked to /etc/nginx/conf.d:
  sudo ln -s ${cfg.out.replace(/\\\\/g, '/')} /etc/nginx/conf.d/${linkAsFileName}
    `)
    }
    console.info('To apply new configs type\n  sudo nginx -s reload')
  }
  console.log(`
Do not modify generated config directly, instead add files to:
  - ${sharedUbAppsFolder}/${reverseProxyCfg.sendFileLocationRoot}/upstream*.conf to extend an upstream's list
  - ${sharedUbAppsFolder}/${reverseProxyCfg.sendFileLocationRoot}/http*.conf     to add an http level directives
  - ${sharedUbAppsFolder}/${reverseProxyCfg.sendFileLocationRoot}/server*.conf   to add a server level directives  
  `)
}

module.exports.shortDoc = `Generate include for NGINX config based on
\t\t\t'reverseProxy' section of application config`
