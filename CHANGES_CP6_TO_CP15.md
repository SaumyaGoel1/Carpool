# CP-6 to CP-15: Feature in Plain Language + What Was Added in Files

Each section has: **(1)** what the feature does in plain language, **(2)** what was added in the codebase at a high level for that CP.

---

## CP-6: Auth API (Login / Sign up with JWT)

**Feature (plain language)**  
Users can sign up and sign in. Passwords are never stored as plain text; they are hashed with bcrypt. After a successful login or sign-up, the API gives the frontend a **JWT**. The frontend sends this token in the `Authorization: Bearer <token>` header on later requests so the API knows who is logged in.

**What was added in files (high-level)**  
- **`jwt_authenticatable.rb`** — New concern: create JWT from user id, read token from request, decode it and find the user.  
- **`api/base_controller.rb`** — New base for all API controllers: uses the concern and exposes `current_user` from the token.  
- **`api/auth_controller.rb`** — New: sign-up and sign-in actions; create/find user, return token + user JSON.  
- **`config/routes.rb`** — New routes: `POST /api/sign_up`, `POST /api/sign_in`.  
- **`user.rb`** — Uses `has_secure_password` (bcrypt) and validates email/password.

---

## CP-7: Organization scoping

**Feature (plain language)**  
Every user belongs to exactly one **organization**. All data is tied to that org: you only see and interact with people in the same organization (e.g. same company or school). The API can return the current user and list members of the current user’s organization.

**What was added in files (high-level)**  
- **`organization.rb`** — New model: organization has a name and many users.  
- **`user.rb`** — User belongs to organization; `organization_id` required.  
- **Migrations** — New `organizations` table; add `organization_id` to `users`.  
- **`base_controller.rb`** — `current_organization` = current user’s organization.  
- **`auth_controller.rb`** — Sign-up accepts `organization_id`; auth responses include organization (id, name).  
- **`me_controller.rb`** — New: `GET /api/me` returns current user and org (requires token).  
- **`organization/members_controller.rb`** — New: `GET /api/organization/members` returns users in current org only.  
- **`config/routes.rb`** — New: `get "me"`, and under `organization`: `get "members"`.

---

## CP-8: Role-based access (Admin vs Member)

**Feature (plain language)**  
Users have a **role**: either **admin** or **member**. New sign-ups are members. Only admins can do things like update the organization’s name (and later manage users). The API returns the user’s role and blocks non-admins from admin-only endpoints (e.g. 403 Forbidden).

**What was added in files (high-level)**  
- **`user.rb`** — Role enum: `member` (default) and `admin`.  
- **Migration** — Add `role` column to `users`.  
- **`base_controller.rb`** — `require_admin`: returns 403 unless current user is admin.  
- **`auth_controller.rb`**, **`me_controller.rb`**, **`organization/members_controller.rb`** — Responses now include `role`.  
- **`organizations_controller.rb`** — New: `GET /api/organization` (any logged-in user), `PATCH /api/organization` (admin only, update org name).  
- **`config/routes.rb`** — New: `get "organization"`, `patch "organization"`.

---

## CP-9: Frontend auth (Login, token, protected routes)

**Feature (plain language)**  
The React app has real login and sign-up screens. After login, the JWT is stored in the browser (e.g. `localStorage`) and sent with every API call. Pages that require login are **protected**: if you’re not logged in, you’re redirected to the login page. On app load, if a token exists, the app checks it with the API and either restores the user or clears the token.

**What was added in files (high-level)**  
- **`api.js`** — New: base API URL (e.g. from `VITE_API_URL`), and `fetchWithAuth()` that adds `Authorization: Bearer <token>` from storage.  
- **`AuthContext.jsx`** — New: holds user, loading, login, logout; on load calls `GET /api/me` when token exists; login/sign-up store token and user.  
- **`ProtectedRoute.jsx`** — New: if not logged in, redirect to `/login`; shows loading while checking.  
- **`LoginPage.jsx`** — New: form that calls sign-in API, stores token and user, redirects to home.  
- **`SignUpPage.jsx`** — New: form (email, password, org id) that calls sign-up API, then same flow as login.  
- **`App.jsx`** — App wrapped in `AuthProvider`; routes for `/login`, `/signup`, and protected routes (e.g. `/`, `/profile`, `/routes`) using `ProtectedRoute`.

---

## CP-10: User profile API

**Feature (plain language)**  
The API lets the current user read and update their own **profile**: name, email, phone, and optional vehicle info (make, model, seat capacity). Only the logged-in user can change their own profile.

**What was added in files (high-level)**  
- **`user.rb`** — Profile fields (via migration): name, phone, vehicle_make, vehicle_model, vehicle_capacity.  
- **`profiles_controller.rb`** — New: `GET /api/profile` (current user’s profile), `PATCH /api/profile` (update own profile with permitted fields).  
- **`config/routes.rb`** — New: `get "profile"`, `patch "profile"`.

