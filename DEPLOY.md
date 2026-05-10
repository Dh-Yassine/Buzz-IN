# Hosting BUZZ-IN for free (Netlify + Render)

Your app has **three** deployable pieces:

| Piece | What it is | Good free host |
|--------|------------|----------------|
| **`web/`** | React + Vite frontend | **Netlify** or Vercel |
| **`detect-service/`** | Python + Recycling-Net-11 API | **Render** (Docker) |
| **`server/`** | Auth + Buzz-Points API (Hono on Cloudflare Workers) | **Cloudflare** |

Static hosts (**Netlify / Vercel**) cannot run PyTorch or your ML model. The **detect** service must run on **Render** (or Railway, Fly.io, etc.), not on Netlify alone.

---

## 0. Prerequisites

1. Push your project to **GitHub** (or GitLab / Bitbucket supported by Netlify & Render).
2. Accounts (free tier): [Netlify](https://www.netlify.com/), [Render](https://render.com/).
3. Optional (login / wallet): [Cloudflare](https://dash.cloudflare.com/) account + Wrangler for Workers (`npm run deploy:api` from repo).

---

## Part 1 — Deploy the detect API on Render

This serves `POST /detect` for scan (multipart field **`image`**).

### Option A — Blueprint (`render.yaml`)

1. In Render Dashboard → **Blueprints** → **New Blueprint Instance**.
2. Connect the repo and select the branch.
3. Render reads **`render.yaml`** at the repo root and proposes a **Web Service** `buzzin-detect` (Docker).
4. Create the blueprint and wait for the first deploy.

Build can take **15–30+ minutes** on first deploy (CPU PyTorch + torchvision + Hugging Face deps). The Dockerfile installs **CPU-only** PyTorch so Render free tier does not pull multi‑GB CUDA stacks. If the build fails, open the build logs.

### Option B — Manual Docker service

1. Render → **New +** → **Web Service** → connect repo.
2. **Runtime:** Docker.
3. **Dockerfile path:** `detect-service/Dockerfile`
4. **Docker build context:** `detect-service`
5. **Instance type:** Free (note limitations below).
6. Deploy.

### Environment variables (detect service)

In Render → your Web Service → **Environment**:

| Key | Value |
|-----|--------|
| `BUZZ_DETECT_CORS_ORIGINS` | Your Netlify site URL, e.g. `https://your-site-name.netlify.app` (no trailing slash). Multiple origins: comma-separated. |

Do **not** set `PORT` yourself — Render injects it.

**Optional:** Add **`HF_TOKEN`** (a [Hugging Face read token](https://huggingface.co/settings/tokens)) so Hub downloads are faster and less likely to hit anonymous rate limits during deploy or first request. Same variable is respected at runtime by `huggingface_hub`.

### URL you need later

After deploy, Render shows something like:

`https://buzzin-detect-xxxx.onrender.com`

Your frontend will use:

`https://buzzin-detect-xxxx.onrender.com/detect`

### Free tier caveats (important)

- **Cold start:** After ~15 minutes idle, the instance sleeps. The **first** request may take **several minutes** (wake + load PyTorch + optionally download/load HF weights).
- **RAM:** Free instances have **limited RAM**. Loading Recyling-Net-11 + PyTorch may **crash with out-of-memory** on the smallest instance. If that happens, upgrade the Render instance or switch to a hosted inference API (e.g. Hugging Face Inference Endpoints / Modal).

---

## Part 2 — Deploy the frontend on Netlify

### Connect the repo

1. Netlify → **Add new site** → **Import an existing project** → GitHub → pick the repo.
2. Netlify should detect **`netlify.toml`** at the **repository root** (not inside `web/`).

Confirm settings (or set manually):

| Setting | Value |
|---------|--------|
| Build command | `npm install && npm run build -w web` |
| Publish directory | `web/dist` |

3. **Deploy site.**

### Environment variables (Netlify UI)

Site configuration → **Environment variables** → **Add a variable**:

| Key | Value |
|-----|--------|
| `VITE_DETECT_API_URL` | `https://YOUR-RENDER-HOST.onrender.com/detect` (your real Render URL + `/detect`) |
| `VITE_API_BASE` | *(Optional)* Your deployed Cloudflare Worker URL with **no** trailing slash, e.g. `https://bin-recycle-api.your-subdomain.workers.dev` — required for register/login/wallet in production. |

`VITE_*` variables are baked in at **build time**. After changing them, trigger **Deploy → Trigger deploy → Clear cache and deploy site**.

### HTTPS

Netlify and Render both use HTTPS — browsers allow `fetch` between them if **`BUZZ_DETECT_CORS_ORIGINS`** on Render includes your Netlify URL.

---

## Part 3 — (Optional) Deploy Cloudflare Worker API

From repo root (with Wrangler logged in):

```bash
npm run deploy:api
```

Set **`VITE_API_BASE`** on Netlify to the Worker URL printed by Wrangler so auth and Buzz-Points work from the static site.

---

## Quick checklist

- [ ] Render detect service is **live** (`GET https://…onrender.com/health` returns JSON).
- [ ] **`BUZZ_DETECT_CORS_ORIGINS`** = `https://your-site.netlify.app`
- [ ] Netlify **`VITE_DETECT_API_URL`** = `https://….onrender.com/detect`
- [ ] Redeploy Netlify after env changes (clear cache recommended).
- [ ] Netlify **`VITE_API_BASE`** set if you use the Worker for auth/points.

---

## Troubleshooting

| Problem | What to check |
|--------|----------------|
| Scan says detect URL missing | Netlify env var name exactly `VITE_DETECT_API_URL`; redeploy after adding it. |
| CORS error in browser console | Render `BUZZ_DETECT_CORS_ORIGINS` matches Netlify URL exactly (including `https`). |
| 502 / timeout on first scan | Render cold start — wait and retry; consider keeping instance warm or upgrading. |
| Worker / login fails | `VITE_API_BASE` correct; Worker deployed; CORS on Worker if needed. |

---

## Alternatives

- **Vercel:** Same as Netlify for **`web/`** — connect repo, set root directory or use `npm install && npm run build -w web`, output `web/dist`. **`vercel.json`** in `web/` provides SPA rewrites if you deploy from the `web` folder.
- **Detect-only elsewhere:** Railway, Fly.io, Google Cloud Run — same Docker image as `detect-service/Dockerfile`.
