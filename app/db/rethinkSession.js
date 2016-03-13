'use strict';


var
confRe      = require(global.core + '/criticalConf'),
session     = require('express-session'),
RDBStore    = require('session-rethinkdb')(session);

const options = {
    servers: [confRe.connect],
    clearInterval: 5000,
    table: 'session'
};

var store = new RDBStore(options);

var Session = session({
    secret: 'somethinglikeBllaaaaaahhh',
    resave: true,
    rolling: true,
    saveUninitialized: true,
    store: store
});

module.exports = {
	Session: Session,
	store: store
};
