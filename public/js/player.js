"use strict";
const player = {};
$(function(){
	
	/*
	 * Private Variables
	*/
	const vendors = ['ms', 'moz', 'webkit', 'o'];

	/* DOM element*/
	const 
	 	time_remaining = document.getElementById('time-remaining'),
		albums 				 = document.getElementById('gravity-album-slider'),
		mobileNavBars	 = document.getElementById('mobileNavBars'),
		searchButton	 = document.getElementById('searchButton'),
		searchInput		 = document.getElementById('searchInput'),
		canvas				 = document.getElementById('visualizer') || undefined,
		bCtx 					 = canvas && canvas.getContext('2d'),
		controls 			 = document.getElementById('gravity-controls').children[0];


		
	const	newSelection = $.Callbacks();

	/* jQuery elements */
	const 
	 	$song_title	 = $('#song-title', controls),
		$sideBar 	= $('aside'),
		$body 		= $('body'),
		$main 		= $('#main'),
		$albums 	= $(albums),
		navdepend = $sideBar.add($body).add($main),
		$searchResults  = $('#results');

	/* 
	 * normalize requestAnimationFrame and cancelAnimationFrame 
	*/
	(function() {var lastTime = 0; for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame']; window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame']; } if (!window.requestAnimationFrame) window.requestAnimationFrame = function(callback, element) {var currTime = new Date().getTime(); var timeToCall = Math.max(0, 16 - (currTime - lastTime)); var id = window.setTimeout(function() {callback(currTime + timeToCall); }, timeToCall); lastTime = currTime + timeToCall; return id; }; if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function(id) {clearTimeout(id); }; }());
	window.AudioContext = (window.AudioContext || window.webkitAudioContext);
	/* 
	 * normalize addEventListener
	*/
	(function() {if (!Event.prototype.preventDefault) {Event.prototype.preventDefault=function() {this.returnValue=false; }; } if (!Event.prototype.stopPropagation) {Event.prototype.stopPropagation=function() {this.cancelBubble=true; }; } if (!Element.prototype.addEventListener) {var eventListeners=[]; var addEventListener=function(type,listener /*, useCapture (will be ignored) */) {var self=this; var wrapper=function(e) {e.target=e.srcElement; e.currentTarget=self; if (typeof listener.handleEvent != 'undefined') {listener.handleEvent(e); } else {listener.call(self,e); } }; if (type=="DOMContentLoaded") {var wrapper2=function(e) {if (document.readyState=="complete") {wrapper(e); } }; document.attachEvent("onreadystatechange",wrapper2); eventListeners.push({object:this,type:type,listener:listener,wrapper:wrapper2}); if (document.readyState=="complete") {var e=new Event(); e.srcElement=window; wrapper2(e); } } else {this.attachEvent("on"+type,wrapper); eventListeners.push({object:this,type:type,listener:listener,wrapper:wrapper}); } }; var removeEventListener=function(type,listener /*, useCapture (will be ignored) */) {var counter=0; while (counter<eventListeners.length) {var eventListener=eventListeners[counter]; if (eventListener.object==this && eventListener.type==type && eventListener.listener==listener) {if (type=="DOMContentLoaded") {this.detachEvent("onreadystatechange",eventListener.wrapper); } else {this.detachEvent("on"+type,eventListener.wrapper); } eventListeners.splice(counter, 1); break; } ++counter; } }; Element.prototype.addEventListener=addEventListener; Element.prototype.removeEventListener=removeEventListener; if (HTMLDocument) {HTMLDocument.prototype.addEventListener=addEventListener; HTMLDocument.prototype.removeEventListener=removeEventListener; } if (Window) {Window.prototype.addEventListener=addEventListener; Window.prototype.removeEventListener=removeEventListener; } } })();
	
	/*
	 * make media player
	*/

	player.audio = new Audio();

	
	/*
	 * Search logic
	*/
	player.lunr = {
		idx: lunr(function(){
			this.ref('_id');

			this.field('artist');
			this.field('name');
		}),

		db: {},
		get:function(ref){
			return this.db.hasOwnProperty(ref) ? this.db[ref] : false;
		}
	}

	function indexMedia(){

		const passed = function(key){ return key !== 'first' && key !== 'last'; }
		let id = 1;

		function add(media,parent){
			for(let prop in media){
				
				if( !passed(prop) && !media.hasOwnProperty(prop) ) continue;

				let currArt = media[prop];

				if( currArt.hasOwnProperty('albums') ) add(currArt.albums, prop);

				if(Array.isArray(currArt.songs) && currArt.songs.length > 0){
					let load = {
						_id: id++,
						artist: parent || currArt.artist,
						name: currArt.albumName || ''
					}
					player.lunr.db[load._id] = load;
					player.lunr.idx.add(load);
				}
			}
		}

		add(player._media);

	}

	/*
		* Progress Bar
	*/

	player.progressBar = new ProgressBar.Line( document.getElementById('gravity-progressbar'),{
		color: "rgb(166,226,108)",
		trailColor:"#383fc0",
    warnings:true,
    svgStyle:{
    	width:'100%',
    	height: '15px'
    }
	});

	
	/*
	 * get data and add helper function to jQuery
	*/
	// player._media = JSON.stringify(window._media)


	//save
	$.getJSON('/music').success( data => { 
		player._media = data;

		indexMedia();

	});



	$.fn.extend({
		isEmpty: function(){ return this.length === 0 }
	});

	/*
	 * Private Functions
	 *
	 * These Functions are for media player and media display only
	*/


	const add_song_title = function(){
		$song_title.text(player.nowPlaying)
	}

	const togglePlay = (function(){
		const play_pause = $('#play,#pause');
		let playOn = false;
		return function(value){
			if(value !== false){
				if(!playOn){
					play_pause.toggle();
					playOn = true;
				}
				return;
			} 
				play_pause.toggle();
				playOn = false;
		}

	}());

	const equal = (a,b) => a === b;

	const control_actions = function(e){
		/* function for event click on controls */
		var element = e.target;
		var action = element.parentElement.id

		if( equal(element.nodeName,'I') ) return controller[action]();
	}

	const asDurationIncreases = function(){
		
		player.set('duration', moment.duration(player.audio.currentTime, 'seconds') );
		postDuration();
	}

	const fix = function(time){ return time < 10 ? ('0'+time) : time }

	const postDuration = function(){
		time_remaining.innerHTML = player.duration.minutes() + ':' + fix(player.duration.seconds()) ;
	}

	const getSection = function( _savedProperty ){
		/*
		 * @param _savedProperty { String }
		 * 
		 * this function is used for player to get next or previous in playlist
		 * NOTE: "this" in this function will equal player 
		*/
		const tag = _savedProperty === 'next' ? 'first' : 'last';
		return function( event ){
			/*
			 * @param event {Object} javascript event object
			 * @return player {Object} 
			*/
			let isEndOrStart = this.islastSong() || this.isBegSong(),
				isEndButPre = this.islastSong() && equal(_savedProperty,'pre'),
				isBegButForward = this.isBegSong() && equal(_savedProperty,'next'),
				onAlbum = this.onAlbum();

				if(!isEndOrStart || isEndButPre || isBegButForward ){
					
					if( this.getCurrent().songs.length !== 1) return this[_savedProperty + 'Song']();
				}

			let name = this.album[ _savedProperty ];
			let isNext = equal( _savedProperty ,'next') ? true : false;

			switch( true ){

				case !!(onAlbum && name) :

					this.set('album', this.current.albums[ name ] );
					break;

				case !!( !onAlbum && isNext && this.current.hasOwnProperty('albums') ):

					this.set('album', this.current.albums[ this.current.albums[tag] ]);
					break;

				case !!( onAlbum && !isNext && this.current.songs):

					this.set('album', false);
					break;

				case !!( onAlbum && isNext && !name ):
				case !!( !onAlbum && isNext && !this.current.albums ):
				case !!( !onAlbum && !isNext ):
				case !!( onAlbum && !isNext && !this.current.songs):
					
					if( this.current.hasOwnProperty(_savedProperty) ){
						this.set('current', this._media[ this.current[ _savedProperty ]] );
					} else {
						this.set('current', this._media[ this._media[tag] ]);
					}


					let albums = this.current.albums;
					let album_holder = ( albums && !isNext) || ( albums && isNext && !this.current.songs) ? albums[albums[tag]] : false;

					this.set('album', album_holder);

					/*
					 * used to display new song list when need to be changed
					*/

					break;

			}

			let specified_index = isNext ? 0 : this.getCurrent().songs.length - 1;

			return this
						.set('new',true)
						.set('index', specified_index )
						.set('nowPlaying', this.getCurrent().songs[ this.index ]);
		}
	}

	function cancelAnimation(){
		if(player.animationId){
				window.cancelAnimationFrame(player.animationId);
				player.animationId = false;
			}
	}

	/*
	 * Player Object
	*/

	player.set = function( prop, value=false){
		this[prop] = value;
		return this;
	}

	$.each(["nowPlaying", "album", "index", 'current', 'duration'], ( index ,val ) => { player.set( val, false )} );

	player.canUseAnimation = true;

	player.next = getSection('next').bind(player);
	player.back = getSection('pre').bind(player);


	player.getNew = function(event){
		// let $self = $(event.target),
		// 	name = $self.text(),
		// 	$album = $self.parent().prev(),
		// 	holder = ( !$album.isEmpty() && $album.get(0).nodeName === 'H2') ? this.current.albums[ $album.text() ] : false;

		// this.set('album', holder)
		// 	.set("nowPlaying", name )
		// 	.set('index', this.getCurrent().songs.indexOf( name ) );
	};
	
	player.setMediaSection =  function(event){

		if(event.target.id === 'gravity-album-slider') return void 0;

		var $selected = $(event.target);

		while( !$selected.is('.gravity-slider-item') ) $selected = $selected.parent();

		player.set('current', this._media[ $selected.attr('data-artist') ]);
		
		var album = $selected.attr('data-album-name') ? this.current.albums[ $selected.attr('data-album-name') ] : false;

		this
			.set('new',true)
			.set('index', 0 )
			.set('album', album)
			.set("nowPlaying", this.getCurrent().songs[ this.index ] );
	}

	player.stopAnimation = function(){
		player.canUseAnimation = false;
		cancelAnimation();
	}

	player.getCurrent = function(){ return this.onAlbum() ? this.album : this.current };

	player.play = function(){
		if( !player.nowPlaying || (!player.audio.paused && !player.new) ) return void 0;

		togglePlay();

		if(player.new){

			let path = player.getCurrent().path + '/' + player.nowPlaying;
			player.audio.src = encodeURIComponent(path);

			player.audio.load && player.audio.load();

			add_song_title();
			player.progressBar.set(0);

			player.set('new', false).set('duration', moment.duration(0, 'seconds') );
			
		}

		player.audio.play();

		if(player.canUseAnimation){

			cancelAnimation();
						
			audioVisualizer();
		}
	
	}

	player.pause = function(){
		if(player.audio.paused) return void 0;

		player.audio.pause(); 
		player.progressBar.stop();
		togglePlay(false);
	}

	player.onAlbum = function(){ return this.album ? true : false };

	player.islastSong = function(){ return this.getCurrent().songs.length - 1 === this.index };

	player.isBegSong = function(){ return this.index === 0  };

	player.nextSong = function(){ return this.set('new',true).set('nowPlaying', this.getCurrent().songs[ ++this.index ]) };

	player.preSong = function(){ return this.set('new',true).set('nowPlaying', this.getCurrent().songs[ --this.index ]) };

	/*
	 * Controller
	*/
	const _audio = player.audio;

	const controller = {
		play: function(){
			if(player.audio.paused && player.nowPlaying !== false ){
				player.play();

			}
		},
		pause: function(){
			if(player.audio.played){
				player.pause();
			}
		},
		forward: function(){
			player.next().play();
		},
		backward: function(){
			player.back().play();
		},
		"volume-up": false,
		"volume-off": function(){
			player.audio.volume = 0;
		},
		"volume-down": false,


	}


	newSelection.add( player.setMediaSection ).add( player.play );

	/*
 	 * Audio Visualizer 
	*/
	var audioVisualizer = function(){};

	if( window.AudioContext && bCtx && window.requestAnimationFrame ){
		(function(){
			const audioCtx = new window.AudioContext();
		  const analyser = audioCtx.createAnalyser();
		  const dataArray = new Uint8Array( analyser.frequencyBinCount );
		  // const data = new Float32Array(analyser.frequencyBinCount);
		  const source = audioCtx.createMediaElementSource(player.audio);
		 	const CANVAS_BAR_WIDTH = 9;
		 	const bars = 30;
		 	const grd = bCtx.createLinearGradient && bCtx.createLinearGradient(0, canvas.height, 0, 0);
		  
		 	source.connect(analyser);
		 	analyser.connect(audioCtx.destination);
		  	
		
		  grd.addColorStop(0, 'rgba(31, 244, 31, 0.6)');  
		  grd.addColorStop(.75, 'rgba(233, 21, 31, 0.8)');
		
		  bCtx.fillStyle = grd;

		 	audioVisualizer = function animate(){ 

		    player.animationId = window.requestAnimationFrame(animate);

		    analyser.getByteFrequencyData(dataArray);
		    // analyser.getFloatFrequencyData(data);

		    
		    	// console.log('byte', dataArray, '\n');
		    	// console.log('Float', data, '\n');
		    

		    bCtx.clearRect(0, 0, canvas.width, canvas.height);

		    for (let i = 0; i < bars; i++) {
		      let bar_x = i * 10;
		      let bar_height = -(dataArray[i] / 2);
		      bCtx.fillRect(bar_x, canvas.height, CANVAS_BAR_WIDTH, bar_height);
		    }
	  	}
	  }())
	} else {
		console.log('animation is not supported inside your currrent browser')
	}
	/*
	 * Search Filter
	*/
	const template = _.template('<li> <%- search.value %> </li>',{variable:'search'});

	function filterSearch(event){

		if(searchInput.value === '') return $albums.children().show();

		let related = player.lunr.idx.search(searchInput.value);

		if(related){
			
			$albums.children().hide();

			related.forEach(function(rel){
				let data = player.lunr.get(rel.ref);

				let artist = "[data-artist='" + data.artist + "']";
				let album  = data.name !== '' ? "[data-album-name='" + data.name + "']" : ''; 

				$albums.children(artist + album).show();

			});

			// clear input box && search results
			searchInput.value = '';
			$searchResults.empty();
		}
	}

	function autoComplete(event){
		if(searchInput.value === '') $searchResults.empty();

		let related = player.lunr.idx.search(searchInput.value);

		if(related.length === 0) return $searchResults.empty();

		let length = related.length > 5 ? 5 : related.length;

		var data = _.map( new Uint8Array(length), function(val,index){
			let d = player.lunr.get(related[index].ref);
			return template({value: (d.name || d.artist) });
		}).join('\n');

		$searchResults.html(data);
	}

	function add_result(event){
		if(event.target.nodeName !== 'LI') return void 0;

		let $target = $(event.target, $searchResults);

		searchInput.value = $target.text();

		// clear search results 
		$searchResults.empty();

	}

	/*
	 * Side Bar
	 *
	 * Display side bar clicked on bars in mobile
	*/

	function useMobileNav(event){
	
		if(event)	event.stopPropagation();

		$sideBar.toggle();
		navdepend.attr('mobile-nav', $sideBar.is(':visible') );

	}

	function exit_sidenav(){ if( $sideBar.is(':visible') ) useMobileNav(); }

	/*
	 * EVENT LISTENERS
	*/

	// if(/iP(hone|od|ad)/.test(navigator.platform)) document.write('hey')

	const EVENT = /iP(hone|od|ad)/.test(navigator.platform) ? 'touchstart' : 'click';

	$searchResults[0].addEventListener( EVENT ,add_result,false);
	searchButton.addEventListener( EVENT , filterSearch, false);

	searchInput.addEventListener('keyup',autoComplete,false)

	$main.on( EVENT, exit_sidenav);
	mobileNavBars.addEventListener( EVENT , useMobileNav, false);

	
	player.audio.addEventListener('timeupdate', asDurationIncreases ,false);
	player.audio.addEventListener('durationchange', function(){

		player.progressBar.animate(1,{
			duration: Math.abs(player.audio.duration - player.audio.currentTime) * 1000
		});

	} , false)

	player.audio.addEventListener('ended', controller.forward, false);

	controls.addEventListener( EVENT , control_actions ,false);
	albums.addEventListener( EVENT , newSelection.fire.bind(player) , true);


	// ios
	// $searchResults[0].addEventListener('touchend',add_result,false);
	// searchButton.addEventListener('touchend', filterSearch, false);
	// controls.addEventListener('touchend', control_actions ,false);
	// albums.addEventListener('touchend', newSelection.fire.bind(player) , true);
	// mobileNavBars.addEventListener('touchend', useMobileNav, false);

});