# AGENT.md — Guidance for AI Agents Working in This Repository

This file tells AI coding agents (GitHub Copilot, Claude, Cursor, etc.) how to work safely and correctly in this codebase. Read it fully before making any changes.

Coding rules and before/after examples live in [`.github/copilot-instructions.md`](.github/copilot-instructions.md). This file covers **navigation, commands, architecture, and workflow**.

---

## Repository layout

```
bmad-todo-app/
├── backend/               # FastAPI application (Python 3.11)
│   ├── app/
│   │   ├── main.py        # App factory: CORS, exception handler, router wiring
│   │   ├── database.py    # SQLAlchemy engine, SessionLocal, get_db()
│   │   ├── models.py      # ORM models (Todo)
│   │   ├── schemas.py     # Pydantic v2 request/response schemas
│   │   ├── crud.py        # All DB logic — the only place queries live
│   │   └── routers/
│   │       └── todos.py   # HTTP routes — delegates everything to crud.*()
│   ├── alembic/           # Database migrations
│   │   └── versions/      # One file per migration
│   ├── tests/
│   │   ├── conftest.py    # SQLite in-memory engine, client fixture, reset_db autouse
│   │   └── test_todos.py  # 22 pytest tests grouped in classes
│   └── pyproject.toml     # Dependencies + tool config (pytest, ruff, black)
│
├── frontend/              # React 18 + Vite + TypeScript
│   └── src/
│       ├── types.ts        # Shared TypeScript interfaces (Todo)
│       ├── api.ts          # All fetch() calls — single source of HTTP logic
│       ├── hooks/
│       │   └── useTodos.ts # State management — todos, loading, error + mutation callbacks
│       ├── components/     # Pure presentational components
│       │   ├── Header.tsx
│       │   ├── AddTodoForm.tsx
│       │   ├── TodoList.tsx
│       │   ├── TodoItem.tsx
│       │   ├── LoadingState.tsx
│       │   ├── EmptyState.tsx
│       │   └── ErrorBanner.tsx
│       ├── App.tsx         # Root: wires useTodos() → components
│       └── index.css       # Design tokens (CSS custom properties) + all styles
│
├── e2e/                   # Playwright end-to-end tests
│   ├── playwright.config.ts
│   └── tests/
│       └── todo-app.spec.ts  # 22 scenarios; beforeEach resets DB via REST API
│
├── docker-compose.yml     # db + backend + frontend services
├── Makefile               # All day-to-day commands (run `make` for help)
├── .env.example           # Root env vars (Postgres credentials)
├── backend/.env.example   # DATABASE_URL, CORS_ORIGINS
└── frontend/.env.example  # VITE_API_BASE_URL
```

---

## Essential commands

Always use the Makefile targets — they encode the correct flags and order.

```bash
make setup          # First-time setup: copy .env files + npm install + playwright browsers
make up             # Build and start all services (Docker Compose)
make down           # Stop containers
make clean          # Stop containers AND remove DB volume (destructive)
make logs           # Tail all container logs

make db             # Start only PostgreSQL
make backend        # Start db + backend
make frontend       # Start full stack (db + backend + frontend)

make test           # Backend pytest suite — no running stack needed
make test-e2e       # Playwright E2E — requires stack already running on :5173
make test-all       # Both suites in sequence
```

**After modifying backend code**, always run `make test` to verify nothing is broken.  
**After modifying frontend or E2E tests**, start the stack with `make up` then run `make test-e2e`.

---

## How to verify your changes

| Change type                | Verification                                                 |
| -------------------------- | ------------------------------------------------------------ |
| New/edited Python function | `make test` (no stack needed)                                |
| New Alembic migration      | `make up` and check that backend starts without errors       |
| New frontend component     | `make up`, open `http://localhost:5173`, run `make test-e2e` |
| New E2E test               | `make up`, `make test-e2e`                                   |
| CSS change                 | `make up`, open the app, check at 375px viewport too         |

---

## How to add a new feature

### Backend

