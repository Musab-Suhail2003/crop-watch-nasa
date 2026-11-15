# Deploying Crop-Watch AI

The frontend (React + Vite) goes on **Vercel**. The backend (FastAPI) goes on **Render** as a Docker web
service, because it keeps NASA and SoilGrids caches and a small farms database on disk and makes long NASA
requests, which serverless functions handle poorly.

```
Browser ──https──> Vercel (static app) ──https──> Render (FastAPI, /api/...) ──> NASA POWER, SoilGrids, ...
```

Files used: `render.yaml` (backend blueprint), `backend/Dockerfile`, `frontend/vercel.json`.
No secrets are needed: the Earthdata login in `backend/.env` is only for the download scripts. Never upload it.

## 1. Push to GitHub

Merge your work into `main` and push. Both Render and Vercel deploy from the GitHub repository.

## 2. Backend on Render

1. render.com → **New → Blueprint** → choose this repository. Render reads `render.yaml` and creates
   `crop-watch-api` (Docker, free plan, health check `/health`).
2. When asked for `CORS_ORIGINS`, enter a placeholder for now: `["http://localhost:5173"]`.
3. Deploy. Your API address looks like `https://crop-watch-api.onrender.com`.
   Check it: `https://crop-watch-api.onrender.com/health` shows `{"status":"ok"}` and `/docs` shows the API.

## 3. Frontend on Vercel

1. vercel.com → **Add New → Project** → import this repository.
2. **Root Directory:** `frontend`. Vercel reads `frontend/vercel.json` (Vite, `npm run build`, output `dist`).
3. **Environment Variables:** `VITE_API_BASE_URL` = `https://crop-watch-api.onrender.com/api`
   (your Render address + `/api`). It is built into the app, so redeploy after changing it.
4. Deploy. Your app address looks like `https://crop-watch-ai.vercel.app`.

## 4. Connect them

On Render → `crop-watch-api` → **Environment** → set
`CORS_ORIGINS` = `["https://crop-watch-ai.vercel.app"]` (your real Vercel address, no trailing slash; add
more addresses inside the brackets, comma-separated). Save; Render redeploys.

Open the Vercel address: the weather tiles and crop plans should load. If the browser console shows a
CORS error, the Vercel address in `CORS_ORIGINS` does not match exactly.

## Good to know

- **HTTPS:** both sites are https, so "Use my location" works on phones.
- **Free Render plan sleeps** after about 15 minutes idle; the next visit waits about a minute while it
  starts. Open the app a few minutes before a demo, or use a paid instance.
- **Caches reset on each Render deploy or restart.** The first comparison for a new place can then take up to
  a minute (mostly the SoilGrids soil service); repeats are fast. The four demo districts are pre-loaded at
  start-up (`WARM_UP_DEMO_DISTRICTS`).
- **Saved farms** are stored in a SQLite file that the free plan does not keep across deploys. Add a Render
  persistent disk mounted at `/app/var` if they must survive.
- **Vercel preview deployments** get their own addresses; add one to `CORS_ORIGINS` if you want it to reach the API.

## Run the production setup locally

```bash
docker compose up --build    # http://localhost:8080 (nginx serves the app and forwards /api to the backend)
```
