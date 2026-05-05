# SplitIt — Shared Expense Tracker

A full-stack web application for tracking shared expenses between friends, roommates, or trip groups. Inspired by Splitwise.

 — this project is being built step by step as a learning exercise to discover JavaScript, Node.js, Express, and PostgreSQL.

## ✨ Features (planned)

- 🔐 User registration & login (JWT authentication)
- 👥 Create groups and invite members
- 💸 Add shared expenses with custom splits
- ⚖️ Automatic balance calculation (who owes whom)
- 🧮 Debt simplification algorithm
- 🌐 Vanilla JS frontend talking to a REST API

## 🛠️ Tech Stack

**Backend:** Node.js · Express · PostgreSQL (`pg` driver) · JWT · bcrypt
**Frontend:** HTML · CSS · Vanilla JavaScript (`fetch` API)
**Dev tools:** nodemon · dotenv · REST Client (VS Code extension)

## 📁 Project Structure

```
splitit/
├── backend/        # Node.js + Express API
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # JWT auth, etc.
│   │   ├── routes/         # API endpoints
│   │   └── server.js       # Entry point
│   ├── sql/                # SQL schema files
│   └── package.json
└── frontend/       # (coming soon)
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL 14+

### Setup

```bash
# Clone the repo
git clone https://github.com/MalekBouaziz2004/splitit.git
cd splitit/backend

# Install dependencies
npm install

# Create the database in PostgreSQL (e.g. via pgAdmin)
# CREATE DATABASE splitit_db;

# Run schema
# Execute sql/schema.sql against splitit_db

# Configure environment
cp .env.example .env
# Then edit .env with your PostgreSQL credentials and JWT secret

# Run the server
npm run dev
```

The API will be available at `http://localhost:3000`.

## 📡 API Endpoints (so far)

| Method | Endpoint              | Description                  | Auth |
|--------|----------------------|------------------------------|------|
| GET    | `/`                  | Health check                 | —    |
| GET    | `/api/db-test`       | Database connection test     | —    |
| POST   | `/api/auth/register` | Register a new user          | —    |
| POST   | `/api/auth/login`    | Login and receive JWT        | —    |
| GET    | `/api/auth/me`       | Get current user profile     | ✅   |

## 📚 Learning Roadmap

- Phase 1 — Project setup, Express + PostgreSQL connection
- Phase 2 — User authentication (JWT, bcrypt)
- Phase 3 — Groups & members CRUD
- Phase 4 — Expenses & balance calculation
- Phase 5 — Frontend with vanilla JS

## 👤 Author

**Malek Bouaziz** 