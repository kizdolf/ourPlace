'use strict';

/*
	Manager for cloud video. 
	Manage upload, database.
	Should transpile every video in order to make it playable by
	any browser, but keep the orginal file as well.
	Should create a file hash to not have duplicate files.
*/

var	WebTorrent      = require('webtorrent'),
    mime            = require('mime'),
	fs  			= require('fs'),
	conf            = require(global.core + '/config'),
	tools           = require(global.core + '/tools'),
	conf 			= require(global.core + '/config'),
	re 				= require(global.core + '/db/rethink'),
	socket 			= require(global.core + '/socket')(),
    lo              = tools.lo,
	tbl 			= conf.rethink.tables.video;

var ClientTorrent 	= new  WebTorrent();

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
	if(file.torrent && !!file.torrent)
		obj.meta.torrent = true;
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

var newTorrent = (file, req, cb)=>{
	var pathTorrent = global.appPath + '/' + file.path,
		d = (new Date().toISOString().substring(0,10)),
		pathFile = global.appPath +  conf.conf.cloudPath + '/' + d + '/';

	ClientTorrent.add(fs.readFileSync(pathTorrent), {path: pathFile}, (torrent)=>{
		var fileDL = torrent.files[0];
		torrent.on('download', function () {
			socket.send({
				file: fileDL.name,
				ratio: torrent.ratio,
				progressDl: torrent.progress * 100,
				dlSpeed: torrent.downloadSpeed,
				upSpeed: torrent.uploadSpeed,
				remain: torrent.timeRemaining
			}, req.session.uuid, false, 'torrent');
		});
		torrent.on('upload', function(){
			socket.send({
				file: fileDL.name,
				ratio: torrent.ratio,
				progressDl: torrent.progress * 100,
				dlSpeed: torrent.downloadSpeed,
				upSpeed: torrent.uploadSpeed,
				remain: torrent.timeRemaining
			}, req.session.uuid, false, 'torrent');
		});
		torrent.on('done', ()=>{
			console.log('torrent finished downloading');
			torrent.files.forEach(function(f){
				var fileInfos = {
					originalname : f.name,
					path: conf.conf.cloudDir + '/' + d + '/' + f.path,
					size: f.length,
					mime : mime.lookup(conf.conf.cloudDir + '/' + d + '/' + f.path),
					torrent: true

				};
				console.log(f.name);
				f.originalname = f.name;
				f.path = conf.conf.cloudDir + '/' + d + '/' + f.path;
				handle(fileInfos, req, cb);
			});
		});
	});
	cb(true);
};

module.exports = {
	handle: handle,
	all: all,
	newTorrent: newTorrent
};
