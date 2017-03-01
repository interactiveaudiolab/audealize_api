//common variables
var music = {playing:false, reverb:false, eq: false, progress: 0, start_time: -1};
var BUFFERS;
var mindelay = 0.01;
var mouse = {down: false};
AUDIOFILES = 
			[
				'/static/audio/guitar.mp3'
				//'/static/audio/drums.mp3'
			];
AUDIOFILES = [AUDIOFILES[Math.floor(Math.random()*AUDIOFILES.length)]];

var context;
var canvas = {};
var json = {'reverb': [], 'eq': []};
var measpos;
var languages = {'reverb': ['English'], 'eq': ['English']};
var rev;
var eq;
var n1;
var n2;
var n3;

var bufferLoader;
var bufferList;
var source;

colors = {'reverb': [], 'eq': []};
fsizes = {'reverb': [], 'eq': []};
words = {'reverb': [], 'eq': []};
x = {'reverb': [], 'eq': []};
y = {'reverb': [], 'eq': []};
rx = [];
ry = [];

wordDict = {'reverb': {}, 'eq': {}};
maxes = [];
params = {'reverb': [], 'eq': []};
indices = [];

var minVariance = {};
var maxVariance = {};
var varianceThresh = {};
var center = {'reverb': -1, 'eq': -1};
var circle = {};

	
function readyCanvas(id) {
	var canv = canvas[id];
	canv.width = 1*.9877*$("#tabs").width();
	canv.height = .45*.9877*$("#tabs").width();
	
	/*
	$('#detailslider-' + id)[0].style.height = .7*canv.height + 'px';
	$('#detailslider-' + id)[0].style.marginTop = .137*canv.height + 'px';
	$('#detailslider-' + id)[0].style.marginBottom = .137*canv.height + 'px';
	*/

	canv.style.width = canv.width;
	canv.style.height = canv.height;
}


function loadEQ() {
	//reset variables
	x['eq'] = [];
	y['eq'] = [];
	var excluded_x = [];
	var excluded_y = [];
	colors['eq'] = [];
	fsizes['eq'] = [];
	words['eq'] = [];
	wordDict['eq'] = {};
	params['eq'] = [];

	minVariance['eq'] = json['eq'][0]['agreement'];
	maxVariance['eq'] = json['eq'][json['eq'].length - 1]['agreement'];
	varianceThresh['eq'] = (maxVariance['eq']-minVariance['eq']) + minVariance['eq'];
	alphamax = 1 - .92*Math.log(5*json['eq'][0]['agreement']+1)
	var word_count = 0;
	for (i = 0; i < json['eq'].length; i++) {
		if ($.inArray(json['eq'][i]['lang'], languages['eq']) != -1) {
			words['eq'].push(json['eq'][i]['word']);
			wordDict['eq'][json['eq'][i]['word']] = word_count;
			x['eq'].push(json['eq'][i]['x'])
			y['eq'].push(json['eq'][i]['y'])
			params['eq'].push(json['eq'][i]['settings'])
			rgb = [Math.random()*255, Math.random()*255, Math.random()*255]
			rgb = rgb.map(function (x) {return Math.floor(x*.6)});
			alphaval = (1 - .92*Math.log(5*json['eq'][i]['agreement']+1))/alphamax;
			rgb.push(alphaval);
			colors['eq'].push(rgb);
			//colors.push("rgba(" + rgb.join() + ")");
			dat = json['eq'][i]['agreement'] - minVariance['eq'];
			dat = dat/(maxVariance['eq']-minVariance['eq'])*.7;
			dat = dat + .3;
			fsize = 12*Math.pow(5, 1/(5*dat));
			fsize = Math.round(fsize);
			fsizes['eq'].push(fsize);

			word_count += 1;
		}
		else {
			excluded_x.push(json['eq'][i]['x'])
			excluded_y.push(json['eq'][i]['y'])
		}
	}
	$('#wordin-eq').autocomplete({source: words['eq']});
	x['eq'] = normalize(x['eq'].concat(excluded_x));
	y['eq'] = normalize(y['eq'].concat(excluded_y));
	x['eq'] = x['eq'].slice(0, words['eq'].length);
	y['eq'] = y['eq'].slice(0, words['eq'].length);
	var canv = canvas['eq'];
	var ctx = canv.getContext('2d');
	canv.width  = canv.width;
	drawmap(json, 'eq');
	if (circle['eq'] != undefined) {
		make_circle_at_point(circle['eq'], 'darkgray', 15, ctx);
	}
	$("#word-count-eq").text('Map built with ' + words['eq'].length + ' words. Nearby words have similar effects.')
}

