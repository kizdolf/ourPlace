var
    React       = require('react'),
    $           = require('jquery');

var Selectable = React.createClass({
    render: function(){
        var i = 0;
        var mountOpts = this.props.values.map(function(item){
            var selected = false;
            if(item.indexOf(':selected') !== -1){
                item = item.split(':selected')[0];
                selected = true;
            }
            return(
                <option key={i++} value={item} selected={selected}>{item}</option>
            );
        }.bind(this));
        return(
            <span className="editItem">
                <p className="editKey">{this.props.name}</p>
                <select id={this.props.name} className="editVal">
                    {mountOpts}
                </select>
                <br/>
            </span>
        );
    }
});


var OnTop = React.createClass({
    update: function(){
        var editables = this.props.elem.edit;
        var edit      ={};
        editables.forEach((item)=>{
            var keyVal = Object.keys(item);
            var value = item[keyVal];
            switch (typeof value){
                case 'string':
                    edit[keyVal] = $('#' + keyVal).val();
                    break;
                case 'object':
                    edit[keyVal] = $('#' + keyVal).find(":selected").text();
                    break;
                default: 
            }
        });
        this.props.update(edit);
    },
    render: function(){
        // var setContent = function(content){
        //     return {__html: content};
        // };
        var editable = this.props.elem.edit;
        console.log(editable);
        var name = this.props.elem.name;
        var i = 0;
        var editableNodes = editable.map(function(item){
            var keyVal = Object.keys(item);
            var value = item[keyVal];
            switch (typeof value){
                case 'string':
                    return (
                        <span key={i++} className="editItem">
                        <p className="editKey">{keyVal}</p> <input className="editVal" type="text" id={keyVal} defaultValue={value} />
                        <br/>
                        </span>
                    );
                case 'object':
                    return(
                        <Selectable name={keyVal} values={value} id={keyVal}/>
                    );
                default: 
            }
        }.bind(this));
        return (
            <div className="onTop">
                <div className="wrapperOnTop">
                    <span className="closeOnTop" onClick={this.props.close}>X</span>
                    <h3>{name}</h3>
                    <div>{editableNodes}</div>
                    <div className="btnsSubOnTop">
                        <button onClick={this.update}>OK</button>
                        <button onClick={this.props.close}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }
});

exports.ItemMenu = React.createClass({
    getInitialState: function(){
        return {
            toTop: {},
            showOnTop: false,
        };
    },
    close: function(){
        this.setState({showOnTop: false});
        this.props.closeMenu();
    },
    edit: function(){
        this.setState({
            showOnTop : true,
            toTop: {edit: this.props.data.edit, name: this.props.data.name}
        });
    },
    getLink: function(){
        var el = this.props.data.meta;
        if(el.urlOrigin){
            var link = document.createElement('a');
            link.setAttribute('class', 'oneOpt');
            link.innerHTML = el.urlOrigin;
            link.setAttribute('href', el.urlOrigin);
            link.setAttribute('target', '_blank');
            link.click();
        }//else print something.
        this.props.closeMenu();
    },
    update: function(data){
        console.log(data);
        console.log(this.props.data);
        var id = this.props.data.id;
        var type = this.props.data.type;
        var url = '/api/update/' + type + '/' + id;
        $.post(url, data);
        this.props.closeMenu();
    },
    // share: function(){
    //     var url     = '/api/getToken/',
    //         data    = {type: this.props.e.type, id: this.props.e.id},
    //         print   = '';
    //     $.post(url, data, function(res){
    //         print = (res.url) ? res.url : 'error, try, again';
    //         console.log(print);
    //     });
    // },
    componentWillUnmount: function(){
        this.close();
        $(document).unbind('mouseup');
        window.onpopstate = function(event) {return true;};
    },
    download: function(){
        var type = this.props.type;
        var id = this.props.data.id;
        var intel = this.props.data.download;
        var dl = document.createElement('a');
        var name = intel.name;
        dl.setAttribute('href', intel.path);
        dl.setAttribute('download', name.replace(/ /g, '-'));
        dl.click();
        dl = null;
        this.socket.emit('hasDownload', {type: type, id: id});
        this.props.closeMenu();
    },
    delete: function(){
        var type = this.props.data.type;
        var id = this.props.data.id;
        var url = '/api/' + type + '/' + id;
        $.ajax({ method: 'DELETE', url : url});
        this.props.closeMenu();
    },
    setPosition: function(pos){
        var it = $('.itemCls');
        var left = pos.x - (10 + parseInt(it.css('marginRight')) + parseInt(it.css('marginBottom')));
        $('#optsItem').css('top', pos.y + 'px');
        $('#optsItem').css('left', left + 'px');
    },
    componentDidMount: function(){
        this.setPosition(this.props.data.position);
        this.socket = io({secure: true});
        window.history.pushState({ reason: "menuClick" }, "menu"); //is that really good?
        $(document).mouseup(function (e){
            var opt = $('#optsItem');
            var onTop = $('.onTop');
            if (!opt.is(e.target) && opt.has(e.target).length === 0 && 
                !onTop.is(e.target) && onTop.has(e.target).length === 0){
                this.props.closeMenu();
            }
        }.bind(this));
        window.onpopstate = function() {
          this.close();
        }.bind(this);
    },
    render: function(){
                    // <span className="oneOpt" onClick={this.showOnTop}><img src="img/ic_comment_black_24dp.png" alt="edit" className="imgOpt"/><span className="txtOpt">Comment</span></span>
        var data = this.props.data;
        return(
            <span id="wrapperMenu">
                <div id="optsItem">
                    {data.download ?
                        <span className="oneOpt" onClick={this.download}>
                            <img src="img/ic_file_download_black_24dp.png" alt="edit" className="imgOpt"/>
                            <span className="txtOpt">Download</span>
                        </span>
                    : null
                    }
                    <span className="oneOpt" onClick={this.delete}>
                        <img src="img/ic_delete_black_24dp.png" alt="edit" className="imgOpt"/>
                        <span className="txtOpt">Delete</span>
                    </span>
                    {data.share ?
                        <span className="oneOpt" onClick={this.share}>
                            <img src="img/ic_link_black_48px.png" alt="edit" className="imgOpt"/>
                            <span className="txtOpt">Share</span>
                        </span>
                    : null
                    }
                    {data.source ?
                        <span className="oneOpt" onClick={this.getSource}>
                            <img src="img/ic_link_black_48px.png" alt="edit" className="imgOpt"/>
                            <span className="txtOpt">Get Source</span>
                        </span>
                    : null
                    }
                    <span className="oneOpt" onClick={this.edit}>
                        <img src="img/ic_edit_black_24dp.png" alt="edit" className="imgOpt"/>
                        <span className="txtOpt">Edit</span>
                    </span>
                </div>
                {
                    this.state.showOnTop ?
                        <OnTop
                            elem={this.state.toTop}
                            close={this.close}
                            update={this.update}
                        />
                    : null
                }
            </span>
        );
    }
});