var context;
var audealize;
var buffers;
var audio;

function setupContext() {
	context = new AudioContext();
	audealize = new Audealize(context, '4cdc8dfc9297f52969df235e3b339e63',
		{
          'eq': 'bright',
          'reverb': 'crisp'
        });
}

$(document).ready(function() {
	audiofile = ["/static/audio/guitar.wav"]
	setupContext();
	bufferloader = new BufferLoader (
		context,
		audiofile,
		finished
	);
	bufferloader.load()

	function finished(buffer_list) {
		buffers = buffer_list.slice(0);
	}
});

function play() {
	audio = create_source(buffers[0], false);
	audio.connect(audealize.input);
	audealize.connect(context.destination);
	audio.start(0);
}

function stop() {
    audio.stop()
}

function toggle_eq() {
	audealize.eq_on = !audealize.eq_on
}

function toggle_reverb() {
  audealize.reverb_on = !audealize.reverb_on
}

function create_source(buffer, loop) {
	var source = context.createBufferSource();
	source.buffer = buffer;
	source.loop = loop;
	return source;
}

function eq_amount(amount) {
	audealize.eq_amount = amount
}

function reverb_amount(amount) {
	audealize.reverb_amount = amount
}

function parse(obj) {
    word = $('#' + obj.id)[0].value;
    if (obj.id == 'reverb-input') {
		audealize.reverb_descriptor = word;
		//console.log('Changed reverb setting to ' + word);
	}
    else if (obj.id == 'eq-input') {
		audealize.eq_descriptor = word;
		//console.log('Changed eq setting to ' + word); 		
    }
}


