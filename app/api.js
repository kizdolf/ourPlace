'use strict';

/*
    Main entry for the API.
    every request prefixed with '/api'  will arrive here.
    From here I have to decide if I keep ALL endpoints here or if I dedicate submodules
    for different kind. (eg: a submodule for users, one for documents, one for login/logout, etc.)

    Until then everything id handled here.
    But hey, there is'nt that much endpoints.
*/

var
express     = require('express'),
multer      = require('multer'),
externSession   = require('./externSession'),
upload      = multer({dest: 'medias/'}),
login       = require('./login'),
lib         = require('./library');

var log = require('simple-node-logger').createSimpleFileLogger('infos.log');

exports.main = (function(){
    var router      = express.Router();
    // Would it be better to externalise the route in a json file somewhere else?
    router.post('/upload', upload.any(), function(req, res){
        req.files.forEach((file)=>{
            log.info(file);
            lib.handle(file, (err, response)=>{
                if(err) res.json({err: err});
                else res.json({done: response});
            });
        });
    });

    router.post('/note', lib.addNote);
    router.get('/notes', lib.allNotes);

    router.delete('/:type/:id', function(req, res){
        console.log('delete!');
        var type = req.params.type;
        var id = req.params.id;
        lib.delete(type, id, function(done){
            res.json(done);
        });
    });

    router.post('/update/:type/:id', lib.update);

    router.post('/fromYoutube', function(req, res){
        var url = req.body.url;
        lib.fromYoutube(url, (bool)=>{
            res.json(bool);
        });
    });

    router.get('/music', function(req, res){
        lib.allSongs().then(function(music){
            res.json({music : music});
        });
    });

    router.get('/amiroot', function(req, res){
        login.isRoot(req).then(function(isIt){
            if(!!isIt){
                res.json(true);
            }else{
                res.json(false);
            }
        });
    });
    router.post('/getToken', function(req, res){
        log.info('Create token for ', req.body.name);
         externSession.generateToken(req.body.name, function(err, token){
            if(err)
                res.json({err: err});
            else
                res.json({url:req.protocol + '://' + req.get('host') + '/play/' + token});
         });
    });

    router.post('/newUser', function(req, res){
        var user = req.body;
        login.isRoot(req).then(function(canRoot){
            if(!!canRoot){
                console.log('create user!');
                login.createUser(user.pseudo, user.password);
                res.json({done: 'user created.'});
            }
        });
    });

    router.get('/playplease/:token', function(req, res){
        if(req.session.canPlay && req.session.name && req.session.nbLeft > 0){
            log.info('can play ' + req.session.name);
            externSession.getPath(req.session.name, function(err, rep){
                if(!err){
                    req.session.nbLeft = req.session.nbLeft - 1;
                    res.json(rep);
                }else{
                    log.error(err);
                }
            });
        }else{
            req.session = null;
            externSession.delToken(req.params.token);
            res.json({err: 'not allowed'});
        }
    });

    return router;
})();
