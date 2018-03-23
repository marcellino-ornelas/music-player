"use strict";
/*
 * Node Modules
*/
const 
	express  = require('express'),
	less 		 = require('less-middleware'),
	path 		 = require('path'),
	logger 	 = require('morgan');


const 
	importer 				= require('../lib/importer')(__dirname),
	fileSystem 			= require('../lib/file-system'),
	middleware 			= require('./middleware');

/*
 * Get all Route end points
*/

const views = importer('./views');

/*
 * create Routes
*/
const router = express.Router();


/*
 * local variables
*/
const publicPath = path.join(process.cwd(),'public');

/*
 * apply middleware
*/

// router.use( flash() );
router.use(logger('common'));

router.use( less( process.cwd() + '/less', {	force: true }) );

router.use(
	express.static( publicPath ), 
	express.static( fileSystem.get('dir path') )
)

router.use(middleware.initLocals);
// router.use(['/music'], middleware.ensureXHR);



/*
 * pages
*/

router.get('/', views.index );
router.get('/music', views.music);

/*
 * Errors
*/

router.use( middleware.error._404 );
router.use( middleware.error._505 );

module.exports = router;