function loadReverb() {
	var excluded_x = [];
	var excluded_y = [];
	
	x['reverb'] = [];
	y['reverb'] = [];
	
	colors['reverb'] = [];
	fsizes['reverb'] = [];
	words['reverb'] = [];
	wordDict['reverb'] = {};

	minVariance['reverb'] = json['reverb'][0]['agreement'];
	maxVariance['reverb'] = json['reverb'][json['reverb'].length - 1]['agreement'];
	varianceThresh['reverb'] = (maxVariance['reverb']-minVariance['reverb']) + minVariance['reverb'];
	alphamax = 1 - .92*Math.log(2*json['reverb'][0]['agreement']+1);
	var word_count = 0;

	for (i = 0; i < json['reverb'].length; i++) {
		if ($.inArray(json['reverb'][i]['lang'], languages['reverb']) != -1) {
			words['reverb'].push(json['reverb'][i]['word']);
			wordDict['reverb'][json['reverb'][i]['word']] = word_count;
			
			if (i >= teach.get_number_taught('reverb')) {
				x['reverb'].push(json['reverb'][i]['x']);
				y['reverb'].push(json['reverb'][i]['y']);
			}

			rgb = [Math.random()*255, Math.random()*255, Math.random()*255];
			rgb = rgb.map(function (x) {return Math.floor(x*.6)});
			alphaval = (1 - .92*Math.log(2*json['reverb'][i]['agreement']+1))/alphamax;
			rgb.push(alphaval);
			colors['reverb'].push(rgb);
			//colors.push("rgba(" + rgb.join() + ")");
			fsize = 6*Math.pow(5, 1/(5*json['reverb'][i]['agreement']));
			fsize = Math.round(fsize);
			fsizes['reverb'].push(fsize);
		}
		else {
			if (i >= teach.get_number_taught('reverb')) {
				excluded_x.push(json['reverb'][i]['x']);
				excluded_y.push(json['reverb'][i]['y']);
			}
		}
		word_count += 1;
	}
	$('#wordin-reverb').autocomplete({source: words['reverb']});
	
	x['reverb'] = normalize(x['reverb'].concat(excluded_x));
	y['reverb'] = normalize(y['reverb'].concat(excluded_y));
	x['reverb'] = x['reverb'].slice(0, words['reverb'].length);
	y['reverb'] = y['reverb'].slice(0, words['reverb'].length);
	
	for (var i = teach.get_number_taught('reverb') - 1; i >=0; i--) {
		x['reverb'].unshift(json['reverb'][i]['x']);
		y['reverb'].unshift(json['reverb'][i]['y']);
	}

	var canv = canvas['reverb'];
	var ctx = canv.getContext('2d');
	canv.width  = canv.width;
	drawmap(json, 'reverb');
	if (circle['reverb'] != undefined) {
		make_circle_at_point(circle['reverb'], 'darkgray', 15, ctx);
	}
	$("#word-count-reverb").text('Map built with ' + words['reverb'].length + ' words. Nearby words have similar effects.');
}

