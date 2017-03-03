/*
audealize.js: implements a high-level audio effect node in Web Audio API. To use it, simply instantiate the Web Audio Node in your Web Audio graph, and give a reverb word or an eq word. 

Depends: reverb.js, equalizer.js, reverbpoints.json, eqpoints.json
*/

function Audealize (context, opts) {
	this.input = context.createGain();
	this.output = context.createGain();

	curve = new Array(40).fill(1)
	this.eq = new Equalizer(context, {'curve': curve});
	this.reverb = new Reverb(context);

	this.parameters = new Object();
	this.parameters.eq_descriptor = opts.eq_descriptor || 'bright'
	this.parameters.reverb_descriptor = opts.reverb_descriptor|| 'crisp'

	// TODO this currently does nothing
	//this.input.connect(this.output);
	this.input.connect(this.eq.input);
	this.input.connect(this.reverb.input);
	this.eq.connect(this.output);
	this.reverb.connect(this.output);

	dict = {};
	dict['eq'] = {};
	dict['reverb'] = {};

	$.getJSON("/static/data/eqdescriptors.json", function (json) {
		json;
		for (i = 0; i < json.length; i++) {
			var word = json[i].word;
			dict['eq'][word] = {};
			dict['eq'][word]['settings'] = json[i].settings;
			dict['eq'][word]['lang'] = json[i].lang;
			dict['eq'][word]['agreement'] = json[i].agreement;
			dict['eq'][word]['num'] = json[i].num;
		}
	});

	$.getJSON("/static/data/reverbdescriptors.json", function (json) {
		json;
		for (i = 0; i < json.length; i++) {
			var word = json[i].word;
			dict['reverb'][word] = {};
			dict['reverb'][word]['settings'] = json[i].settings;
			dict['reverb'][word]['lang'] = json[i].lang;
			dict['reverb'][word]['agreement'] = json[i].agreement;
			dict['reverb'][word]['num'] = json[i].num;
		}
	});

	this.dict = dict;
}

Audealize.prototype = Object.create(null, {
	connect: {
		value: function (dest) {
			this.output.connect(dest.input ? dest.input : dest);
		}
	},

	disconnect: {
		value: function () {
			this.output.disconnect();
		}
	},

	eq_descriptor: {
		get: function () { return this.parameters.eq_descriptor; },
		set: function (word) {
			word = word.toLowerCase();
			if (word in this.dict['eq']) {
				this.eq.curve = this.dict['eq'][word]['settings'];
				this.parameters.eq_descriptor = word;
			}
			else {
				syn = this.get_synonym(word, 'eq');
				if (syn != null) {
					this.eq.curve = this.dict['eq'][syn]['settings'];
					this.parameters.eq_descriptor = syn;
				}
			}
		}
	},

	reverb_descriptor: {
		get: function () { return this.parameters.reverb_descriptor; },
		set: function (word) {
			word = word.toLowerCase();
			if (word in this.dict['reverb']) {
				this.reverb.settings = this.dict['reverb'][word]['settings'];
				this.parameters.reverb_descriptor = word;
			}
			else {
				console.log('Descriptor \"' + word + "\" not found");
				//TODO handle words not in map
			}
			//TODO find synonyms
		}
	},
});
