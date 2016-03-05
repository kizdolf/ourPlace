'use strict';

exports.connect =  {
    db: 'dbName',
    host: 'localhost',
    port: 28015, //default one
    authKey: 'the secret key you did set up'
};

exports.local = {
	appPath: '/path/to/app' //(eg: /home/user/ourPlace). DO Not leave the trailing slash.
};

//not mandatory. see config. (i don't use it actually.)
exports.bugsnag = {
    token: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
};

exports.https = {
    privKey: '/path/to/certificates/privkey.pem',
    certificate: '/path/to/certificates/cert.pem',
    chain : '/path/to/certificates/chain.pem'
};

exports.extern = {
	mandrillApiKey: 'mandrillApiKey' //=>https://mandrillapp.com
};

exports.freebox = {
    app: {
        id: 'app.our.place',
        appName: 'our_placev0',
        version: '0.0.2',
        device: 'web_app',
        ip: '01.002.03.04:34033'
    },
    token: 'xxxxxxxxxxxxxxxxxxxx', //can be obtained via freebox-share.
    paths: {
        movies: 'Movie/Path/On/Freebox' //something like /externalHardDrive/Movies for me.
    }
};