'use strict'

/*
  Manage Torrents.
  TODO:
      - At startup get torrents from db and start leech/seed.
      - recognize duplicate torrent
      - ...
*/
const conf        = require(global.core + '/config')
const re          = require(global.core + '/db/rethink')
const socket      = require(global.core + '/socket')()
const table       = conf.rethink.tables.torrent
const tbls        = conf.rethink.tables
const tools       = require(global.core + '/tools')
const cloud       = require(global.core + '/cloud/main')

const uuid        = require('uuid')
const fs          = require('fs')
const WebTorrent  = require('webtorrent')
const Mime        = require('mime')

const lo          = tools.lo

/*See web torrent options.*/
var Client = new WebTorrent({
  dht: false,
  webSeeds: false
})

/*Ensure Client is 'clean'*/
Client.destroy((done)=>{
  console.log('destroy of all Torrents done.');
  Client = new WebTorrent({
    dht: false,
    webSeeds: false
  })
})

/* Used to synchronise WebTorrents and DB with some props and methods*/
const TorrentTemplate = () => {
  let torrent = () => { //main torrent status
    return({
      name: '',
      path: '',
      magnet: '',
      filesRoot: '',
      relFilesRoot: '',
      totalSize: 0,
      downloaded: 0,
      uploaded: 0,
      dateStart: new Date(),
      dateEnd: new Date(),
      dateLastUpdate: new Date(),
      currentUpSpeed: 0,
      currentDownSpeed: 0,
      maxUpSpeed: 0,
      maxDownSpeed: 0,
      progress: 0,
      ratio: 0,
      timeRemaining: '',
      nbPeers: 0,
      done: false
    })
  }
  let target = () => { //props for each file in torrent
    return({
      id: '',
      name: '',
      path: '',
      relPath : '',
      mime: '',
      size: 0,
      sizeDl: 0,
      meta: {},
      progress: 0,
      done: false
    })
  }
  let targets = []
  let torrentStatus = torrent()
  let id = ''
  return ({
    id: id,
    torrentStatus : torrentStatus,
    targets : targets,
    getTarget : (id, cb) => {
      let done = false
      targets.forEach((target) => {
        if(target.id == id){
          done = true
          cb(target)
          return;
        }
      })
      if(!done)
        cb(false)
    },
    //ensure props are limited to the ones defines above.
    addTarget : (obj, cb) => {
      let newTarget = target()
      let countAddedprops = 0
      newTarget.id = uuid.v4()
      Object.keys(obj).map((keyObj) => {
        Object.keys(newTarget).map((keyMain) => {
          if(keyObj == keyMain && typeof keyObj === typeof keyMain){
            newTarget[keyMain] = obj[keyMain]
            countAddedprops++
          }
        })
      })
      targets.push(newTarget)
      cb(newTarget, countAddedprops)
    },
    //ensure props are limited to the ones defines above.
    updateTarget: (id, obj, cb) => {
      targets.forEach((target, i) => {
        if(target.id == id) {
          Object.keys(obj).map((keyObj) => {
            Object.keys(target).map((keyMain) => {
              if(keyObj == keyMain && typeof keyObj === typeof keyMain){
                targets[i][keyMain] = obj[keyMain]
              }
            })
          })
          cb(true)
        }
      })
    },
    //ensure props are limited to the ones defines above.
    updateTorrent : (obj, cb) => {
      let newTorrent = torrentStatus
      let countAddedprops = 0
      Object.keys(obj).map((keyObj) => {
        Object.keys(newTorrent).map((keyMain) => {
          if(keyObj == keyMain && typeof keyObj === typeof keyMain){
            newTorrent[keyMain] = obj[keyMain]
            countAddedprops++
          }
        })
      })
      torrentStatus = newTorrent
      cb(newTorrent, countAddedprops)
    },
    //sync with DB.
    save : (cb) => {
      if(id === ''){
        re.insert(table, {torrent: torrentStatus, targets: targets})
        .then((res) => {
          id = res.generated_keys[0]
          if (cb) cb(id)
        })
      }else{
        re.update(table, id, {torrent: torrentStatus, targets: targets})
        .then(()=>{ if(cb) cb(id) })
      }
    }
  })
}

//handle every files contained in a torrent.
const addTargets = (Torrent, files) => {
  return new Promise((resolve) => {
    let nbFiles = files.length
    files.forEach((file) => {
      Torrent.addTarget({
        name: file.name,
        path: Torrent.torrentStatus.filesRoot + file.path,
        relPath: Torrent.torrentStatus.relFilesRoot + file.path,
        size: file.length
      }, () => { (nbFiles-- === 1) ? resolve(true) : null })
    })
  })
}

