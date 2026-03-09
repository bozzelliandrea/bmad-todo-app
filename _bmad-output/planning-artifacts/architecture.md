---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-bmad-todo-app-2026-03-09.md
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
workflowType: architecture
status: complete
---

# Architecture Decision Document — bmad-todo-app

**Author:** Boz  
**Date:** 2026-03-09  
**Status:** Complete  
**Version:** 1.0

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements Summary (from PRD):**

| Category             | Count          | Key Implications                                           |
| -------------------- | -------------- | ---------------------------------------------------------- |
| Task CRUD operations | FR-01 to FR-09 | Single resource REST API; stateless backend                |
| Session persistence  | FR-10 to FR-13 | PostgreSQL required; no local-only storage                 |
| List presentation    | FR-14 to FR-17 | Read-heavy for initial load; ordering by `created_at`      |
| Error handling       | FR-18 to FR-22 | Client and server both validate; structured error contract |
| API contract         | FR-23 to FR-28 | 5 endpoints; JSON only; CORS required                      |
| Responsive layout    | FR-29 to FR-30 | CSS-only concerns; no backend impact                       |

**Non-Functional Requirements driving architecture:**

- **NFR-01–03 (Performance):** < 200ms API response, < 1s frontend TTI → Vite bundler (fast dev + optimized prod), async FastAPI, connection pooling via SQLAlchemy
- **NFR-04–06 (Reliability):** Data consistency, clean restart, DB health check → PostgreSQL transactions, Docker health checks, SQLAlchemy sessions in try/finally
- **NFR-07–10 (Maintainability):** Env vars, formatter, README, one-command start → `.env` files, docker-compose, Prettier + Black
- **NFR-11–13 (Security):** CORS locked, parameterized SQL, no stack traces in responses → FastAPI CORS middleware, SQLAlchemy ORM only, custom exception handlers
- **NFR-14–15 (Accessibility):** Keyboard nav, ARIA, contrast → frontend-only concerns, no architectural impact

**Scale & Complexity:**

- Project type: Full-stack greenfield SPA + REST API
- Complexity: **Low** — single resource, no auth, no real-time, no external integrations
- Estimated architectural components: 6 (frontend app, API server, database, Docker Compose orchestration, migrations, test suite)

### Technical Constraints & Dependencies

| Constraint                         | Source                      | Impact                                                                     |
| ---------------------------------- | --------------------------- | -------------------------------------------------------------------------- |
| React + FastAPI + PostgreSQL stack | User preference             | Fixed; no alternative evaluation needed                                    |
| No authentication in MVP           | PRD scope decision          | No JWT/session middleware; simpler CORS rules                              |
| Single-command local startup       | NFR-10                      | Docker Compose is the local dev environment                                |
| Extensible for auth later          | Product brief future vision | User-agnostic DB schema; no user-specific assumptions baked into API shape |
| No real-time features              | PRD out-of-scope            | No WebSockets, no SSE; plain HTTP polling acceptable                       |

### Cross-Cutting Concerns

1. **Error handling contract:** Both client and server must agree on error shape — `{ "detail": "..." }` for all failures.
2. **Environment configuration:** All secrets/config in `.env`; never hardcoded; shared pattern between Docker Compose and local CLI.
3. **CORS:** Consistent origin allowlist between dev and prod `.env` files.
4. **Database session lifecycle:** Every request gets a fresh SQLAlchemy session; all sessions closed regardless of success or failure.
5. **Testing:** Backend unit/integration tests use a separate test database; frontend tests mock the API module.

---

## Technology Stack Decisions

### ADR-001: Frontend Framework — React with Vite

**Status:** Decided  
**Context:** Need a fast, modern SPA framework with good ecosystem support. Options: React (Vite), Next.js, Vue 3.  
**Decision:** **React with Vite**  
**Rationale:**

