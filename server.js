"use strict";
/*
 *  node_modules
*/
const 
	express = require('express'),
	fs 			= require("fs"),
	path 		= require('path'),
	http 		= require('http'),
	jade 		= require('jade');

/*
 * start app
*/
const app = express(); 

/******************
***  my modules ***
******************/


/*
 * Set up file system 
*/
const fileSystem = require('./lib/file-system');

// set options for filesystem
fileSystem
	.set('dir path', path.normalize( "/Users/student/Desktop/media/") )
	.set('picture', true);

app.locals.music = fileSystem.createMusicList();



/*
 * Router
*/
const routes = require('./routes');

/*
 * my helpers
*/


/*
 * set helpers
*/
app
	.set('port', process.env.PORT || 3002)
	.set('views', path.resolve(__dirname,'templates/views'))
	.set('view engine', 'jade')
	.engine('jade', jade.__express);

app.use(routes);

http.createServer(app).listen(app.get('port'),(err) => {
	if (err){ throw err; }
	console.log('server running on port ' + app.get('port'));
});


