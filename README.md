# SplitIt — Shared Expense Tracker

A full-stack web application for tracking shared expenses between friends, roommates, or trip groups. Inspired by Splitwise. Built as a learning project to discover JavaScript, Node.js, Express, and PostgreSQL.

## ✨ Features

- 🔐 **JWT authentication** with bcrypt-hashed passwords
- 👥 **Groups** with multiple members and role-based authorization
- 💸 **Expenses** with equal or custom splits
- ⚖️ **Automatic balance calculation** (who owes whom)
- 🧮 **Debt simplification algorithm** — minimum number of transfers to settle up
- ⚛️ **React frontend** powered by Vite, with authentication, groups, members, expenses, and balances

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

**Backend:** Node.js · Express · PostgreSQL (`pg` driver) · JWT · bcrypt
**Frontend:** React · Vite · CSS · `fetch` API · hash routing
**Dev tools:** nodemon · dotenv · REST Client · Vite

## 📁 Project Structure

```
splitit/
├── backend/                # Node.js + Express API
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
│   ├── index.html           # React entry
│   ├── src/                 # React components and API helpers
│   ├── vite.config.js       # Dev proxy: /api -> Express on port 3000
│   └── css/                 # Shared styles
└── docs/screenshots/       # README assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js v20.19+ or v22.12+ (required by Vite 8)
- PostgreSQL 14+

### Setup

```bash
git clone https://github.com/MalekBouaziz2004/splitit.git
cd splitit/backend
npm install
```

Create the database (e.g., via pgAdmin):
```sql
CREATE DATABASE splitit_db;
```

Then run the schema in `sql/schema.sql` against `splitit_db`.

Copy `.env.example` to `.env` and fill in your credentials:
```env
DB_PASSWORD=your_password
JWT_SECRET=any_long_random_string
```

Start the server:
```bash
npm run dev
```

### Optional PostgreSQL and Express with Docker Compose

Docker Compose can run PostgreSQL and the Express backend. The React frontend still runs on the host. Create a `.env` file in the repository root with local secrets (this file is ignored by Git):

```env
SPLITIT_DOCKER_DB_PASSWORD=<your-local-password>
SPLITIT_DOCKER_JWT_SECRET=<your-local-jwt-secret>
```

From the repository root, start only the database, or start the backend together with its database dependency:

```bash
docker compose up -d db
docker compose up -d --build backend
```

The containerized API is available at `http://localhost:3000`; PostgreSQL is available only on the host loopback interface at `localhost:5433`. To use this database from a host-run backend instead, set `DB_HOST=localhost`, `DB_PORT=5433`, `DB_NAME=splitit_docker`, `DB_USER=splitit_dev`, and `DB_PASSWORD` to the password in the root `.env`. The containerized backend uses `db:5432`. These values are separate from the existing `splitit_db` setup. The schema in `backend/sql/schema.sql` is applied only when the Docker volume is first initialized on an empty database.

Stop both services without deleting the persistent database volume:

```bash
docker compose stop backend db
```

### Run the React frontend

Keep the Express server running on `http://localhost:3000`. In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173/` (or use the port printed by Vite). Direct routes include `/#login`, `/#register`, `/#groups`, and `/#group/:id`. Login and registration use the existing Express API. The groups overview lists and creates groups. Group details include members, expenses, balances, and suggested settlement transfers. Equal and custom expense splits are supported. Settlement transfers are suggestions only; the API does not record payments. Vite forwards `/api` requests to `http://localhost:3000`, so the React API client uses the existing Express routes without a hard-coded API origin. The frontend uses `frontend/css/style.css`.

To check the production bundle, run `npm run build` in `frontend/`. The build writes `frontend/dist/index.html` and its assets.

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

## 👤 Author

**Malek Bouaziz** — 4th-semester Computer Science student
[GitHub](https://github.com/MalekBouaziz2004)
