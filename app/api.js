'use strict';

/*
    Main entry for the API.
    every request prefixed with '/api'  will arrive here.
    From here I have to decide if I keep ALL endpoints here or if I dedicate submodules
    for different kind. (eg: a submodule for users, one for documents, one for login/logout, etc.)

    Until then everything id handled here.
    But hey, there is'nt that much endpoints. (for now at least)
*/

var
express         = require('express'),
multer          = require('multer'),
// externSession   = require('./externSession'),
login           = require('./login'),
lib             = require('./library'),
tools           = require('./tools'),
user            = require('./user'),
conf            = require('./config').conf,
feed            = require('./rss/main');

var s = require('./socket')();

var log = require('simple-node-logger').createSimpleFileLogger('infos.log');
//upload          = multer({dest: 'medias/'}),

exports.main = (function(){
    // Would it be better to externalise the route(s) in a json file somewhere else?
    var router      = express.Router();
    //take care of where, not more.
    var storage = multer.diskStorage({
        destination: (r, f, cb)=>{
            var path = conf.mediaDir + '/' + (new Date().toISOString().substring(0,10));
            tools.mkdir(path);
            cb(null, (path + '/'));
        },
    });

    router.post('/upload', multer({storage: storage}).any(), (req, res)=>{
        req.files.forEach((file)=>{
            lib.handle(file, (err, response)=>{
                if(err) res.json({err: err});
                else {
                    user.own(req.session.uuid, response);
                    s.send(response, req.session, true);
                    res.json({done: response});
                }
            });
        });
    });

    router.get('/root/:first/:second?', user.root);
    router.post('/root/:param', user.rootPost);
    router.delete('/root/:id', user.rootDelete);

    router.post('/note', lib.addNote);
    router.get('/notes', lib.allNotes);

    router.delete('/:type/:id', function(req, res){
        console.log('delete!');
        var type = req.params.type;
        var id = req.params.id;
        lib.delete(type, id, function(done){
            s.send(done, req.session, true);
            res.json(done);
        });
    });

    router.post('/update/:type/:id', lib.update);

    router.post('/fromYoutube', function(req, res){
        var url = req.body.url;
        lib.fromYoutube(url, (bool)=>{
            s.send(true, req.session, true);
            res.json(bool);
        });
    });

    router.get('/music', function(req, res){
        lib.allSongs(req.session).then(function(music){
            res.json({music : music});
        });
    });



    // router.post('/getToken', function(req, res){
    //     log.info('Create token for ', req.body.name);
    //      externSession.generateToken(req.body.name, function(err, token){
    //         if(err)
    //             res.json({err: err});
    //         else
    //             res.json({url:req.protocol + '://' + req.get('host') + '/play/' + token});
    //      });
    // });

    // router.post('/newUser', function(req, res){
    //     var user = req.body;
    //     login.isRoot(req).then(function(canRoot){
    //         if(!!canRoot){
    //             console.log('create user!');
    //             login.createUser(user.pseudo, user.password);
    //             res.json({done: 'user created.'});
    //         }
    //     });
    // });

    // router.get('/playplease/:token', function(req, res){
    //     if(req.session.canPlay && req.session.name && req.session.nbLeft > 0){
    //         log.info('can play ' + req.session.name);
    //         externSession.getPath(req.session.name, function(err, rep){
    //             if(!err){
    //                 req.session.nbLeft = req.session.nbLeft - 1;
    //                 res.json(rep);
    //             }else{
    //                 log.error(err);
    //             }
    //         });
    //     }else{
    //         req.session = null;
    //         externSession.delToken(req.params.token);
    //         res.json({err: 'not allowed'});
    //     }
    // });

    router.get('/rss', feed.getRss);

    router.get('/user/status', user.getStatus);

    router.post('/user/status', user.setStatus);

    return router;
})();
