Audealize is capable of searching for synonyms and similar words when presented with an unknown descriptor.

To find synonyms, the node accesses a thesaurus service provided by [http://words.bighugelabs.com](http://words.bighugelabs.com). In order to use this functionality, the Audealize node must be provided with an API key. To get your API key, go to [http://words.bighugelabs.com/getkey.php](http://words.bighugelabs.com/getkey.php) and create an account.

Once you have an API key, the Audealize node should be instantiated as follows:

    var audealize = new Audealize(context, 'Your API Key');

Now, if {@link Audealize~eq\_descriptor eq\_descriptor} or {@link Audealize~reverb\_descriptor reverb\_descriptor} are set with a word not in Audealize's dictionary, the node will attempt to find a synonym of the desired word that is in it's dictionary. If no synonyms are found, the desriptor will revert to its previous value.
