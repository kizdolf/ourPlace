var React       = require('react'),
    Dropzone    = require('react-dropzone'),
    $           = require('jquery'),
    request     = require('superagent');

exports.Upload = React.createClass({
    getInitialState: function(){
        /*
            should be able to store and update the state of all uploading data.
            And do display it Nicely. Actually the div display the state of the uplaod should be a component.
        */
        return { pct: null };
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
        files.forEach(function(file) {
            request.post(this.props.url)
            .attach('file', file, file.name)
            .on('progress', function(e){
                this.setState({pct: e.percent});
            }.bind(this))
            .on('error', function(err){
                console.log(err);
            })
            .end(function(res){
                console.log('res from request.');
                console.log(res);
            });
        }.bind(this));
    },
    render: function(){
        return(
            <div>
                <Dropzone onDrop={this.onDrop} className="dropZone">
                  <div className="innerDrop">Drop stuff!</div>
                </Dropzone>
                <div className="uploadStatus">
                    done at {this.state.pct} %.
                </div>
            </div>
        );
    }
});