$(document).ready(function() {
	try {
	
	if ($.cookie('userid') == undefined) {
		$.cookie('userid', makeid(), {expires: 365, path: '/'});
	}

	canvas['reverb'] = document.querySelector('#controller-reverb');
	canvas['eq'] = document.querySelector('#controller-eq');
	canvas['waveform'] = document.querySelector('#controller-waveform');
	$("#command").hide();
	readyCanvas('reverb');
	readyCanvas('eq');
	$(".traditional").hide();
	
	$("[data-toggle='tooltip']").tooltip();
	
	$('[data-toggle="popover"]').popover({
    	trigger: 'hover'
	});

	$("#dialarray .dial").knob({
		'min':0, 
		'max':100,
		'readOnly': true,
		'width':25,
		'height':25,
		'displayInput': false
	});


	
	$.getJSON("static/data/index.json", function(res) {
		for (i = 0; i < res.length; i++) {
			indices.push(res[i]);
		}
	});

	$.getJSON("static/data/measpos.json", function(res) {
		measpos = res;
		for (i = 0; i < res.length; i++) {
			rx.push(res[i][0]);
			ry.push(res[i][1]);
		}
		rx = normalize(rx);
		ry = normalize(ry);
	});
	
	$.getJSON("static/data/params.json", function(res) {
		for (i = 0; i < res.length; i++) {
			params['reverb'].push(res[i]);
		}
	});
	
	$.getJSON("static/data/reverbpoints.json", function(res) {
		json['reverb'] = res;
		display_languages(json, 'reverb');
		filter_by_language('reverb');

	});

	$.getJSON("static/data/eqpoints.json", function(res) {
		json['eq'] = res;
		loadEQ();
		display_languages(json, 'eq');
		filter_by_language('eq');
	});

	window.addEventListener('resize', resizeAll)

	function resizeAll() {
		readyCanvas('eq');
		drawmap(json, 'eq');
		readyCanvas('reverb');
		drawmap(json, 'reverb');
		readyWave();
	}	

	canvas['waveform'].addEventListener('click', function(evt) {
		if(!music.playing) {
			music.toggle(true);
		}
		music.stop();
		var mousePos = getMousePos(canvas['waveform'], evt);
		var start = mousePos.x / canvas['waveform'].width;
		music.playAt(start, true);
	}, false);

	setup_listeners('eq');
	setup_listeners('reverb');

	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	online = new AudioContext();

	context = online;

	createNodes();

	maxes = [.1, 1, .012, 22050, 1];

	bufferLoader = new BufferLoader (
		context,
		AUDIOFILES,
		finishedLoading
	);
	bufferLoader.load();

	function finishedLoading(bufferList) {
		BUFFERS = bufferList.slice(0);
		offline = new OfflineAudioContext(2, Math.round(BUFFERS[0].length*1.2), 44100);
		readyWave();
	}
	
	var tabs = $("#tabs").tabs();
	var tabs = $("#tabs").tabs("option", "active", 0);
	tabs.find(".ui-tabs-nav").sortable({
		axis: "x",
		stop: function() {
			tabs.tabs("refresh");
			music.reroute();
		}
	});

	if ($.cookie('seenModal') == undefined) {
		$.cookie('seenModal', 'true', {expires: 365});
		$("#info").modal('show');
	}
	}
	catch (err) {
		$(".browser-error").modal('show');
	}

});

function filter_by_language(id) {
	var elem_id = 'language-' + id + '[]';
	var selector = "input[name='" + elem_id + "']:checked";
	var checked_languages = $(selector).map(function() {return this.value});
	languages[id] = checked_languages;
	switch (id) {
		case 'eq':
			loadEQ();
			break;
		case 'reverb':
			loadReverb();
			break;
	}
}

function display_languages(data, id) {
	var langs = find_languages(data[id]);
	for (l in langs) {
		var checkbox = document.createElement('input');
		checkbox.type = "checkbox";
		checkbox.name = "language-" + id + "[]";
		checkbox.value = langs[l];
		checkbox.checked = true;
		checkbox.onclick = function() {
			var elem_id = 'language-' + id + '[]';
			var selector = "input[name='" + elem_id + "']:checked";
			var checked_languages = $(selector).map(function() {return this.value});
			if (checked_languages.length == 0) {
				$('#language-' + id).notify("At least one language must be selected.", {'elementPosition': 'right', 'showDuration': 10, 'hideDuration':10});
				this.checked = true;
				return;
			}
			filter_by_language(id);
		};

		var label = document.createElement('label');
		var description = document.createTextNode(' ' + langs[l]);
		label.appendChild(checkbox);
		label.appendChild(description);
		document.getElementById('language-' + id).appendChild(label);
	}
}

function find_languages(data) {
	langs = [];
	for (d in data) {
		if ($.inArray(data[d]['lang'], langs) == -1) {
			if (data[d]['lang'] != undefined) {
				langs.push(data[d]['lang']);
			}
		}
	}
	return langs;
}

function setup_listeners(id) {
	canvas[id].addEventListener('mousedown', function(evt) {
		var mousePos = getMousePos(canvas[id], evt);
		drawCircle(mousePos, id);
		if (!music.playing) {
			music.toggle(true);
		}
		if (!music[id]) {
			music.effect(id);
		}
		mouse.down = true;
	}, false);

	canvas[id].addEventListener('mousemove', function(evt) {
		var mousePos = getMousePos(canvas[id], evt);
		if (mouse.down) {
			drawCircle(mousePos, id);
		}
		else {
			draw_hover(mousePos, id);
		}
	}, false);
	
	canvas[id].addEventListener('mouseup', function(evt) {
		mouse.down = false;
	}, false);

	/*
	$('#detailslider-' + id).on("input", function() {
		changevariance(this, id);
	});
	*/
}

function createNodes() {
	if (rev != null) {
		rev = new Reverb(context, 
			{'d': rev.d, 
			 'g': rev.g,
			 'm': rev.m,
			 'f': rev.f,
			 'E': rev.E,
			 'wetdry': rev.wetdry
			});
	}
	else {
		rev = new Reverb(context);
	}
	if (eq != null) {
		eq = new Equalizer(context, {curve: eq.curve, range: eq.range});
		eq.range = eq.range;
	}
	else {
		arr = []; for (i = 0; i<40; i++) {arr.push(0)};
		eq = new Equalizer(context, {curve: arr});
	}

	graphCurve();

	n1 = context.createGain();
	n2 = context.createGain();
	n3 = context.createGain();
}