/*
  Update torrent :
    - set torrent status
    - set torrent targets status
    - synch with db
    - send status via socket to user.
*/
const majTorrent = (torrenting, Torrent, uuid) => {
  Torrent.updateTorrent({
    downloaded: torrenting.downloaded,
    uploaded: torrenting.uploaded,
    dateLastUpdate: new Date(),
    magnet: torrenting.magnetURI,
    currentUpSpeed: torrenting.uploadSpeed,
    currentDownSpeed: torrenting.downloadSpeed,
    maxUpSpeed: (torrenting.uploadSpeed > Torrent.torrentStatus.maxUpSpeed) ? torrenting.uploadSpeed : Torrent.torrentStatus.maxUpSpeed,
    maxDownSpeed: (torrenting.downloadSpeed > Torrent.torrentStatus.maxDownSpeed) ? torrenting.downloadSpeed : Torrent.torrentStatus.maxDownSpeed,
    progress: Math.round((torrenting.progress * 100) * 10) / 10,
    ratio: torrenting.ratio,
    timeRemaining: Math.round(torrenting.timeRemaining / 1000) + ' sec',
    nbPeers: torrenting.numPeers
  }, () => {
    let ln = Torrent.targets.length
    Torrent.targets.forEach((target) => {
      torrenting.files.forEach((file) => {
        if(file.name == target.name){
          let dlBytes = fs.statSync(target.path)['size']
          let progress = (dlBytes * 100) / target.size
          Torrent.updateTarget(target.id, {
            sizeDl:  dlBytes,
            progress:  Math.round(progress * 10) / 10,
            done: (dlBytes === target.size) ? true : false
          }, () => {
            if(ln-- == 1){
              Torrent.save((id)=>{
                socket.send({id: id, torrent: Torrent.torrentStatus, targets: Torrent.targets}, uuid, false, 'torrent')
              })
            }
          })
        }
      })
    })
  })
}

// small helper, this is a duplicate from library.js FUNC handle LINE 146
const getConfMime = (mime) => {
  let mimetypeFound = false
  conf.OKmimes.forEach(function(mimetype){
    if(mime.indexOf(mimetype) !== -1 && mime.indexOf('mpegurl') === -1){
      mimetypeFound = mimetype
    }
  })
  return mimetypeFound
}

/*
  This is a duplicate from library.js FUNC saveFile LINE 105
  the use of the 'true' method is impossible cuz of differents object and automatic methods on library.js
  Need to be moved/improved.
*/
const cpyLibSaveFile = (file, meta, cb) => {
  let tbl = conf.rethink.tables.song
  var ext = file.name.split('.').pop();
  var obj = {
      name : file.name,
      path : '/' + file.relPath,
      type : file.mime, //to fix!
      size : file.size,
      date : new Date(),
      meta : meta,
      ext  : ext
  };
  re.insert(tbl, obj).then(()=>{
      lo.info('insert', {tbl: tbls.song, obj: obj});
      cb(null, true);
  }).catch((err)=>{
      tools.rm(__dirname + '/..' + obj.path);
      lo.error('insert', {tbl: tbls.song, obj: obj, error: err});
      cb(err, null);
  });
}

/*
  Finish the job when torrent is fully downloaded.
  I'd like to rename files, move them to proper location, transpile what need to be.
  I should have a module to define all of this. And to handle it.
*/
const handleTargets = (Torrent, req) => {
  let targets = Torrent.targets
  targets.forEach((target) => {
    let mime = Mime.lookup(target.path)
    let confMime = getConfMime(mime)
    switch (confMime) {
      case 'video':
        let fileInfos = {
          originalname : target.name,
          path: target.relPath,
          size: target.size,
          mimetype : mime,
          torrent: true
        }
        cloud.handle(fileInfos, req);
        break;
      case 'audio':
        tools.getMetaData(target.path, function(err, meta){
          if(meta.picture && meta.picture.indexOf(conf.conf.cloudPath) !== -1){
            meta.picture = conf.conf.cloudPath + meta.picture.split(conf.conf.cloudPath)[1]
          }
          if(!err){
            cpyLibSaveFile(target, meta, ()=>{})
          }
          });
        break;
      default:
          lo.error('mimetype not handled from torrent', {file: target})
        break;
    }
  })
}

/*
  Main function.
*/
const newTorrent = (file, req, cb) => {
  let Torrent = TorrentTemplate()
  const userUuid = req.session.uuid
  const formatDate = new Date().toISOString().substring(0,10)
  let torrent = {
    name: file.originalname,
    path: global.appPath + '/' + file.path,
    filesRoot : global.appPath +  conf.conf.cloudPath + '/' + formatDate + '/',
    relFilesRoot : conf.conf.cloudDir + '/' + formatDate + '/',
    dateStart: new Date(),
    dateLastUpdate: new Date()
  }
  Torrent.updateTorrent(torrent, (torrent, nb) => {
    Torrent.save()
    let confTorrent = { path: torrent.filesRoot }
    Client.add(fs.readFileSync(torrent.path), confTorrent, (torrenting) => {
      addTargets(Torrent, torrenting.files)
      .then(() => {
        let interval = setInterval(() => {
          majTorrent(torrenting, Torrent, userUuid)
        }, conf.conf.torrentTriggerSocket)
        cb(null, true);
        torrenting.on('done', () => {
          Torrent.updateTorrent({done: true, dateEnd : new Date()}, (torrent, nb) => {
            majTorrent(torrenting, Torrent, userUuid)
            console.log('torrent finished downloading!!');
            handleTargets(Torrent, req)
          })
        })
      })
    })
    Client.on('error', (err) => {
      lo.error('WebTorrent error on add torrent', {err: err})
    })
  })
}
// return all torrents in DB
const all = () => {
  return new Promise((resolve, reject) => {
    re.getAll(table)
    .then((torrents) => {
      resolve(torrents)
    })
    .catch((e) => {
      reject(e)
    })
  })
}


module.exports = {
  newTorrent,
  all
}
