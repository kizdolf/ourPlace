/*
    Entry point.

    Ideas:
        - clusturize the application. Carefully because websockets don't like it really much.
          Solutions are out there to manage them, the pid used by one user need to stay the same all along the process.
        - Run tests at startup. (this implies to BUILD and CODE tests. humpfff)
*/
'use strict';

var
    express     = require('express'),
    bodyParser  = require('body-parser'),
    conf        = require('./app/config').conf,
    api         = require('./app/api');

    require('./app/socket');

var loggued = false;

/*Fake account managment.*/
var accounts = {
    isLoggued : function(body){
        body = body;
        return loggued;
    },
    goodUser : function(body){
        console.log(body);
        return true;
    },
    registerUser : function(body){
        body = body;
        return new Promise(function(ful){
            loggued = true;
            ful(true);
        });
    }
};

    express()
    //middlewares
    .use(bodyParser.urlencoded(conf.bodyParserOpt))
    .use(bodyParser.json())
    .use('/tokenLogin', function(req, res){
        res.json({token: 123456});
    })
    .use('/login', function(req, res, next){
        console.log('login!');
        if(accounts.goodUser(req.body)){
            accounts.registerUser(req.body).then(function(done){
                res.send({ok: true});
                done = done;
            });
        }else{
            next();
        }
    })
    .use(function(req, res, next){
        if(!accounts.isLoggued(req.body))
            res.sendFile(__dirname + '/login/index.html', {root : '/', token: 123456});
        else
            next();
    })
    //serve webApp
    .use(conf.webPath, express.static(conf.webDir))
    //serve medias
    .use(conf.mediaPath, express.static(conf.mediaDir))
    //use api
    .use(conf.apiPrefix, api.main)
    //wrong path
    .use(function(req, res){
        //TODO: Send a 404 page. Or redirect somewhere.
        res.json({msg: '404'});
    })
    //ready for requests.
    //TODO: add log.
    .listen(conf.mainPort);
