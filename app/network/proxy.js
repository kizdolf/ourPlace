'use strict';

var http        = require('http'),
    httpProxy   = require('http-proxy'),
    conf        = require(global.core + '/config').conf,
    proxy       = httpProxy.createProxyServer({'agent':  new http.Agent({ keepAlive: true })}),
    matchHost   = new RegExp(conf.hostname);

var proxy = (req, res, next)=>{
    if(!req.hostname.match(matchHost)){
        console.log('redirect:' + req.hostname);
        proxy.web(req, res, {'target': 'http://localhost:9000'}, function(error){
            console.log("Error Proxy");
            console.log(error);
        });
    }else{
        req.socket.setTimeout(60 * 60 * 1000);
        next();
    }
};

module.exports = {
    launch: proxy
};