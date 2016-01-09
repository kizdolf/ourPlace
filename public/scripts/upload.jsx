var React       = require('react'),
    Dropzone    = require('react-dropzone'),
    $           = require('jquery'),
    request     = require('superagent');

var Uploading = React.createClass({
    render: function(){
        var mountCurrent = Object.keys(this.props.now).map(function (key) {
            return(
                <li key={this.props.now[key].name}>
                    <span className="tNow">{this.props.now[key].name} : </span><span className="pctNow">{this.props.now[key].pct}</span>
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
            },
            putClass = function(){
                dZ.addClass('willDrop');
            };

        ht.on({
            dragenter: putClass,
            dragover: function(){
                if(!dZ.hasClass('willDrop'))
                    putClass();
            }
        });
        dZ.on({
            dragleave: rmClass,
            drop: rmClass
        });
    },
    onDrop: function(files){
        files.forEach(function(file, i) {
            console.log('uploading ' + file.name);
            var elem = {name: file.name, pct: 'Starting ...'};
            var current = this.state.uploading;
            current[file.name] = elem;
            this.setState({ uploading: current });
            request.post(this.props.url)
            .attach('file', file, file.name)
            .on('progress', function(e){
                var elem = {name: file.name, pct: parseInt(e.percent).toString() + '%'};
                var current = this.state.uploading;
                current[file.name] = elem;
                this.setState({ uploading: current });
            }.bind(this))
            .on('error', function(err){
                console.log(err);
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
