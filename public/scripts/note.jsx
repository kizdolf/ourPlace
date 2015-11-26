var
    React       = require('react'),
    Medium      = require('react-medium-editor'),
    linker      = require('autolinker'),
    moment      = require('moment'),
    $           = require('jquery');

require('react-medium-editor/node_modules/medium-editor/dist/css/medium-editor.css');
require('react-medium-editor/node_modules/medium-editor/dist/css/themes/default.css');

var Note = React.createClass({
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
        var d = Date.now();
        var note = {
            name: 'ourNote' + d,
            content: txt,
            date: Date.now()
        };
        this.setState({text: 'Not sended!'});
        this.props.addNote(note);
        $.post(this.props.apiAddNote, {note: note});
    },
    render: function(){
        return(
            <div className="editorNote">
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
    render: function(){
        var mountNotes = this.state.notes.map((note)=>{
            return(
                <Note data={note} key={note.name}/>
            );
        });
        return(
            <div id="Notes">
                <Editor
                    get={this.getNotesFromAPI}
                    apiAddNote={this.props.apiAddNote}
                    addNote={this.addNote}
                />
                <ul className="notes">
                    {mountNotes}
                </ul>
            </div>
        );
    }
});
