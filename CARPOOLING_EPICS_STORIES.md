## Car Pooling Application – Epics & Stories

**Tech stack:** Ruby, Rails, Docker, React, TypeScript, PostgreSQL, AWS  
**Scope:** Single region/premise/organization/college (e.g. company employees define routes, send/accept pooling requests).

---

## Epic 1: Monorepo & Core Infrastructure

### CP-1 – Monorepo structure & tooling
**Goal:** Developer can clone, run, and navigate backend/frontend easily.

**Acceptance criteria:**
- Repo has `backend/` (Rails API) and `frontend/` (React + TS) roots.
- Root `README` explains structure, local run commands, and environments.
- `.gitignore` includes build artifacts, dependencies, and env/secrets.
- Code style tools configured:
  - Backend: RuboCop (or similar).
  - Frontend: ESLint + Prettier.
- Optional: root `Makefile` or scripts for `dev:api`, `dev:web`, `dev:all`.

### CP-2 – Dockerized Rails API (local)
**Goal:** API + DB run locally in Docker.

**Acceptance criteria:**
- `backend/Dockerfile` builds and runs Rails API.
- `docker-compose.yml` defines Rails API + PostgreSQL for local.
- `docker-compose up api` brings up API + DB; migrations can be run inside container.
- DB config uses env vars for host, port, user, password, database name.
- `.env.example` documents required env vars; no secrets committed.

### CP-3 – Dockerized React frontend (local & prod-ready)
**Goal:** Frontend can run in Docker for dev and build for prod.

**Acceptance criteria:**
- `frontend/Dockerfile` supports:
  - Dev mode: hot reload (volume-mounted source).
  - Prod mode: multi-stage build creating optimized static assets.
- Frontend reads API base URL from env (`REACT_APP_API_URL` or similar).
- `docker-compose up web` runs Dockerized frontend in dev mode.

### CP-4 – Full stack docker-compose
**Goal:** Single command brings up full stack for local dev.

**Acceptance criteria:**
- Root `docker-compose.yml` (or override) defines `api`, `db`, `frontend` services.
- `docker-compose up` runs all three; frontend connects to API via service name.
- CORS configured so frontend can call API in local dev.
- API exposes simple health endpoint (`/health` or `/status`).

### CP-5 – CI pipeline (lint, test, build)
**Goal:** Every PR is validated automatically.

**Acceptance criteria:**
- GitHub Actions (or similar) workflow on PR:
  - Backend: install deps, run RuboCop, run tests.
  - Frontend: install deps, run ESLint, run tests/build.
- CI fails on lint/test failures.
- Optional: build Docker images and run basic smoke commands.

---

## Epic 2: Authentication, Organization & Roles

### CP-6 – User sign-up & login (API)
**Goal:** Secure registration and login via API.

**Acceptance criteria:**
- Approach chosen and documented (Devise + JWT or session-based).
- Endpoints:
  - `POST /auth/signup`
  - `POST /auth/login`
- Passwords hashed (e.g. BCrypt); never stored in plain text.
- Successful login returns token or sets session; clear error responses on failure.

### CP-7 – Organization model & scoping
**Goal:** All core data is per-organization.

**Acceptance criteria:**
- `Organization` model exists.
- Users belong to exactly one organization (`organization_id` on `User`).
- Queries for routes, rides, requests, etc. are scoped to `current_user.organization`.
- Tests cover that a user cannot access another org’s records.

### CP-8 – Role-based access control (Admin/Member)
**Goal:** Admin and Member behavior is enforced consistently.

**Acceptance criteria:**
- Role representation implemented (e.g. enum on `User`).
- Policy layer (e.g. Pundit or custom) enforces:
  - Only Admins can manage org settings and invites.
  - Members can only manage their own routes/offers/requests.
- Unauthorized actions return 403-style responses with clear messages.

### CP-9 – Frontend auth (login, logout, guard routes)
**Goal:** Users authenticate via UI and access protected pages.