- Next.js adds SSR/SSG complexity that is unnecessary for a simple SPA with a separate API.
- Vite provides near-instant HMR and optimized production builds with minimal config.
- React is the most widely understood framework — maximizes future maintainability.
- TypeScript enabled from project creation for type safety.

**Consequences:** Frontend and backend run on separate ports in dev (`:5173` and `:8000`). CORS must be configured.

---

### ADR-002: Backend Framework — FastAPI (Python)

**Status:** Decided  
**Context:** Need a Python REST API framework. Options: FastAPI, Django REST Framework, Flask.  
**Decision:** **FastAPI**  
**Rationale:**

- Automatic OpenAPI/Swagger docs at `/docs` with zero config — useful for dev and testing.
- Native async support; performant under concurrent requests.
- Pydantic models provide request/response validation and serialization out of the box.
- Type annotations throughout align with Python best practices.
- Significantly less ceremony than Django for a simple CRUD API.

**Consequences:** Python 3.11+. Pydantic v2. Uvicorn as the ASGI server.

---

### ADR-003: Database — PostgreSQL via SQLAlchemy ORM

**Status:** Decided  
**Context:** Need durable relational storage. Options: PostgreSQL, SQLite, MySQL.  
**Decision:** **PostgreSQL 16 with SQLAlchemy 2.x ORM**  
**Rationale:**

