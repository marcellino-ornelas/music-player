/*
 *  node_modules
*/
const 
	path 			= require('path')
	express 	= require('express')
	logger 		= require('morgan');
	

// const publicPath = path.resolve(process.cwd(),'public');
// const options = { maxAge: 9000000000};

const apply_scripts = {
	css:[
		"css/packages/normalize.css",
		"css/packages/css-reset.css",
		"css/main.css",
		"css/font-awesome.css"
	],
	js:[
		"js/jquery/jquery.js",
		"js/progressbar.js",
		'js/moment.js',
		'js/underscore-min.js',
		'js/lunr.js',
		"js/player.js",
	],
}

/*
 * middleware
*/

exports.initLocals = function(req,res,next){
	
	res.locals.apply_scripts = apply_scripts;
	res.locals.files = req.app.locals.music;
	res.locals.page  = req.baseUrl;
	// res.locals.error = req.flash('error');
	// res.locals.infos = req.flash('info');

	next();
}

/*
 * Ensure XHR Request
 *
 * Make sure request is coming from a XHR Http Request 
*/

exports.ensureXHR = function(req,res,next){

	next( !req.xhr && 'route' );
}

/*
 * Errors
 *
 * Server all errors including
 * 	- 404
 *	- 505
*/
exports.error = {};

exports.error._404 = function(req,res){
	res.status(404).render('404');
}

exports.error._505 = function(error,req,res){
	res.status(505).render('505');
}

