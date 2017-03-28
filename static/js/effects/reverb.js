/*
Reverb.js: implements a parametric reverberator in Javascript using Web Audio API.
Use it by setting d, g, m, f, E to the parameters you want. Connect a source to it:
source.connect(reverb.input). Connect it to a node: reverb.connect(context.destination).

The reverberator is described in depth in this paper:
http://music.cs.northwestern.edu/publications/Rafii-Pardo%20-%20A%20Digital%20Reverberator%20Controlled%20through%20Measures%20of%20the%20Reverberation%20-%20NU%20EECS%202009.pdf

Depends: filter.js, primefactors.js.
*/

var fs = 48000;
var allpassgain = .1;
var mindelay = 0.01;


/**
 * A parametric Reverberator AudioNode <br>
 * Use it by setting d, g, m, f, E to the parameters you want <br>
 * The reverberator is described in depth <a
 * href="http://music.cs.northwestern.edu/publications/Rafii-Pardo%20-%20A%20Digital%20Reverberator%20Controlled%20through%20Measures%20of%20the%20Reverberation%20-%20NU%20EECS%202009.pdf">
 * here </a>
 *
 * @class
 * @name Reverb
 * @param {AudioContext} context - The Web Audio context
 * @param {Object} opts - Can contain initial vlaues reverb.param
 */
function Reverb (context, opts) {
	this.input = context.createGain();
	this.output = context.createGain();
	this.output.gain.value = .45;


	var p = this.meta.params;
	opts = opts || {};

	this.param = new Object();

	this.param.d = opts.d || p.d.defaultValue;
	this.param.g = opts.g || p.g.defaultValue;
	this.param.m = opts.m || p.m.defaultValue;
	this.param.f = opts.f || p.f.defaultValue;
	this.param.E = opts.E || p.E.defaultValue;
	this.param.wetdry = opts.wetdry;
	if (this.param.wetdry == undefined) {
		this.param.wetdry = 1;
	}
	
	this.wet = context.createGain();
	this.dry = context.createGain();
	this.wet.gain.value = Math.cos((1 - this.param.wetdry)*.5*Math.PI);
	this.dry.gain.value = Math.cos(this.param.wetdry*.5*Math.PI);

	// Setting up internal audio nodes to implement the reverberator.
	this.combNodes = []
	rt = this.param.d*Math.log(.001)/Math.log(this.param.g);

	for (var i = 0; i < 6; i++) {
		var delay = this.param.d*(15-i)/15;
		var gain = Math.pow(.001,delay/rt);
		delay = prevPrime(delay*fs)/fs;
		var obj = new Filter(context, {
			d: delay,
			g1: 0,
			g2: gain
		});
		this.combNodes.push(obj);
	}

	this.minDelay = context.createDelay();
	this.minDelay.delayTime.value = mindelay;
	da = mindelay + .006;
	delayVal = prevPrime((da + this.param.m/2)*fs)/fs;
	this.allpassleft = new Filter(context, {
		d: delayVal,
		g1: -allpassgain,
		g2: allpassgain
	});

	delayVal = prevPrime((da - this.param.m/2)*fs)/fs;
	this.allpassright = new Filter(context, {
		d: delayVal,
		g1: -allpassgain,
		g2: allpassgain
	});

	this.gainL1 = context.createGain();
	this.gainR1 = context.createGain();
	this.gainL1.gain.value = 1;
	this.gainR1.gain.value = 1;
	
	this.merger = context.createChannelMerger(2);
	
	x1 = Math.cos(2*Math.PI*this.param.f/fs);
	x2 = Math.sqrt(Math.pow((x1 - 2), 2) - 1);
	gainVal = 2 - x1 - x2;

	this.lowfilter = context.createBiquadFilter();
	this.lowfilter.type = 'lowpass';
	this.lowfilter.frequency.value = this.param.f;

	this.lowfiltL = context.createBiquadFilter();
	this.lowfiltL.type = 'lowpass';
	this.lowfiltL.frequency.value = this.param.f;

	this.lowfiltR = context.createBiquadFilter();
	this.lowfiltR.type = 'lowpass';
	this.lowfiltR.frequency.value = this.param.f;
	


	this.gain = context.createGain();
	this.gainclean = context.createGain();
	this.gainscale = context.createGain();

	var totalGain = this.param.E + 1;
	var g1 = 1/totalGain;

	this.gainclean.gain.value = Math.cos((1-g1)*.125*Math.PI);
	this.gain.gain.value = Math.cos(g1*.375*Math.PI);
	this.gainscale.gain.value = .5*.8/(this.gainclean.gain.value + this.gain.gain.value);

	this.combEntry = context.createGain();
	this.combExit = context.createGain();

	this.allEntry = context.createGain();
	this.allExit = context.createGain();

	this.lowEntry = context.createGain();
	this.lowExit = context.createGain();

	// Connect up the audio nodes!
	this.input.connect(this.dry);
	this.dry.connect(this.output);
	this.input.connect(this.wet);
	this.wet.connect(this.combEntry);
	this.wet.connect(this.minDelay);
	this.minDelay.connect(this.gainclean);

	for (var i = 0; i < 6; i++) {
		this.combEntry.connect(this.combNodes[i].input);
		this.combNodes[i].connect(this.combExit);
	}

	this.combExit.connect(this.allEntry);
	this.allEntry.connect(this.allpassleft.input);
	this.allEntry.connect(this.allpassright.input);	

	this.allpassright.connect(this.gainR1);
	this.allpassleft.connect(this.gainL1);
	
	this.gainL1.connect(this.lowfiltL);
	this.gainR1.connect(this.lowfiltR);
	this.lowfiltL.connect(this.merger, 0 ,0);
	this.lowfiltR.connect(this.merger, 0, 1);
	
	this.merger.connect(this.allExit);
	this.allExit.connect(this.lowExit);
	
	this.lowEntry.connect(this.lowfilter);
	this.lowfilter.connect(this.lowExit);

	this.lowExit.connect(this.gain);
	this.gain.connect(this.gainscale);
	this.gainclean.connect(this.gainscale);

	this.gainscale.connect(this.output);
}