**Acceptance criteria:**
- Login page with email/password form calling `login` endpoint.
- Token/session stored securely (HTTP-only cookies or localStorage with documented trade-offs).
- Protected routes redirect unauthenticated users to login.
- Logout clears auth state and redirects to login.
- Invalid credentials and network errors surfaced to user.

---

## Epic 3: User & Profile

### CP-10 – User profile API
**Goal:** Current user can retrieve and update their own profile.

**Acceptance criteria:**
- Endpoints:
  - `GET /me` (current profile).
  - `PATCH /me` (update).
- Fields: name, email, phone, optional vehicle info (make, model, capacity, plate).
- Only current user can update own profile.
- Validation for required/optional fields; clear error payloads.

### CP-11 – Profile UI (including vehicle info)
**Goal:** Simple, usable profile & vehicle editor screen.

**Acceptance criteria:**
- “My Profile” page shows name, email, phone, vehicle details.
- Edit form with client-side validation (required name/phone, numeric capacity).
- Shows success and error states from API.
- Uses shared form components/layout.

---

## Epic 4: Routes & Ride Offers

### CP-12 – Route model & API
**Goal:** Represent a commuting route with schedule.

**Acceptance criteria:**
- `Route` model with:
  - `user_id`, `organization_id`
  - Start/end (address or lat/lng), optional waypoints
  - Schedule: recurrence (daily/weekdays/custom) and time window.
- CRUD endpoints:
  - `GET /routes`, `POST /routes`, `PATCH /routes/:id`, `DELETE /routes/:id`.
- Users can only manage their own routes; all scoped by org.

### CP-13 – “My Routes” UI
**Goal:** Users can manage their own routes visually.

**Acceptance criteria:**
- “My Routes” page:
  - List of routes with summary (start → end, days, time).
- Create/edit flow (page or modal) using CP-12 fields.
- Delete with confirmation.
- Client-side validation aligned with API rules.

### CP-14 – Ride Offer model & API
**Goal:** A route can be advertised as an active ride offer.

**Acceptance criteria:**
- `RideOffer` (or equivalent) with:
  - `route_id`, `seats_available`, `active`.
- Only route owner can create/update an offer.
- Endpoints:
  - `POST /ride_offers`
  - `PATCH /ride_offers/:id`
  - `GET /ride_offers` (active, scoped to organization).
- Validations: seats ≥ 1; route must belong to current user and organization.

### CP-15 – Browse available rides (API + UI)
**Goal:** Members can discover rides they might join.

**Acceptance criteria:**
- API filters:
  - Date or recurring schedule.
  - From/to area (simple substring or tag).
  - Min seats remaining.
- “Browse Rides” page:
  - Filters (search, date picker, seats).
  - List of rides with driver name, route summary, seats.
- Clear empty state when no rides match.

---

## Epic 5: Pooling Requests & Matching

### CP-16 – Pooling Request model & API
**Goal:** Represent and validate a join request.

**Acceptance criteria:**
- `PoolingRequest` model:
  - `requester_id`, `ride_offer_id`, `status` (pending/approved/rejected/cancelled), `message`.
- Endpoint:
  - `POST /ride_offers/:id/requests`.
- Validations:
  - Requester and driver in same organization.
  - Ride has at least 1 seat remaining.
  - No active (pending/approved) duplicate for same requester/ride.

### CP-17 – Send request UI
**Goal:** From ride listing, user can request to join.

**Acceptance criteria:**
- On each ride card: “Request ride” button.
- Optional message input before confirming.
- Disabled or alternate state if already requested.
- Clear success and error messages.

### CP-18 – Approve / reject requests (API)
**Goal:** Driver can manage incoming requests.

**Acceptance criteria:**
- Endpoint:
  - `PATCH /requests/:id` to set status to approved or rejected.
- Only ride offer owner can change status.
- On approve:
  - Seat count decremented atomically; fails if no seats remaining.
  - Association created between requester and ride (e.g. `RideParticipant`).
