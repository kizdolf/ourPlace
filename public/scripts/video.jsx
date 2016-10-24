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
                <video src="this.state.path" autoPlay >
                </video>
            </div>
        );
    }
});

var VideoBox = React.createClass({
    getInitialState: function() {
        return {
            videos: [],
            showMenu: false,
            toMenu: {},
            types:[],
            streamPath : false
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
		$.get(this.props.videoAPI, function(data){
            data.forEach(function(item){
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
            season      = parseInt(intel.meta.season ? intel.meta.season : '').toString(),
            episode     = parseInt(intel.meta.episode ? intel.meta.episode : '').toString(),
            name        = intel.meta.name ? intel.meta.name : intel.name,
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
		return(
			<span>
            <div id="Cloud">
                <div className="files">
                	{test}
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
	VideoBox: VideoBox
};
