var
    React       = require('react'),
    Medium      = require('react-medium-editor'),
    linker      = require('autolinker'),
    ItemMenu    = require('./smalls.jsx').ItemMenu,
    moment      = require('moment'),
    $           = require('jquery');

require('./../css/medium-editor.min.css');
require('./../css/default.min.css');

var Note = React.createClass({
    showMenu: function(e){
        this.props.showMenu(
            {x: e.pageX, y: e.pageY},
            this.props.data,
            this.props.data.id
        );
    },
    render: function(){
        var setContent = function(content){
            return {__html: content};
        };
        var formatDate =  function(d){
            return (moment(parseInt(d)).format('ddd DD MMMM YYYY HH:mm'));
        };
        return(
            <li className="oneNote itemCls">
                <span className="date">{formatDate(this.props.data.date)}</span>
                <div className="contentNote" dangerouslySetInnerHTML={setContent(this.props.data.content)} />
                <img
                    className="itemMenu toptop"
                    src="img/ic_more_vert_black_24dp_1x.png"
                    onClick={this.showMenu}
                />
            </li>
        );
    }
});

var Editor = React.createClass({
    getInitialState: function(){
        return {
            text: "Type here a note!<br>(Urls will be transform when you send the note)<br>Select text to see the toolbar :)",
        };
    },
    handleChange: function(text){
        this.setState({text: text});
    },
    send: function(){
        var txt = linker.link(this.state.text);
        var note = {
            content: txt,
            date: Date.now()
        };
        this.setState({text: 'Note sended!'});
        $.post(this.props.apiAddNote, {note: note});
    },
    render: function(){
        return(
            <div className="oneNote">
                <Medium
                tag="pre"
                text={this.state.text}
                onChange={this.handleChange}
                options={{
                        toolbar: {
                            buttons: ['bold', 'italic', 'underline', 'anchor', 'h2', 'h3', 'quote'],
                        },
                    }}
                />
            <button onClick={this.send}>Send</button>
            </div>
        );
    }
});

exports.NoteBox = React.createClass({
    getInitialState: function(){
        return {
            notes: [],
            toTop: {},
            showMenu: false
        };
    },
    byValue: function(a, b){
       if(parseInt(a.date) > parseInt(b.date)) return -1;
       else return 1;
    },
    getNotesFromAPI: function(){
        $.get(this.props.noteAPI, function(data){
            this.setState({notes: data.sort(this.byValue)});
        }.bind(this));
    },
    handlerSocket: function(name, data){
        if(data.type !== 'note') return false;
        var notes = this.state.notes;
        var cb = function(){this.setState({notes: notes});}.bind(this);
        if(name == 'new'){notes.unshift(data.obj); return cb(); }
        else{
            notes.forEach(function(note, i){
                if(name == 'changed'){
                    if(note.id === data.obj.id){notes[i] = data.obj; return cb(); }
                }else{
                    if(note.id === data.obj){notes.splice(i, 1); return cb(); }
                }
            });
        }
    },
    componentDidMount: function(){
        this.getNotesFromAPI();
        this.socket = io({secure: true});
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
        this.socket.on('update', function(data){});//jshint ignore: line
        this.socket.on('new', function(data){});//jshint ignore: line
        this.socket.on('delete', function(data){});//jshint ignore: line
        this.socket.on('update', function(data){});//jshint ignore: line
        // clearInterval(this.load);
    },
    showMenu: function(e, meta, id){
        this.setState({
            toTop: {meta: meta, e: e, type:'note', id: id},
            showMenu: !this.state.showMenu
        });
    },
    closeMenu: function(){
        if (this.isMounted()) this.setState({showMenu: false});
    },
    removed: function(id){id = null;},
    render: function(){
        var mountNotes = this.state.notes.map((note)=>{
            return(
                <Note data={note} key={note.id} showMenu={this.showMenu}/>
            );
        });
        return(
            <span>
            <div id="Notes">
                <ul className="notes">
                    <Editor
                        get={this.getNotesFromAPI}
                        apiAddNote={this.props.apiAddNote}
                    />
                    {mountNotes}
                </ul>
            </div>
            {this.state.showMenu ?
                <ItemMenu e={this.state.toTop} closeMenu={this.closeMenu} type='note' removed={this.removed} />
            : null
            }
            </span>
        );
    }
});
