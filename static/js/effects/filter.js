/*
This implements a simple first order filter. Note that due to Web Audio API
limitations, very low delays are impossible. Set the feedforward and feedbackward
gains, and the amount of delay. Required for reverberator.
*/
function Filter (context, opts) {
	this.input = context.createGain();
	this.output = context.createGain();

	var p = this.meta.params;
	if (opts === undefined) {
		d = p.d.defaultValue;
		g1 = p.g1.defaultValue;
		g2 = p.g2.defaultValue;
	}
	else {
		d = opts.d;
		g1 = opts.g1;
		g2 = opts.g2;
	}

	var entry = context.createGain();
	var exit = context.createGain();

	this.gain1 = context.createGain();
	this.gain1.gain.value = g1;
	this.gain2 = context.createGain();
	this.gain2.gain.value = g2;

	this.delay = context.createDelay();
	this.delay.delayTime.value = d;

	this.input.connect(this.gain1);
	this.gain1.connect(exit);
	exit.connect(this.output);
	
	this.input.connect(entry);
	entry.connect(this.delay);
	this.delay.connect(exit);
	
	this.output.connect(this.gain2);
	this.gain2.connect(entry);
}

Filter.prototype = Object.create(null, {
	connect: {
		value: function(dest) {
			this.output.connect(dest.input ? dest.input : dest);
		}
	},

	disconnect: {
		value: function() {
			this.output.disconnect();
		}
	},

	meta: {
		value: {
			name: "Lowpass filter",
			params: {
				d: {
					min: 0,
					max: .1,
					defaultValue: .01,
					type: "float"
				},
				
				g1: {
					min: -1,
					max: 1,
					defaultValue: 1/Math.sqrt(2),
					type: "float"
				},
				
				g2: {
					min: -1,
					max: 1,
					defaultValue: -1/Math.sqrt(2),
					type: "float"
				}
			}
		}
	},
	

	d: {
		enumeramble: true,
		get: function() {return this.delay.delayTime.value;},
		set: function(value) {
			this.delay.delayTime.setValueAtTime(value,0);
		}
	},
	
	g1: {
		enumeramble: true,
		get: function() {return this.gain1.gain.value;},
		set: function(value) {
			this.gain1.gain.setValueAtTime(value,0);
		}
	},

	g2: {
		enumeramble: true,
		get: function() {return this.gain2.gain.value;},
		set: function(value) {
			this.gain2.gain.setValueAtTime(value,0);
		}
	}
});
