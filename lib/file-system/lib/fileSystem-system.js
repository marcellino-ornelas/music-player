/*
 *
 *
 *
 *
 *
*/

/*
 * node_modules
*/
const fs = require('fs'),
      is = require('is'),
	  path = require('path'),
      each = require('lodash/each'),
      sort = require('lodash/sortBy'),
      mixin = require('merge-descriptors');

const system = exports = module.exports = {};


/*
 * private variables
*/
const
	musicTypes = /^.+(.wma|.mp3|.wav|.ogg)$/,

	videoTypes = /^.+(.mp4)$/,

	picturesTypes = /^.+(.png|.jpg|.jpeg|.gif)$/,

	path_error_message = 'Needs path paramiter',

	title_error_message = 'Needs title paramiter';


/*
 * private functions
*/
const join = path.join,
	  normalize = path.normalize;
	  isArray = is.array;

function isDataType(songName){
	return is.string(songName) && ( system.get('type') === 'music' ? musicTypes.test(songName) : videoTypes.test(songName) );
}

function isPictureType(name){
	return is.string(name) && picturesTypes.test(name);
}

function emptyArray(arr){
	return isArray( arr ) && arr.length === 0;
}
function emptyObject(obj){
	for(var key in obj) if(obj.hasOwnProperty(key)) return false;
	return true
}

function getMediaFileList(path=''){

	path = join( system.get('dir path') , path);

	try{
		return fs.readdirSync( path );

	} catch (err){

		return [];
	}
}

const emptyMediaList = function(_nameOfproperty, _advancePropertyName,constructor){
	/*
	 * @param musicObj {object Music}
	 * @return {Boolean}
	 *
 	 * detects if Media object is empty
	*/
	return function(MediaObject){

		if(!MediaObject || !MediaObject instanceof constructor) throw Error('Must me a object and instance of Media constructor');
		if( MediaObject.hasOwnProperty( _nameOfproperty) && MediaObject[ _nameOfproperty ].length !== 0 ) return false;
		if( MediaObject.hasOwnProperty(_advancePropertyName) && !emptyObject(MediaObject[_advancePropertyName]) ) return false;

		return true;

	}

};

const addNextAndPreToMedia = function(media, type){
	let pre = false,
		mediaKeys = Object.keys(media);

	for(let now, name, i = 0; i < mediaKeys.length; i++){

		[name , now] = [ mediaKeys[i], media[ mediaKeys[i] ] ];

		if( pre ) media[pre].setNext( name );

		now.setPre( pre );

		pre = name;

		if( now.hasOwnProperty( type ) ) addNextAndPreToMedia( now[type], type);
	}

	media.first = mediaKeys[0];
	media.last = mediaKeys[ mediaKeys.length - 1];

	return media;
}


const
	emptyVideoList = emptyMediaList('videos', 'extras', Video),
	emptyMusicList = emptyMediaList('songs', 'albums', Music);




