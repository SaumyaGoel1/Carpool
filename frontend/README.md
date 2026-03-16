# React Frontend

After adding or changing dependencies in `package.json`, rebuild the frontend image so `node_modules` is updated:  
`docker compose build frontend --no-cache` then `docker compose up frontend`.

Vite + React app with Docker support for **development** (hot reload) and **production** (multi-stage static build).

## Ports (nothing replaces Rails on 3000)

| Service              | Port | URL                    |
|----------------------|------|------------------------|
| **Rails backend**    | 3000 | http://localhost:3000  |
| **Frontend (dev)**   | 5173 | http://localhost:5173  |
| **Frontend (prod)**  | 80 or 8080 | http://localhost:80 or :8080 |

Rails stays on **3000**. The frontend is a separate app: use **5173** for dev (Vite) or **80** (or 8080) for the production build.

## API URL (environment variable)

The app calls the API using `VITE_API_URL`:

- **Development:** Set when running the container (e.g. in `docker-compose.yml` or `docker run -e VITE_API_URL=...`).
- **Production:** Pass at **build time** as a build-arg so it’s baked into the bundle:
  ```bash
  docker build -f frontend/Dockerfile --build-arg VITE_API_URL=https://api.example.com --target production -t app-frontend ./frontend
  ```

## Docker

### Development (hot reload)

```bash
# From repo root with docker-compose
docker compose build frontend
docker compose up frontend

# Or build/run manually
docker build -f frontend/Dockerfile --target development -t app-frontend:dev ./frontend
docker run -p 5173:5173 -e VITE_API_URL=http://localhost:3000 -v "$(pwd)/frontend:/app" -v /app/node_modules app-frontend:dev
```

App: http://localhost:5173. Changes in `frontend/` trigger hot reload.

### Production (multi-stage, static assets)

**From repo root.** Build first, then run (image is only on your machine until you build it):

```bash
# 1. Build the image (required before run)
docker build -f frontend/Dockerfile \
  --build-arg VITE_API_URL=https://api.example.com \
  --target production \
  -t app-frontend:prod \
  ./frontend

# 2. Run in background. "start worker process" lines are normal nginx startup, not errors.
docker run -d -p 8080:80 --name app-frontend app-frontend:prod
```

Then open **http://localhost:8080**. To stop: `docker stop app-frontend`.

## Local (no Docker)

```bash
cd frontend
npm install
VITE_API_URL=http://localhost:3000 npm run dev
```

Build:

```bash
VITE_API_URL=https://api.example.com npm run build
npm run preview
```
