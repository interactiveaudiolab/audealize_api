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
  eq_descriptor: {
    get: function() {
      return new Descriptor(this.parameters.eq_descriptor, 'eq');
    },
    set: function(word) {
      word = word.word ? word.word : word.toLowerCase()

      if (word in descriptors['eq']) {
        console.log('(Audealize) Changed eq setting to ' + word)
        this.eq.curve = descriptors['eq'][word]['settings']
        this.parameters.eq_descriptor = word
      }
      else {
        console.log('(Audealize) Looking for synonyms...')
        var synonyms = this.get_synonyms(word)
        if (synonyms.length == 0) {
          console.log('(Audealize) No synonyms found')
          return
        }
        for (var syn in synonyms) {
          if (syn in descriptors['eq']) {
            this.parameters.eq_descriptor = syn
            this.eq.curve =
              descriptors['eq'][syn]['settings']
            console.log('(Audealize) Synonym found: ' + syn)
            return
          }
          console.log('(Audealize) No synonyms found')
        }
      }
    }
  },

  /**
   * The reverb {@link Descriptor}.
   * Set with a string or Descriptor.
   * @member
   * @name Audealize~reverb_descriptor
   */
  reverb_descriptor: {
    get: function() {
      return new Descriptor(this.parameters.reverb_descriptor, 'reverb');
    },
    set: function(word) {
      word = word.word ? word.word : word.toLowerCase()

      if (word in descriptors['reverb']) {
        this.reverb.settings = descriptors['reverb'][word]['settings']
        this.reverb.wetdry = this.parameters.reverb_amount
        this.parameters.reverb_descriptor = word
        console.log('(Audealize) Changed reverb setting to ' + word)
      }
      else {
        console.log('(Audealize) looking for synonyms...')

        var synonyms = this.get_synonyms(word)
        if (synonyms.length = 0) {
          console.log('(Audealize) No synonyms found')
          return
        }
        // find first synonym that's in the reverb dictionary
        for (var syn in synonyms) {
          if (syn in descriptors['reverb']) {
            this.parameters.reverb_descriptor = syn
            this.reverb.settings = descriptors['reverb'][syn]['settings']
            this.reverb.wetdry = this.parameters.reverb_amount
            console.log('(Audealize) Synonym found: ' + syn)
          }
          console.log('(Audealize) No synonyms found')
        }
      }
    }
  },


  /**
   * The intensity of the EQ effect. Default = 1.0
   * Set with a positive number
   * @member
   * @name Audealize~eq_amount
   */
  eq_amount: {
    get: function() { return this.parameters.eq_amount },
    set: function(amount) {
      this.parameters.eq_amount = amount
      this.eq.range = amount / 5. // eq multiplies range by 5 before scaling gain vals
    }
  },

  /**
   * The ratio of reverb to dry signal. 1 = reverb only. 0 = dry signal only
   * Set with a number  [0,1]
   * @member
   * @name Audealize~reverb_amount
   */
  reverb_amount: {
    get: function() { return this.parameters.reverb_amount },
    set: function(amount) {
      this.parameters.reverb_amount = amount;
      this.reverb.wetdry = amount;
    }
  },


  // For internal use only
  get_synonyms: {
    value: function(word) {
      var url = 'http://words.bighugelabs.com/api/2/4cdc8dfc9297f52969df235e3b339e63/'
      word = word.replace(/' '/g, '%20')
      var fullurl = url + word + '/json'
      var response = ''

      $.post(fullurl, {}, function(repl) {
         response = repl
      }, 'json').fail(function (x) { console.log(x) })
      
      var synonyms = []
      for (var mainkey in response) {
        for (var subkey in response[mainkey]) {
          if (subkey != 'ant') {
            for (var syn in response[mainkey][subkey]) {
              synonyms.push(syn)
            }
          }
        }
      }
      return synonyms
    }
  },
})