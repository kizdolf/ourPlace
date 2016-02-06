'use strict';


var 
confRe      = require('./criticalConf'),
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
    resave: false,
    saveUninitialized: true,
    store: store
});

module.exports = {
	Session: Session,
	store: store
};