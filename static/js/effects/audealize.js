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

	this.input.connect(this.eq.input);
	this.input.connect(this.reverb.input);
	this.eq.connect(this.output);
	this.reverb.connect(this.output);
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
			if (word in descriptors['eq']) {
				this.eq.curve = descriptors['eq'][word]['settings'];
				this.parameters.eq_descriptor = word;
			}
			else {
				// syn = this.get_synonym(word, 'eq');
				// if (syn != null) {
				// 	this.eq.curve = descriptors['eq'][syn]['settings'];
				// 	this.parameters.eq_descriptor = syn;
				// }
			}
		}
	},

	reverb_descriptor: {
		get: function () { return this.parameters.reverb_descriptor; },
		set: function (word) {
			word = word.toLowerCase();
			if (word in descriptors['reverb']) {
				this.reverb.settings = descriptors['reverb'][word]['settings'];
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
