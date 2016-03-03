'use strict';

var lwip 	= require('lwip'),
	conCnf  = require('./../app/criticalConf'),
   	tbls    = require('./../app/config').rethink.tables,
    _r      = require('rethinkdbdash')(conCnf.connect);

var resize = (pics, i)=>{
	if(!pics[i]) return;
	console.log(i);
	var path = '..' + pics[i];
	lwip.open(path, (err, img)=>{
		if(!err){
			var ratio = Math.min(200 / img.width(), 200 / img.height());
			img.scale(ratio, (err, img)=>{
				if(!err){
					img.writeFile(path, (err)=>{
						if(err){
							console.log(err);
						}else{
							console.log('done' + ratio);
							resize(pics, i+1);
						}
					});
				}else{
					console.log(err);
					resize(pics, i+1);
				}
			});
		}else{
			resize(pics, i+1);
		}
	});

};

_r.table(tbls.song).getField('meta')('picture')
.then((pics)=>{	resize(pics, 0); });

