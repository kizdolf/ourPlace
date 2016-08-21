'use strict';

/*
	Manager for cloud video. 
	Manage upload, database.
	Should transpile every video in order to make it playable by
	any browser, but keep the orginal file as well.
	Should create a file hash to not have duplicate files.
*/

var	tools           = require(global.core + '/tools'),
	conf 			= require(global.core + '/config'),
	re 				= require(global.core + '/db/rethink'),
    lo              = tools.lo,
	tbl 			= conf.rethink.tables.video;

var handle = (file, req, cb) =>{
	var who = req.session.uuid;
	lo.info('Saving new video', {byWho: who, file: file});
	var obj = {
		path: '/' + file.path,
		name: file.originalname,
		mime: file.mimetype,
		size: file.size,
		date: new Date(),
		meta: {}
	};
	re.insert(tbl, obj)
	.then((res)=>{
		cb(true);
	lo.info('Video saved', {byWho: who, file: file, res: res});
	}).catch((error)=>{
		lo.error('saving video in db', {error: error, byWho: who});
		cb(false);
	});
};

var all = (req, res) =>{
	var who = req.session.uuid;
	re.getAll(tbl).then((all)=>{
		res.json(all);
	}).catch((err)=>{
		lo.error('saving video in db', {error: err, byWho: who});
		res.json(false);
	});
};

module.exports = {
	handle: handle,
	all: all
};