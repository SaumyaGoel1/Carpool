
# App

## Run everything live (CP-1 through CP-15)

Get the full stack running so you can use the app in the browser.

### 1. Start database and API (first time: run migrations)

```bash
# Start DB and app so we can run migrations
docker compose up -d db
docker compose up -d app

# Wait for app to be up (~30s), then run migrations
docker compose run --rm app bin/rails db:prepare

# Optional: seed default org and an admin user (admin@example.com / changeme123)
docker compose run --rm app bin/rails db:seed
```

### 2. Start the full stack

```bash
docker compose up
```

Leave this running. You should see the app and frontend start; the frontend waits for the API to be healthy.

### 3. Use the app

| URL | What |
|-----|------|
| **http://localhost:5173** | React app (login, sign up, profile, routes, browse rides) |
| **http://localhost:3000** | Rails API (e.g. health: http://localhost:3000/up) |

**First time:**

1. Open **http://localhost:5173**.
2. Click **Sign up** and create an account (use **Organization ID: 1** if you ran `db:seed`).
3. Log in, then use **My routes**, **Browse rides**, **Profile** as needed.
4. To offer a ride: **My routes** → **New route** or **Edit** a route → check **Offering ride**, set **Seats available** → Save. The route will appear under **Browse rides** for others in the same org.

**Stop everything:** `Ctrl+C` in the terminal where `docker compose up` is running, then:

```bash
docker compose down
```

---

## Quick run (full stack: API + DB + frontend)

One command runs API, database, and React frontend:

```bash
docker compose up
```

- **Rails API:** http://localhost:3000 (health: http://localhost:3000/up)
- **React frontend:** http://localhost:5173  
- **Database:** Postgres (internal; no browser URL)

**Before first use**, run migrations (and optionally seed) as in **Run everything live** above.

Frontend can call the API; CORS is configured for `localhost:5173` and `localhost:8080`. The API service has a health/readiness check so the frontend starts after the API is ready.

To run only API + DB (no frontend): `docker compose up app`

## Auth API (CP-6)

Passwords are hashed with bcrypt; never stored in plain text. The API returns a JWT for the frontend to send in the `Authorization: Bearer <token>` header.

| Endpoint | Description |
|----------|-------------|
| `POST /api/sign_up` | Register. Body: `{ "user": { "email", "password", "password_confirmation", "organization_id" } }`. Returns `{ "token", "user": { "id", "email", "organization_id", "organization" } }`. |
| `POST /api/sign_in` | Login. Body: `{ "user": { "email", "password" } }`. Returns `{ "token", "user" }`. |
| `GET /api/me` | Current user (requires `Authorization: Bearer <token>`). Returns `{ "user": { "id", "email", "organization_id", "organization" } }`. |

Optional: set `JWT_SECRET` in the environment; otherwise the Rails secret key base is used.

## Organization scoping (CP-7)

Users belong to an **organization**; all API data is scoped by the current user's organization. Only users in the same organization can pool together.

- **Organization** model; **User** has `organization_id` (required).
- Auth responses and `GET /api/me` include `organization` (id, name).
- **GET /api/organization/members** — list users in the current user's organization only (requires `Authorization: Bearer <token>`). Use this pattern to scope all future resources by `current_organization`.

## Role-based access (CP-8)

**Roles:** `admin`, `member` (stored on User). New sign-ups are always `member`; admins are created via seed or later via invite (CP-24).

- **Admin** can manage the organization and users (invite, deactivate, org settings).
- **Member** can use pooling only; cannot invite or manage.

Auth and `GET /api/me` include `role`. Members list includes each user's `role`.

| Endpoint | Who |
|----------|-----|
| `GET /api/organization` | Any authenticated user — current org (id, name). |
| `PATCH /api/organization` | **Admin only** — update org name. Body: `{ "organization": { "name" } }`. Members get `403 Forbidden`. |

Use `require_admin` in API controllers for admin-only actions; policies enforce role.

## Frontend auth (CP-9)

The React app has login, token storage, and protected routes.

- **Login** (`/login`): form calls `POST /api/sign_in`, stores JWT in `localStorage`, then redirects to `/`.
- **Protected routes**: visiting `/` (home) without a valid token redirects to `/login`. On load, the app validates the stored token with `GET /api/me` and restores the user or clears storage.
- **Logout**: "Log out" clears the token and user, then redirects to `/login`.

Ensure `VITE_API_URL` points at your API (e.g. `http://localhost:3000` in dev).

