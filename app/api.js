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
    - Handle the login mechanics here.
*/
var
express     = require('express'),
multer      = require('multer'),
upload      = multer({dest: 'medias/'}),
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

    return router;
})();
