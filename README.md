
# Car Pooling

A single-organization car pooling app: users define routes and send or accept pooling requests (e.g. for a company or campus).

**Tech stack:** Ruby on Rails (backend), React + TypeScript (frontend), PostgreSQL, Docker, AWS.

## Repository layout

- `app/`, `config/`, `db/`, etc. – Rails application (API + server‑rendered views).
- `frontend/` – React SPA (TypeScript, Vite) that will talk to the Rails backend.

## Run locally

### Backend (Rails)

```bash
bundle install
bin/rails db:prepare
bin/rails server
```

Backend runs on http://localhost:3000.

### Frontend (React)

From the repo root:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173.

## Next steps

- Wire the frontend to call Rails APIs for routes and pooling requests.
- Add more detailed setup notes (environment variables, Docker usage, deployment) as the project evolves.
