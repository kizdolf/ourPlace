var
    React       = require('react'),
    Link        = require('react-router').Link,
    $           = require('jquery');

var OnTop = React.createClass({
    getInitialState: function(){
        return {
            editable: [],
            type: '',
            id: ''
        };
    },
    componentDidMount: function(){
        var editable;
        if(this.props.elem.type === "song"){
            var artist = (this.props.elem.meta.meta.artist) ? this.props.elem.meta.meta.artist[0] : '';
            editable = [
                {name: "title", val: this.props.elem.meta.meta.title || ''},
                {name:"album",val: this.props.elem.meta.meta.album || ''},
                {name:"artist",val: artist}];
        }
        this.setState({
            id: this.props.elem.id,
            type: this.props.elem.type,
            editable: editable
        });
        console.log(this.state);
    },
    update: function(){
        var values = {};
        this.state.editable.forEach((o)=>{
            var str = o.name;
            values[str] = $('#' + str).val();
        });
        this.props.update(values);
    },
    render: function(){
        var i = 0;
        var editNodes = this.state.editable.map(function(o){
            console.log(o);
            return (
                <div key={i++}>
                    <p>{o.name}</p> <input type="text" id={o.name} defaultValue={o.val}/>
                </div>
            );
        }.bind(this));
        return (
            <div className="onTop">
                <div className="wrapperOnTop">
                    <span className="closeOnTop" onClick={this.props.close}>X</span>
                    <h3>{this.props.elem.name}</h3>
                    <div>
                        {editNodes}
                    </div>
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
    },
    showOnTop: function(){
        this.setState({
            showOnTop : !this.state.showOnTop
        });
    },
    edit: function(){
        this.setState({
            showOnTop : true,
            toTop: this.props.e
        });
        // this.props.closeMenu();
    },
    download: function(){
        var dl = document.createElement('a');
        var name;
        dl.setAttribute('href', this.props.e.meta.path);
        if(this.props.e.meta.title){
            name = this.props.e.meta.title + '_';
            name += (this.props.e.meta.artist) ? this.props.e.meta.artist[0] : '';
            var ext = this.props.e.name.split('.')[this.props.e.name.split('.').length - 1];
            name += (ext.length === 3) ? '.' + ext : '.' + this.props.e.src.split('.')[this.props.e.src.split('.').length - 1];
        }else{
            name = this.props.e.meta.name;
        }
        name = name.replace(/ /g, '-');
        console.log(name);
        dl.setAttribute('download', name);
        dl.click();
        dl = null;
        this.props.closeMenu();
    },
    delete: function(){
        var id = this.props.e.id;
        var type = this.props.e.type;
        var url = '/api/' + type + '/' + id;
        console.log('going to delete on ' + url);
        this.props.closeMenu();
        $.ajax({
            method: 'DELETE',
            url : url,
        }).done(function(msg){
            if(msg === true){
                this.props.removed(id);
            }
        }.bind(this));
    },
    update: function(data){
        var id = this.props.e.id;
        var type = this.props.e.type;
        var url = '/api/update/' + type + '/' + id;
        this.props.closeMenu();
        $.post(url, data, function(msg){
            console.log(msg);
        }.bind(this));

    },
    componentDidMount: function(){
        var left = this.props.e.e.x;
        var right = this.props.e.e.y;
        /*
            we nned to see if it goes outside the screen here,
            and move it on the other side if it does.
            (true for vertical and horizontal)
            And move a bit from the button itself could be good as well.
        */
        $('#optsItem').css('top', right + 'px');
        $('#optsItem').css('left', left + 'px');
    },
    render: function(){
        return(
            <span>
                <div id="optsItem">
                    {
                        this.props.type === 'song' ?
                        <span className="oneOpt" onClick={this.download}><img src="img/ic_file_download_black_24dp.png" alt="dl" className="imgOpt"/><span className="txtOpt">Download</span></span>
                        : ''
                    }
                    <span className="oneOpt" onClick={this.edit}><img src="img/ic_edit_black_24dp.png" alt="edit" className="imgOpt"/><span className="txtOpt">Edit</span></span>
                    <span className="oneOpt" onClick={this.showOnTop}><img src="img/ic_comment_black_24dp.png" alt="edit" className="imgOpt"/><span className="txtOpt">Comment</span></span>
                    <span className="oneOpt" onClick={this.delete}><img src="img/ic_delete_black_24dp.png" alt="del" className="imgOpt"/><span className="txtOpt">Delete</span></span>
                    <span className="oneOpt" onClick={this.showOnTop}><img src="img/ic_link_black_48px.svg" alt="share" className="imgOpt"/><span className="txtOpt">Get link</span></span>
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

exports.Menu = React.createClass({
    render: function(){
        return (
            <div className="WrapperMenu">
                <ul className="links">
                    <li className="oneLink"><Link to="/notes">Notes</Link></li>
                    <li className="oneLink"><Link to="/">Music</Link></li>
                </ul>
            </div>
        );
    }
});