- PostgreSQL is production-grade, transaction-safe, and standard for Python web apps.
- SQLAlchemy ORM ensures parameterized queries by design (NFR-12), preventing SQL injection.
- UUID primary keys (via `uuid4`) are generated at DB level — safer for future multi-user scenarios.
- Alembic (SQLAlchemy's migration tool) enables schema evolution without raw SQL files.
- SQLite would be sufficient for MVP but creates a migration risk when moving to production.

**Consequences:** PostgreSQL Docker image required in Docker Compose. Alembic config file in `backend/`.

---

### ADR-004: Local Development — Docker Compose

**Status:** Decided  
**Context:** Need a one-command local startup (NFR-10). Options: Docker Compose, manual scripts, Makefile.  
**Decision:** **Docker Compose v3 with three services**  
**Rationale:**

- Single `docker compose up` starts `db`, `backend`, and `frontend` in the correct order.
- Service dependencies and health checks ensure backend waits for PostgreSQL.
- Consistent environment across developer machines; no "works on my machine" issues.
- Volumes mount source code for hot-reload in development.

**Services:**

| Service    | Image / Build                 | Port   | Notes                      |
| ---------- | ----------------------------- | ------ | -------------------------- |
| `db`       | `postgres:16-alpine`          | `5432` | Health check: `pg_isready` |
| `backend`  | `./backend` (Dockerfile)      | `8000` | `depends_on: db (healthy)` |
| `frontend` | `./frontend` (Dockerfile.dev) | `5173` | Volume-mounted for HMR     |

---

### ADR-005: Frontend State Management — React Hooks Only

**Status:** Decided  
**Context:** How to manage todo list state. Options: React Context + hooks, Redux, Zustand, React Query.  
**Decision:** **Local component state with `useState` + `useEffect`**  
**Rationale:**

- The entire app is a single page with one resource. Global state management libraries add overhead not justified for this scope.
- A single `useTodos` custom hook encapsulates all state + API calls cleanly.
- State is server-authoritative: every mutation fetches fresh data from the server (no client-side optimistic patching in MVP).
- This approach is the simplest to understand and debug; teaches clean hook patterns.

**Post-MVP:** If optimistic updates or caching become necessary, TanStack Query (React Query) can replace the `useTodos` hook with minimal refactoring.

---

### ADR-006: No Authentication in MVP

**Status:** Decided  
**Context:** Auth would require user table, session management, JWT/cookie handling.  
**Decision:** **No authentication.** All API endpoints are open.  
**Rationale:** PRD explicitly excludes auth from MVP scope. Adding auth skeletons "for future use" increases complexity with no user value.  
**Extensibility preserved by:**

- `todos` table has no `user_id` column in MVP but the schema is designed so one `ALTER TABLE` migration adds it.
- API route prefix `/api/v1/` allows introducing an auth-gated router at `/api/v1/auth/` without changing existing routes.
- CORS middleware is already present; adding auth headers is additive.

---

## Patterns and Conventions

### Backend Patterns

**Project layout (FastAPI):**

```
backend/
├── app/
│   ├── main.py              # FastAPI app factory; mounts routers; CORS; exception handlers
│   ├── database.py          # SQLAlchemy engine, SessionLocal, Base, get_db dependency
│   ├── models.py            # SQLAlchemy ORM models (Todo)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── routers/
│   │   └── todos.py         # All /todos endpoints
│   └── crud.py              # DB operations (get_todos, create_todo, update_todo, delete_todo)
├── alembic/
│   ├── env.py
│   └── versions/
│       └── 0001_create_todos.py
├── tests/
│   ├── conftest.py          # Test DB setup, TestClient fixture
│   └── test_todos.py        # Endpoint tests
├── alembic.ini
├── Dockerfile
├── pyproject.toml           # Dependencies (fastapi, sqlalchemy, alembic, psycopg2, pydantic, uvicorn)
└── .env.example
```

**Dependency injection pattern (database session):**

```python
# database.py
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# routers/todos.py — all endpoints use:
def get_todos(db: Session = Depends(get_db)):
    ...
```

**Error response contract:**

All errors return `{ "detail": "human-readable message" }` — FastAPI's default for `HTTPException`. Custom handlers for `422` (validation errors) normalize the shape to the same format.

**Pydantic schema pattern:**

```python
# schemas.py
class TodoBase(BaseModel):
    title: str

class TodoCreate(TodoBase):
    pass  # Only title needed on create

class TodoUpdate(BaseModel):
    is_done: bool  # Only is_done patchable in MVP

class TodoResponse(TodoBase):
    id: UUID
    is_done: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

**CRUD pattern (no business logic in routers):**

```python
# crud.py — all DB operations through this layer
def get_todos(db: Session) -> list[Todo]: ...
def create_todo(db: Session, todo: TodoCreate) -> Todo: ...
def update_todo(db: Session, todo_id: UUID, data: TodoUpdate) -> Todo | None: ...
def delete_todo(db: Session, todo_id: UUID) -> bool: ...
```

Routers call `crud.*`; `crud.*` calls ORM; no raw SQL anywhere.

---

### Frontend Patterns

**Project layout (React + Vite):**

```
frontend/
├── src/
│   ├── main.tsx             # React DOM root
│   ├── App.tsx              # Root component; renders Header + AddTodoForm + TodoList
│   ├── api.ts               # All fetch() calls; single source of API truth
│   ├── hooks/
│   │   └── useTodos.ts      # State + side effects for the todo resource
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── AddTodoForm.tsx
│   │   ├── TodoList.tsx
│   │   ├── TodoItem.tsx
│   │   ├── LoadingState.tsx
│   │   ├── EmptyState.tsx
│   │   └── ErrorBanner.tsx
│   ├── types.ts             # Shared TypeScript interfaces (Todo, ApiError)
│   └── index.css            # CSS custom properties (design tokens) + global reset
├── public/
├── index.html
├── vite.config.ts           # Proxy /api → backend in dev
├── tsconfig.json
├── package.json
└── .env.example             # VITE_API_BASE_URL=http://localhost:8000
```

**API module pattern (`api.ts`):**

All `fetch` calls live here. Components never call `fetch` directly.

```typescript
// types.ts
export interface Todo {
  id: string;
  title: string;
  is_done: boolean;
  created_at: string;
  updated_at: string;
}

// api.ts
const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export async function getTodos(): Promise<Todo[]> { ... }
export async function createTodo(title: string): Promise<Todo> { ... }
export async function updateTodo(id: string, is_done: boolean): Promise<Todo> { ... }
export async function deleteTodo(id: string): Promise<void> { ... }
```

**Custom hook pattern (`useTodos.ts`):**

```typescript
export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = async () => { ... };

  useEffect(() => { fetchTodos(); }, []);

  const addTodo = async (title: string) => { ... };
  const toggleTodo = async (id: string, is_done: boolean) => { ... };
  const removeTodo = async (id: string) => { ... };

  return { todos, loading, error, addTodo, toggleTodo, removeTodo, retry: fetchTodos };
}
```

`App.tsx` calls `useTodos()` and passes values/callbacks down as props. No prop drilling beyond one level.

**Dev proxy (Vite):**

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});
```

