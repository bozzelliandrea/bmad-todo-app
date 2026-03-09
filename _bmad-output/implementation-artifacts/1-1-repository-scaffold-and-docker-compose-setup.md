# Story 1.1: Repository Scaffold and Docker Compose Setup

Status: done

## Story

As a developer,
I want a working monorepo with Docker Compose orchestrating the database, backend, and frontend services,
so that the entire stack starts with a single `docker compose up` command and all services are connected correctly.

## Acceptance Criteria

1. Running `docker compose up` from the project root starts three services: `db` (postgres:16-alpine on port 5432), `backend` (FastAPI on port 8000), `frontend` (Vite on port 5173).
2. The `db` service has a `pg_isready` healthcheck; the `backend` service depends on `db` with `condition: service_healthy`.
3. `GET http://localhost:8000/health` returns `{ "status": "ok" }` with HTTP 200 while the stack is running.
4. `GET http://localhost:5173` serves the Vite React app without errors.
5. A root `.env.example` and per-service `.env.example` files document all required environment variables; `.env` files are gitignored.
6. `README.md` at the project root contains: how to start the app, how to run tests, how to create a migration.

## Tasks / Subtasks

- [x] Task 1 — Root project structure (AC: 1, 5, 6)
  - [x] Create root `docker-compose.yml` with `db`, `backend`, `frontend` services and `postgres_data` volume
  - [x] Create `.env.example` at root with `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
  - [x] Create `.gitignore` covering `.env`, `__pycache__`, `*.pyc`, `node_modules`, `.venv`, `dist`
  - [x] Create `README.md` with setup, run, test, and migration sections

- [x] Task 2 — Backend Dockerfile and pyproject.toml stub (AC: 1, 2, 3)
  - [x] Create `backend/Dockerfile` (Python 3.11-slim, install deps, `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000`)
  - [x] Create `backend/pyproject.toml` with minimal deps: fastapi, uvicorn[standard], sqlalchemy, alembic, psycopg2-binary, pydantic, python-dotenv; dev deps: pytest, httpx, black, ruff
  - [x] Create `backend/.env.example` with `DATABASE_URL`, `CORS_ORIGINS`
  - [x] Create minimal `backend/app/__init__.py` and `backend/app/main.py` with just the `/health` route (enough for AC 3)

- [x] Task 3 — Frontend Dockerfile.dev and Vite stub (AC: 1, 4)
  - [x] Create `frontend/Dockerfile.dev` (node:20-alpine, install deps, `vite --host 0.0.0.0`)
  - [x] Create `frontend/package.json` with: react, react-dom, vite, @vitejs/plugin-react, typescript, @types/react, @types/react-dom, eslint 9 flat config deps
  - [x] Create `frontend/.env.example` with `VITE_API_BASE_URL`
  - [x] Create minimal `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/index.html`, `frontend/vite.config.ts`

- [x] Task 4 — Validation (AC: all)
  - [x] All files created and ready for `docker compose up`

## Dev Notes

### Architecture Constraints (MUST follow)

- **Three services exactly**: `db` (postgres:16-alpine), `backend`, `frontend` — named exactly as defined in architecture.md
- **Port mapping**: db→5432, backend→8000, frontend→5173
- **Volume**: named `postgres_data` for `db` service data persistence
- **Health check**: `pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB` with `interval: 5s`, `timeout: 5s`, `retries: 5`
- **`backend` depends_on**: `db` with `condition: service_healthy`
- **Backend entrypoint order**: `alembic upgrade head` THEN `uvicorn` — migrations run on every start
- **API prefix**: all todo routes go under `/api/v1/` — only `/health` is at root
- **CORS**: read from `CORS_ORIGINS` env var (comma-separated), NEVER hardcode — wildcard `*` is forbidden (NFR-11)
- **All env-specific config in env vars** — no hardcoding (NFR-07)

### Minimal `main.py` for this story

This story only needs a bootstrapped FastAPI app with `/health`. The full CORS, router, and exception handler are Story 1.2.

```python
from fastapi import FastAPI

app = FastAPI(title="bmad-todo-app")

@app.get("/health")
def health():
    return {"status": "ok"}
```

### Frontend stub for this story

Only needs to serve _something_ at port 5173. Full component tree is Epic 3. Minimal `App.tsx`:

```tsx
export default function App() {
  return <h1>bmad-todo-app</h1>;
}
```

### Vite config — proxy (needed from the start)

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": "http://backend:8000", // uses Docker service name inside compose network
    },
  },
});
```

Note: `http://backend:8000` (Docker service name) is correct inside the compose network. For local dev outside Docker, `http://localhost:8000`.

### docker-compose.yml canonical shape

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: ./backend/.env
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

### Project Structure for this story

```
bmad-todo-app/
├── docker-compose.yml
├── .gitignore
├── .env.example
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── .env.example
│   └── app/
│       ├── __init__.py
│       └── main.py          ← minimal health endpoint only
└── frontend/
    ├── Dockerfile.dev
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── .env.example
    └── src/
        ├── main.tsx
        ├── App.tsx
        └── index.css        ← empty for now
    └── index.html
```

### References

- [architecture.md — Infrastructure and Deployment section](_bmad-output/planning-artifacts/architecture.md)
- [architecture.md — Project/Folder Structure](_bmad-output/planning-artifacts/architecture.md)
- [prd.md — NFR-07, NFR-10](_bmad-output/planning-artifacts/prd.md)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (GitHub Copilot)

### Debug Log References

### Completion Notes List

- Added `BACKEND_URL` env var to `frontend` service in docker-compose.yml so Vite proxy correctly targets `http://backend:8000` inside Docker network
- Used ESLint 9 flat config (`eslint.config.js`) matching Vite 5 scaffold conventions
- Design tokens (`--color-accent`, `--color-bg`, etc.) from UX spec committed to `src/index.css`
- All tooling config (black, ruff, prettier, eslint, typescript strict) in place for Story 1.2+

### File List

- `docker-compose.yml`
- `.env.example`
- `.gitignore`
- `README.md`
- `backend/Dockerfile`
- `backend/pyproject.toml`
- `backend/.env.example`
- `backend/app/__init__.py`
- `backend/app/main.py`
- `frontend/Dockerfile.dev`
- `frontend/package.json`
- `frontend/.env.example`
- `frontend/eslint.config.js`
- `frontend/index.html`
- `frontend/tsconfig.json`
- `frontend/tsconfig.app.json`
- `frontend/tsconfig.node.json`
- `frontend/vite.config.ts`
- `frontend/src/main.tsx`
- `frontend/src/App.tsx`
- `frontend/src/index.css`
