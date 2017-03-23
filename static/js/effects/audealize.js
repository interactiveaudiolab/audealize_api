/*
audealize.js: implements a high-level audio effect node in Web Audio API. To use it, simply instantiate the Web Audio Node in your Web Audio graph, and give a reverb word or an eq word. 

Depends: reverb.js, equalizer.js, data.js, descriptor.js
*/

/**
 * Audealize AudioNode. See {@tutorial Audealize-tutorial}
 * @class
 * @name Audealize
 * @param {AudioContext} context 
 * @param {Object} opts - Can contain initial vlaues for eq_descriptor and reverb_descriptor
 */
function Audealize (context, opts) {
  this.input = context.createGain()
  this.output = context.createGain()

  curve = new Array(40).fill(0);
  this.eq = new Equalizer(context, { 'curve': curve })

  this.reverb = new Reverb(context)

  this.parameters = new Object()
  this.parameters.eq_descriptor = opts.eq_descriptor || 'bright'
  this.parameters.reverb_descriptor = opts.reverb_descriptor || 'crisp'
  this.parameters.eq_amount = opts.eq_amount || 1
  this.parameters.reverb_amount = opts.reverb_amount || .7

  // start out dry
  this.reverb.wetdry = 0

  this.input.connect(this.eq.input)
  this.eq.connect(this.reverb.input)
  this.reverb.connect(this.output)
}

Audealize.prototype = Object.create(null, {
  /**
   * Set bypass status for EQ and Reverb effects
   * @function
   * @name Audealize~bypass
   * @param {boolean} eq - If true, EQ will be enabled. If false, EQ will be
   * bypassed
   * @param {boolean} reverb - If true, EQ will be enabled. If false, EQ will be
   * bypassed
   */
  bypass: {
    value: function(eq, reverb) {
      if (eq) {
        this.eq.curve = descriptors['eq'][this.parameters.eq_descriptor]['settings']
      } else {
        this.eq.curve = new Array(40).fill(0)
      }
      if (reverb) {
        this.reverb.wetdry = this.parameters.wetdry
      } else {
        this.reverb.wetdry = 0
      }
    }
  },

  /**
   * Connect output of this node to the input of another AudioNode
   * @function
   * @name Audealize~connect
   * @param {AudioNode} dest - The node to connect to
   */
  connect: {
    value: function(dest) {
      this.output.connect(dest.input ? dest.input : dest)
    }
  },

  /**
   * Disconnect output of this node
   * @function
   * @name Audealize~disconnect
   */
  disconnect: {value: function() { this.output.disconnect(); }},

  /**
   * The EQ {@link Descriptor}.
   * Set with a string or Descriptor.
   * @member
   * @name Audealize~eq_descriptor
   */
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