In development, `fetch('/api/todos')` proxies to `http://localhost:8000/api/todos`, avoiding CORS issues in the browser during local dev.

---

### Error Handling Strategy

| Layer                    | Error type                        | Handling                                                                                        |
| ------------------------ | --------------------------------- | ----------------------------------------------------------------------------------------------- |
| Frontend — API call      | Network error / timeout           | Catch in `api.ts`; re-throw with normalized message                                             |
| Frontend — `useTodos`    | Any API error                     | Set `error` state; display `<ErrorBanner>`; never clear existing `todos`                        |
| Frontend — `AddTodoForm` | Empty input                       | Client-side validation before API call; inline message below input                              |
| Frontend — `AddTodoForm` | API failure on create             | Inline error message; input not cleared (user can retry)                                        |
| Backend — validation     | Empty/missing title               | Pydantic raises `422`; FastAPI returns `{ "detail": [...] }`                                    |
| Backend — not found      | `GET/PATCH/DELETE` on missing ID  | `crud.*` returns `None`; router raises `HTTPException(404)`                                     |
| Backend — DB error       | Connection failure or query error | SQLAlchemy raises; global exception handler returns `500` with generic message (no stack trace) |

---

### Coding Conventions

**General:**

- All code auto-formatted before commit: **Black + Ruff** (backend), **Prettier** (frontend).
- No commented-out code committed. Use `# TODO:` with issue reference for known gaps.
- No magic strings: API base URL from env var; DB URL from env var.

**Python:**

- Type annotations required on all function signatures.
- `snake_case` for everything except Pydantic models (class names `PascalCase`).
- Single `.env` file per service; loaded via `python-dotenv` (or Pydantic `BaseSettings`).

**TypeScript/React:**

- Strict mode enabled (`"strict": true` in `tsconfig.json`).
- `PascalCase` for components, `camelCase` for functions/variables, `SCREAMING_SNAKE_CASE` for constants.
- No `any` types. Use `unknown` and narrow explicitly.
- Props interfaces defined inline or in `types.ts` for shared types.
- `React.FC<Props>` avoided; prefer inline function component declarations.

---

## Project / Folder Structure

```
bmad-todo-app/
├── .env                        # Root-level env (not committed; see .env.example)
├── docker-compose.yml          # Orchestrates db + backend + frontend
├── docker-compose.prod.yml     # (Future) Production overrides
├── README.md                   # Getting started, dev workflow, migration guide
│
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   ├── types.ts
│   │   ├── index.css
│   │   ├── hooks/
│   │   │   └── useTodos.ts
│   │   └── components/
│   │       ├── Header.tsx
│   │       ├── AddTodoForm.tsx
│   │       ├── TodoList.tsx
│   │       ├── TodoItem.tsx
│   │       ├── LoadingState.tsx
│   │       ├── EmptyState.tsx
│   │       └── ErrorBanner.tsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile.dev
│
├── backend/                    # Python FastAPI service
│   ├── app/
│   │   ├── main.py             # App factory + middleware + exception handlers
│   │   ├── database.py         # Engine + session + Base + get_db
│   │   ├── models.py           # SQLAlchemy Todo model
│   │   ├── schemas.py          # Pydantic TodoCreate / TodoUpdate / TodoResponse
│   │   ├── crud.py             # DB operations
│   │   └── routers/
│   │       └── todos.py        # /api/v1/todos endpoints
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   │       └── 0001_create_todos_table.py
│   ├── tests/
│   │   ├── conftest.py
│   │   └── test_todos.py
│   ├── alembic.ini
│   ├── pyproject.toml
│   ├── .env.example
│   └── Dockerfile
│
├── _bmad/                      # BMAD framework (do not modify)
└── _bmad-output/               # BMAD-generated planning artifacts
    └── planning-artifacts/
        ├── product-brief-bmad-todo-app-2026-03-09.md
        ├── prd.md
        ├── ux-design-specification.md
        └── architecture.md     ← this file
```

