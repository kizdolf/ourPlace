'use strict';

/*
	Manager for cloud video.
	Manage upload, database.
	Should transpile every video in order to make it playable by
	any browser, but keep the orginal file as well.
	Should create a file hash to not have duplicate files.
*/

var	mime            = require('mime'),
	  fs  			      = require('fs'),
    child_process   = require('child_process'),
	  conf            = require(global.core + '/config'),
	  tools           = require(global.core + '/tools'),
	  re 				      = require(global.core + '/db/rethink'),
	  socket 			    = require(global.core + '/socket')(),
    lo              = tools.lo,
	  tbl 			      = conf.rethink.tables.video;

/*
	Tv-show recognition. Could and should be muc much better.
	Abd should recognize all types of video infos (movies, definition, etc) not just season/episode.
*/
var extractFromName = function(name){
	var ret = {};
	var start = false;
	var RegSE = new RegExp('[Ss][0-9]{2}[Ee][0-9]{2}');
	var match1 = name.match(RegSE);
	if(match1 !== null){
		ret.season = parseInt(match1[0].slice(1, 3)).toString();
		ret.episode = parseInt(match1[0].slice(4, 6)).toString();
		start = name.split(match1[0])[0];
		ret.name = start;
	}else{
		var RegSxE = new RegExp('[0-9][0-9]?x[0-9][0-9]?');
		var match3 = name.match(RegSxE);
		if(match3 !== null){
			var infos = match3[0].split('x');
			ret.season = parseInt(infos[0]).toString();
			ret.episode = parseInt(infos[1]).toString();
			start = name.split(match3[0])[0];
			ret.name = start;
		}
	}

	/*It's a Tv-show*/
	if(ret.name){
		var regName = /[.-]/g;
		ret.name = ret.name.replace(regName, ' ');
		ret.name = ret.name.replace(regName, ' ');
		ret.name = ret.name.trim();
		ret.type = "tvshow";
	}
	return ret;
};

var extractFromNameBis = (name, cb) => {
	const exec = 'guessit --json "' + name + '"';
	child_process.exec(exec, (err, out)=>{
    if(err) cb(err, null)
    else {
      let jsonObj = JSON.parse(out)
      jsonObj.name = jsonObj.title
      if(jsonObj.type && jsonObj.type == 'episode')
        jsonObj.type = 'tvshow'
      cb(null, jsonObj)
    }
	});
};


var handle = (file, req, cb) => {
	var who = req.session.uuid;
  extractFromNameBis(file.originalname, (err, infos)=>{
    lo.info('Saving new video', {byWho: who, file: file});
    var obj = {
      path: '/' + file.path,
      name: file.originalname,
      mime: file.mimetype,
      size: file.size,
      date: new Date(),
      meta: infos || {}
    };
    if(file.torrent && !!file.torrent)
    obj.meta.torrent = true;
    re.insert(tbl, obj)
    .then((res)=>{
      if(cb)
      cb(true);
      lo.info('Video saved', {byWho: who, file: file, res: res});
    }).catch((error)=>{
      lo.error('saving video in db', {error: error, byWho: who});
      if(cb)
      cb(false);
    })
  })
};

var all = (req, res) =>{
	var who = req.session.uuid,
    	files = [];
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
	all: all,
  extractFromName: extractFromName,
  extractFromNameBis: extractFromNameBis
};