- Status transitions validated (no approving cancelled or already rejected).

### CP-19 – Driver request management UI
**Goal:** Driver can see and act on requests.

**Acceptance criteria:**
- “My Ride Requests” (driver view):
  - Shows requests grouped by ride offer.
  - Displays requester name, message, status.
- Approve/reject actions update UI and reflect seat count changes.

### CP-20 – Requester view: My requests
**Goal:** Requesters can track statuses and cancel.

**Acceptance criteria:**
- API:
  - `GET /my/requests` lists current user’s requests with ride and driver info.
  - `PATCH /requests/:id/cancel` for pending ones.
- UI:
  - “My Requests” page with list and status badges.
  - “Cancel” action for pending only.

---

## Epic 6: Notifications & Communication

### CP-21 – Notification model & API
**Goal:** System tracks key events for users.

**Acceptance criteria:**
- `Notification` model:
  - `user_id`, `type`, `reference_id`/`reference_type`, `read_at`.
- Events:
  - New request on my ride offer.
  - Request approved.
  - Request rejected.
- Endpoints:
  - `GET /notifications`
  - `PATCH /notifications/:id/mark_read`
  - Optional: `PATCH /notifications/mark_all_read`.

### CP-22 – In-app notifications UI
**Goal:** Simple in-app notification center.

**Acceptance criteria:**
- Header bell icon showing unread count.
- Clicking bell opens list with latest notifications:
  - Text summary by type.
  - Click-through navigates to relevant page (ride or request).
- Mark-as-read behavior updates unread count.

### CP-23 – Email notifications (configurable)
**Goal:** Optional email channel for key events.

**Acceptance criteria:**
- Rails mailers for:
  - New request on driver’s ride offer.
  - Approval/rejection to requester.
- Email sending toggled via env flag.
- Uses background jobs; failures logged.

---

## Epic 7: Admin & Organization Management

### CP-24 – Admin user invitations
**Goal:** Admin can onboard users to their organization.

**Acceptance criteria:**
- `Invitation` model:
  - `email`, `organization_id`, `token`, `status`, optional `role`.
- Admin-only endpoint to create invitation:
  - `POST /organizations/:id/invitations`.
- Accept-invite flow:
  - Endpoint uses `token` to create user / attach to org.
- Secure token handling; invitation link or email generated.

### CP-25 – Admin member management
**Goal:** Admin can view and deactivate members.

**Acceptance criteria:**
- API:
  - `GET /organizations/:id/members`
  - `PATCH /users/:id/deactivate`
- Implementation uses soft delete or `active` flag.
- UI:
  - Member list with role and status.
  - Deactivate action requires confirmation.

### CP-26 – Organization settings UI + API
**Goal:** Admin can update organization-level settings.

**Acceptance criteria:**
- API:
  - `GET /organizations/:id`
  - `PATCH /organizations/:id`
- Fields: name and optional policies (e.g. max seats per offer, visibility).
- UI form with validation and success/error feedback.

---

## Epic 8: Safety, History & Quality

### CP-27 – Cancel request & withdraw offer
**Goal:** Clean lifecycle for cancellations.

**Acceptance criteria:**
- API supports:
  - Requester cancel: pending requests only.
  - Driver withdraw: ride offer set inactive; optionally auto-reject/cancel pending.
- Notifications sent appropriately (if configured).
- UI exposes cancel/withdraw actions where relevant.

### CP-28 – Ride & request history
**Goal:** Users can see what happened in the past.

**Acceptance criteria:**
- API:
  - “Past” rides for drivers and passengers based on date/status.
  - Past requests and outcomes.
- UI:
  - History page with basic date filters.
  - Shows route, participants, and final status.

### CP-29 – Consistent validation & error handling
**Goal:** Predictable, user-friendly error behavior.

**Acceptance criteria:**
- API error format standardized (e.g. `{ errors: [{ field, message }] }`).
- Global frontend error handling:
  - Field-level validation messages.
  - Banner/toast for non-field errors.
