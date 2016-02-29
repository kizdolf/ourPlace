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
externSession   = require('./externSession'),
lib             = require('./library'),
tools           = require('./tools'),
user            = require('./user'),
conf            = require('./config').conf,
feed            = require('./rss/main');

require('./socket')();

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

    router.get('/rss', feed.getRss);

    router.get('/user/status', user.getStatus);

    router.post('/user/status', user.setStatus);

    router.post('/getToken', function(req, res){
        var obj = {id: req.body.id, type: req.body.type};
         externSession.generateToken(obj, function(err, token){
            if(err)
                res.json({err: err});
            else
                res.json({url:req.protocol + '://' + req.get('host') + '/play/' + token});
         });
    });

    // router.get('/playplease/:token', function(req, res){
    //     if(req.session.canPlay && req.session.name && req.session.nbLeft > 0){
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

    return router;
})();
