# Attendance Face Recognition Service

Local Python service used by the Spring Boot backend for real face verification.

## Setup

```powershell
cd face-service
C:\tmp\attendance-face-env\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 5055
```

The local install on this machine uses `C:\tmp\attendance-face-env\.venv` because OneDrive blocked pip writes inside the project folder.

Then enable it in `backend/src/main/resources/application.properties` or environment variables:

```properties
app.face.serviceEnabled=true
app.face.serviceUrl=http://localhost:5055/verify
```

Flow:

1. Employee uploads a profile photo in the frontend.
2. Employee check-in/check-out sends selfie to Spring Boot.
3. Spring Boot downloads the profile photo and sends profile + selfie to this Python service.
4. Python DeepFace returns `score` and `verified`.
5. Spring Boot stores `checkInFaceScore`, `checkInFaceVerified`, `checkOutFaceScore`, and `checkOutFaceVerified`.
