'use strict';

/*
    Main entry for the API.
    every request prefixed with '/api'  will arrive here.
    From here I have to decide if I keep ALL endpoints here or if I dedicate submodules
    for different kind. (eg: a submodule for users, one for documents, one for login/logout, etc.)
*/

var
express     = require('express'),
multer      = require('multer'),
upload      = multer({dest: 'medias/'}),
lib         = require('./library');

exports.main = (function(){
    var router      = express.Router();

    router.post('/upload', upload.single('file'), function(req, res){
        var file = req.file;
        lib.handle(file, function(err, response){
            if(err)
                res.json({err: err});
            else
                res.json({done: response});
        });
    });

    return router;
})();