---

## Infrastructure and Deployment

### Local Development (Docker Compose)

```yaml
# docker-compose.yml (canonical reference)
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-bmad_todos}
      POSTGRES_USER: ${POSTGRES_USER:-todos_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-todos_pass}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-todos_user}"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      CORS_ORIGINS: ${CORS_ORIGINS:-http://localhost:5173}
    volumes:
      - ./backend:/app
    depends_on:
      db:
        condition: service_healthy
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - ./frontend/src:/app/src
    environment:
      VITE_API_BASE_URL: "" # Empty = use Vite proxy in dev

volumes:
  postgres_data:
```

**Startup sequence:**

1. `db` starts and passes health check (`pg_isready`).
2. `backend` starts; Alembic runs migrations on startup (`alembic upgrade head` in entrypoint).
3. `frontend` starts Vite dev server with HMR enabled.

### Environment Variables

**Root `.env` (mounted by Docker Compose):**

```bash
# Database
POSTGRES_DB=bmad_todos
POSTGRES_USER=todos_user
POSTGRES_PASSWORD=todos_pass

# Backend
CORS_ORIGINS=http://localhost:5173

# Frontend (passed to Vite build)
VITE_API_BASE_URL=
```

**Never commit `.env`** — only `.env.example` is committed.

### Database Migrations (Alembic)

Migrations run automatically on backend container start:

```bash
# backend/Dockerfile entrypoint
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Manual migration commands (run inside backend container):

```bash
# Create a new migration
alembic revision --autogenerate -m "add user_id to todos"

