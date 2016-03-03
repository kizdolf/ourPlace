'use strict';
/*
	Resize every image stored in DB.
	change H and W to change max img size.
	Just run it as node imgResize.js
*/
var lwip 	= require('lwip'),
	conCnf  = require('./../app/criticalConf'),
   	tbls    = require('./../app/config').rethink.tables,
    _r      = require('rethinkdbdash')(conCnf.connect);

var H = 200; //max height you want
var W = 200; //max width you want


/*
	Recursive function, launched again when resize is done.
	param pics: array of all pics.
	param i: current index (increment at each call)
*/
var resize = (pics, i)=>{
	if(!pics[i]){
		console.log('done!');
		process.exit(0);
	}else{
		var path = '..' + pics[i];
		lwip.open(path, (err, img)=>{
			if(!err){
				var ratio = Math.min(W / img.width(), H / img.height());
				img.scale(ratio, (err, img)=>{
					if(!err){
						img.writeFile(path, (err)=>{
							if(err) console.log(err);
							else{
								console.log('done for img num ' + i + ' at ratio : ' + ratio);
								resize(pics, i+1);
							}
						});
					}else{
						console.log(err);
						resize(pics, i+1);
					}
				});
			}else resize(pics, i+1); //just do the next one. maybe it's in db but not on disk.
		});
	}
};

_r.table(tbls.song).getField('meta')('picture')
.then((pics)=>{	resize(pics, 0); });