//plays the music on the page.
music.playAt = function(percent, loop) {
	if (record.recording) {
           record.toggle(true);
	}
	
	music.start_time = context.currentTime; 
	music.progress = percent;
	readyWave();
	setInterval(readyWave, 10);
	this.audio = createSource(BUFFERS[0], loop);
	var duration = this.audio.source.buffer.duration;
	var startPoint = percent * duration;
	this.reroute();

	if (!this.audio.source.start) {
		this.audio.source.noteOn(0);
	} else {
		this.audio.source.start(0, startPoint);
	}
	$("#recordNotify").html('');
	$("#playstop").html('<span class="glyphicon glyphicon-stop"></span>');
}
	
function createSource(buffer, loop) {
	var source = context.createBufferSource();
	source.buffer = buffer;
	source.loop = loop;
	return {
		source: source,
		rev: rev,
		eq: eq,
		n1: n1,
		n2: n2,
		n3: n3
	};
}

//stops the music on the page.
music.stop = function() {
	music.progress = 0;
	readyWave();
	$("#playstop").html('<span class="glyphicon glyphicon-play"></span>');
	if (!this.audio.source.stop) {
		this.audio.source.noteOff(0);
	} else {
		this.audio.source.stop(0);
	}
}

//turns on the effect.
music.reroute = function() {
	this.audio.source.disconnect();
	this.audio.n1.disconnect();
	this.audio.n2.disconnect();
	this.audio.n3.disconnect();
	this.audio.rev.disconnect();
	this.audio.eq.disconnect();

	this.audio.source.connect(this.audio.n1);
	var setText = $("#tabs ul a").text();
	if (setText != "EQReverb" || setText != "ReverbEQ") {
		setText = "EQReverb";
	}

	if (setText == "EQReverb") {
		if (this.eq) {
			this.audio.n1.connect(this.audio.eq.input);
			this.audio.eq.connect(this.audio.n2);
			$("#effect-eq").html('<span class="glyphicon glyphicon-bell"></span> Turn EQ Off');
		}
		else {
			this.audio.n1.connect(this.audio.n2);
			$("#effect-eq").html('<span class="glyphicon glyphicon-bell"></span> Turn EQ On');
		}

		if (this.reverb) {
			this.audio.n2.connect(this.audio.rev.input);
			this.audio.rev.connect(this.audio.n3);
			$(".effect-reverb").each(function(index) {
				$(this).html('<span class="glyphicon glyphicon-bell"></span> Turn Reverb Off');
			});
			$('#effect-reverb').html('<span class="glyphicon glyphicon-bell"></span> Turn Reverb Off');
		}
		else {
			this.audio.n2.connect(this.audio.n3);
			$(".effect-reverb").each(function(index) {
				$(this).html('<span class="glyphicon glyphicon-bell"></span> Turn Reverb On');
			});
			$('#effect-reverb').html('<span class="glyphicon glyphicon-bell"></span> Turn Reverb On');
		}
	}

	if (setText == "ReverbEQ") {
		if (this.reverb) {
			this.audio.n1.connect(this.audio.rev.input);
			this.audio.rev.connect(this.audio.n2);
			$(".effect-reverb").each(function(index) {
				$(this).html('<span class="glyphicon glyphicon-bell"></span> Turn Reverb Off');
			});
		}
		else {
			this.audio.n1.connect(this.audio.n2);
			$(".effect-reverb").each(function(index) {
				$(this).html('<span class="glyphicon glyphicon-bell"></span> Turn Reverb On');
			});
		}
		if (this.eq) {
			this.audio.n2.connect(this.audio.eq.input);
			this.audio.eq.connect(this.audio.n3);
			$("#effect-eq").html('<span class="glyphicon glyphicon-bell"></span> Turn EQ Off');
		}
		else {
			this.audio.n2.connect(this.audio.n3);
			$("#effect-eq").html('<span class="glyphicon glyphicon-bell"></span> Turn EQ On');
		}
	}
	
	this.audio.n3.connect(context.destination);
}

//call this one for a toggle button between play and not play.
music.toggle = function(loop) {
	this.playing ? this.stop() : this.playAt(0, loop);
	this.playing = !this.playing;
}

music.effect = function(id) {
	try {
		music[id] = !music[id];
		this.reroute();
	}
	catch (err) {
		if (!music.playing) {
			music.toggle();
			music.toggle();
		}
		music.effect(id);
	}
}

