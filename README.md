# ourPlace

> Node.js / angular application as a small but personnal cloud. Under development. 


### What's here already? 

* Music: Upload it, play it, edit it.
* Notes: Because I needed it badly. 
* Usuable from a mobile.
* Nothing more. See the next section for the rest. 

### What's will be here? 


* Accounts: 
This deserve a bit of explaination I suppose. I want to be able to share everything uploaded on the cloud. But not to everyone. So I don't want to allow people to log-on. Just log-in. Only the Admin should be able to send invitations, and only people with invitations should be able to log-in. Then why not allow some members to invite?  
So. An invite system. Token based. With the smallest account managment possible: pseudo/password/profilPicture/id. 
Unique token for the invitation, unique token at each login.

* Music: 
 * youtube links, paste a link and the app will download it and gice it to you gently and quickly.
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

* Build the install system for the couchbase buckets and view. I have not look this out. Tools probably exists already. 
* Tests. I don't do tests. I should. I should use tools for this. I should, but I don't...
* A better front-end. The angular controller start to be huge for nothing. Build factorys, use localstorage for some stuff, recode a lot of the front actually :(
* CSS. I am not good in css. I do not like css. The existing one is... working at least.
* Streaming managment. As the moment a user start to listen a song, I would like to store in the user device the whole playlist (at least the x nexts songs) to allow the user to listen music when network is down. And to retrieve this data even after a reload of the page. 
* Add a bit of social. By that I mean a chat at least. But if a chat it is, it's a chat without keeping data. I don't want to store people message in a databse. Or we store them encrypted. With no way to decrypt them. 
* Https.


# Installation: 
1) Git clone somewhere. 

2) npm install 

3) edit config 

4) Couchbase views: 
* Bucket name: fileForUs
* views :
```
	name: listing
	views: allNames, allNotes, allSongs.

	allNames :
	function (doc, meta) {
		if(doc.name.indexOf('ourNote') === -1)
			emit(meta.id, doc);
	}

	allNotes: 
	function (doc, meta) {
    	if(doc.name.indexOf('ourNote') !== -1)
			emit(meta.id, doc);
	}

	allSongs: (useless, unused...)
	function (doc, meta) {
  		if(doc.type === "audio/mp3")
    		emit(meta.id, doc);
	}
```
5) launch it. 
- directly: node index 
- via forever: forever start index.js 
- via a other tools: rtfm
