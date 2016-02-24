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

//not mandatory. see config.
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