const loginPageContainer = document.getElementById("loginPageContainer");
const videoContainer = document.getElementById("videoContainer");
const loginButton = document.getElementById("loginButton");
const faceIdButton = document.getElementById("faceIdButton");
const faceIDResult = document.getElementById("faceIDResult");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const video = document.getElementById("video");

const server = "http://127.0.0.1:5500";

let faceIDControl = false;
let localStream = null;
let LabeledFaceDescriptors = null;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri(`${server}/models`),
  faceapi.nets.faceLandmark68Net.loadFromUri(`${server}/models`),
  faceapi.nets.faceRecognitionNet.loadFromUri(`${server}/models`),
  faceapi.nets.ssdMobilenetv1.loadFromUri(`${server}/models`)
]).then(init);

async function init() {
  LabeledFaceDescriptors = await loadImages();
  faceIdButton.textContent = "Use FaceID"
  faceIdButton.style.cursor = "pointer";
  faceIdButton.style.pointerEvents = "all";
  faceIdButton.style.backgroundColor = "#5fc8e2cc"
};

function loadImages() {
  const label = ["user_1"];

  return Promise.all(
    label.map(async label => {
      const descriptions = [];
      for (let i = 1; i <= 3; i++) {
        const img = await faceapi.fetchImage(
          `${server}/users/${label}/${i}.jpg`
        );

        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
};

function startCamera() {
  navigator.getUserMedia(
    {
      video: {}
    },
    stream => {
      localStream = stream;
      video.srcObject = stream;
    },
    err => console.log(err)
  );
}
function stopCamera() {
  video.pause();
  video.srcObject = null;
  localStream.getTracks().forEach(track => {
    track.stop();
  });
}

faceIdButton.addEventListener("click", () => {
  faceIDControl = !faceIDControl;
  usernameInput.disabled = faceIDControl;
  passwordInput.disabled = faceIDControl;

  if (faceIDControl) {
    videoContainer.classList.add("faceIDShow");
    loginPageContainer.classList.add("faceIDActive");
    faceIdButton.classList.add("active");
    loginButton.style.display = "none";
    faceIdButton.textContent = "Back to Login";
    startCamera();
  } else {
    videoContainer.classList.remove("faceIDShow");
    loginPageContainer.classList.remove("faceIDActive");
    faceIdButton.classList.remove("active");
    loginButton.style.display = "block";
    faceIdButton.textContent = "Use FaceID";
    faceIDResult.textContent = "";
    faceIDResult.style.display = "none";
    stopCamera();
  }
});

video.addEventListener("play", async () => {
  const boxSize = {
    width: video.width,
    height: video.height
  };

  let cameraInterval = setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, boxSize);
    const faceMatcher = new faceapi.FaceMatcher(LabeledFaceDescriptors, 0.6);

    const results = resizedDetections.map(d =>
      faceMatcher.findBestMatch(d.descriptor)
    );
      console.log(results)
    if (results.length > 0) {
      faceIDResult.textContent = "Login successful! Redirecting ...";
      faceIDResult.classList = [];
      faceIDResult.classList.add("success");
      faceIDResult.style.display = "block";
      clearInterval(cameraInterval);
      setTimeout(() => {
        location.href = "https://github.com/TolunayEmre";
      }, 2000);
    } else {
      faceIDResult.textContent = "Login failed! Trying again, please wait...";
      faceIDResult.classList = [];
      faceIDResult.classList.add("error");
      faceIDResult.style.display = "block";
    }
  }, 100);
});
