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
	this.input.connect(this.output)
	//this.input.connect(this.eq);
	//this.input.connect(this.reverb);
	//this.eq.connect(this.output);
	//this.reverb.connect(this.output);
}

Audealize.prototype = Object.create(null, {
	connect: {
		value: function(dest) {
			this.output.connect(dest.input ? dest.input : dest);
		}
	},

	disconnect: {
        value: function () {
            this.output.disconnect();
        }
    },

    eq_descriptor: {
		get: function() {return this.parameters.eq_descriptor;},
		set: function(value) {
			this.parameters.eq_descriptor = value;
			//TODO make this do things
		}
	},

    reverb_descriptor: {
		get: function() {return this.parameters.reverb_descriptor;},
		set: function(value) {
			this.parameters.reverb_descriptor = value;
			//TODO make this do things
		}
	}
});