1. **Model** — add columns to `backend/app/models.py`.
2. **Migration** — create a new file in `backend/alembic/versions/` following the naming pattern `0002_description.py`.
3. **Schema** — add/update Pydantic v2 schemas in `backend/app/schemas.py`.
4. **CRUD** — implement the DB logic in `backend/app/crud.py`. This is the **only** file that touches `db.query()`.
5. **Router** — add the route in `backend/app/routers/todos.py`, calling `crud.*()`. Set correct status codes (POST → 201, DELETE → 204).
6. **Tests** — add a test class in `backend/tests/test_todos.py`. Use the `client` fixture; include a docstring citing the FR or AC.

### Frontend

1. **Types** — update `frontend/src/types.ts` if the API response shape changes.
2. **API** — add a typed helper in `frontend/src/api.ts`.
3. **Hook** — add the mutation callback in `frontend/src/hooks/useTodos.ts`; always call `fetchTodos()` after the API call resolves.
4. **Component** — create a new file in `frontend/src/components/`. Use CSS tokens; add `aria-label` to every interactive element.
5. **E2E test** — add a `test.describe` block in `e2e/tests/todo-app.spec.ts` using semantic locators.

---

## Critical constraints

- **Routers never query the DB directly.** Queries live only in `crud.py`.
- **Components never call `fetch()`.** All HTTP lives in `api.ts`.
- **No Pydantic v1 APIs.** Use `field_validator` + `ConfigDict`, never `@validator` or `class Config`.
- **No `datetime.utcnow()`.** Use `datetime.now(timezone.utc)`.
- **No `server_default` for UUID PKs.** Use `default=uuid.uuid4` so SQLite tests work.
- **No hardcoded colours or spacing.** Use `var(--color-*)`, `var(--radius-*)`, `var(--shadow-*)`.
- **No CSS selectors in Playwright tests.** Use `getByRole`, `getByLabel`, `getByText`.
- **Every function in TypeScript must have an explicit return type.** No `any`.
- **After every mutation in a hook, call `fetchTodos()`.** Never patch local state optimistically.

---

## API contract

Base path: `/api/v1`

| Method | Path          | Success | Body              |
| ------ | ------------- | ------- | ----------------- |
| GET    | `/todos`      | 200     | `Todo[]`          |
| POST   | `/todos`      | 201     | `Todo`            |
| PATCH  | `/todos/{id}` | 200     | `Todo`            |
| DELETE | `/todos/{id}` | 204     | —                 |
| GET    | `/health`     | 200     | `{"status":"ok"}` |

`Todo` shape: `{ id: string (UUID), title: string, is_done: boolean, created_at: string, updated_at: string }`

---

## Environment variables

| File            | Variable            | Default                                                | Purpose                                                   |
| --------------- | ------------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| `.env`          | `POSTGRES_USER`     | `todo_user`                                            | Postgres username                                         |
| `.env`          | `POSTGRES_PASSWORD` | `todo_password`                                        | Postgres password                                         |
| `.env`          | `POSTGRES_DB`       | `todo_db`                                              | Database name                                             |
| `backend/.env`  | `DATABASE_URL`      | `postgresql://todo_user:todo_password@db:5432/todo_db` | SQLAlchemy connection string                              |
| `backend/.env`  | `CORS_ORIGINS`      | `http://localhost:5173`                                | Comma-separated allowed origins                           |
| `frontend/.env` | `VITE_API_BASE_URL` | `http://localhost:8000`                                | Backend URL for direct calls (Vite proxies `/api` in dev) |

The test suite overrides `DATABASE_URL` to `sqlite://` (in-memory) before any imports, so no running database is needed for `make test`.

---

## Ports

| Service         | Port                       |
| --------------- | -------------------------- |
| PostgreSQL      | 5432                       |
| FastAPI         | 8000                       |
| Vite dev server | 5173                       |
| Swagger UI      | http://localhost:8000/docs |

---

## Things to avoid

- Do **not** run raw `pytest` or `uvicorn` outside the virtualenv — use `make test` or Docker.
- Do **not** edit `.env` files or `docker-compose.yml` to change credentials — update `.env.example` and document the change.
- Do **not** create helper utilities or abstract base classes unless a concrete need exists — keep it simple.
- Do **not** add `console.log` debugging to committed code.
- Do **not** add new npm packages to `frontend/` without checking `e2e/` compatibility (shared Playwright browser installs).
