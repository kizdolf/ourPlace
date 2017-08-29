var
fs          = require('fs'),
mm          = require('musicmetadata'),
sharp       = require('sharp'),
mainConf    = require(global.core + '/config').conf,
re          = require(global.core + '/db/rethink'),
cnf         = require(global.core + '/config').conf,
tbls        = require(global.core + '/config').rethink.tables;

var rm = (path)=>{
    fs.access(path, (err)=>{
        if(!err){
            fs.unlinkSync(path);
            lo().info('deleted file ', {path: path});
        }else
            lo().error('unable to supress file ', {path: path});
    });
};

var mkdir = (path)=>{
    try{
        fs.mkdirSync(path);
    }catch(e){}
};

var thisIs404 = (req, res)=>{
    //TODO: Send a 404 page. Or redirect somewhere.
    res.json({msg: '404'});
};

//save logs in logs table.
/*
    To do: handle table when it become too fat.
        Save data in a tar file, clean table (keep lasts nothing more tahsn 10 days or so)
*/
var lo = ()=>{
    var logIt = (level, log, attachment)=>{
        var toLog = {
            when : Date.now(),
            timestamp: ~~(new Date() / 1000),
            level : level,
            log: log,
            attachment: attachment
        };
        if(level === 'request')
            re.insert(tbls.request, toLog);
        else
            re.insert(tbls.log, toLog);
    };
    return{
        error: (log, attachment)=>{
            logIt('error', log, attachment);
        },
        info: (log, attachment)=>{
            logIt('info', log, attachment);
        },
        debug: (log, attachment)=>{
            logIt('debug', log, attachment);
        },
        request: (log, attachment)=>{
            logIt('request', log, attachment);
        },
    };
};

var makeItHttps = (req, res, next)=>{
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    route = req.originalUrl;
    if(cnf.devMode) lo().request('request:', {ip: ip, route: route, method: req.method});
    if(req.secure || !cnf.httpsMode) next();
    else res.redirect('https://' + req.headers.host + req.url);
};

var resizePic = (fsPath, style, cb) =>{
  const imgSize = mainConf.imgMaxSize
  sharp(fsPath)
    .resize(imgSize.width, imgSize.height)
    .max().toBuffer().then((buffer)=>{
      fs.writeFile(fsPath, buffer, 'base64', (err)=>{
        if(err){
          lo().error('resizing image', {img: fsPath, error: err})
          cb(false)
        }
        cb(true);
      })
    })
};

//extract and save picture. if extract failed just delete pic without blocking process.
var extractPicture = (meta, path, cb)=>{
    var pic     = new Buffer(meta.picture[0].data), //read picture
        style   = meta.picture[0].format,
        picName = path.split('/').pop() + '.' + style, //deduct name.
        comp    = path.split('/');
    comp.pop();
    path = comp.join('/') + '/';
    var fsPath  = path + picName;
    pic = pic.toString('base64'); //convert the pic in readable data.
    fs.writeFile(fsPath, pic, 'base64', (err)=>{ //write data in it's own file.
        if(err){
            lo().error('writing img', {picName: picName, err: err});
            delete meta.picture; //do not keep the useless file.
            cb(meta); //pretend everything was fine.
        }else{
            lo().info('extracted img', {picName: picName, path: path});
            meta.picture = '/' + fsPath; //save new pic path
            resizePic(fsPath, style, ()=>{
                cb(meta);
            });
        }
    });
};

/*
Retrieve metadata from a file. Files are not always easy with that, because of the
differents format we are facing. We should try to implement other metadata formats actually.
Maybe later.
So in case of error an empty object is returned. The app continue to run. See ya!
*/
var getMetaData = (path, cb)=>{
    mm(fs.createReadStream(path), (err, meta)=>{ //send all the algo to mm (music metadata package)
        if(err){
            lo().error('getting Metadata. Continuing with empty meta.', {pathWeKnow: path, err: {}});
            cb(null, {}); //do not let 0 metaData prevent the song to be listened.
        }else{
            if(meta.picture[0] && meta.picture[0].data){ //there is a pic. Extract it.
                extractPicture(meta, path, (meta)=>{
                    cb(null, meta); //and go on..
                });
            }else{ //if no picture in file, the prop need to be cleared.
                delete meta.picture; //dont keep the picture field in the metadata.
                cb(null, meta);
            }
        }
    });
};


const multerStorageSwitch = (r, f, cb) => {

  const mimeCase = (mime) => {
    if (mime.indexOf('torrent') || mime.indexOf('srt')) return 'torrent'
    else if (mime.indexOf('audio') !== -1) return 'audio'
    else if (mime.indexOf('video') !== -1) return 'video'
    else return 'unhandled'
  };

  var path
  var datePath = '/' + new Date().toISOString().substring(0,10)
  var type = mimeCase(f.mimetype)
  lo().info('new upload to handle type is ' + type + '.', {file: f});
  switch (type) {
    case 'audio':
      path = cnf.mediaDir + datePath;
      break;
    case 'video':
      path = cnf.cloudDir + datePath;
      break;
    case 'torrent':
      path = cnf.cloudDir + datePath;
      break;
    default:
      lo().error('upload refused!', {file: f});
      cb(false)
  }
  if (type !== 'unhandled') {
    tools.mkdir(path);
    cb(null, (path + '/'));
  }
}

module.exports = {
    rm: rm,
    mkdir: mkdir,
    thisIs404: thisIs404,
    lo: lo(),
    makeItHttps: makeItHttps,
    resizePic: resizePic,
    getMetaData: getMetaData,
    multerStorageSwitch: multerStorageSwitch
};
