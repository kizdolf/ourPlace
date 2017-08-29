'use strict';

const http      = require('http')
const httpProxy = require('http-proxy')

const conf      = require(global.core + '/config').conf
const proxy     = httpProxy.createProxyServer({'agent':  new http.Agent({ keepAlive: true })})
const matchHost = new RegExp(conf.hostname)

exports.launch = (req, res, next) => {
  const matchProxy = () => {
    return (
        req.hostname && (
          req.hostname.match(matchHost)   ||
          req.hostname.match('localhost') ||
          req.hostname.match('127.0.0.1')
        )
    )
  }

  if (!matchProxy()) {
    console.log(new Date() + ' : redirect hostname : ' + req.hostname + ' from ip ' + req.ip)
    proxy.web(req, res, { 'target': 'http://localhost:9000' }, (error) => console.error("Error Proxy", error) )
  } else next()
}
