'use strict';

/*
    Main entry for the API.
    every request prefixed with '/api'  will arrive here.
    From here I have to decide if I keep ALL endpoints here or if I dedicate submodules
    for different kind. (eg: a submodule for users, one for documents, one for login/logout, etc.)

    Until then everything id handled here.
    But hey, there is'nt that much endpoints.
*/

/*TODO:
    - path of the upload need to be changed depending on the file type. 
    - make the api able to upload multiple file simultenaously.
*/
var
express     = require('express'),
multer      = require('multer'),
upload      = multer({dest: 'medias/'}),
login       = require('./login'),
lib         = require('./library');

exports.main = (function(){
    var router      = express.Router();
    // Would it be better to externalise the route in a json file somewhere else?
    router.post('/upload', upload.single('file'), function(req, res){
        var file = req.file;
        lib.handle(file, function(err, response){
            //need of a loggin system... (accessible from the outside, with a query system would be great actually.)
            if(err) res.json({err: err});
            else res.json({done: response});
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

    return router;
})();
