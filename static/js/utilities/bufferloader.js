/*
This file loads a list of urls to audio files into 
AudioBuffer constructs usable by the Web Audio API,
asynchronously. This is how we load the audio files
used in the app.
*/

function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  // Load buffer asynchronously
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var loader = this;

  request.onload = function() {
  	var audioData = request.response;
  	var buffer;
	context.decodeAudioData(audioData,
							function (decodedAudio) {
								buffer = decodedAudio;
								loader.bufferList[index] = buffer;
								if (++loader.loadCount == loader.urlList.length)
									loader.onload(loader.bufferList);
							},
							function () {
								console.log('error decoding audio');
								$('.import-error').modal('show');
							});
  /*
    // Asynchronously decode the audio file data in request.response
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length)
          loader.onload(loader.bufferList);
      }
    );
*/
  }
  request.onerror = function() {
    alert('BufferLoader: XHR error');
  }

  request.send();
}

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.urlList.length; ++i)
  this.loadBuffer(this.urlList[i], i);
}

