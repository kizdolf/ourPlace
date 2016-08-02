'use strict';

/*
	Manager for cloud video. 
	Manage upload, database.
	Should transpile every video in order to make it playable by
	any browser, but keep the orginal file as well.
	Should create a file hash to not have duplicate files.
*/

var	tools           = require(global.core + '/tools'),
	child_process   = require('child_process'),
	fs              = require('fs'),
    lo              = tools.lo;

var handle = (file, cb) =>{
	console.log("handle cloud file.");
	console.log(file);
};

module.exports = {
	handle: handle
};