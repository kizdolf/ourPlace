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
boxStream       = require(global.core + '/video/boxStream'),
externSession   = require(global.core + '/externSession'),
lib             = require(global.core + '/library'),
cloud           = require(global.core + '/cloud/main'),
tools           = require(global.core + '/tools'),
rootSu          = require(global.core + '/root/root'),
user            = require(global.core + '/user'),
conf            = require(global.core + '/config').conf,
feed            = require(global.core + '/rss/main'),
lo              = tools.lo,
express         = require('express'),
multer          = require('multer');

require('./socket')();

exports.main = (function(){
    // Would it be better to externalise the route(s) in a json file somewhere else?
    var router      = express.Router();
    //take care of where, not more.
    var storage = multer.diskStorage({
        destination: (r, f, cb)=>{
            /*
                Depending on mimetype (f.mimetype) uplaod should happen in 
                media path or in cloud path. Media for songs, cloud for videos.
            */
            var path;
            lo.info('new upload to handle.', {file: f});
            if(f.mimetype.indexOf('audio') !== -1){
                lo.info('upload accepted as Audio file.', {file: f});
                path = conf.mediaDir + '/' + (new Date().toISOString().substring(0,10));
                tools.mkdir(path);
                cb(null, (path + '/'));
            }else if (f.mimetype.indexOf('video') !== -1){
                lo.info('upload accepted as Video file.', {file: f});
                path = conf.cloudDir + '/' + (new Date().toISOString().substring(0,10));
                tools.mkdir(path);
                cb(null, (path + '/'));
            }else{
                lo.error('upload refused!', {file: f});
                cb(false);
            }
        },
    });

    router.post('/upload', multer({storage: storage}).any(), (req, res)=>{
        req.files.forEach((file)=>{
            lo.info('insert', {byWho: req.session.uuid, file: file});
            lib.handle(file, req, (err, response)=>{
                if(err) res.json({err: err});
                else {
                    user.own(req.session.uuid, response);
                    res.json({done: response});
                }
            });
        });
    }).set('connection', 'keep-alive');

    router.get('/root/:first/:second?', rootSu.root);
    router.post('/root/:param', rootSu.rootPost);
    router.delete('/root/:id', rootSu.rootDelete);

    router.post('/note', lib.addNote);
    router.get('/notes', lib.allNotes);
    router.get('/cloud', cloud.all);

    router.delete('/:type/:id', function(req, res){
        var type = req.params.type;
        var id = req.params.id;
        lib.delete(type, id, function(done){
            lo.info('delete', {byWho: req.session.uuid, type: type, id: id});
            res.json(done);
        });
    });

    router.post('/update/:type/:id', lib.update);

    router.post('/fromYoutube', function(req, res){
        var url = req.body.url;
        lib.fromYoutube(url, (bool)=>{
            lo.info('from youtube', {byWho: req.session.uuid, url: url});
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

    router.get('/delog', (req, res)=>{
        lo.info('delog triggered', {who: req.session.uuid, pseudo: req.session.pseudo});
        res.json({delog: 'done'});
        req.session.destroy();
    });

    /*streams!*/

    router.get('/streams/list', boxStream.boxList);
    router.get('/streams/list/:path', boxStream.box64List);
    router.get('/streams/stream/:path', boxStream.stream);

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
