# Deployment

This project is prepared for split deployment:

- Backend repository: `https://github.com/Anjibabu18/Attendance_Backend.git`
- Frontend repository: `https://github.com/Anjibabu18/Attendance_frontend.git`

## Push clean split repos

Make sure Windows Git is logged in as `Anjibabu18`, then run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\push-split-repos.ps1
```

## Render backend (Node.js)

Use the `backend-node` folder. Render can build it via the `Dockerfile`.

Set these Render environment variables:

- `DATABASE_URL=mysql://avnadmin:your-db-password@mysql-3bafb0f2-anushamilktrading-4564.b.aivencloud.com:26783/attendance`
- `PORT=8081`
- `JWT_SECRET` (auto-generated or set your custom string)
- `CORS_ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `MAIL_HOST`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`

Add GitHub secret `RENDER_DEPLOY_HOOK_URL` in the backend repo if you want GitHub Actions to trigger Render redeploys.

## Vercel frontend

Set this Vercel environment variable:

- `VITE_API_URL=https://your-render-backend.onrender.com`

Redeploy frontend after changing `VITE_API_URL`.
