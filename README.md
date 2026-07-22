# Attendance Management System

Stack:
- Backend: Java 17 + Spring Boot + MySQL + JWT
- Frontend: React + TypeScript + Vite + MUI
- Photos: Cloudinary (photo per company role)

## Production-ready highlights

- Location-wise assignment: Admin can create multiple office GPS geofences and assign each employee to an office.
- Secure self punch: Employee check-in/out validates GPS radius against the assigned office and requires a selfie upload.
- Advanced attendance analytics: automatic late minutes, early-leave minutes, overtime minutes, full-day/half-day thresholds, and configurable grace periods.
- Role-based access: Admin, HR, and Employee APIs are separated with Spring Security method rules.
- Strong authentication: JWT issuer validation, configurable CORS, login attempt lockout, and password policy enforcement.
- Company workflow: HR attendance marking, employee leave requests, HR approval/rejection, holidays, daily group photos, and monthly summaries.

## 1) MySQL setup

Create database:
```sql
CREATE DATABASE attendance;
```

## 2) Backend setup (Spring Boot)

From `backend/`:
```powershell
mvn spring-boot:run
```

Environment variables (PowerShell example):
```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/attendance?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata"
$env:DB_USER="root"
$env:DB_PASS="YOUR_PASSWORD"

# Use a long random secret (32+ chars)
$env:JWT_SECRET="use-a-long-random-secret-32-plus-characters"
$env:CORS_ALLOWED_ORIGINS="http://localhost:5173"
$env:JWT_EXPIRES_MINUTES="1440"
$env:LOGIN_MAX_ATTEMPTS="5"
$env:LOGIN_LOCK_MINUTES="1"
$env:PASSWORD_MIN_LENGTH="10"

# Optional: seed initial admin (created once if not exists)
$env:INIT_ADMIN_USERNAME="YOUR_ADMIN_USERNAME"
$env:INIT_ADMIN_PASSWORD="YOUR_ADMIN_PASSWORD"

# Optional: seed initial HR login (created once if not exists)
$env:INIT_HR_USERNAME="YOUR_HR_USERNAME"
$env:INIT_HR_PASSWORD="YOUR_HR_PASSWORD"

# Optional: working-days config
$env:DEFAULT_JOIN_DATE="2026-01-19"
# Weekly holidays are set by Admin in the UI (stored in DB)

# Optional: Cloudinary (needed only for company role photo uploads)
$env:CLOUDINARY_CLOUD_NAME="YOUR_CLOUD_NAME"
$env:CLOUDINARY_API_KEY="YOUR_API_KEY"
$env:CLOUDINARY_API_SECRET="YOUR_API_SECRET"

# Optional: Email notifications (leave requests -> HR, decision -> employee)
# Turn on only if you have SMTP credentials.
$env:MAIL_ENABLED="true"
$env:MAIL_FROM="no-reply@yourdomain.com"
$env:MAIL_HOST="smtp.gmail.com"
$env:MAIL_PORT="587"
$env:MAIL_USER="your-smtp-user"
$env:MAIL_PASS="your-smtp-password"
# Optional override: comma-separated HR recipient emails
$env:MAIL_HR_RECIPIENTS="hr1@yourdomain.com,hr2@yourdomain.com"
```

Admin seeding (first run only): set `INIT_ADMIN_USERNAME` + `INIT_ADMIN_PASSWORD`.
Seed passwords must satisfy the configured password policy.

Local development default credentials (when no seed env vars are set and database is empty):
- Admin: `admin` / `Admin@12345!`
- HR: `hr` / `HrUser@12345!`

## Production deployment checklist

Before submitting or deploying for a company:

- Set `JWT_SECRET` to a real random value; the backend rejects the default placeholder.
- Set `CORS_ALLOWED_ORIGINS` to the deployed frontend domain only, for example `https://your-attendance-app.com`.
- Use a production MySQL database with a non-root `DB_USER` and a strong `DB_PASS`.
- Keep `INIT_ADMIN_PASSWORD`, SMTP, Cloudinary, and database credentials in the hosting provider environment, not in Git.
- Create at least one office location in Admin, then assign employees to their correct office.
- Use HTTPS for both frontend and backend.
- Disable seed credentials after first production admin creation by setting `app.seed.enabled=false` or removing seed env vars.

## 3) Frontend setup (React)

From `frontend/`:
```powershell
npm install
npm run dev
```

Create `frontend/.env`:
```bash
VITE_API_URL=http://localhost:8081
```

If you want to use the deployed backend instead, set:
```bash
VITE_API_URL=https://attendance-backend-hv7t.onrender.com
```

Note: Vite reads env vars at startup, so restart `npm run dev` after changing `.env`.

## 4) How it works

- Admin:
  - Create Company Roles and upload Role Photo
  - Create HR login
  - Create Employee (employee number + name + login + company role + assigned office)
  - Create multiple office locations and assign employees location-wise
  - Set default In/Out time and weekly holidays (weekends)
  - Configure full-day, half-day, late grace, early-leave grace, and overtime thresholds
  - Add festival holidays (shows as `H`)
- HR:
  - Mark/Update attendance with `inTime` and `outTime` (defaults set by Admin)
  - Mark Leave (L) for a date
  - Bulk update a date range (e.g. Jan 19 -> today) with same in/out time
  - Review late, early-leave, and overtime analytics
  - Upload daily group photo for a selected date
  - Status is `P` if worked time >= full day threshold, `HD` if >= half day threshold, else `L`
- Employee:
  - Select month and view calendar
  - `P` shows in green, `HD` shows in amber, `L` shows in red
  - `H` shows in purple (holiday)
  - Self check-in/out with GPS validation and selfie photo

## Notes

- Do not commit secrets (DB password, Cloudinary keys, JWT secret). Keep them in environment variables or `.env` files.
- Weekly holidays (weekends) are configured by Admin and shown as `H`.
- Festival holidays are configured by Admin and shown as `H`.