- Tests for key validation rules (auth, routes, offers, requests).

---

## Epic 9: Deployment & AWS

### CP-30 – AWS account & IAM basics
**Goal:** Secure foundation for running app in AWS.

**Acceptance criteria:**
- IAM roles/users created for:
  - CI deploy.
  - Runtime tasks (API, frontend deploy).
- Least-privilege policies; access keys stored only in CI secrets.
- High-level diagram or doc of AWS resources and access.

### CP-31 – RDS PostgreSQL (prod)
**Goal:** Managed DB in AWS.

**Acceptance criteria:**
- RDS PostgreSQL instance created in VPC with restricted security groups.
- Rails production DB config uses connection string from secrets.
- Migrations run against RDS as part of deploy/runbook.

### CP-32 – API deployment (ECS or EB)
**Goal:** Rails API running in AWS.

**Acceptance criteria:**
- Chosen platform (ECS Fargate, Elastic Beanstalk, etc.) documented.
- Deployed container uses env from Parameter Store or Secrets Manager.
- Health check integrated (ALB or platform-native).
- HTTPS termination at load balancer.

### CP-33 – React app deployment (S3 + CloudFront)
**Goal:** Frontend served securely and efficiently.

**Acceptance criteria:**
- Production build uploaded to S3 bucket.
- CloudFront distribution fronts bucket with HTTPS.
- API base URL injected at build time via env.
- Cache invalidation strategy documented or automated.

### CP-34 – CI/CD for deploy on merge
**Goal:** Automated deploy pipeline to prod (or staging).

**Acceptance criteria:**
- On merge to `main`:
  - Run tests, build images/artifacts.
  - Deploy API (ECS/EB) and frontend (S3/CloudFront).
- Rollback steps documented and ideally automated.

### CP-35 – Secrets & config management
**Goal:** No production secrets in code or plain env files.

**Acceptance criteria:**
- Production secrets stored in AWS Secrets Manager or Parameter Store.
- CI has read access via IAM; no secrets in repo or logs.
- Docs enumerating required env vars for backend, frontend, CI, and deploy.

### CP-36 – Monitoring & logging
**Goal:** Basic observability for operations.

**Acceptance criteria:**
- API logs shipped to CloudWatch (or equivalent).
- Error tracking added (e.g. Sentry or similar, if chosen).
- Basic health dashboard or alert on 5xx rate.

---

## Epic 10: Documentation & Handoff

### CP-37 – Developer README & runbook
**Goal:** New dev or operator can get productive quickly.

**Acceptance criteria:**
- Root `README`:
  - Tech stack overview.
  - Local setup (Docker and non-Docker, if applicable).
  - How to run tests.
- Runbook:
  - Deploy steps (manual + CI).
  - Rollback steps.
  - Where to find logs, metrics, secrets.

### CP-38 – API documentation
**Goal:** Clear API contract for frontend and external consumers.

**Acceptance criteria:**
- OpenAPI/Swagger spec or structured Markdown doc.
- Covers key endpoints (auth, profile, routes, offers, requests, notifications).
- Includes request/response examples and auth explanation.
- Docs linked from README and kept version-controlled.

---

## Suggested Sprint Order

- **Sprint 0:** CP-1 → CP-5 (monorepo, Docker, CI).
- **Sprint 1:** CP-6 → CP-9 (auth, orgs, roles, frontend auth).
- **Sprint 2:** CP-10 → CP-13 (profile + routes + UI).
- **Sprint 3:** CP-14 → CP-20 (offers, browse, requests, approvals).
- **Sprint 4:** CP-21 → CP-26 (notifications + admin/org).
- **Sprint 5:** CP-27 → CP-29 (cancel, history, validation/error UX).
- **Sprint 6:** CP-30 → CP-36 (AWS infra, deploy, monitoring).
- **Sprint 7:** CP-37, CP-38 (docs & handoff, UAT hardening).

