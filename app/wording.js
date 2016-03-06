'use strict';
var fs = require('fs');

var htmlWelcome = (url, pseudo, fromPseudo, cb)=>{
    fs.readFile(global.appPath + '/app/templates/welcome.html', (err, html)=>{
        html = html.toString();
        if(!err){
            html = html.replace(/{{url}}/g, url);
            html = html.replace(/{{pseudo}}/g, pseudo);
            html = html.replace(/{{from}}/g, fromPseudo);
            return cb(html);
        }
    });
};

module.exports = {
    htmlWelcome: htmlWelcome
};