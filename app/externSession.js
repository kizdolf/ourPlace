'use strict';

var
    randToken   = require('rand-token'),
    re          = require(global.core + '/db/rethink.js'),
    tbls        = require(global.core + '/config').rethink.tables;

    var log = require('simple-node-logger').createSimpleFileLogger('infos.log');

var generateToken = function(obj, cb){
    var token = randToken.generate(16);
    var ins = {
        token: token,
        date : new Date().getTime(),
        target : obj.id,
        type: obj.type
    };
    re.insert(tbls.share, ins)
    .then((res)=>{
            log.info(' token inserted:',  res.cas);
            cb(null, token);
    }).catch((e)=>{
            log.error(' inserting obj');
            log.error(e);
            cb(e, null);
    });
};

// var tokenIsGood = function(token, cb){
//     var Bucket = Cluster.openBucket(conf.tokenBucket, function(err){
//         if(err){
//             console.log(err);
//             cb(err, null);
//         }
//     });
//     Bucket.get(token, function(err, res){
//         if(err){
//             cb(err, null);
//         }else{
//             cb(null, res.value.target);
//         }
//     });
// };

// var getPath = function(name, cb){
//     var Bucket = Cluster.openBucket(conf.filesBucket, function(err){
//         if(err){
//             console.log(err);
//             cb(err, null);
//         }
//     });
//     Bucket.get(name, function(err, res){
//         if(err){
//             cb(err, null);
//         }else{
//             cb(null, {file: res.value.path, type: res.value.type});
//         }
//     });
// };

// var delToken = function(token){
//     console.log('remove token ' + token);
//     var Bucket = Cluster.openBucket(conf.tokenBucket, function(err){
//         if(err){
//             console.log(err);
//         }
//     });
//     Bucket.remove(token, function(err){
//         if(err){
//             log.error(err);
//         }
//     });
// };

// var play = function(req, res){
//     var token = req.params.token;
//     tokenIsGood(token, function(err, name){
//         if(!err) {
//             log.info('allow playing for ', name);
//             req.session.logued = true;
//             if(!req.session.nbLeft && req.session.nbLeft !== 0)
//                 req.session.nbLeft = 5;
//             req.session.canPlay = true;
//             req.session.name = name;
//             res.sendFile(__dirname + '/play/index.html', {root: '/'});
//         }else{
//             res.json({err : 'not allowed.'});
//             log.info('cannot play it anymore.');
//         }
//     });
// };


module.exports = {
    generateToken: generateToken,
    // tokenIsGood: tokenIsGood,
    // getPath: getPath,
    // delToken: delToken,
    // play: play,
};
