var React       = require('react'),
    Dropzone    = require('react-dropzone'),
    $           = require('jquery'),
    request     = require('superagent');

var Uploading = React.createClass({
    render: function(){
        var mountCurrent = Object.keys(this.props.now).map(function (key) {
            var pct = this.props.now[key].pct;
            var clss = "tNow";
            //when upload ends all music are converted to ogg format. So when pct stay at 100 this is what's happening.
            if (pct.indexOf('100') != -1) pct = 'Converting...';
            if (pct.indexOf('error') != -1) clss = "tNow err"; //aie.
            return(
                <li key={this.props.now[key].name}>
                    <div className="upWrapper" style={{width: pct}}></div>
                    <span className={clss}>{this.props.now[key].name} : </span><span className="pctNow">{pct}</span>
                </li>
            );
        }.bind(this));
        return(
            <ul>
                {mountCurrent}
            </ul>
        );
    }
});

exports.Upload = React.createClass({
    getInitialState: function(){
        return { uploading: [] };
    },
    componentDidMount: function(){
        var dZ = $('.dropZone'),
            ht = $('html'),
            rmClass = function(){
                dZ.removeClass('willDrop');
            };

        ht.on('dragenter', function(evt){
            if(this.props.drag == false)
                dZ.addClass('willDrop');
        }.bind(this));
        ht.on('dragover', function(evt){
            if(!dZ.hasClass('willDrop') && this.props.drag == false)
                dZ.addClass('willDrop');
        }.bind(this));
        dZ.on({
            dragleave: rmClass,
            drop: rmClass
        });
    },
    onDrop: function(files){
        if(this.props.drag) return;
        files.forEach(function(file, i) {
            var elem = {name: file.name, pct: 'Starting ...'};
            var current = this.state.uploading;
            current[file.name] = elem;
            this.setState({ uploading: current });
            request
            .post(this.props.url)
            .attach('file', file, file.name)
            .on('progress', function(e){
                var elem = {name: file.name, pct: parseInt(e.percent).toString() + '%'};
                var current = this.state.uploading;
                current[file.name] = elem;
                this.setState({ uploading: current });
            }.bind(this))
            .on('error', function(err){
                var current = this.state.uploading;
                current[file.name].pct = 'error uploading :/';
                this.setState({ uploading: current });
            })
            .end(function(res){
                var current = this.state.uploading;
                current[file.name].pct = 'Finished.';
                this.setState({ uploading: current });
                setTimeout(function(){
                    delete current[file.name];
                    this.setState({ uploading: current });
                }.bind(this), 3500);
            }.bind(this));
        }.bind(this));
    },
    render: function(){
        return(
            <div>
                <Dropzone onDrop={this.onDrop} className="dropZone">
                  <div className="innerDrop">Drop stuff!</div>
                </Dropzone>
                {Object.keys(this.state.uploading).length > 0 ?
                    <div className="uploadStatus">
                        <Uploading now={this.state.uploading} />
                    </div>
                : ''
                }
            </div>
        );
    }
});
