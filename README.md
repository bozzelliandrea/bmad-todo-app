# bmad-todo-app

A full-stack personal task manager built with React, FastAPI, and PostgreSQL — developed using the [BMAD Method](https://github.com/bmad-method/bmad-method).

## Stack

| Layer           | Technology                   |
| --------------- | ---------------------------- |
| Frontend        | React 18 + Vite + TypeScript |
| Backend         | FastAPI (Python 3.11)        |
| Database        | PostgreSQL 16                |
| Dev environment | Docker Compose               |

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose v2)

## Getting Started

### 1. Clone and configure environment

```bash
git clone https://github.com/bozzelliandrea/bmad-todo-app.git
cd bmad-todo-app

# Copy and fill in environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

The default values in `.env.example` work out of the box for local development — no changes required.

### 2. Start the full stack

```bash
docker compose up
```

This starts three services:

- **db** — PostgreSQL 16 on port `5432`
- **backend** — FastAPI on `http://localhost:8000`
- **frontend** — Vite dev server on `http://localhost:5173`

The backend runs `alembic upgrade head` automatically on startup, so the database schema is always up to date.

### 3. Open the app

```
http://localhost:5173
```

API docs (Swagger UI):

```
http://localhost:8000/docs
```

Health check:

```
http://localhost:8000/health
```

## Running Tests

### Backend tests

```bash
docker compose run --rm backend pytest
```

Or inside a running container:

```bash
docker compose exec backend pytest
```

### Frontend (lint and type-check)

```bash
docker compose exec frontend npm run lint
docker compose exec frontend npm run typecheck
```

## Database Migrations

Migrations are managed with [Alembic](https://alembic.sqlalchemy.org/).

### Create a new migration

```bash
docker compose exec backend alembic revision --autogenerate -m "describe your change"
```

The new migration file is created in `backend/alembic/versions/`.

### Apply all pending migrations

```bash
docker compose exec backend alembic upgrade head
```

This also runs automatically every time the backend container starts.

### Roll back one migration

```bash
docker compose exec backend alembic downgrade -1
```

## Project Structure

```
bmad-todo-app/
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/                 # FastAPI application
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── alembic/             # Migrations (created in Story 1.3)
│   └── app/
│       ├── main.py
│       ├── database.py
│       ├── models.py
│       ├── schemas.py
│       ├── crud.py
│       └── routers/
│           └── todos.py
└── frontend/                # React SPA
    ├── Dockerfile.dev
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api.ts
        ├── types.ts
        ├── hooks/
        │   └── useTodos.ts
        └── components/
```

## API Reference

| Method   | Path                 | Description       |
| -------- | -------------------- | ----------------- |
| `GET`    | `/health`            | Health check      |
| `GET`    | `/api/v1/todos`      | List all todos    |
| `POST`   | `/api/v1/todos`      | Create a todo     |
| `PATCH`  | `/api/v1/todos/{id}` | Toggle completion |
| `DELETE` | `/api/v1/todos/{id}` | Delete a todo     |
