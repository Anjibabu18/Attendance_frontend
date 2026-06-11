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


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "detectorBackend": DETECTOR_BACKEND,
        "distanceMetric": DISTANCE_METRIC,
    }


@app.post("/verify")
async def verify(profile: UploadFile = File(...), punch: UploadFile = File(...)):
    profile_path = await _save_upload(profile, "profile")
    punch_path = await _save_upload(punch, "punch")
    try:
        from deepface import DeepFace

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
        return {
            "verified": bool(result.get("verified", False)),
            "score": round(score, 4),
            "distance": round(distance, 6),
            "threshold": round(threshold, 6),
            "model": MODEL_NAME,
            "detectorBackend": DETECTOR_BACKEND,
            "distanceMetric": DISTANCE_METRIC,
        }
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"Face not detected clearly: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Face verification failed: {exc}") from exc
    finally:
        _delete(profile_path)
        _delete(punch_path)


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
