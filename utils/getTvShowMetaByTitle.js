'use strict';

var conCnf  = require('./../app/criticalConf'),
   	tbls    = require('./../app/config').rethink.tables,
    _r      = require('rethinkdbdash')(conCnf.connect);

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
		var Reg4xN = new RegExp('[0-9]{3}');
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

var run = function(cb){
	_r.table(tbls.video).run().then((res)=>{
		var nb = res.length - 1;
		res.forEach(function(video, i){
			if(!video.meta.season){
				var meta = extractFromName(video.name);
				if(meta.type){
					console.log(video);
					console.log(meta);
					video.meta = meta;
					_r.table(tbls.video).get(video.id).update(video)
					.run().then(function(res){
						console.log('updated');
						console.log(video.meta);
						if(i++ == nb){
							cb();
						}
					}).catch(function(err){
						console.log("err");
						console.log(err);
						if(i++ == nb){
							cb();
						}
					});
				}
			}else if(i++ == nb){
				cb();
			}
		});
	}).catch(function(err){
		console.log(err);
		cb();
	});
};

run(function(){
	console.log('done');
	process.exit();
});
