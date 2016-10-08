var React       = require('react'),
    ItemMenu    = require('./itemMenu.jsx').ItemMenu,
    $           = require('jquery');

var Video = React.createClass({
    download: function(){
        var intel = this.props.data;
        var dl = document.createElement('a');
        var name = intel.name;
        dl.setAttribute('href', intel.path);
        dl.setAttribute('download', name.replace(/ /g, '-'));
        dl.click();
        dl = null;
        this.props.hasDownload(intel.id);
    },
    stream: function(){

    },
    showMenu: function(e){
        this.props.switchMenu({
            position: {x: e.pageX, y: e.pageY},
            data: this.props.data
        });
    },
    render: function(){
        var intel = this.props.data,
            meta = intel.meta,
            toScreen = {
                name : meta.name ? meta.name : intel.name,
                type : meta.type ? 'Category: ' + meta.type: '_null_',
                season : meta.season ? 'S' + meta.season: '_null_',
                episode : meta.episode ? 'E' + meta.episode: '_null_',
                toPrint : this.props.nextOrder ? this.props.nextOrder : false
                // <span className="fieldVideo typeVideo">{toScreen.type}</span>
            };
            console.log(toScreen.toPrint);
        return(
            <li>
                {
                    (toScreen.toPrint) ? <span className="orderToPrint">{toScreen.toPrint}</span> : null
                }
                <span  className="oneVideo itemCls">
                    <span className="metaVideo Meta" onClick={this.download}>
                        <span title="Download the file" className="fieldVideo titleVideo">{toScreen.name}</span>
                        <span className="fieldVideo seasonVideo">{toScreen.season}</span>
                        <span className="fieldVideo episodeVideo">{toScreen.episode}</span>
                    </span>
                    <div className="optsVideo">
                        <img className="optVideo" src="img/ic_more_vert_black_24dp_1x.png" onClick={this.showMenu} />
                    </div>
                </span>
            </li>
        );
    }
});

var Stream = React.createClass({
    getInitialState: function() {
        return {
            display: 'none',
            path: ''
        };
    },
    componentDidMount: function() {

    },
    render: function(){
        return(
            <div id="stream" style={{display: this.state.display}}>
                <span onClick={this.close}> Close </span>
                <video src="this.state.path" autoplay >
                </video>
            </div>
        );
    }
});

var Torrent = React.createClass({
    render: function(){
        var torrent = this.props.data;
        return(
            <div className="oneTorrent Meta">
                <p className="torOpt">Name: {torrent.name} </p>
                <p className="torOpt">Ratio: {torrent.ratio} </p>
                <p className="torOpt">Download: {torrent.progressDL} % </p>
                <p className="torOpt">Time remaining:  {torrent.remainTime} seconds </p>
                <p className="torOpt">Download Speed: {torrent.speed.dl}/sec </p>
                <p className="torOpt">Upload Speed: {torrent.speed.up}/sec </p>
            </div>
        );
    }
});

