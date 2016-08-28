var
    React       = require('react'),
    Link        = require('react-router').Link,
    linker      = require('autolinker'),
    $           = require('jquery');

var Selectable = React.createClass({
    render: function(){
        var i = 0;
        var mountOpts = this.props.values.map(function(item){
            return(
                <option key={i++} value={item}>{item}</option>
            );
        }.bind(this));
        return(
            <span>
                <p>{this.props.name}</p>
                <select id={this.props.name}>
                    {mountOpts}
                </select>
                <br/>
            </span>
        );
    }
});


var OnTop = React.createClass({
    // getInitialState: function(){
    //     return {
    //         editable: [],
    //         type: '',
    //         id: ''
    //     };
    // },
    // componentDidMount: function(){
    //     var editable;
    //     if(this.props.elem.type === 'song'){
    //         var artist = (this.props.elem.meta.meta.artist) ? this.props.elem.meta.meta.artist[0] : '';
    //         editable = [
    //             {name: 'title', val: this.props.elem.meta.meta.title || '', type: 'text'},
    //             {name:'album', val: this.props.elem.meta.meta.album || '', type: 'text'},
    //             {name:'artist', val: artist, type: 'text'}];
    //     }else if (this.props.elem.type === 'note'){
    //         editable = [{
    //             name: 'note', val: this.props.elem.meta.content, type: 'textarea'
    //         }];
    //     }
    //     this.setState({
    //         id: this.props.elem.id,
    //         type: this.props.elem.type,
    //         editable: editable
    //     });
    // },
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
        console.log("end");
        console.log(edit);
        this.props.update(edit);
    },
    // lowerCase: function(i){
    //     console.log('lower');
    //     console.log(i);
    //     var edit = this.state.editable;
    //     edit[i].val = edit[i].val.toLowerCase();
    //     console.log(edit[i]);
    //     this.setState({editable: edit});
    // },
    
    render: function(){
        var setContent = function(content){
            return {__html: content};
        };
        var editable = this.props.elem.edit;
        var name = this.props.elem.name;
        var i = 0;
        var editableNodes = editable.map(function(item){
            var keyVal = Object.keys(item);
            var value = item[keyVal];
            switch (typeof value){
                case 'string':
                    return (
                        <span key={i++}>
                        <p>{keyVal}</p> <input type="text" id={keyVal} defaultValue={value} />
                        <br/>
                        </span>
                    );
                    break;
                case 'object':
                    return(
                        <Selectable name={keyVal} values={value} id={keyVal}/>
                    );
                    break;
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
    // showOnTop: function(){
    //     this.setState({
    //         showOnTop : !this.state.showOnTop
    //     });
    // },
    edit: function(){
        this.setState({
            showOnTop : true,
            toTop: {edit: this.props.data.edit, name: this.props.data.name}
        });
        // this.props.closeMenu();
    },
    // download: function(){
    //     var dl = document.createElement('a'), name;
    //     var song = this.props.e.meta;
    //     var meta = song.meta;
    //     dl.setAttribute('href', song.path);
    //     console.log(song);
    //     console.log(meta);
    //     var ext = song.type.split('/')[1];
    //     if(meta.title){
    //         name = meta.title + '_';
    //         name += (meta.artist) ? meta.artist[0] : '';
    //         name += '.' + ext;
    //     }else{
    //         console.log('NON e.meta.title');
    //         name = e.meta.name;
    //     }
    //     dl.setAttribute('download', name.replace(/ /g, '-'));
    //     dl.click();
    //     dl = null;
    //     this.props.closeMenu();
    // },
    // delete: function(){
    //     var id = this.props.e.id;
    //     var type = this.props.e.type;
    //     var url = '/api/' + type + '/' + id;
    //     this.props.closeMenu();
    //     $.ajax({
    //         method: 'DELETE',
    //         url : url,
    //     }).done(function(msg){ //this is to remove soon. due to db listeners.
    //         if(msg === true){
    //             this.props.removed(id);
    //         }
    //     }.bind(this));
    // },
    // getLink: function(){
    //     var el = this.props.e.meta;
    //     if(el.urlOrigin){
    //         var link = document.createElement('a');
    //         link.setAttribute('class', 'oneOpt');
    //         link.innerHTML = el.urlOrigin;
    //         link.setAttribute('href', el.urlOrigin);
    //         link.setAttribute('target', '_blank');
    //         link.click();
    //     }
    //     this.props.closeMenu();
    // },
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
    // componentDidMount: function(){
    //     var top = this.props.e.e.y;
    //     var it = $('.itemCls');
    //     var left = this.props.e.e.x - (10 + parseInt(it.css('marginRight')) + parseInt(it.css('marginBottom')));
    //     $('#optsItem').css('top', top + 'px');
    //     $('#optsItem').css('left', left + 'px');
    //     $(document).mouseup(function (e){
    //         var opt = $('#optsItem');
    //         var onTop = $('.onTop');
    //         if (!opt.is(e.target) && opt.has(e.target).length === 0 && 
    //             !onTop.is(e.target) && onTop.has(e.target).length === 0){
    //             this.props.closeMenu();
    //         }
    //     }.bind(this));
    //     var stateObj = { reason: "menuClick" };
    //     window.history.pushState(stateObj, "menu");
    //     window.onpopstate = function(event) {
    //       this.close();
    //     }.bind(this);

    // },
    // componentWillUnmount: function(){
    //     this.close();
    //     $(document).unbind('mouseup');
    //     window.onpopstate = function(event) {return true;};
    // },
    setPosition: function(pos){
        var it = $('.itemCls');
        var left = pos.x - (10 + parseInt(it.css('marginRight')) + parseInt(it.css('marginBottom')));
        $('#optsItem').css('top', pos.y + 'px');
        $('#optsItem').css('left', left + 'px');
    },
    componentDidMount: function(){
        this.setPosition(this.props.data.position);
    },
    render: function(){
                    // <span className="oneOpt" onClick={this.showOnTop}><img src="img/ic_comment_black_24dp.png" alt="edit" className="imgOpt"/><span className="txtOpt">Comment</span></span>
        var data = this.props.data;
        return(
            <span>
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