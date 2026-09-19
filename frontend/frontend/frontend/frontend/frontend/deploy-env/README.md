# Vercel Env Import Guide

Backend project env file:
- deploy-env/backend-vercel.env

Frontend project env file:
- deploy-env/frontend-vercel.env

Before deploying:
1. In backend-vercel.env, replace https://YOUR-FRONTEND.vercel.app with your real frontend Vercel URL after frontend deploy.
2. In frontend-vercel.env, replace https://YOUR-BACKEND.vercel.app with your real backend Vercel URL after backend deploy.
3. Add these variables manually in Vercel Project Settings > Environment Variables.
4. Redeploy both projects after changing env values.

Do not commit deploy-env/*.env files to GitHub.