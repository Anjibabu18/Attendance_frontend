const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const loadFaceModels = async (faceapi: any) => {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
};

export const waitForVideoFrame = async (video: HTMLVideoElement) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) return;
    await wait(150);
  }
  throw new Error("Camera frame is not ready yet. Please wait a second and try again.");
};

export const detectReliableFace = async (faceapi: any, videoOrCanvas: HTMLVideoElement | HTMLCanvasElement) => {
  if (videoOrCanvas instanceof HTMLVideoElement) {
    await waitForVideoFrame(videoOrCanvas);
  }

  const tinyOptions = [
    new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.25 }),
    new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.18 }),
    new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.12 }),
  ];
  const ssdOptions = [
    new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 }),
    new faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 }),
  ];

  for (let attempt = 0; attempt < 5; attempt += 1) {
    for (const options of tinyOptions) {
      const detection = await faceapi.detectSingleFace(videoOrCanvas, options).withFaceLandmarks().withFaceDescriptor();
      if (detection) return detection;
    }
    for (const options of ssdOptions) {
      const detection = await faceapi.detectSingleFace(videoOrCanvas, options).withFaceLandmarks().withFaceDescriptor();
      if (detection) return detection;
    }
    await wait(220);
  }

  return null;
};