function effectAmount(obj, str) {
	if (str ==  'reverb') {
		rev.wetdry = obj.value/1000;
		$("#wetdry").val(rev.wetdry*100);
		$("#dialarray .dial").trigger('change');
	}
	if (str == 'eq') {
		eq.range = obj.value/1000;
		set_eq_sliders();
		graphCurve();
	}
}

music.upload = function() {
	$('input[type=file]').click();
}

$('input[type=file]').change(function() {
	if (music.playing) {
		music.toggle(false);
	}
	file = this.files[0];
	url = URL.createObjectURL(file);
	AUDIOFILES = [url];
	bufferLoader = new BufferLoader (
		context,
		AUDIOFILES,
		finishedLoading
	);
	bufferLoader.load();
	function finishedLoading(bufferList) {
		BUFFERS = bufferList.slice(0);
		offline = new webkitOfflineAudioContext(2, Math.round(BUFFERS[0].length + 44100*10), 44100);
		readyWave();
	}
});

music.download = function() {
	if (music.playing) {
		music.toggle(false);
	}

	offline = new webkitOfflineAudioContext(2, Math.round(BUFFERS[0].length+ 44100*10), 44100);
	context = offline;
	createNodes();
	this.audio = createSource(BUFFERS[0], false);	
	music.reroute();
	music.toggle(false);

	context.oncomplete = function(e) {
		outBuffer = e.renderedBuffer;
		var worker = new Worker('/static/js/recorderWorker.js');
		worker.postMessage({
			command: 'init',
			config: {
				sampleRate: context.sampleRate
			}
		});

		worker.postMessage({
			command: 'record',
			buffer: [outBuffer.getChannelData(0),
					outBuffer.getChannelData(1)]
		});

		worker.postMessage({
			command: 'exportWAV',
			type: 'audio/wav'
		});

		worker.onmessage = function(e) {
			filename = "";
			if (music['eq'] && center['eq'] != -1) {
				filename = filename +  'eq-' + words['eq'][center['eq']];
			}
			if (music['reverb'] && center['reverb'] != -1) {
				if (filename != "") {
					filename = filename + '+';
				}
				filename = filename + 'reverb-' + words['reverb'][center['reverb']];
			}
			if (filename == "") {
				filename = "original"
			}

			Recorder.forceDownload(e.data, filename + '.wav');
		}
		context = online;
		createNodes();
		music.toggle(true);
	}
	context.startRendering();
}

function make_circle_at_point(mousePos, color, rad, ctx) {
	ctx.beginPath();
	centerx = mousePos.x;
	centery = mousePos.y;
	ctx.arc(centerx, centery, rad, 0, 2*Math.PI);
	ctx.closePath();
	ctx.strokeStyle = color;
	ctx.stroke();
	return {x:centerx, y:centery};
}

function find_closest_word_in_map(point, id) {
	var canv = canvas[id];
	bestword = 0;
	mindist = -1;
	for (i = 0; i < x[id].length; i++) {
		pt = [(.1+x[id][i]*.8)*canv.width, (.9*y[id][i]+.05)*canv.height];
		dist = Math.sqrt(Math.pow(pt[0]-point.x, 2) + Math.pow(pt[1] - point.y, 2));
		if (mindist != -1) {
			if (dist < mindist) {
				mindist = dist;
				bestword = i;
			}
		}
		else {
			mindist = dist;
		}	
	}
	return bestword;
}

function find_closest_reverb_to_word(point, id) {
	var canv = canvas[id];
	best = 0;
	mindist = -1;
	for (i = 0; i < rx.length; i++) {
		pt = [(.1+rx[i]*.8)*canv.width, (.9*ry[i]+.05)*canv.height];
		dist = Math.sqrt(Math.pow(pt[0]-point.x, 2) + Math.pow(pt[1] - point.y, 2));
		if (mindist != -1) {
			if (dist < mindist) {
				mindist = dist;
				best = indices[i];
			}
		}
		else {
			mindist = dist;
		}	
	}
	return best;
}

function draw_hover(mousePos, id) {
	var canv = canvas[id];
	ctx = canv.getContext('2d');
	canv.width = canv.width;
	drawmap(json, id, mousePos);
	make_circle_at_point(mousePos, 'lightgray', 15, ctx);
	if (circle[id] != undefined) {
		make_circle_at_point(circle[id], 'darkgray', 15, ctx);
	}
}

