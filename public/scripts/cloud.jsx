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
                type : meta.type ? 'Category: ' + meta.type: '',
                season : meta.season ? 'Season: ' + meta.season: '',
                episode : meta.episode ? 'Episode: ' + meta.episode: '',
            };
        return(
            <li  className="oneVideo itemCls">
                <span className="metaVideo Meta" onClick={this.download}>
                    <span title="Download the file" className="fieldVideo titleVideo">{toScreen.name}</span>
                    <span className="fieldVideo typeVideo">{toScreen.type}</span>
                    <span className="fieldVideo seasonVideo">{toScreen.season}</span>
                    <span className="fieldVideo episodeVideo">{toScreen.episode}</span>
                </span>
                <div className="optsVideo"> 
                    <span className="optVideo" onClick={this.showMenu}>Menu</span>
                </div>
            </li>
        );
    }
});

var CloudBox = React.createClass({
    getInitialState: function() {
        return {
            videos: [],
            showMenu: false,
            toMenu: {},
            types:[]
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
                    if(types.indexOf(item.meta.type) == -1)
                        types.push(item.meta.type);
                    item.metaCategory = item.meta.type;
                }else{
                    if(types.indexOf('unknown'))
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
        if(name == 'new'){videos.unshift(data.obj); return cb(); }
        else{
            videos.forEach(function(note, i){
                if(name == 'changed'){
                    if(note.id === data.obj.id){videos[i] = data.obj; return cb(); }
                }else{
                    if(note.id === data.obj){videos.splice(i, 1); return cb(); }
                }
            });
        }
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
    closeMenu: function(){
        this.setState({showMenu: false, toMenu: {}});
    },
    switchMenu: function(data){
        var toggle = !this.state.showMenu;
        this.setState({showMenu: toggle});
        if(toggle){
            var intel   = data.data,
            season      = intel.meta.season ? intel.meta.season : '',
            episode     = intel.meta.episode ? intel.meta.episode : '',
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
        
        var test = this.state.types.map(function(item){
                var mountVideosCat = this.state.videos.map(function(video){
                    if(item != video.metaCategory){
                        return;
                    }else{
                        return(
                            <Video 
                                data={video}
                                hasDownload={this.hasDownload}
                                key={video.id}
                                switchMenu={this.switchMenu}
                            />
                        );
                    }
                }.bind(this));
                return(
                    <div className="categoryVideo">
                        <h3 className="catTitle">{item}</h3>
                        <ul className="files">
                            {mountVideosCat}
                        </ul>
                    </div>
                );
            }.bind(this));
   
        var mountVideos = this.state.videos.map((video)=>{
            return(
                <div className="categoryVideo">

                    <Video 
                        data={video}
                        hasDownload={this.hasDownload}
                        key={video.id}
                        switchMenu={this.switchMenu}
                    />
                </div>
            );
        });
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
            </span>
		);
	}
});

module.exports = {
	CloudBox: CloudBox
};