---

## CP-11: Profile UI

**Feature (plain language)**  
There is a **Profile** page in the React app where you can see and edit your name, phone, and vehicle details. The page loads your profile from the API and saves changes with a success or error message.

**What was added in files (high-level)**  
- **`ProfilePage.jsx`** — New page at `/profile`: fetches profile, shows form, submits updates via `PATCH /api/profile`, shows success/error.  
- **`App.jsx`** — New protected route for `/profile`.  
- **`HomePage.jsx`** — New link to “Profile”.

---

## CP-12: Routes API

**Feature (plain language)**  
Users can create and manage **routes**: a path from A to B with optional waypoints, when they travel (e.g. daily, weekdays), and departure/arrival times. The API supports full CRUD; each user only sees and edits their own routes, and everything stays within their organization’s scope.

**What was added in files (high-level)**  
- **`route.rb`** — New model: belongs to user; start/end address (and optional lat/lng), waypoints, recurrence, departure/arrival time; validations.  
- **Migration** — New `routes` table.  
- **`routes_controller.rb`** — New: index, show, create, update, destroy; all scoped to `current_user.routes`.  
- **`config/routes.rb`** — New: `resources :routes` (index, show, create, update, destroy).

---

## CP-13: Routes UI (My routes, New, Edit, Delete)

**Feature (plain language)**  
The app has screens to **list your routes**, **add a new route**, **edit** one, and **delete** one. Deleting asks for confirmation (e.g. “Delete? Yes / No”) so you don’t remove a route by mistake.

**What was added in files (high-level)**  
- **`RoutesListPage.jsx`** — New page at `/routes`: list of routes, “New route” button, Edit/Delete per row, delete confirmation.  
- **`RouteFormPage.jsx`** — New: `/routes/new` and `/routes/:id/edit`; form for addresses, waypoints, recurrence, times; create or update.  
- **`App.jsx`** — New protected routes: `/routes`, `/routes/new`, `/routes/:id/edit`.  
- **`HomePage.jsx`** — New “My routes” link.

---

## CP-14: Offer ride (driver marks route, seats)

**Feature (plain language)**  
A user can mark one of their routes as **offering a ride** and set how many **seats** are available. Only the owner of the route can set or change this. The API can list all **active ride offers** in the current user’s organization (routes that are offering and have at least one seat), with driver and route info.

**What was added in files (high-level)**  
- **`route.rb`** — New: `offering` (boolean), `seats_available` (integer); validation: if offering, seats_available ≥ 1.  
- **Migration** — Add `offering` and `seats_available` to `routes`.  
- **`routes_controller.rb`** — Permits and returns `offering` and `seats_available` so `PATCH /api/routes/:id` can set them.  
- **`rides_controller.rb`** — New: `GET /api/rides/offers` lists routes in current org where offering=true and seats_available ≥ 1, with driver info.  
- **`config/routes.rb`** — New: `get "rides/offers"`.

---

## CP-15: Browse available rides

**Feature (plain language)**  
Members can **browse** available rides in their organization. They see a list of ride offers (who’s driving, route, time, seats) and can **filter** by “from” address, “to” address, and minimum number of seats. The UI calls the same offers API with these filters.

**What was added in files (high-level)**  
- **`rides_controller.rb`** — `offers` action now accepts optional query params: `from`, `to`, `min_seats`, and filters the list.  
- **`BrowseRidesPage.jsx`** — New page at `/rides`: list of offers with driver and route summary; search form that applies from/to/min_seats and refetches.  
- **`App.jsx`** — New protected route for `/rides`.  
- **`HomePage.jsx`** — New “Browse rides” link.

---

## About CP-16

**CP-16 is not defined in your README or codebase.** The README stops at CP-15 and only mentions CP-24 (invite, deactivate) as future. If you have a spec for CP-16, share it and we can map it the same way.

---

## Quick reference: main files by feature

| Feature | Backend (Rails) | Frontend (React) |
|--------|------------------|------------------|
| Auth (JWT, sign in/up) | `auth_controller.rb`, `jwt_authenticatable.rb`, `base_controller.rb` | `AuthContext.jsx`, `api.js`, `LoginPage.jsx`, `SignUpPage.jsx`, `ProtectedRoute.jsx` |
| Organization & roles | `organizations_controller.rb`, `organization/members_controller.rb`, `base_controller#require_admin` | (org id on sign-up) |
| Profile | `profiles_controller.rb`, User model profile columns | `ProfilePage.jsx` |
| Routes (CRUD + offer) | `routes_controller.rb`, `route.rb` | `RoutesListPage.jsx`, `RouteFormPage.jsx` |
| Browse rides | `rides_controller.rb` | `BrowseRidesPage.jsx` |