function drawCircle(mousePos, id) {
	var canv = canvas[id];
	canv.width  = canv.width;
	ctx = canv.getContext('2d');

	if (mousePos == 'reset') {
		center[id] = -1;
		drawmap(json, id);
		return;
	}
	
	circle[id] = make_circle_at_point(mousePos, 'lightgray', 15, ctx);
	center[id] = find_closest_word_in_map(circle[id], id);

	$('#wordin-'+id).val(words[id][bestword]);
	$('#contrib-count-'+id).text("'" + words[id][bestword]+ "'" + ' learned from ' + json[id][bestword]['num'] + ' contributions.');

	drawmap(json, id);
	
	if (id == 'reverb') {
		best_reverb = find_closest_reverb_to_word(circle[id], id);
		p = params[id][best_reverb].slice();
		p.push($("#reverb-effectamount").val()/1000);
		set_reverb(p)
		show_reverb(params[id][best]);
	}

	if (id == 'eq') {	
		eq.curve = params[id][bestword];
		eq.range = $("#eq-effectamount").val()/1000;
		graphCurve();
		set_eq_sliders();
	}
}

function set_eq_sliders() {
	$('.eq-control').each(function(band) {
		this.value = 500*(eq.range*eq.curve[band] + 1);
	});
}

function direct_control(obj, id) {
	var canv = canvas[id];
	if (!music.playing) {
		music.toggle(true);
	}
	if (!music[id]) {
		music.effect(id);
	}
	if (id == 'eq') {
		var new_curve = []
		$('.eq-control').each(function(band) {
			new_curve.push((this.value/1000)*2 - 1);
		});
		eq.normalize = false;
		eq.curve = new_curve;
		eq.normalize = true;
		var nearest_eq = find_closest_eq_by_curve(new_curve);
		var pt = [(.1+x['eq'][nearest_eq]*.8)*canv.width, (.9*y['eq'][nearest_eq]+.05)*canv.height];
		var mousePos = {'x': pt[0], 'y': pt[1]};
		
		draw_hover(mousePos, id);
		
		graphCurve();
	}

	if (id == "reverb") {
		var new_reverb = []
		$(".direct-reverb-control").each(function(index) {
			new_reverb.push((this.value/1000)*maxes[index]);
		});
		var nearest_reverb = find_closest_reverb_by_parameter(new_reverb);
		var pt = [(.1+rx[nearest_reverb]*.8)*canv.width, (.9*ry[nearest_reverb]+.05)*canv.height];
		var mousePos = {'x': pt[0], 'y': pt[1]};

		draw_hover(mousePos, id);

		new_reverb.push(rev.wetdry);
		set_reverb(new_reverb);
		show_reverb(new_reverb);
	}
}

function find_closest_eq_by_curve(e) {
	var closest = 0;
	var max_correlation = -Infinity;
	var current_correlation;

	for (p in params['eq']) {
		current_correlation = ss.sample_correlation(e, params['eq'][p]);
		console.log(current_correlation);
		if (current_correlation > max_correlation) {
			closest = p;
			max_correlation = current_correlation;
		}
	}
	return closest;
}

function find_closest_reverb_by_parameter(r) {
	var closest = 0;
	var min_distance = Infinity;
	var current_distance;

	for (p in indices) {
		current_distance = distance(r, params['reverb'][indices[p]], maxes.map(function(x) {return 1/x}));
		if (current_distance < min_distance) {
			closest = p;
			min_distance = current_distance;
		}
	}
	return closest;
}

function show_traditional(id) {
	var element = '#traditional-' + id;
	if ($(element).is(':visible')) {
		$(element).hide();
		$('#show-traditional-' + id).html('<span class="glyphicon glyphicon-plus"></span> Show traditional interface');
	}
	else {
		$(element).show();
		$('#show-traditional-' + id).html('<span class="glyphicon glyphicon-minus"></span> Hide traditional interface');
	}
}

function set_reverb(p) {
	rev.d = p[0];
	rev.g = p[1];
	rev.m = p[2];
	rev.f = p[3];
	rev.E = p[4];
	rev.wetdry = p[5];
}

function show_reverb(p) {
	$("#dialarray .par").each(function(index) {
		this.value = Math.abs(p[index])/maxes[index]*100;
		$('#dialarray .dial').trigger('change');
	});
	$(".direct-reverb-control").each(function(index) {
		this.value = Math.abs(p[index])/maxes[index]*1000;
	});
}


