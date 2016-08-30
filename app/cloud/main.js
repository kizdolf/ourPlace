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

var extractFromName = function(name){
	var ret = {};
	var start = false;
	var RegSE = new RegExp('[Ss][0-9]{2}[Ee][0-9]{2}');
	var match1 = name.match(RegSE);
	if(match1 !== null){
		ret.season = match1[0].slice(1, 3);
		ret.episode = match1[0].slice(4, 6);
		start = name.split(match1[0])[0];
		ret.name = start;
	}else{	
		var Reg4xN = new RegExp('[0-9]{3}[0-9]?');
		var match2 = name.match(Reg4xN);
		if(match2 !== null){
			ret.season = match2[0].slice(0, -2);
			ret.episode = match2[0].substring(match2[0].length - 2);
			start = name.split(match2[0])[0];
			ret.name = start;
		}else{
			var RegSxE = new RegExp('[0-9][0-9]?x[0-9][0-9]?');
			var match3 = name.match(RegSxE);
			if(match3 !== null){
				var infos = match3[0].split('x');
				ret.season = infos[0];
				ret.episode = infos[1];
				start = name.split(match3[0])[0];
				ret.name = start;
			}
		}
	}

	if(ret.name){
		var regName = /[.-]/g;
		ret.name = ret.name.replace(regName, ' ');
		ret.name = ret.name.replace(regName, ' ');
		ret.name = ret.name.trim();
		ret.type = "tvshow";
	}
	return ret;
};

var handle = (file, req, cb) => {
	var who = req.session.uuid;
	lo.info('Saving new video', {byWho: who, file: file});
	var obj = {
		path: '/' + file.path,
		name: file.originalname,
		mime: file.mimetype,
		size: file.size,
		date: new Date(),
		meta: extractFromName(file.originalname)
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
    var files = [];
	re.getAll(tbl).then((all)=>{
        files = all.sort((a, b)=>{ return (a.name > b.name) ? -1 : 1; });
		res.json(files);
	}).catch((err)=>{
		lo.error('getting all videos', {error: err, byWho: who});
		res.json(false);
	});
};

module.exports = {
	handle: handle,
	all: all
};