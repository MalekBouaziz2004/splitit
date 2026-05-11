# SplitIt — Shared Expense Tracker

A full-stack web application for tracking shared expenses between friends, roommates, or trip groups. Inspired by Splitwise. Built as a learning project to discover JavaScript, Node.js, Express, and PostgreSQL.

## ✨ Features

- 🔐 **JWT authentication** with bcrypt-hashed passwords
- 👥 **Groups** with multiple members and role-based authorization
- 💸 **Expenses** with equal or custom splits
- ⚖️ **Automatic balance calculation** (who owes whom)
- 🧮 **Debt simplification algorithm** — minimum number of transfers to settle up
- 🌐 **Vanilla JS frontend** talking to a REST API (no framework)

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

### REST API
The backend exposes a JWT-protected REST API tested with the REST Client extension.
![API test](docs/screenshots/05-api-test.png)

### Database schema
PostgreSQL with foreign keys, composite primary keys, indexes, and `CHECK` constraints for data integrity.
![Database schema](docs/screenshots/06-database-schema.png)

## 🛠️ Tech Stack

**Backend:** Node.js · Express · PostgreSQL (`pg` driver) · JWT · bcrypt
**Frontend:** HTML · CSS · Vanilla JavaScript (`fetch` API, hash routing)
**Dev tools:** nodemon · dotenv · REST Client · Live Server

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
├── frontend/               # Vanilla JS SPA
│   ├── index.html
│   ├── css/
│   └── js/
└── docs/screenshots/       # README assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
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

In a separate terminal, serve the frontend (e.g., via VS Code's **Live Server** extension on `frontend/index.html`).

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
