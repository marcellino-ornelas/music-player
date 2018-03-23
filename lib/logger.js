/*
 * logger.js
*/
const isStream = require('is-stream');

class logger extends console.Console{
	constructor(stdout,stderr,opts){
		
		switch( arguments.length){
			case 0:
				stdout = process.stdout;
				stderr = process.stderr;
				opts = {};
				break;
			case 1:
				// change
				opts = stout;
				stdout = process.stdout;
				stderr = process.stderr;
				break;
			case 2:
				opts = stderr;
				stderr = process.stderr;
				break;
		}

		// create warnings
		if( isStream.writable(stdout) ) stdout = process.stdout;
		if( isStream.writable(stderr) ) stderr = process.stderr;

	}
}

var log = new logger();
var log = new logger({});
var log = new logger( process.stdout);
var log = new logger(process.stdout,{});
var log = new logger( process.stdout, process.stderr)
var log = new logger( process.stdout, process.stderr, {})


log.log(['hey','out','down'],'\n');
// hey
// out
// down

// ['hey','out','down']


