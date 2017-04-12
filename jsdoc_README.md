# Audealize API
A Web Audio node to encourage fast prototyping of semantic audio applications. 
___
![Audealize](https://github.com/interactiveaudiolab/audealize_api/blob/master/docs/img/propreverbcontroller.png?raw=true)

Audealize API provides a natural language interface for controlling two audio effects: equalization and reverberation. The API provides a Web Audio AudioNode that uses crowdsourced mappings between descriptions and low-level signal parameters to allow a user to control the settings of each effect by specifying a word (e.g. "bright", "warm") that describes their desired sound. We hope that this node will be useful for implementing audio production interfaces based on natural language on the web.

# Download
[Download Audealize API in one minified .js file here.](https://raw.githubusercontent.com/interactiveaudiolab/audealize_api/master/audealize.min.js?token=ANbNLpSuNTILJ-w22goMutRzKyBZpqVGks5Y9rJ6wA%3D%3D)

# Getting Started

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