/*
 * Media constructor
 * @param path { String } path to folder containing items
 * @param title { title }
 * @param name { String}
 *
 *
 *
 * @return {object Media}
 *
 * Create a Media object for everyfolder that has music or video inside of it
 * if it detects that there multiple ablums inside folders then will merge into
 * main mediaExtra point.
 * @returns {object Object}
*/
function Media( path, title, name,  _nameOfproperty , _advanceInnerName, _advancePropertyName ){
	if( !title ) throw Error( title_error_message );
	if( !path || !is.string( path )) throw Error(path_error_message);

	let constructor = system.get('type') === 'music' ? Music : Video,
						check = system.get('type') === 'music' ? emptyMusicList : emptyVideoList;

	this.path = path;
	this[title] = name;

	let self = this,
		mediaPlaylist = [],
		mediaExtras = {},
		fileMediaContent = getMediaFileList(path);

	if( emptyArray(fileMediaContent) ) return false;

	each( fileMediaContent , (val, i) => {
		let holder , newPath;

		if( system.get('picture') && self.picture === undefined && isPictureType(val)){
			self.picture = val;
			return;
		}

		if( isDataType(val) ) return mediaPlaylist.push(val);

		newPath  = join( self.path, val );

		holder = new constructor(newPath, _advanceInnerName , val);

		if( !check( holder ) ) {

			mediaExtras[val] = holder;

			if(mediaExtras[val].hasOwnProperty(_advancePropertyName) ){

				mixin(mediaExtras, mediaExtras[val][_advancePropertyName] , false);
				delete mediaExtras[val][ _advancePropertyName ];

			}

			if( check(mediaExtras[val]) ) delete mediaExtras[val];

		}

	});


	if( !emptyObject(mediaExtras) ){

		this[_advancePropertyName] = mediaExtras
	}

	if( !emptyArray( mediaPlaylist ) ) this[ _nameOfproperty ] = sort(mediaPlaylist, function(val){ return val.toUpperCase(); });

}
Media.prototype.setNext = function(value){
	this.next = value ;
}

Media.prototype.setPre = function(value){
	this.pre = value;
}

/*
 * Music constructor
 * @param path { String } path to folder containing items
 * @param title { title }
 * @param name { String}
 * @return {object Music}
 *
* Creates a instance of Media object
*/
function Music( path, title, name){	Media.call(this, path, title, name, 'songs', 'albumName', 'albums'); }

Music.prototype = Object.create(Media.prototype);
Music.prototype.constructor = Music;
/*
 * Video constructor
 * @param path { String } path to folder containing items
 * @param title { title }
 * @param name { String}
 * @return {object Video}
 *
 * Creates a instance of Media object
*/
function Video(path, title, name){	Media.call(this, path, title, name,'videos', 'videoName','extras'); }

Video.prototype = Object.create(Media.prototype);
Video.prototype.constructor = Video;


/*
 * System propertys
 *
*/
system.set = function(property, value){
	/*
	* @param property {String} name of property
	* @param value {String} value
	* @return {object}
	*
	* set a propety of system to equal value;
	* use to change default setting of system
	*/
	// if(!this.hasOwnProperty(property)) throw new Error('property not found on system settings');

	this[ property ] = value;
	return this;
}

system.get = function(property){
	/*
	* @param property {String}  propterty to fetch
	* @return {String}
	*
	* get a property in system
	* if not there return a empty string
	*/
	if(!this.hasOwnProperty(property)) throw new Error('property not found on system settings')

	return this[property];
}

system.createMediaList =
system.createVideoList =
system.createMusicList = function(title){
	let media  = {},
		unknownMedia = [],
		type = this.get('type'),
		isMusic = ( type === 'music'),
		check = isMusic ? emptyMusicList : emptyVideoList;
		constructor = ( isMusic ) ? Music : Video,
		fileNames = getMediaFileList( type );

	title = title ? title : (isMusic ? 'artist' : 'type' );

	for(let holder, path, name, i = 0; i < fileNames.length; i++){
		name = fileNames[i];
		path = join( this.get('_overRideFileName_') || type , name );

		if(isDataType( name )){
			return unknownMedia.push(name);
		}


		holder = new constructor(path, title, name);

		if( !check( holder ) ) media[ name ] = holder;

	}
	let inner_name = isMusic ? 'albums' : 'extras';

	if( !emptyArray( unknownMedia ) ){
		media.unknownMedia = Object.create( constructor.prototype );
		media.unknownMedia[title] =  'unknownMedia';
		media.unknownMedia.path = this.get('type');
		media.unknownMedia[ isMusic ? 'songs' : 'videos'] = unknownMedia;
	}
	addNextAndPreToMedia( media, inner_name );

	return media;
}

/*
 * Default settings for the system to use
 *
*/
system.set('dir path', normalize(`${__dirname}/public/` ) );
system.set('type', 'music');
system.set('_overRideFileName_', false);
system.set('picture', false);


