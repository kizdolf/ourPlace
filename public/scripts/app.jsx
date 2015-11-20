var
    React       = require('react'),
    ReactDOM    = require('react-dom'),
    Router      = require('react-router').Router,
    Route       = require('react-router').Route,
    IndexRoute  = require('react-router').IndexRoute,
    Layout      = require('./layout.jsx').Layout,
    NoteBox     = require('./note.jsx').NoteBox,
    MusicBox    = require('./music.jsx').MusicBox;

ReactDOM.render((
    <Router>
        <Route path="/" component={Layout}>
            <IndexRoute component={MusicBox} />
            <Route path="notes" component={NoteBox} />
        </Route>
    </Router>
), document.getElementById('app'));
