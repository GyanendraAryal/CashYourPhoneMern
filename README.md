# CashYourPhone (MERN)

Monorepo layout:

| Folder | Role |
|--------|------|
| **`server/`** | Express API (users, devices, cart, orders, eSewa, admin routes) |
| **`client/`** | Vite + React storefront |
| **`admin/`** | Vite + React admin dashboard |

The admin UI talks to the **same** API as the client; there is no separate admin-only backend process.

---

## Prerequisites

- **Node.js 18+**
- **MongoDB** (local, Docker, or Atlas)

Optional: **Redis** (only if you enable background jobs with `JOBS_ENABLED=true`), **Cloudinary** if `UPLOAD_MODE=cloudinary`.

---

## 1. Server (`server/`)

```bash
cd server
npm install
cp .env.example .env
# Edit .env: set MONGO_URI, JWT secrets, ADMIN_JWT_SECRET, etc.
npm run dev
```

- Default URL: **http://localhost:4000**
- Health: `GET http://localhost:4000/api/health`
- Dev uses `nodemon`; production uses `npm start`.

**Minimum `.env` for local dev:** `MONGO_URI`, `JWT_ACCESS_SECRET` + `JWT_REFRESH_SECRET` (or `JWT_SECRET`), `ADMIN_JWT_SECRET`, `CORS_ORIGINS` including `http://localhost:5173` and `http://localhost:5174`.  
For checkout tests, set **eSewa** variables (see `server/.env.example`).  
For image uploads in dev you can use **`UPLOAD_MODE=local`**; production should use **`UPLOAD_MODE=cloudinary`** with Cloudinary credentials.

---

## 2. Client (`client/`)

```bash
cd client
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:4000
npm run dev
```

- Default URL: **http://localhost:5173** (Vite default)
- API calls use `VITE_API_URL` (or inferred `http://<your-host>:4000` in dev); see `client/src/utils/constants.js`. The backend must allow this origin in `CORS_ORIGINS` (`server/.env`). `vite.config.mjs` also defines a `/api` proxy for tooling or if you switch the client to same-origin `/api` URLs.

---

## 3. Admin (`admin/`)

```bash
cd admin
npm install
cp .env.example .env
# VITE_ADMIN_API_URL=http://localhost:4000
npm run dev
```

- Dev server: **http://localhost:5174** (see `admin/package.json`)
- More detail: `admin/README.md`

---

## Run all three (development)

Use three terminals from the repo root:

1. **MongoDB** running (or connection string to Atlas in `server/.env`).
2. `cd server && npm run dev`
3. `cd client && npm run dev`
4. `cd admin && npm run dev`

Seed an admin user if needed: `cd server && npm run seed:admin` (see `server/.env` for `ADMIN_EMAIL` / `ADMIN_PASSWORD` when seeding).

---

## Docker (full stack)

From the repo root:

```bash
docker compose up --build
```

Set secrets via environment or an untracked compose override. Adjust `VITE_API_URL` build args so browser clients point at the API URL users can reach (not only `localhost` in real deployments).

---

## Production builds

| App | Command | Output |
|-----|---------|--------|
| Server | `cd server && npm start` | Runs `node server.js` (set `NODE_ENV=production` and required env vars; see `server/src/config/env.js`) |
| Client | `cd client && npm run build` | `client/dist` |
| Admin | `cd admin && npm run build` | `admin/dist` |

Serve `dist` with any static host (e.g. Nginx); point `VITE_*` URLs at your public API during **build** time.

---

## CI

GitHub Actions (`.github/workflows/ci.yml`) installs dependencies and builds **client** and **admin**. Run **server** checks locally before pushing if you change the API.