# Apply all pending migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1
```

### API URL Convention

All API routes are prefixed `/api/v1/`:

| Route                | Method | Description                  |
| -------------------- | ------ | ---------------------------- |
| `/api/v1/todos`      | GET    | List all todos               |
| `/api/v1/todos`      | POST   | Create a todo                |
| `/api/v1/todos/{id}` | PATCH  | Update a todo                |
| `/api/v1/todos/{id}` | DELETE | Delete a todo                |
| `/health`            | GET    | Health check (no versioning) |

The `/api/v1/` prefix enables adding future versioned routes (`/api/v2/`) or auth routes (`/api/v1/auth/`) without path conflicts.

### Future Deployment (Post-MVP Consideration)

The architecture is container-ready. A production deployment would:

- Replace Vite dev server with `nginx` serving the built React bundle (static files).
- Use `gunicorn + uvicorn workers` instead of `uvicorn --reload`.
- Use managed PostgreSQL (AWS RDS, Supabase, Neon) instead of containerized `db`.
- Set `CORS_ORIGINS` to the production frontend URL.
- Use Docker secrets or a secrets manager instead of `.env` files.

No architectural changes required — only configuration and Dockerfile target changes.

---

## Validation

### Architecture vs. PRD Alignment Check

| PRD Requirement                               | Architectural coverage                                                                              |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| FR-01: View all todos on load                 | `GET /api/v1/todos` → `crud.get_todos()` → `useTodos.fetchTodos()` → `<TodoList>`                   |
| FR-02: Create todo                            | `POST /api/v1/todos` → `crud.create_todo()` → `useTodos.addTodo()` → `<AddTodoForm>`                |
| FR-03: Empty title validation                 | Pydantic `TodoCreate` (server) + `<AddTodoForm>` trim check (client)                                |
| FR-04: Task appears immediately after confirm | `useTodos.addTodo()` calls `fetchTodos()` after POST resolves                                       |
| FR-05/06: Toggle completion                   | `PATCH /api/v1/todos/{id}` → `crud.update_todo()` → `useTodos.toggleTodo()` → `<TodoItem>` checkbox |
| FR-07/08: Delete permanently                  | `DELETE /api/v1/todos/{id}` → `crud.delete_todo()` → `useTodos.removeTodo()` → `<TodoItem>` button  |
| FR-10/11: Persistence across sessions         | PostgreSQL `todos` table with `postgres_data` volume                                                |
| FR-12: `created_at` server-assigned           | SQLAlchemy model: `default=func.now()`, not client-supplied                                         |
| FR-14: Ordered by `created_at`                | `crud.get_todos()`: `db.query(Todo).order_by(Todo.created_at.asc())`                                |
| FR-16: Empty state                            | `<TodoList>` renders `<EmptyState>` when `todos.length === 0 && !loading`                           |
| FR-17: Loading state                          | `<TodoList>` renders `<LoadingState>` when `loading === true`                                       |
| FR-18/19: Error state + retry                 | `<TodoList>` renders `<ErrorBanner onRetry={retry}>` when `error !== null`                          |
| FR-21: Structured backend errors              | Global FastAPI exception handler normalizes all errors to `{ "detail": "..." }`                     |
| FR-23–28: API contract                        | Defined precisely in `routers/todos.py` with Pydantic schemas                                       |
| FR-28: CORS                                   | FastAPI `CORSMiddleware` with `CORS_ORIGINS` from env                                               |
| FR-29/30: Responsive + touch targets          | CSS in `index.css` + component `className` — not architectural, covered in UX spec                  |

### Architecture vs. UX Spec Alignment Check

| UX Requirement                     | Architectural coverage                                             |
| ---------------------------------- | ------------------------------------------------------------------ |
| Auto-focus input                   | `<AddTodoForm>` `autoFocus` attribute (desktop only)               |
| Enter to submit                    | `<form onSubmit>` — both Enter and button click handled            |
| Input clears after submit          | `useTodos.addTodo()` resets form state after resolution            |
| Confirmed (not optimistic) updates | `useTodos.*` methods: await API → then update state                |
| Inline validation for empty input  | `<AddTodoForm>` validates before calling `api.createTodo()`        |
| Error banner non-destructive       | `setError()` never clears `todos` state                            |
| `role="alert"` on error            | `<ErrorBanner>` renders `<div role="alert">`                       |
| `aria-busy` on loading             | `<TodoList>` sets `aria-busy={loading}` on list container          |
| Design tokens                      | CSS custom properties in `index.css` matching UX spec palette      |
| `prefers-reduced-motion`           | CSS `@media (prefers-reduced-motion: reduce)` disables transitions |

### Open Questions (Pre-Implementation Clarifications)

| #   | Question                                                                        | Recommended default                                                        |
| --- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | Should completed tasks sort to the bottom, or remain in creation order?         | Keep creation order (simpler; PRD says "ascending by created_at")          |
| 2   | Should `PATCH /todos/{id}` also allow updating `title` (even if not in MVP UI)? | Accept `is_done` only — matches MVP UI; `title` update deferred            |
| 3   | Should the backend add pagination to `GET /todos`?                              | No — PRD scope assumes small personal list; add in V2                      |
| 4   | Test database: same Compose DB or separate?                                     | Separate in-memory SQLite for unit tests; Compose DB for integration tests |

---

_Architecture Decision Document generated via BMAD workflow — Phase 3 Solutioning — Agent: Winston (🏗️ Architect)_  
_Project: bmad-todo-app | Author: Boz | Date: 2026-03-09_