var CloudBox = React.createClass({
    getInitialState: function() {
        return {
            videos: [],
            showMenu: false,
            toMenu: {},
            types:[],
            streamPath : false,
            torrents: {}
        };
    },
    hasDownload: function(id){
        this.socket.emit('hasDownload', {type: 'video', id: id});
    },
    byValue: function(a, b){
       if(parseInt(a.date) > parseInt(b.date)) return -1;
       else return 1;
    },
	getFilesFromApi: function(){
        var types = [];
		$.get(this.props.cloudAPI, function(data){
            data.forEach(function(item){
                // console.log(item.meta);
                if(item.meta.type){
                    if(types.indexOf(item.meta.type) === -1)
                        types.push(item.meta.type);
                    item.metaCategory = item.meta.type;
                }else{
                    if(types.indexOf('unknown') === -1)
                        types.push('unknown');
                    item.metaCategory = 'unknown';
                }
            });
            types.sort();
            this.setState({videos: data, types: types});
        }.bind(this));
	},
    handlerSocket: function(name, data){
        if(data.type !== 'cloud') return false;
        var videos = this.state.videos;
        var cb = function(){this.setState({videos: videos});}.bind(this);
        var types = this.state.types;
        var item = data.obj;
        if(item.meta && item.meta.type){
            if(types.indexOf(item.meta.type) === -1)
                types.push(item.meta.type);
            item.metaCategory = item.meta.type;
        }else{
            if(types.indexOf('unknown') === -1)
                types.push('unknown');
            item.metaCategory = 'unknown';
        }
        if(name == 'new'){
            videos.unshift(data.obj); return cb();
        }else{
            videos.forEach(function(note, i){
                if(name == 'changed'){
                    if(note.id === data.obj.id){videos[i] = data.obj; return cb(); }
                }else{
                    if(note.id === data.obj){videos.splice(i, 1); return cb(); }
                }
            });
        }
    },
    formatSizeUnits : function (bytes){
        if      (bytes>=1000000000) {bytes=(bytes/1000000000).toFixed(2)+' GB';}
        else if (bytes>=1000000)    {bytes=(bytes/1000000).toFixed(2)+' MB';}
        else if (bytes>=1000)       {bytes=(bytes/1000).toFixed(2)+' KB';}
        else if (bytes>1)           {bytes=bytes+' bytes';}
        else if (bytes==1)          {bytes=bytes+' byte';}
        else                        {bytes='0 byte';}
        return bytes;
    },
    componentDidMount: function(){
        this.socket = io({secure: true});
		this.getFilesFromApi();
	    this.socket.on('new', function(data){
            this.handlerSocket('new', data);
        }.bind(this));
        this.socket.on('changed', function(data){
            this.handlerSocket('changed', data);
        }.bind(this));
        this.socket.on('delete', function(data){
            this.handlerSocket('delete', data);
        }.bind(this));
        this.socket.on('torrent', function(data){
            var torrents = this.state.torrents;
            var status = {
                    ratio: data.ratio,
                    progressDL: Math.round(data.progressDl * 100) / 100,
                    remainTime : Math.ceil(data.remain / 1000),
                    name: data.file,
                    speed: {
                        dl: this.formatSizeUnits(data.dlSpeed),
                        up: this.formatSizeUnits(data.upSpeed)
                    }
                };
            torrents[data.file] = status;
            this.setState({torrents: torrents});
        }.bind(this));
    },
    componentWillUnmount: function(){
        this.socket.on('changed', function(data){});//jshint ignore: line
        this.socket.on('new', function(data){});//jshint ignore: line
        this.socket.on('delete', function(data){});//jshint ignore: line
        this.socket.on('torrent', function(data){});//jshint ignore: line
        // clearInterval(this.load);
    },
    closeMenu: function(){
        this.setState({showMenu: false, toMenu: {}});
    },
    switchMenu: function(data){
        var toggle = !this.state.showMenu;
        this.setState({showMenu: toggle});
        if(toggle){
            var intel   = data.data,
            season      = intel.meta.season ? intel.meta.season : '',
            episode     = parseInt(intel.meta.episode ? intel.meta.episode : '').toString(),
            name        = parseInt(intel.meta.name ? intel.meta.name : intel.name).toString(),
            types       = ['movie', 'tvshow','other'];
            if(intel.meta.type){
                types.forEach(function(type, i){
                    if(intel.meta.type == type){
                        types[i] = types[i] + ':selected';
                        return;
                    }
                });
            }
            var opts = {
                name: name,
                download: {name: intel.name, src: intel.path},
                share: false,
                source: false,
                edit: [
                    {name : name},
                    {type: types},
                    {season: season},
                    {episode: episode},
                ],
                type: 'video',
                id: data.data.id,
                position: data.position
            };
            this.setState({ toMenu: opts });
        }else{
            this.closeMenu();
        }
    },
	render: function(){
        var i =0;
        var test = this.state.types.map(function(item){
            i++;
                var letterOrder = '';
                var orderToPrint = false;
                var mountVideosCat = this.state.videos.map(function(video){
                    if(item != video.metaCategory){
                        return;
                    }else{
                        var firstLetter = video.meta.name ? (video.meta.name).charAt(0) : (video.name).charAt(0);
                        if(letterOrder != firstLetter){
                            orderToPrint = firstLetter;
                            letterOrder = firstLetter;
                            console.log(orderToPrint);
                        }else orderToPrint = false;
                        return(
                            <Video
                                data={video}
                                nextOrder={orderToPrint}
                                hasDownload={this.hasDownload}
                                key={video.id}
                                switchMenu={this.switchMenu}
                            />
                        );
                    }
                }.bind(this));
                return(
                    <div className="categoryVideo" key={i}>
                        <h3 className="catTitle">{item}</h3>
                        <ul className="files">
                            <li  className="oneVideo itemCls">
                                <span className="metaVideo Meta">
                                    <span title="file name" className="fieldTitle fieldVideo titleVideo">FILE NAME</span>
                                    <span className="fieldTitle fieldVideo seasonVideo">SEASON</span>
                                    <span className="fieldTitle fieldVideo episodeVideo">EPISODE</span>
                                </span>
                            </li>
                            {mountVideosCat}
                        </ul>
                    </div>
                );
            }.bind(this));
        var j = 0;
        var tor;
        var mountTorrents = Object.keys(this.state.torrents).map(function(key){
            j++;
            tor = this.state.torrents[key];
            return(
                <Torrent data={tor} key={j} />
            );
        }.bind(this));
		return(
			<span>
            <div id="Cloud">
                <div className="files">
                	{test}
                </div>
                <div className="torrents">
                    <h3 className="catTitle">Active Torrents</h3>
                    {mountTorrents}
                </div>
            </div>
            {this.state.showMenu ?
                <ItemMenu
                    data={this.state.toMenu}
                    closeMenu={this.closeMenu}
                />
            : null
            }
            <Stream path={this.state.streamPath}/>
            </span>
		);
	}
});

module.exports = {
	CloudBox: CloudBox
};
