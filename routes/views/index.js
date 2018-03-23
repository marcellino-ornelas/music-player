
exports = module.exports = function(req,res){

	const locals = res.locals;

	locals.files = req.app.locals.music;
	locals.page = 'Listen';

	res.render('index');
}