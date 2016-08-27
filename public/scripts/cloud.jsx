var React   = require('react'),
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
        console.log(this.props.data);
        this.props.deleteFile(this.props.data.id);
    },
    render: function(){
        var intel = this.props.data;
        console.log(intel);
        return(
            <li  className="oneVideo">
                <span onClick={this.download}>
                    <h3>{intel.name}</h3>
                </span>
                <span className="closeOnTop" onClick={this.deleteFile}>Delete File</span>
            </li>
        );
    }
});

var CloudBox = React.createClass({
    getInitialState: function() {
        return {
              videos: []
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
	render: function(){
		var mountVideos = this.state.videos.map((video)=>{
            return(
                <Video data={video} hasDownload={this.hasDownload} deleteFile={this.deleteFile} key={video.id}/>
            );
        });
		return(
			<span>
            <div id="Cloud">
                <ul className="files">
                	{mountVideos}
                </ul>
            </div>
            </span>
		);
	}
});

module.exports = {
	CloudBox: CloudBox
};