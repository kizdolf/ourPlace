var
    React       = require('react'),
    ReactDOM    = require('react-dom'),
    Router      = require('react-router').Router,
    Route       = require('react-router').Route,
    IndexRoute  = require('react-router').IndexRoute,
    Layout      = require('./layout.jsx').Layout,
    NoteBox     = require('./note.jsx').NoteBox,
    SongBox    = require('./song.jsx').SongBox;

ReactDOM.render((
    <Router>
        <Route path="/" component={Layout}>
            <IndexRoute component={SongBox} />
            <Route path="notes" component={NoteBox} />
            <Route path="*" component={SongBox} />
        </Route>
    </Router>
), document.getElementById('app'));
