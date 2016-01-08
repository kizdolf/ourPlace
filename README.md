# ourPlace

> Node / React / Rethinkdb application as a small but personnal cloud. Under development. 

**Using what else?**

 * socket.io : to pass some data, to know when to call the api
 * express-session && socket.io-express-session to manage session, session are stored in a rethinkdb table, avaible from request or socket. <3
 * Table listener from rethinkdb. It tell me when something happen (and what) on a table. Allow to react properly (still under dev)
 * youtube-dl : under the hood, it's used to download youtube song, extract metadata, image etc.
 * webpack : just on file to serve, and help so much the dev phase. 

### What's here already? 

* Music: Upload it, play it, edit it.
* Notes: Because I needed it badly. 
* Rss: under light construction. 
* Usuable from a mobile.
* Nothing more. See the next section for the rest. 

### What's will be here? 


* Accounts: **[DONE]**
This deserve a bit of explaination I suppose. I want to be able to share everything uploaded on the cloud. But not to everyone. So I don't want to allow people to log-on. Just log-in. Only the Admin should be able to send invitations, and only people with invitations should be able to log-in. Then why not allow some members to invite?  (_idea_)
[_NOT done_]So. An invite system. Token based. With the smallest account managment possible: pseudo/password/profilPicture/id. 
Unique token for the invitation, unique token at each login.

* Music: 
 * youtube links, paste a link and the app will download it and gice it to you gently and quickly. **[DONE]**
 * Comments: We are such good as trolling, we should be able to troll even on a simple could based music player.
 * Change/Add a cover. Because some metaData are broken, or imcomplete, or emptys, but a picture for a song is usefull. 
 * sort Music. By artist, by date. 
 * playlists. Because that's what we love nowadays.
* Notes: 
  * Edit/delete/comment/sort.
* Pictures: 
 * Not sure about this. Is it usefull to store pics on a cloud? for real. I don't know. But maybe.
* Documents: 
 * store stuff you want to download later somewhere else. Store stuff you want to share. Do not store personnal stuff. Not if you share this cloud with others people. 

### What's need to be done in a later future?

* Tests. I don't do tests. I should. I should use tools for this. I should, but I don't...
* CSS. I am not good in css. I do not like css. The existing one is... working at least.
* Streaming managment. As the moment a user start to listen a song, I would like to store in the user device the whole playlist (at least the x nexts songs) to allow the user to listen music when network is down. And to retrieve this data even after a reload of the page. 
* Add a bit of social. By that I mean a chat at least. But if a chat it is, it's a chat without keeping data. I don't want to store people message in a databse. Or we store them encrypted. With no way to decrypt them. (not sure, at all.)
* Https.