## User profile API (CP-10)

CRUD for the **current user** profile: name, contact, optional vehicle. Only the authenticated user can read or update their own profile.

| Endpoint | Description |
|----------|-------------|
| `GET /api/profile` | Current user profile. Returns `name`, `email`, `phone`, `vehicle` (make, model, capacity), `organization`. Requires `Authorization: Bearer <token>`. |
| `PATCH /api/profile` | Update own profile. Body: `{ "profile": { "name", "email", "phone", "vehicle_make", "vehicle_model", "vehicle_capacity" } }`. All fields optional. |

Vehicle is optional; omit or send empty to clear.

## Profile UI (CP-11)

The React app has a **Profile** screen to view and edit name, phone, and vehicle (make, model, capacity).

- **Route:** `/profile` (protected). Link from home: “Profile”.
- **Display:** Loads `GET /api/profile` and shows name, email (read-only), phone, and vehicle fields.
- **Edit:** Form submits via `PATCH /api/profile`. Success message on save; error message and validation list on failure (e.g. invalid email).

## Routes API (CP-12)

Users can define **routes** (start, end, waypoints, schedule). CRUD is scoped to the current user and their organization.

**Route fields:** `start_address`, `end_address` (required); optional `start_lat`/`start_lng`, `end_lat`/`end_lng`; `waypoints` (array); `recurrence` (`daily` | `weekdays` | `weekly` | `custom`); `departure_time`, `arrival_time` (e.g. `"08:00"`).

| Endpoint | Description |
|----------|-------------|
| `GET /api/routes` | List current user's routes. |
| `GET /api/routes/:id` | Show one route (own only). |
| `POST /api/routes` | Create route. Body: `{ "route": { "start_address", "end_address", ... } }`. |
| `PATCH /api/routes/:id` | Update route (own only). |
| `DELETE /api/routes/:id` | Delete route (own only). |

All require `Authorization: Bearer <token>`.

## Routes UI (CP-13)

Screens to list, create, edit, and delete your routes.

- **My routes** (`/routes`): List of your routes with summary (start → end, recurrence, time). Link to **New route**; each row has **Edit** and **Delete** (with confirmation: "Delete? Yes / No").
- **New route** (`/routes/new`): Form for start address, end address, waypoints (comma-separated), recurrence (daily/weekdays/weekly/custom), departure/arrival time. Submit creates the route and redirects to the list.
- **Edit route** (`/routes/:id/edit`): Same form, pre-filled; submit updates and redirects to the list.

Home has a **My routes** link.

## Offer ride (CP-14)

Drivers can mark a route as **offering a ride** with a number of **seats available**. Only the route owner can set or change this.

- **Route model:** `offering` (boolean), `seats_available` (integer). When `offering` is true, `seats_available` must be ≥ 1.
- **Update offer:** Use `PATCH /api/routes/:id` with `offering` and `seats_available` (only route owner).
- **List active offers in org:** `GET /api/rides/offers` — returns routes in the current user's organization where `offering=true` and `seats_available >= 1`, with route details and driver (id, email, name). Optional query params: `from` (substring of start address), `to` (substring of end address), `min_seats` (minimum seats). Requires `Authorization: Bearer <token>`.

## Browse available rides (CP-15)

Members can see available rides in their organization with filters.

- **API:** `GET /api/rides/offers` supports optional filters: `from`, `to`, `min_seats` (query params).
- **UI:** **Browse rides** (`/rides`): list of available rides with driver and route summary (start → end, departure time, recurrence, seats). Search form at top: filter by from address, to address, min seats; **Search** applies filters.

Home has a **Browse rides** link.

## CI (GitHub Actions)

On every **pull request** and **push to main**, the pipeline runs:

- **Lint Ruby** (RuboCop)
- **Lint frontend** (ESLint for JS/JSX)
- **Rails tests** (unit + system)
- **Frontend tests** (Vitest)
- **Docker build** (Rails + frontend prod images)
- **Security scans** (Brakeman, importmap audit)

To **block merge until CI passes**: GitHub → Settings → Branches → Add rule for `main` → Require status checks to pass → select the CI jobs.

---

This README would normally document whatever steps are necessary to get the
application up and running.

Things you may want to cover:

* Ruby version

* System dependencies

* Configuration

* Database creation

* Database initialization

* How to run the test suite

* Services (job queues, cache servers, search engines, etc.)

* Deployment instructions


