var
    React       = require('react'),
    Medium      = require('react-medium-editor'),
    linker      = require('autolinker'),
    ItemMenu    = require('./smalls.jsx').ItemMenu,
    moment      = require('moment'),
    $           = require('jquery');

require('react-medium-editor/node_modules/medium-editor/dist/css/medium-editor.css');
require('react-medium-editor/node_modules/medium-editor/dist/css/themes/default.css');

var Note = React.createClass({
    showMenu: function(e){
        console.log(this.props);
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
            <li className="oneNote">
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
        this.props.addNote(note);
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
    addNote: function(note){
        var newNotes = this.state.notes;
        note.id = note.date;
        newNotes.unshift(note);
        this.setState({notes: newNotes});
    },
    componentDidMount: function(){
        this.getNotesFromAPI();
        this.load = setInterval(this.getNotesFromAPI, 25000);
    },
    componentWillUnmount: function(){
        clearInterval(this.load);
    },
    showMenu: function(e, meta, id){
        this.setState({
            toTop: {meta: meta, e: e, type:'note', id: id},
            showMenu: !this.state.showMenu
        });
    },
    closeMenu: function(){
        this.setState({showMenu: false});
    },
    removed: function(id){
        console.log(name + ' had beed removed');
        var actuals = this.state.notes;
        actuals.forEach((note, i)=>{
            if(note.id === id){
                actuals.splice(i, 1);
                return;
            }
        });
        this.setState({notes: actuals});
        setTimeout(function(){this.getNotesFromAPI();}.bind(this), 2500);
    },
    render: function(){
        var mountNotes = this.state.notes.map((note)=>{
            return(
                <Note data={note} key={note.id} showMenu={this.showMenu}/>
            );
        });
        return(
            <div id="Notes">
                <ul className="notes">
                    <Editor
                        get={this.getNotesFromAPI}
                        apiAddNote={this.props.apiAddNote}
                        addNote={this.addNote}
                    />
                    {mountNotes}
                </ul>
                {
                    this.state.showMenu ?
                        <ItemMenu
                            e={this.state.toTop}
                            closeMenu={this.closeMenu}
                            type='note'
                            removed={this.removed}
                        />
                    : null
                }
            </div>

        );
    }
});