function drawmap(json, id, hover_position) {
	plotted = [];
	var canv = canvas[id];
	ctx = canv.getContext('2d');
	init_map = (center[id] == -1);
	hovering = (hover_position != undefined);
	hover_center = -1;
	
	if (hovering) {
		hover_center = find_closest_word_in_map(hover_position, id);
	}

	if (!init_map) {
		center_word = [(.1+x[id][center[id]]*.8)*canv.width, (.9*y[id][center[id]]+.05)*canv.height];
		center_point = [circle[id]['x'], circle[id]['y']];
	}

	var unhighlighted_alpha_value = .7;
	var hover_alpha_value = .15
	
	for (i = 0; i < words[id].length; i++) {
		in_radius = false;
		hover_radius = false;
		var point = [(.1+x[id][i]*.8)*canv.width, (.9*y[id][i]+.05)*canv.height];
		var font_size = fsizes[id][i];
		var color = colors[id][i].slice();
		var pad = 2;

		//check for a collision, using the font size and word length, plus a bit of padding to see if it will collide
		var collision = check_for_collision(point, plotted, font_size + words[id][i].length + pad);
		
		if (!init_map) {
			in_radius = inRadius(point, center_point, 75);
		}
		
		if (hovering) {
			hover_radius = inRadius(point, [hover_position.x, hover_position.y], 75)
		}
		
		if (i == center[id] || i == hover_center) {
			color[3] = 1;
		}
		else {
			if (in_radius || hover_radius) {
				color[3] = hover_alpha_value;
			}
			else {
				color[3] =  unhighlighted_alpha_value;
			}
		}

		if (init_map && !hover_radius) {
			color[3] = 1;
		}
		
		if (!collision || hover_radius || in_radius) {
			plot_word(words[id][i], color, font_size, point, ctx);
		}
		
		plotted.push(point);
	}
}

function check_for_collision(point, plotted, dist) {
	//edit slack in x and y directions
	slack = [.125, 1.5];
	for (p in plotted) {
		var distance = Math.sqrt(slack[0]*Math.pow(point[0] - plotted[p][0], 2) + slack[1]*Math.pow(point[1] - plotted[p][1], 2));
		if (distance < dist) {
			return true;
		}
	}
	return false;
}

function plot_word(word, color, font_size, point, ctx) {
	color = 'rgba(' + color.join() + ')';
	ctx.fillStyle = color;
	ctx.font = font_size + "px Helvetica Neue, Helvetica, Arial, sans-serif"
	ctx.textAlign="center";
	ctx.fillText(word, point[0], point[1]);
}

function inRadius(pt, centerpt, r) {
	d = Math.sqrt(Math.pow(pt[0] - centerpt[0], 2) + Math.pow(pt[1] - centerpt[1], 2));
	if (d < r) {
		return true;
	}
	return false;
}

function changetoword(obj, id, event) {
	var canv = canvas[id];
	if (typeof obj == 'string' || obj instanceof String){
		word = obj;
	}
	else{
		try {
			word = obj.value.toLowerCase();
		}
		catch(err) {
			word = obj;
		}
	}
	if (event.keyCode == 13 || event == 13 || wordDict[id][word] != undefined){
		if (wordDict[id][word] != undefined) {
			$('#wordin-' + id).notify('Found ' + word,
				{'autoHideDelay': 1000, 'elementPosition': 'top left', 'className': 'success', 'showDuration': 200, 'hideDuration': 100 });
			try {
				obj.style.borderColor = "green";
			} catch(err) {}
			
			ind = wordDict[id][word];
			pt = [(.1+x[id][ind]*.8)*canv.width, (.9*y[id][ind]+.05)*canv.height];
			circle[id] = {x: pt[0], y: pt[1]};
			drawCircle(circle[id], id);
			if (!music.playing) {
				music.toggle(true);
			}
			if (!music[id]) {
				music.effect(id);
			}

		}
		else {
			text = obj.value.toLowerCase();
			$('#teach-' + id).notify("Try teaching it.",
				{'autoHideDelay': 6000, 'elementPosition': 'bottom left', 'className': 'warning',
				'showDuration':  200, 'hideDuration': 100 });
			$('#teach-word-input').val(text);
			found = findWordChoices(text, id);
			if (found.length > 0) {
				if (found.length > 1) {
					console.log(found);
					display_text = found.slice(0, found.length - 1);
					display_text = display_text.join(', ');
					display_text = display_text + ' or ' + found[found.length-1];
				}
				else {
					display_text = found.join(', ');
				}
				$('#wordin-' + id).notify("Try " + display_text,
					{'autoHideDelay': 6000, 'elementPosition': 'top left', 'className': 'info',
					'showDuration':  200, 'hideDuration': 100 });
			}

			if (found.length == 0){
				$('#wordin-' + id).notify('Word not found.',
				{'elementPosition': 'top left', 'className': 'error', 'showDuration': 200, 'hideDuration': 100 });
			}
			try {
			obj.style.borderColor = "#AD0003";
			} catch(e) {}
		}
		return false;
	}
	return true;
}

