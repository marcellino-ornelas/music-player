const path = require('path');
const fs = require('fs');
const is = require('is');

const isJsfile = RegExp.prototype.test.bind(/^.+(.js)$/);

exports = module.exports = function(dirname){

	if(!dirname) throw new Error('Need the directory of your current page');

	return function(dir_path){

		if(is.string(dir_path) && !dir_path) throw new Error('Need a path string as a parameter.. got' + typeof path);
		
		dir_path = path.join(dirname, dir_path);

		if(!path.isAbsolute(dir_path)) return new Error('Path was not a absolute path');


		let routes = {};


		// read path contents
		var fileNames = fs.readdirSync(dir_path);

		if( is.empty(fileNames) ) throw new Error('Directory: "' + dir_path + '"  was empty');

		for(let i = 0; i < fileNames.length; i++) {
			let filename = fileNames[i];
			
			// move on if not a js file
			if( !isJsfile( filename ) ) continue;

			let full_path = path.join(dir_path, filename );
			let name = path.basename(full_path, '.js');

			let contents = require(full_path);

			if( !is.empty(contents) ) routes[name] = contents;
		}

		return routes
	}

}