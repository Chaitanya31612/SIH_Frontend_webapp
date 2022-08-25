var audio = document.querySelector("audio");
var h1 = document.querySelector("h1");
var default_h1 = h1.innerHTML;

function captureMicrophone(callback) {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(callback)
    .catch(function (error) {
      alert("Unable to access your microphone.");
      console.error(error);
    });
}

function stopRecordingCallback() {
  audio.srcObject = null;
  var blob = recorder.getBlob();
  console.log(blob);

  var reader = new FileReader();
  reader.readAsDataURL(blob);

  reader.onloadend = function () {
    var base64String = reader.result;
    console.log("Base64 String - ", base64String);

    var obj = {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filedata: base64String,
      }),
    };

    fetch("http://localhost:8000/predict-base64/", obj)
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        var myTextarea = document.getElementById("myTextarea");
        myTextarea.append(json.transcribed_text);

        console.log(json);
      })
      .catch((err) => {
        console.error(err);
      });
  };
  audio.src = URL.createObjectURL(blob);

  recorder.microphone.stop();
  audio.muted = true;
}

var recorder; // globally accessible

document.getElementById("btn-start-recording").onclick = function () {
  this.disabled = true;
  var greenButton = document.getElementsByClassName("mic_stop")[0];
  greenButton.classList.add("hide");
  var redButton = document.getElementsByClassName("mic_start")[0];
  redButton.classList.remove("hide");

  captureMicrophone(function (microphone) {
    audio.srcObject = microphone;

    recorder = RecordRTC(microphone, {
      type: "audio",
      recorderType: StereoAudioRecorder,
      desiredSampRate: 16000,
    });

    recorder.startRecording();

    var max_seconds = 1;
    var stopped_speaking_timeout;
    var speechEvents = hark(microphone, {});

    speechEvents.on("speaking", function () {
      // console.log(recorder.getBlob());
      if (recorder.getBlob()) return;

      clearTimeout(stopped_speaking_timeout);

      if (recorder.getState() === "paused") {
        // recorder.resumeRecording();
      }

      h1.innerHTML = default_h1;
    });

    speechEvents.on("stopped_speaking", function () {
      // console.log(recorder.getBlob());
      if (recorder.getBlob()) return;

      // recorder.pauseRecording();
      stopped_speaking_timeout = setTimeout(function () {
        document.getElementById("btn-stop-recording").click();
        h1.innerHTML = "Recording is now stopped.";
      }, max_seconds * 1000);

      // just for logging purpose (you ca remove below code)
      var seconds = max_seconds;
      (function looper() {
        h1.innerHTML =
          "Recording is going to be stopped in " + seconds + " seconds.";
        seconds--;

        if (seconds <= 0) {
          h1.innerHTML = default_h1;
          return;
        }

        setTimeout(looper, 1000);
      })();
    });

    // release camera on stopRecording
    recorder.microphone = microphone;

    document.getElementById("btn-stop-recording").disabled = false;
  });
};

document.getElementById("btn-stop-recording").onclick = function () {
  this.disabled = true;
  var greenButton = document.getElementsByClassName("mic_stop")[0];
  greenButton.classList.remove("hide");
  var redButton = document.getElementsByClassName("mic_start")[0];
  redButton.classList.add("hide");
  recorder.stopRecording(stopRecordingCallback);
};
