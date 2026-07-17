# Attendance Backend

Spring Boot backend for the attendance system.

## Render deployment

Use Docker deployment on Render and set these environment variables:

- `DB_URL`
- `DB_USER`
- `DB_PASS`
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

For the first Render deploy, keep `FACE_SERVICE_ENABLED=false` unless the Python face service is deployed separately.
