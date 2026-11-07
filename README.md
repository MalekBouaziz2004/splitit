# SplitIt — Shared Expense Tracker

A full-stack expense tracker for friends, roommates, and travel groups. Create a group, share costs, and see who owes whom. The React app and Express API can run together with PostgreSQL through Docker Compose, or separately for local development.

## ✨ Features

- Register and log in with JWT authentication and bcrypt-hashed passwords.
- Create groups and add or remove members by username or email, subject to group permissions.
- Record expenses with equal or custom shares; the payer or group creator can delete an expense.
- View member balances and a suggested settlement plan. Transfers are suggestions; the app does not record payments.
- Follow hash routes for login, registration, groups, and group details, with loading and error states.

## 📸 Screenshots

### Login & Registration
![Login page](docs/screenshots/01-login.png)

### Groups overview
Once logged in, users see all the groups they belong to.
![Groups list](docs/screenshots/02-groups-list.png)

### Group details — balances & settlement
The app calculates each member's net balance and proposes the minimum number of transfers to settle the debts.
![Group details](docs/screenshots/03-group-details.png)

### Adding an expense
Supports equal splits or custom amounts per participant. Validation ensures the split sums match the total.
![Add expense](docs/screenshots/04-add-expense.png)

## 🛠️ Tech Stack

- **Frontend:** React · Vite · CSS · `fetch` · hash routing
- **API:** Node.js · Express · JWT · bcrypt
- **Database:** PostgreSQL · `pg` driver
- **Containers:** Docker Compose · Nginx for the production React build

## Architecture

`Browser → Nginx (React assets and /api proxy) → Express API → PostgreSQL`

In Docker, Nginx forwards `/api` to `backend:3000` inside the Compose network; Express connects to `db:5432`. The browser uses relative `/api` URLs on `localhost:5173` and never needs a container hostname. During local frontend development, Vite proxies `/api` to `localhost:3000` instead.

## 📁 Project Structure

```
splitit/
├── compose.yaml             # PostgreSQL, Express, and React/Nginx services
├── backend/                # Node.js + Express API
│   ├── Dockerfile
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business logic (balance algorithm)
│   │   ├── middleware/     # JWT auth
│   │   ├── routes/         # API endpoints
│   │   └── server.js       # Entry point
│   ├── sql/                # Database schema
│   └── requests.http       # REST Client test file
├── frontend/               # React SPA
│   ├── Dockerfile           # Vite build + Nginx runtime
│   ├── nginx.conf           # Static files and /api proxy
│   ├── index.html           # React entry
│   ├── src/                 # React components and API helpers
│   ├── vite.config.js       # Dev proxy: /api -> Express on port 3000
│   └── css/                 # Shared styles
└── docs/screenshots/       # README assets
```

## 🚀 Getting Started

### Full stack with Docker Compose

Requires Docker with Compose. In the repository root, create a Git-ignored `.env` file with your own local values (replace the placeholders; do not commit this file):

```env
SPLITIT_DOCKER_DB_PASSWORD=<choose-a-local-password>
SPLITIT_DOCKER_JWT_SECRET=<choose-a-long-random-secret>
```

Start the three services from the repository root:

```bash
docker compose up -d --build
```

Open **http://localhost:5173/**. The API is also reachable directly at `http://localhost:3000/`; PostgreSQL is bound to `localhost:5433` on the host. Compose uses the separate `splitit_docker` database and a persistent volume. `backend/sql/schema.sql` runs only when that volume is first initialized empty.

Stop the services while retaining the database volume:

```bash
docker compose stop
```

### Local development

Requires Node.js v20.19+ or v22.12+ and Docker Compose for the isolated development database. Stop the containerized frontend and backend if they use ports 5173 and 3000, then start only PostgreSQL:

```bash
docker compose stop frontend backend
docker compose up -d db
```

In `backend/.env` (also Git-ignored), set these values. Use the same password you chose for `SPLITIT_DOCKER_DB_PASSWORD` above, and replace the JWT placeholder with a local secret:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5433
DB_NAME=splitit_docker
DB_USER=splitit_dev
DB_PASSWORD=<same-local-database-password>
JWT_SECRET=<choose-a-long-random-secret>
```

Run the API and frontend in separate terminals, from the repository root:

```bash
cd backend
npm ci
npm run dev
```

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173/` (or Vite's printed port). Routes include `/#login`, `/#register`, `/#groups`, and `/#group/:id`. From the repository root, stop the development database with `docker compose stop db` when finished. To check the frontend bundle separately, run `npm run build` in `frontend/`.

### Verification status

Previously verified: the React production build; `docker compose config -q`; Docker image builds and container starts; HTTP 200 from the frontend at `/`, its built JavaScript asset, the backend at `/`, and `/api/db-test` through both the backend and the Nginx proxy. The isolated Docker database was observed healthy with the five schema tables present and empty at initialization. **A complete end-to-end test of registration, login, groups, members, expenses, balances, permissions, and browser navigation against a test database is still outstanding.** No new tests were run for this README update.

## 📡 API Endpoints

| Method | Endpoint                                          | Description                | Auth |
|--------|---------------------------------------------------|----------------------------|------|
| POST   | `/api/auth/register`                              | Register a new user        | —    |
| POST   | `/api/auth/login`                                 | Login and receive JWT      | —    |
| GET    | `/api/auth/me`                                    | Current user profile       | ✅   |
| POST   | `/api/groups`                                     | Create a group             | ✅   |
| GET    | `/api/groups`                                     | List my groups             | ✅   |
| GET    | `/api/groups/:id`                                 | Group details + members    | ✅   |
| POST   | `/api/groups/:id/members`                         | Add a member               | ✅   |
| DELETE | `/api/groups/:id/members/:userId`                 | Remove a member            | ✅   |
| POST   | `/api/groups/:id/expenses`                        | Add an expense             | ✅   |
| GET    | `/api/groups/:id/expenses`                        | List expenses              | ✅   |
| DELETE | `/api/groups/:id/expenses/:expenseId`             | Delete an expense          | ✅   |
| GET    | `/api/groups/:id/balances`                        | Balances + settlement plan | ✅   |

## 🧠 What I Learned

This was my first JavaScript project, built phase by phase as a learning exercise:

- **Phase 1** — Node.js project setup, Express, PostgreSQL connection pooling, environment variables
- **Phase 2** — JWT authentication, bcrypt password hashing, middleware
- **Phase 3** — REST API design, many-to-many relationships, SQL JOINs, authentication vs authorization
- **Phase 4** — Money handling with `NUMERIC`, SQL transactions, service-layer pattern, greedy debt-simplification algorithm
- **Phase 5** — DOM manipulation, `fetch` API, hash-based SPA routing, XSS prevention
- **Phase 6** — migration to React and Vite, plus Docker Compose deployment with Nginx

## 👤 Author

**Malek Bouaziz** — 4th-semester Computer Science student
[GitHub](https://github.com/MalekBouaziz2004)
