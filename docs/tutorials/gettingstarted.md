Audealize is a Web Audio [AudioNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioNode). It can be used as a part of a Web Audio graph to apply equalization and reverberation effects to audio. 

Start by creating an [AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext) and an audio source. For this example we’ll use an [OscillatorNode](https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode) to generate a 1000 Hz square wave.

	var context = new AudioContext();
	var oscillator = context.createOscillator();
	oscillator.type = 'square';
	oscillator.frequency = 1000;
	oscillator.start();

Create an Audealize node, passing our AudioContext as an argument.

	var audealize = new Audealize(context);

Connect our source buffer to the Audealize node. Then connect the Audealize node to our output. 

	oscillator.connect(audealize.input);
	audealize.connect(context.destination);

## Controlling the Effects

At this point, you should hear a dry saw wave. To add EQ and reverb effects, set {@link Audealize~eq\_descriptor eq\_descriptor} and {@link Audealize~reverb\_descriptor reverb\_descriptor}. This will engage both effects.

	audealize.eq_descriptor = 'bright';
	audealize.reverb_descriptor = 'hall';

To change the amount of each effect, use the {@link Audealize~eq\_amount eq\_amount} and {@link Audealize~reverb\_amount reverb\_amount} parameters. 

{@link Audealize~reverb\_amount reverb\_amount} is the ratio between dry and wet signals. It must be a value between 0 and 1.

	audealize.reverb_amount = 1; // The node will now output only the reverb signal
	audealize.reverb_amount = 0; // The node will now output only the dry signal.
	audealize.reverb_amount = 0.5; // The node will now output a mix of reverb and dry signals

{@link Audealize~eq\_amount eq\_amount} scales the range of the EQ curve, making the effect more or less intense. Negative values will cause the EQ to apply the inverse of the descriptor’s effect.

	audealize.eq_amount = 1; // The default value
	audealize.eq_amount = 2; // A more intense curve (more 'bright')
	audealize.eq_amount = 0.5; // A less intense curve (less 'bright')
	audealize.eq_amount = 0; // A flat curve (no effect)
	audealize.eq_amount = -1; // The opposite of 'bright'

To disable or enable an effect, set {@link Audealize~eq\_on eq\_on} or {@link Audealize~reverb\_on reverb\_on}.

	audealize.eq_on = false; // EQ is now bypassed
	audealize.reverb_on = false; // Reverb is now bypassed

## Descriptor Data

The EQ and reverb descriptors contain additional information. (See {@link Descriptor})
	
	var reverb_descriptor = audealize.reverb_descriptor
	console.log(JSON.stringify(reverb_descriptor))
 
Output:

    {
    	"word": "crisp", 
    	"effect": "reverb",
    	"settings":[0.02565566318,0.1703046892,-0.007168177493,3815.808202,0.7850597401,1],
    	"num": 62,
		"agreement": 0.2393311015787082,
    	"x": 0.08517147812765787,
    	"y": 0.09099208391366857
    }

{@link Descriptor} properties:

* **{@link Descriptor~word word}:** The semantic descriptor

* **{@link Descriptor~effect effect}:** The audio effect described by the word (eq or reverb)

* **{@link Descriptor~settings settings}:** The audio effect parameters corresponding to the descriptor

* **{@link Descriptor~num num}:** The number of crowdsourced submissions upon which the descriptor definition is based

* **{@link Descriptor~agreement agreement}:** The level of agreement between different submissions for the word

* **{@link Descriptor~x x}:** The x coordinate of this descriptor when parameter space is projected onto a 2d space

* **{@link Descriptor~y y}:** The y coordinate of this descriptor when parameter space is projected onto a 2d space
