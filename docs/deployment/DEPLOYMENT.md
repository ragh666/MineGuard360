# MineGuard360 — Production Deployment Guide

This document describes how to deploy the MineGuard360 platform as **two independent frontend applications** connected to **one central backend and WebSocket server**.

---

## Architecture Overview

```
                        [ Central Backend ]
                     (Render / Railway / EC2)
                     https://api.mineguard360.io
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
       [ Driver Display ]             [ Dashboard ]
            (Vercel)                      (Vercel)
https://mineguard-driver.vercel.app  https://mineguard-dash.vercel.app
```

---

## Step 1: Deploy Backend (Express + Socket.IO)

The backend must be deployed first so that you obtain its public URL.

### Recommended Providers
- Render (Web Service)
- Railway
- Fly.io
- AWS EC2 / DigitalOcean Droplet

### Deployment Steps (e.g. Render)
1. Point your service to the repository root with working directory `backend` (or run from root with `npm run start:backend`).
2. **Build Command:**
   ```bash
   npm install
   ```
3. **Start Command:**
   ```bash
   npm start
   ```
4. **Environment Variables:**
   ```env
   PORT=4000
   CORS_ORIGINS=https://mineguard360-driver.vercel.app,https://mineguard360-dashboard.vercel.app
   SIMULATION_MODE=true
   AI_SERVICE_URL=
   ```
5. Deploy and note your backend URL: e.g. `https://mineguard360-backend.onrender.com`.
6. Verify health check:
   ```bash
   curl https://mineguard360-backend.onrender.com/api/health
   ```

---

## Step 2: Deploy Driver Display (Vercel / Netlify)

The Driver Display is an independent Vite/React single-page application located in `driver-display/`.

### Deployment Steps (Vercel)
1. In Vercel, create a new project and select your Git repository.
2. In the project settings, set **Root Directory** to:
   ```
   driver-display
   ```
3. **Build & Output Settings:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables:**
   ```env
   VITE_BACKEND_URL=https://mineguard360-backend.onrender.com
   ```
5. Click **Deploy**. The site will open directly at `https://mineguard360-driver.vercel.app/` without blank pages.

---

## Step 3: Deploy Control-Room Dashboard (Vercel / Netlify)

The Control-Room Dashboard is an independent Vite/React application located in `dashboard/`.

### Deployment Steps (Vercel)
1. In Vercel, create a second project and select the same Git repository.
2. Set **Root Directory** to:
   ```
   dashboard
   ```
3. **Build & Output Settings:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables:**
   ```env
   VITE_BACKEND_URL=https://mineguard360-backend.onrender.com
   ```
5. Click **Deploy**. The site will open directly at `https://mineguard360-dashboard.vercel.app/`.

---

## Step 4: Verification Checklist

1. Open Driver Display URL in Browser A.
2. Open Dashboard URL in Browser B.
3. Verify that both displays show the `CONNECTED` or `ONLINE` status indicator.
4. On the Dashboard, go to **Environment Simulation**, and change weather to **DENSE_FOG** and visibility to **15m**.
5. Observe the Driver Display: it **immediately updates in real time** without requiring a page refresh.
6. On the Dashboard, go to **System Health**, toggle **Radar Fault ON**.
7. Observe both screens: both immediately reflect the sensor degradation and enforce reduced safe operation.
8. Clear the fault: both screens immediately recover.
