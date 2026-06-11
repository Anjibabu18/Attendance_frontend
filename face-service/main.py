import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Attendance Face Recognition Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

MODEL_NAME = os.getenv("FACE_MODEL_NAME", "Facenet512")
DETECTOR_BACKEND = os.getenv("FACE_DETECTOR_BACKEND", "opencv")
DISTANCE_METRIC = os.getenv("FACE_DISTANCE_METRIC", "cosine")
MIN_FACE_SCORE = float(os.getenv("FACE_MIN_SCORE", "0.70"))
MIN_BRIGHTNESS = float(os.getenv("FACE_MIN_BRIGHTNESS", "35"))
MIN_BLUR = float(os.getenv("FACE_MIN_BLUR", "18"))
MIN_FACE_AREA_RATIO = float(os.getenv("FACE_MIN_FACE_AREA_RATIO", "0.015"))


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "detectorBackend": DETECTOR_BACKEND,
        "distanceMetric": DISTANCE_METRIC,
        "minFaceScore": MIN_FACE_SCORE,
        "quality": {
            "minBrightness": MIN_BRIGHTNESS,
            "minBlur": MIN_BLUR,
            "minFaceAreaRatio": MIN_FACE_AREA_RATIO,
        },
    }


@app.post("/verify")
async def verify(profile: UploadFile = File(...), punch: UploadFile = File(...)):
    profile_path = await _save_upload(profile, "profile")
    punch_path = await _save_upload(punch, "punch")
    try:
        from deepface import DeepFace

        profile_quality = _detect_quality(profile_path)
        punch_quality = _detect_quality(punch_path)
        _raise_if_bad_quality(profile_quality, "Profile photo")
        _raise_if_bad_quality(punch_quality, "Punch selfie")

        result = DeepFace.verify(
            img1_path=str(profile_path),
            img2_path=str(punch_path),
            model_name=MODEL_NAME,
            detector_backend=DETECTOR_BACKEND,
            distance_metric=DISTANCE_METRIC,
            enforce_detection=True,
        )
        distance = float(result.get("distance", 1.0))
        threshold = float(result.get("threshold", 0.68))
        score = max(0.0, min(1.0, 1.0 - (distance / threshold))) if threshold > 0 else 0.0
        deepface_verified = bool(result.get("verified", False))
        verified = deepface_verified and score >= MIN_FACE_SCORE
        return {
            "verified": verified,
            "deepfaceVerified": deepface_verified,
            "score": round(score, 4),
            "distance": round(distance, 6),
            "threshold": round(threshold, 6),
            "model": MODEL_NAME,
            "detectorBackend": DETECTOR_BACKEND,
            "distanceMetric": DISTANCE_METRIC,
            "quality": {
                "profile": profile_quality,
                "punch": punch_quality,
            },
            "message": "Verified" if verified else f"Face score below required {int(MIN_FACE_SCORE * 100)}%",
        }
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"Face not detected clearly: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Face verification failed: {exc}") from exc
    finally:
        _delete(profile_path)
        _delete(punch_path)


@app.post("/detect")
async def detect(image: UploadFile = File(...)):
    image_path = await _save_upload(image, "detect")
    try:
        quality = _detect_quality(image_path)
        accepted, message = _quality_acceptance(quality)
        return {
            "faceDetected": accepted,
            "faceCount": quality["faceCount"],
            "detectorBackend": DETECTOR_BACKEND,
            "message": message,
            "quality": quality,
        }
    except ValueError as exc:
        return {
            "faceDetected": False,
            "faceCount": 0,
            "detectorBackend": DETECTOR_BACKEND,
            "message": f"Face not detected clearly: {exc}",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Face detection failed: {exc}") from exc
    finally:
        _delete(image_path)


async def _save_upload(upload: UploadFile, label: str) -> Path:
    suffix = Path(upload.filename or f"{label}.jpg").suffix or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
      tmp.write(await upload.read())
      return Path(tmp.name)


def _delete(path: Path):
    try:
        path.unlink(missing_ok=True)
    except Exception:
        pass


def _detect_quality(image_path: Path) -> dict:
    import cv2
    from deepface import DeepFace

    image = cv2.imread(str(image_path))
    if image is None:
        raise ValueError("Unreadable image")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    brightness = float(gray.mean())
    blur = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    height, width = gray.shape[:2]

    faces = DeepFace.extract_faces(
        img_path=str(image_path),
        detector_backend=DETECTOR_BACKEND,
        enforce_detection=True,
        align=True,
    )
    face_count = len(faces)
    largest_ratio = 0.0
    for face in faces:
        area = face.get("facial_area") or {}
        face_area = float(area.get("w", 0) * area.get("h", 0))
        largest_ratio = max(largest_ratio, face_area / float(width * height))

    accepted, message = _quality_acceptance({
        "faceCount": face_count,
        "brightness": brightness,
        "blur": blur,
        "largestFaceAreaRatio": largest_ratio,
    })
    return {
        "faceCount": face_count,
        "brightness": round(brightness, 2),
        "blur": round(blur, 2),
        "largestFaceAreaRatio": round(largest_ratio, 4),
        "accepted": accepted,
        "message": message,
    }


def _quality_acceptance(quality: dict) -> tuple[bool, str]:
    face_count = int(quality.get("faceCount", 0))
    if face_count <= 0:
        return False, "No clear face detected"
    if face_count > 1:
        return False, "Multiple faces detected. Use one person only"
    if float(quality.get("brightness", 0)) < MIN_BRIGHTNESS:
        return False, "Photo is too dark. Move to better light"
    if float(quality.get("blur", 0)) < MIN_BLUR:
        return False, "Photo is blurry. Hold camera steady"
    if float(quality.get("largestFaceAreaRatio", 0)) < MIN_FACE_AREA_RATIO:
        return False, "Face is too small. Move closer to camera"
    return True, "Face quality accepted"


def _raise_if_bad_quality(quality: dict, label: str):
    if not quality.get("accepted", False):
        raise ValueError(f"{label}: {quality.get('message', 'Face quality failed')}")
