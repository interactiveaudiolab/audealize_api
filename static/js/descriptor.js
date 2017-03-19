/* descriptor.js Depends: data.js */

/**
 * Class containing information about an effect descriptor
 * @class
 * @name Descriptor
 * @param {string} word - The semantic descriptor
 * @param {string} effect - The audio effect described by the word (eq or reverb)
 */
function Descriptor (word, effect) {
  effect = effect.toLowerCase()
  word = word.toLowerCase()
  if (effect !== 'eq' && effect !== 'reverb') {
    throw new Error("Effect must be 'eq' or 'reverb.'")
  }
  if (!(word in descriptors[effect])) {
    throw new Error('Word not in ' + effect + ' dictionary.')
  }

  /**
   * The semantic descriptor
   * @member {string}
   * @name Descriptor~word
   */
  this.word = word
  /**
   * The audio effect described by the word (eq or reverb)
   * @member {string}
   * @name Descriptor~effect
   */
  this.effect = effect
  /**
   * The audio effect parameters corresponding to the descriptor
   * @member {array}
   * @name Descriptor~settings
   */
  this.settings = descriptors[effect][word]['settings']
  /**
   * The agreement score
   * @member {number}
   * @name Descriptor~agreement
   */
  this.agreement = descriptors[effect][word]['agreement']
  /**
   * The number of submissions for the descriptor
   * @member {number}
   * @name Descriptor~num
   */
  this.num = descriptors[effect][word]['num']
  /**
   * The x coordinate of this descriptor when mapped to a 2d space
   * @member {number}
   * @name Descriptor~x
   */
  this.x = descriptors[effect][word]['x']
  /**
  * The y coordinate of this descriptor when mapped to a 2d space
  * @member {number}
  * @name Descriptor~y
  */
  this.y = descriptors[effect][word]['y']
}