//parses through input word/s returning list of:
//synonyms and  words found on map (or other map), if any. 
function findWordChoices(text, id) {
	if (text != '') {
        response = $.ajax({
        		type: "POST",
        		url: "/synonym",
           		data: {
	       		'text': text},
			async: false	
		});

		wordresponse = jQuery.parseJSON(response.responseText);
		var found = [];

		wordsplit = text.split(" ");

		for(i = 0; i < wordresponse.length; i++){
			word = wordresponse[i];
			if(wordDict[id][word] != undefined){
				if (found.length <= 2){
					found.push(" " + word);
				}
			}
		}	

		          
		if (found.length == 0 && wordsplit.length > 1){
			word = text.replace(" ","");
			if(wordDict[id][word] != undefined){
				changetoword(word,id,13);
				return;
			}
		}

		if (found.length == 0 && wordsplit.length > 1){
			word = text.replace(" ","-");
			if(wordDict[id][word] != undefined){
				changetoword(word,id,13);
				return;
			}
		}
		
				
		if (found.length == 0 && wordsplit.length > 1){
			oldwordsplit = wordsplit;
			for(j=0; j < wordsplit.length; j++){
				oword = wordsplit[j];
				if(wordDict[id][oword] != undefined){
					found.push(oword+" was found");
				}
				else {
					foundSyns = findWordChoices(oword,id);
					if (foundSyns.length != 0){
						found.push(foundSyns+" for " +oword);
						wordsplit = oldwordsplit;
					}
					else{
						found.push(oword + " not found");
						wordsplit = oldwordsplit;
					}		
				}
			}
		}
		if (id == 'reverb') {
			if (wordDict['eq'][text] != undefined){
				found.push("checking the EQ map");
			}
		}
		if (id == 'eq') {
			if (wordDict['reverb'][text] != undefined){
				found.push("checking the reverb map");
			}
		}
		found = $.unique(found);
		return found;
	}
}

function changevariance(obj, id) {
	var canv = canvas[id];
	varianceThresh[id] = (obj.value/obj.max)*(maxVariance[id]-minVariance[id]) + minVariance[id];
	if (circle[id] == undefined) {
		canv.width = canv.width;
		drawmap(json, id);
	}
	else {
		drawCircle(circle[id], id);
	}
}

//common functions
function normalize(arr) {
	function max(previous,current) { 
	      return previous > current ? previous:current
	}
	function min(previous,current) { 
	      return previous < current ? previous:current
	}

	arrmin = arr.reduce(min);
	for (i = 0; i < arr.length; i++) {
		arr[i] = arr[i] + Math.abs(arrmin)
	}

	arrmax = arr.reduce(max);
	for (i = 0; i < arr.length; i++) {
		arr[i] = arr[i]/arrmax
	}
	return arr
}

function getMousePos(canv, evt) {
	var rect = canv.getBoundingClientRect();
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}

var curveChart;

function graphCurve() {	
	var curvectx = $("#curve").get(0).getContext("2d");
	var curveData = [];
	var filler = [];
	var arr = [];
	for (i = 0; i<40; i++) {
		arr.push("");
		curveData.push(eq.curve[i]*eq.range);
		filler.push(1);
	}
	filler[39] = -1;
	var data = {
		labels: arr,
		datasets: [
			{
				fillColor: "rgba(135,206,235,0.2)",
	            strokeColor: "rgba(135,206,235,1)",
    	        pointColor: "rgba(135,206,235,0.2)",
        	    pointStrokeColor: "#fff",
            	pointHighlightFill: "#fff",
            	pointHighlightStroke: "rgba(135,206,235,0.2)",
				data: curveData
			},
			{
				fillColor: "rgba(135,206,235,0)",
	            strokeColor: "rgba(135,206,235,0)",
    	        pointColor: "rgba(135,206,235,0)",
        	    pointStrokeColor: "#fff",
            	pointHighlightFill: "#fff",
            	pointHighlightStroke: "rgba(135,206,235,0)",
				data: filler
			}
		]
	};

	if (curveChart == null) {
		curveChart = new Chart(curvectx);
		curveChart.Line(data, {	
					showTooltips: false,
					scaleShowGridLines: false,
					pointDot: false,
					datasetStroke: false,
					animation: false,
					scaleLineColor: "rgba(255,255,255,0)",
					scaleShowLabels: false
		});
	}
	else {
		curveChart.Line(data, {	
					showTooltips: false,
					scaleShowGridLines: false,
					pointDot: false,
					datasetStroke: false,
					animation: false,
					scaleLineColor: "rgba(255,255,255,0)",
					scaleShowLabels: false
		});
	}	
}

function makeid() {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for( var i=0; i < 20; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}
