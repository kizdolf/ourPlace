var React       = require('react'),
    ItemMenu    = require('./itemMenu.jsx').ItemMenu,
    $           = require('jquery');


var Torrent = React.createClass({
  getInitialState : function(){
    return{
      showTargets : 'none'
    }
  },
  changeVisiTargets : function(){
    let show = this.state.showTargets
    let newShow = (show == 'none') ? 'block' : 'none'
    this.setState({showTargets : newShow})
  },
  render: function(){
    let data = this.props.data;
    let torrent = data.torrent
    let targets = data.targets
    let mountTorrentFiles = targets.map((target) => {
      return(
        <li key={target.id} className="torrentTarget">
          <span className="targetProgress" style={{width:target.progress + '%'}}></span>
          <span className="targetName">{target.name}</span>
          <span className="targetSize"> Size : {target.size} bytes</span>
        </li>
      )
    })
    return(
      <div className="oneTorrent">
        <div className="torrentInfos">
          <span className="torrentInfo progressT">
            <span className="progressText"> {torrent.progress} % </span>
            <span className="progressText"> {torrent.timeRemaining}</span>
            <span className="background" style={{width:torrent.progress + '%'}}></span>
          </span>
          <div className="torrentFields">
            <span className="torrentInfo name">{torrent.name} </span>
            <span className="torrentInfo field">
              <img src="img/ic_arrow_downward_black_18px.svg" alt="dlSpeed" title="dlSpeed"/>
              {torrent.currentDownSpeed} bytes/sec
            </span>
            <span className="torrentInfo field">
              <img src="img/ic_arrow_upward_black_18px.svg" alt="upSpeed" title="upSpeed"/>
              {torrent.currentUpSpeed} bytes/sec
            </span>
            <span className="torrentInfo field">
              <img src="img/ic_swap_vert_black_18px.svg" alt="ratio" title="ratio"/>
              {torrent.ratio}
            </span>
            <span className="torrentInfo field">
            <img src="img/ic_supervisor_account_black_18px.svg" alt="nbPeers" title="nbPeers"/>
            {torrent.nbPeers}
            </span>
            <span className="torrentInfo field cursor">
            <img onClick={this.changeVisiTargets} src="img/ic_visibility_black_24px.svg"  alt="See Files"  title="See Files"
            />
            </span>
          </div>
        </div>
        <div className="hover">
          <span className="torrentInfo field">Date start :  {torrent.dateStart} </span>
        </div>
        <div className="torrentFiles" style={{display:this.state.showTargets}}>
          <ul>
            {mountTorrentFiles}
          </ul>
        </div>
      </div>
    );
  }
});

const TorrentBox = React.createClass({
  getInitialState: function(){
    return {
        torrents: []
    }
  },
  componentDidMount: function(){
    this.socket = io({secure: true});
    this.socket.on('torrent', function(torrent){
      let torrents = this.state.torrents
      let update = false
      torrents.forEach((stateTorrent, i) => {
        if(stateTorrent.id == torrent.id){
          torrents[i] = torrent
          update = true
        }
      })
      if(!update)
        torrents.push(torrent)
      if (this.isMounted())
        this.setState({torrents: torrents})
    }.bind(this))
    $.get('/api/torrents', function(data){
      if(!data.err)
        this.setState({torrents : data})
    }.bind(this))
  },
  componentWillUnmount: function(){
    this.socket = null
  },
  render: function(){
    var mountTorrents = this.state.torrents.map(function(torrent){
      return(
        <Torrent data={torrent} key={torrent.id} />
      )
    })
    return(
      <div className="torrentBox">
          <h2>Torrents!</h2>
          {mountTorrents}
      </div>
    )
  }
})


module.exports = {
  TorrentBox: TorrentBox
}
