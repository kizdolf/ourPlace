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
    deleteFile: function(){
        this.props.deleteFile(this.props.data.id);
    },
    showMenu: function(e){
        this.props.switchMenu({
            position: {x: e.pageX, y: e.pageY},
            data: this.props.data
        });
    },
    render: function(){
        var intel = this.props.data;
        if(intel.meta){
            console.log('META');
            console.log(intel.meta);
        }
        return(
            <li  className="oneVideo itemCls">
                <span className="metaVideo" onClick={this.download}>
                    <span className="titleVideo">{intel.name}</span>
                </span>
                <div className="optsVideo"> 
                    <span className="optVideo" onClick={this.deleteFile}>Delete</span>
                    <span className="optVideo" onClick={this.stream}>Stream</span>
                </div>
                <img
                    className="itemMenu toptop"
                    src="img/ic_more_vert_black_24dp_1x.png"
                    onClick={this.showMenu}
                />
            </li>
        );
    }
});

var CloudBox = React.createClass({
    getInitialState: function() {
        return {
            videos: [],
            showMenu: false,
            toMenu: {}
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
		$.get(this.props.cloudAPI, function(data){
            this.setState({videos: data.sort(this.byValue)});
        }.bind(this));
	},
    deleteFile: function(id){
        var type = "video";
        var url = '/api/' + type + '/' + id;
        $.ajax({ method: 'DELETE', url : url});
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
            var season = data.data.meta.season ? data.data.meta.season : '';
            var episode = data.data.meta.episode ? data.data.meta.episode : '';
            var name = data.data.meta.name ? data.data.meta.name : data.data.name;
            var opts = {
                name: name,
                download: {name: data.data.name, src: data.data.path},
                share: false,
                source: false,
                edit: [
                    {name : data.data.name},
                    {type: ['movie', 'tvshow','other']},
                    {season: season},
                    {episode: episode},
                ],
                type: 'video',
                id: data.data.id,
                position: data.position
            };
            this.setState({
                toMenu: opts
            });
        }else{
            this.closeMenu();
        }
    },
	render: function(){
		var mountVideos = this.state.videos.map((video)=>{
            return(
                <Video 
                    data={video}
                    hasDownload={this.hasDownload}
                    deleteFile={this.deleteFile}
                    key={video.id}
                    switchMenu={this.switchMenu}
                />
            );
        });
		return(
			<span>
            <div id="Cloud">
                <ul className="files">
                	{mountVideos}
                </ul>
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