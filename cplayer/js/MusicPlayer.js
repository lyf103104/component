(function() {
	this.MusicPlayer = function MusicPlayer(options) {
		if (!options || typeof options !== 'object' || options instanceof Array) {
			return console.error('arguments not object');
		}
		if (!options.container || !options.music || !(options.music instanceof Array)) {
			return console.error('object arguments undefined');
		}
		/**
		 * @param       {Object}  Musicplayer config object
		 * cotainer     {String}  播放器容器Id,
		 * music        {Object}  音频配置对象
		 * music.name   {String}  歌曲名字
		 * music.author {String}  歌曲作者
		 * music.src    {String}  歌曲的链接地址
		 * music.lrc    {String}  歌词的链接地址, ps: 必须是lrc格式
		 * [mode]       {Number}  播放模式, 1 -> 顺序播放, 2 -> 随机播放, 3 -> 单曲循环, 默认为1
		 * [autoplay]   {Boolean} 是否自动播放, 默认为false
		 * @return      {Object}
		 */
		this.options = MusicPlayer.extend({
			mode: 1,
			autoplay: false
		}, options);

		this.currentIndex = 0;
		this.firstPlay    = false;
		this.timer        = null;
		this.dom = document.querySelector(this.options.container);
		this.initMusic();
	};

	MusicPlayer.prototype.initMusic = function() {
		this.audio = new Audio(this.options.music[0].src);
		this.audio.mode     = this.options.mode;
		this.audio.autoplay = this.options.autoplay;

		this.audio.volume = 1.0;

		this.createElement();
		this.audioBindEvents(this.audio);
	};

	MusicPlayer.prototype.createElement = function() {
		var temp =  '<div class="lrc-container"><div class="lrc-wrap"><div class="lrc-loading">歌词加载中..</div></div></div>' +
					'<div id="process" class="process relative">' +
						'<div class="current-time">00:00</div>' +
						'<div class="process-wrap">' +
							'<div class="process-bar">' +
								'<div class="rdy"></div>' +
								'<div class="cur">' +
									'<span id="processBtn" class="process-btn c-btn"></span>' +
								'</div>' +
							'</div>' +
						'</div>' +
						'<div class="total-time">00:00</div>' +
					'</div>' +
					'<div class="play-control">' +
						'<div class="mode fl relative">'+
							'<div class="mode-wrap">' +
								'<div data-mode="1" class="mode-1"></div>' +
								'<div data-mode="2" class="hide mode-2"></div>' +
								'<div data-mode="3" class="hide mode-3"></div>' +
							'</div>' +
						'</div>' +
						'<div class="switch">' +
							'<div class="prev-btn"></div>' +
							'<div class="switch-wrap">' +
								'<div class="icon-btn play-btn"></div>' +
								'<div class="hide icon-btn pause-btn"></div>' +
							'</div>' +
							'<div class="next-btn"></div>' +
						'</div>' +
						'<div class="list fr relative">' +
							'<div class="list-btn"></div>' +
						'</div>' +
					'</div>' +
					'<div class="songlist">' +
						'<div class="songwrap">' +
							'<div class="song-title">歌曲列表<span class="song-close"></span></div>' +
							'<ul class="song-ul"></ul>' +
						'</div>' +
					'</div>' +
					'<div class="bg"></div>';
		this.dom.innerHTML = temp;
		this.initPlayMode();
	};

	MusicPlayer.prototype.initPlayMode = function() {
		var modeDom   = this.find('mode-wrap'),
			modeItem  = modeDom.getElementsByTagName('div');
		for (var i = modeItem.length - 1; i >= 0; i--) {
			modeItem[i].style.display = 'none';
		}
		modeItem[this.options.mode-1].style.display = 'block';
	};

	MusicPlayer.prototype.audioBindEvents = function(audio) {
		var self = this,
			progressBar  = self.find('cur'),
			lrcContainer = self.find('lrc-container'),
			lrcWrap      = self.find('lrc-wrap'),
			curtTimeDom  = self.find('current-time'),
			totalTime    = self.find('total-time'),
			nextDom      = self.find('next-btn'),
			lrcItem      = lrcWrap.getElementsByTagName('p'),
			basic        = 0,
			newEvents = [],
			events = [
				['loadedmetadata', loadedMetaData],
				['play', play],
				// ['timeupdate', timeupDate],
				['ended', ended]
			];

		for (var i = events.length - 1; i >= 0; i--) {
			newEvents.push({
				target: audio,
				eventName: events[i][0],
				handler: events[i][1]
			});
		}

		MusicPlayer.bindEventModel(newEvents);

		function loadedMetaData() {
			totalTime.innerText = MusicPlayer.transTime(this.duration);
			self.duration = this.duration;
			if (!self.firstPlay) {
				self.getMusicLrc(0);
				self.createSongList();
				self.controllerBindEvents();
			}
		}

		function play() {
			if (!self.firstPlay) {
				self.setSongLi(self.currentIndex);
				self.firstPlay = true;
			}
			self.timer && clearInterval(self.timer);
			lrcWrap.style.transform = 'translateY(0px)';
			lrcWrap.style.transform = '-webkit-translateY(0px)';

			var lrcItemH = lrcItem[0].offsetHeight,
				lrcboxH  = lrcContainer.offsetHeight/2;

			self.timer = setInterval(function(){timeupDate(lrcItemH, lrcboxH)}, 1e3);
		}

		function ended() {
			self.playModel(nextDom);
			progressBar.style.width = 0;
		}

		function timeupDate(lrcItemH, lrcboxH) {
			var music = self.audio,
				lyric = self.lyric,
				currentTime  = Math.round(music.currentTime),
				curtPrcent   = currentTime / self.duration * 100,
				lrcContainer = self.find('lrc-container'),
				line         = lyric[currentTime],
				lrcLength    = lrcItem.length;

			progressBar.style.width = curtPrcent+'%';
			curtTimeDom.innerText = MusicPlayer.transTime(currentTime);

			if (line) {
				for (var i = lrcLength - 1; i >= 0; i--) {lrcItem[i].style.color = '#fff';}
				lrcItem[line].style.color = '#ff0000';

				if (line*lrcItemH > lrcboxH) {
					basic++;
					lrcWrap.style.transform = 'translateY(' + -basic*lrcItemH + 'px)';
					lrcWrap.style.transform = '-webkit-translateY(' + -basic*lrcItemH + 'px)';
				}
			}
		}
	};

	MusicPlayer.prototype.controllerBindEvents = function() {
		var self      = this,
			bgCover   = this.find('bg'),
			switchDom = this.find('switch-wrap'),
			lrcWrap   = this.find('lrc-wrap'),
			modeDom   = this.find('mode-wrap'),
			openSong  = this.find('list-btn'),
			songList  = this.find('songlist'),
			closeSong = this.find('song-close'),
			nextDom   = this.find('next-btn'),
			prevDom   = this.find('prev-btn'),
			playDom   = switchDom.getElementsByClassName('play-btn')[0],
			pauseDom  = switchDom.getElementsByClassName('pause-btn')[0],
			modeItem  = modeDom.getElementsByTagName('div'),
			songItem  = songList.getElementsByClassName('song-item'),
			events    = [{
				target: playDom,
				eventName: 'click',
				handler: cplay
			}, {
				target: pauseDom,
				eventName: 'click',
				handler: cpause
			}, {
				target: openSong,
				eventName: 'click',
				handler: openSongList
			}, {
				target: closeSong,
				eventName: 'click',
				handler: closeSongList
			}, {
				target: prevDom,
				eventName: 'click',
				handler: songPlayhandler
			}, {
				target: nextDom,
				eventName: 'click',
				handler: songPlayhandler
			}];

		MusicPlayer.bindEventModel(events);
		forBindEvent(songItem, getMusicIndex);
		forBindEvent(modeItem, modeToggle);

		function cplay() {self.play();}
		function cpause() {self.pause();}

		function modeToggle() {
			var mode = this.getAttribute('data-mode');

			this.style.display = 'none';
			if (mode == 3) {
				mode = 0;
				this.previousSibling.previousSibling.style.display = 'block';
			} else {
				this.nextSibling.style.display = 'block';
			}
			self.options.mode = +mode+1;
		}

		function openSongList() {
			songListhandler(0, '100vh', 360, ['3px', '100%']);
		}
		function closeSongList() {
			songListhandler(0.7, 0, 0, ['1px', '80%']);
		}
		function songListhandler(opacity, height, rotate, filter) {
			lrcWrap.style.opacity                = opacity;
			songList.style.height                = height;
			closeSong.style.transform            = 'rotate('+rotate+'deg)';
			closeSong.style['-webkit-transform'] = 'rotate('+rotate+'deg)';
			bgCover.style.filter                 = 'blur('+filter[0]+') brightness('+filter[1]+')';
			bgCover.style['-webkit-filter']      = 'blur('+filter[0]+') brightness('+filter[1]+')';
		}

		function songPlayhandler() {self.playModel(this);}

		function getMusicIndex() {
			self.setMusic(this.getAttribute('data-index'));
		}

		function forBindEvent(items, callback) {
			for (var i = items.length - 1; i >= 0; i--) {
				items[i].addEventListener('click', callback, false);
			}
		}
	};

	MusicPlayer.prototype.buffProgressBar = function() {
		var self      = this,
			music     = self.audio,
			duration  = self.duration,
			buffDom   = self.find('rdy'),
			buffTimer = setInterval(function() {
			var len      = music.buffered.length,
				buff     = music.buffered.end(len - 1),
				percent  = (buff / duration * 100).toFixed();

			buffDom.style.width = percent + '%';
			if (percent == 100) clearInterval(buffTimer);
		}, 1e3);
	};

	MusicPlayer.prototype.play = function() {
		var playDom = this.find('play-btn');
		this.audio.play();
		playDom.style.display = 'none';
		playDom.nextSibling.style.display = 'block';
	};

	MusicPlayer.prototype.pause = function() {
		var pauseDom = this.find('pause-btn');
		this.audio.pause();
		pauseDom.style.display = 'none';
		pauseDom.previousSibling.style.display = 'block';
	};

	MusicPlayer.prototype.playModel = function() {
		// 播放模式, 1 -> 顺序播放, 2 -> 随机播放, 3 -> 单曲循环
		var mode   = this.options.mode,
			music  = this.options.music;

		switch (mode) {
			case 1:
				var idx = arguments[0].className == 'prev-btn' ? this.currentIndex - 1 : this.currentIndex + 1;
				if (idx == -1) {
					idx = music.length - 1;
				} else if (idx == music.length) {
					idx = 0;
				}
				this.setMusic(idx);
				break;
			case 2:
				this.setMusic(Math.floor(MusicPlayer.rand(0, music.length)));
				break;
			case 3:
				this.setMusic(this.currentIndex);
				break;
		}
	};

	MusicPlayer.prototype.setMusic = function(idx) {
		idx = parseInt(idx);
		this.currentIndex = idx;
		this.audio.src    = this.options.music[idx]['src'];
		this.play();
		this.getMusicLrc(idx);
		this.setSongLi(idx);
	};

	MusicPlayer.prototype.createSongList = function() {
		var html = '';
		var songList = this.options.music;
		for (var i = 0; i < songList.length; i++) {
			var item = songList[i];
			html += '<li class="song-item" data-index="' + i + '">' +
						'<span class="name fl">' + item.name +'</span>' +
						'<span class="author fr">' + item.author + '</span>' +
					'</li>';
		}
		this.find('song-ul').innerHTML = html;
	};

	MusicPlayer.prototype.setSongLi = function(index) {
		var songItem = this.dom.getElementsByClassName('song-item');
		for (var i = songItem.length - 1; i >= 0; i--) {
			songItem[i].style.color = '#fff';
		}
		songItem[index].style.color = '#da5d5d';
	};

	MusicPlayer.prototype.getMusicLrc = function(index) {
		var self = this,
			_url = self.options.music[index]['lrc'],
			xmlhttp = new XMLHttpRequest();

		xmlhttp.open('get', _url);
		xmlhttp.send();
		xmlhttp.onreadystatechange = function () {
			if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
				self.parseMusicLrc(xmlhttp.responseText);
			}
		};
	};

	MusicPlayer.prototype.parseMusicLrc = function(data) {
		var lines   = data.split('\n');
		var timeReg = /\[\d*:\d*((\.|\:)\d*)*\]/g;
		var result  = {};

		lines[lines.length-1].length === 0 && lines.pop();
		lines.forEach(function(value, index) {
			var time    = value.match(timeReg);
			var lrcText = value.replace(timeReg, '');

			var hax = time[0].slice(1, -1).split(':');
			var ret = Math.round(hax[0] * 60 + Number(hax[1]));

			result[ret] = lrcText;
		});
		this.showLrc(result);
	};

	MusicPlayer.prototype.showLrc = function(lyric) {
		var html = '',
			line = 0;
		this.lyric = {};
		for (var key in lyric) {
			if (lyric[key] == '') lyric[key] = '&nbsp;';
			html += '<p>' + lyric[key] + '</p>';

			// this.lyric[key] = {
			// 	index: line++
			// };
			this.lyric[key] = line++;
		}
		this.find('lrc-wrap').innerHTML = html;
	};

	MusicPlayer.prototype.find = function(className) {
		return this.dom.getElementsByClassName(className)[0];
	};

	MusicPlayer.bindEventModel = function(eventList) {
		for (var i = eventList.length - 1; i >= 0; i--) {
			eventList[i].target.addEventListener(eventList[i]['eventName'], eventList[i]['handler']);
		}
	};

	MusicPlayer.extend = function(defaults, options) {
		for (var prop in options) {
			if (options.hasOwnProperty(prop)) {
				defaults[prop] = options[prop];
			}
		}
		return defaults;
	};

	MusicPlayer.transTime = function(time) {
		var m = parseInt(time / 60),
			s = parseInt(time % 60);

		return s < 10 ? ('0' + m + ':0' + s) : ('0' + m + ':' + s);
	};

	MusicPlayer.rand = function(min, max) {
		return Math.random() * (max - min) + min;
	};
})();