/*
 * Music
 *
 * retrieve json object of music from server
*/


exports = module.exports = function(req,res){
	console.log('grabbing music...')
	// console.log('request\n',req);
	// console.log('resquest\n',res);

	res.json(req.app.locals.music);

}