Reverb.prototype = Object.create(null, {
  connect: {
    value: function(dest) {
      this.output.connect(dest.input ? dest.input : dest);
    }
  },

  disconnect: {value: function() { this.output.disconnect(); }},

  toggle: {
    value: function(comb, low, all, only) {
	  this.input.disconnect()
	  this.combExit.disconnect();
      this.allExit.disconnect();

      if (!only) {
        this.input.connect(this.minDelay);
        this.minDelay.connect(this.gainclean);
        console.log("reverb + clean");
      } else {
        console.log("only reverb");
      }
      if (comb) {
        this.input.connect(this.combEntry);
        console.log("combs connected");
      } else {
        this.input.connect(this.combExit);
        console.log("combs disconnected");
      }

      if (all) {
        this.combExit.connect(this.allEntry);
        console.log("allpass connected");
      } else {
        this.combExit.connect(this.allExit)
        console.log("allpass disconnected");
      }

      if (low) {
        this.allExit.connect(this.lowExit)
        console.log("lowpass connected");
      } else {
        this.allExit.connect(this.lowExit);
        console.log("lowpass disconnected");
      }
    }
  },

  meta: {
    value: {
      name: 'Reverberator',
      params: {
        d: {min: 0.01, max: .1, defaultValue: .05, type: 'float'},
        g: {min: 0, max: 1, defaultValue: .5, type: 'float'},
        m: {min: -.012, max: .012, defaultValue: .006, type: 'float'},
        f: {min: 0, max: 22050, defaultValue: 22050, type: 'int'},
        E: {min: 0, max: 1, defaultValue: 1, type: 'float'},
        wetdry: {min: 0, max: 1, defaultValue: .85, type: 'float'}
      }
    }
  },

  d: {
    get: function() { return this.param.d; },
    set: function(value) {
      this.param.d = value;
      rt = this.param.d * Math.log(.001) / Math.log(this.param.g);
      for (i = 0; i < 6; i++) {
        var delay = this.param.d * (15 - i) / 15;
        delay = prevPrime(delay * fs) / fs;
        var gain = Math.pow(.001, delay / rt);
        this.combNodes[i].g2 = gain;
        this.combNodes[i].d = delay;
      }
    }
  },

  g: {
    get: function() { return this.param.g; },
    set: function(value) {
      this.param.g = value;
      rt = this.param.d * Math.log(.001) / Math.log(this.param.g);
      for (i = 0; i < 6; i++) {
        var delay = this.param.d * (15 - i) / 15;
        var gain = Math.pow(.001, delay / rt);
        this.combNodes[i].g2 = gain;
      }
    }
  },

  m: {
    get: function() { return this.param.m; },
    set: function(value) {
      this.param.m = value;
      da = mindelay + .006;
      var delayval = prevPrime((da - this.param.m / 2) * fs) / fs;
      this.allpassright.d = delayval;
      delayval = prevPrime((da + this.param.m / 2) * fs) / fs;
      this.allpassleft.d = delayval;
    }
  },

  f: {
    get: function() { return this.param.f; },
    set: function(value) {
      this.param.f = value;
      this.lowfilter.frequency.setValueAtTime(this.param.f, 0);
      this.lowfiltL.frequency.setValueAtTime(this.param.f, 0);
      this.lowfiltR.frequency.setValueAtTime(this.param.f, 0);
    }
  },

  E: {
    get: function() { return this.param.E; },
    set: function(value) {
      this.param.E = value;
      var totalGain = this.param.E + 1;
      var g1 = 1 / totalGain;

      this.gainclean.gain.value = Math.cos((1 - g1) * .125 * Math.PI);
      this.gain.gain.value = Math.cos(g1 * .375 * Math.PI);
      this.gainscale.gain.value =
          .5 * .8 / (this.gainclean.gain.value + this.gain.gain.value);
    }
  },

  /**
   * The ratio of reverb to dry signal. 1 = reverb only.
   * 
   * @member
   * @name Reverb~wetdry
   * @param {number} wetdry
   */
  wetdry: {
    get: function() { return this.param.wetdry; },
    set: function(value) {
      this.param.wetdry = value;
      this.wet.gain.value = Math.cos((1 - value) * .5 * Math.PI);
      this.dry.gain.value = Math.cos(value * .5 * Math.PI);
    }
  },

  settings: {
    get: function() {
      return [this.d, this.g, this.m, this.f, this.E, this.wetdry];
    },
    set: function(settings) {
      this.d = settings[0];
      this.g = settings[1];
      this.m = settings[2];
      this.f = settings[3];
      this.E = settings[4];
      this.wetdry = settings[5];
    }
  }
});
