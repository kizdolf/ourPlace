'use strict';

/*
    Main entry for the API.
    every request prefixed with '/api'  will arrive here.
    From here I have to decide if I keep ALL endpoints here or if I dedicate submodules
    for different kind. (eg: a submodule for users, one for documents, one for login/logout, etc.)
*/

var
express     = require('express');

exports.main = (function(){
    var router      = express.Router();

    router.post('/upload', function(req, res){
        console.log('request post on upload.');
    });

    return router;
})();
