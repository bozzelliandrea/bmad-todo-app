---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
status: complete
---

# bmad-todo-app — Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bmad-todo-app, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories. Stories are ordered by dependency — infrastructure first, then API, then frontend.

---

## Requirements Inventory

### Functional Requirements

```
FR-01: A user can view all existing todos when the application loads.
FR-02: A user can create a new todo by entering a title (1–500 characters) and submitting via button click or Enter key.
FR-03: A user cannot create a todo with an empty or whitespace-only title; the form shows a validation message.
FR-04: A newly created todo appears in the list immediately after server confirmation without a full page reload.
FR-05: A user can toggle the completion status of a todo between done and not done.
FR-06: A user can toggle a completed todo back to incomplete.
FR-07: A user can delete any todo permanently; deletion is reflected in the list immediately after server confirmation.
FR-08: Deleted todos do not reappear after page refresh.
FR-09: Completed todos remain visible in the list until explicitly deleted.
FR-10: All todo data persists across browser refreshes.
FR-11: All todo data persists across browser close and reopen.
FR-12: The created_at timestamp is assigned by the server at creation time and is immutable.
FR-13: The updated_at timestamp is updated by the server whenever a todo is modified.
FR-14: Todos are displayed in ascending order by created_at (oldest first).
FR-15: Active and completed todos are visually distinguishable (strikethrough + dimmed for completed).
FR-16: The application displays a clear empty state when no todos exist.
FR-17: The application displays a loading indicator while the initial todo list is being fetched.
FR-18: When the API is unreachable, the frontend displays a non-destructive error state with a user-readable message.
FR-19: A retry action is available when in an error state.
FR-20: Failed create/update/delete operations show an inline error message without reverting the user's input.
FR-21: The backend returns structured error responses ({ "detail": "..." }) for all 4xx and 5xx cases.
FR-22: The backend validates that todo title is non-empty; returns 422 for invalid input.
FR-23: GET /api/v1/todos returns an array of all todos with fields: id, title, is_done, created_at, updated_at.
FR-24: POST /api/v1/todos accepts { "title": "string" } and returns the created todo with all fields.
FR-25: PATCH /api/v1/todos/{id} accepts { "is_done": bool } and returns the updated todo.
FR-26: DELETE /api/v1/todos/{id} returns 204 No Content on success.
FR-27: GET /health returns { "status": "ok" } with HTTP 200.
FR-28: All endpoints enforce CORS, allowing only the configured frontend origin.
FR-29: The UI is fully usable on viewport widths >= 375px without horizontal scrolling.
FR-30: All interactive elements have touch targets >= 44px x 44px.
```

### Non-Functional Requirements

```
NFR-01: The frontend must reach time-to-interactive in < 1 second on a local development machine.
NFR-02: All API endpoints must respond in < 200ms under normal local conditions with < 1000 todos in the database.
NFR-03: The initial todo list fetch must display results before any interaction timeout occurs in the browser.
NFR-04: The application must not lose any user-submitted data due to a transient network error.
NFR-05: The backend must restart cleanly after a crash without data corruption.
NFR-06: The backend must wait for a healthy database connection before accepting requests.
NFR-07: All environment-specific configuration must be stored in environment variables, not hardcoded.
NFR-08: The codebase must follow consistent formatting (Prettier for frontend, Black/Ruff for backend).
NFR-09: The project must include a README.md documenting how to start the application, run tests, and add a migration.
NFR-10: A new developer must be able to run the full application stack with a single command (docker compose up).
NFR-11: CORS is restricted to the configured frontend origin; wildcard * is not acceptable.
NFR-12: SQL queries use parameterized statements only (via SQLAlchemy ORM).
NFR-13: The backend does not expose stack traces or internal error details in API error responses.
NFR-14: All interactive elements are keyboard-accessible (Tab, Enter, Space).
NFR-15: The application passes automated accessibility checks for missing labels, contrast ratios, and ARIA roles.
```

### Additional Requirements (from Architecture + UX)

```
- Docker Compose setup with three services: db (postgres:16-alpine), backend (FastAPI), frontend (Vite)
- db service must include a pg_isready healthcheck; backend depends_on db with condition: service_healthy
- Alembic migrations run automatically on backend container start (alembic upgrade head)
- PostgreSQL todos table: id (UUID PK), title (VARCHAR 500 NOT NULL), is_done (BOOLEAN default FALSE), created_at (TIMESTAMPTZ default NOW()), updated_at (TIMESTAMPTZ default NOW())
- Backend layout: app/main.py, app/database.py, app/models.py, app/schemas.py, app/crud.py, app/routers/todos.py
- Frontend layout: src/main.tsx, src/App.tsx, src/api.ts, src/types.ts, src/hooks/useTodos.ts, src/components/*
- All routes under /api/v1/ prefix; /health endpoint at root
- Vite proxy: /api → http://localhost:8000 in development
- Input auto-focused on desktop load; 16px minimum font-size on inputs (iOS Safari)
- error banner uses role="alert"; loading state uses aria-busy="true"
- CSS custom properties (design tokens) defined in index.css matching UX spec palette
- prefers-reduced-motion media query disables animations
- .env.example files committed for both frontend and backend; .env files gitignored
```

### FR Coverage Map

| Epic                       | Stories | FRs Covered               | NFRs Covered                           |
| -------------------------- | ------- | ------------------------- | -------------------------------------- |
| Epic 1: Project Foundation | 1.1–1.3 | —                         | NFR-07, NFR-09, NFR-10                 |
| Epic 2: Backend REST API   | 2.1–2.5 | FR-12, FR-13, FR-21–FR-28 | NFR-02, NFR-04–06, NFR-08, NFR-11–13   |
| Epic 3: Frontend React SPA | 3.1–3.5 | FR-01–FR-20, FR-29–FR-30  | NFR-01, NFR-03, NFR-08, NFR-14, NFR-15 |

---

## Epic List

1. [Epic 1: Project Foundation & Infrastructure](#epic-1-project-foundation--infrastructure)
2. [Epic 2: Backend REST API](#epic-2-backend-rest-api)
3. [Epic 3: Frontend React SPA](#epic-3-frontend-react-spa)

---

## Epic 1: Project Foundation & Infrastructure

**Goal:** Establish the monorepo structure, Docker Compose local dev environment, and database schema so that all subsequent development has a stable, reproducible foundation to build on.

**Definition of Done:** `docker compose up` starts all three services cleanly; the backend returns `200 OK` on `GET /health`; the `todos` table exists in PostgreSQL with the correct schema; a developer can clone the repo and have the app running in under 5 minutes following the README.

---

### Story 1.1: Repository Scaffold and Docker Compose Setup

As a developer,  
I want a working monorepo with Docker Compose orchestrating the database, backend, and frontend services,  
So that the entire stack starts with a single command and all services are connected correctly.

**Acceptance Criteria:**

**Given** the developer has Docker Desktop installed  
**When** they run `docker compose up` from the project root  
**Then** three services start: `db` (postgres:16-alpine), `backend` (FastAPI on port 8000), `frontend` (Vite on port 5173)

**Given** the `db` service starts  
**When** the health check runs (`pg_isready`)  
**Then** the backend service only starts after `db` reports healthy

**Given** the stack is running  
**When** the developer sends `GET http://localhost:8000/health`  
**Then** the response is `{ "status": "ok" }` with HTTP 200

**Given** the repository is cloned fresh  
**When** the developer reads `README.md`  
**Then** they find clear instructions for: starting the app, running tests, and creating a migration

**Tasks:**

- Create root `docker-compose.yml` with `db`, `backend`, `frontend` services and `postgres_data` volume
- Create `backend/Dockerfile` with Python 3.11, installs dependencies from `pyproject.toml`, runs `alembic upgrade head && uvicorn app.main:app`
- Create `frontend/Dockerfile.dev` with Node LTS, installs npm deps, runs `vite --host`
- Create `.env.example` at root and per-service with all required variables
- Add `.env` to `.gitignore`
- Create `README.md` with setup, run, test, and migration instructions

---

### Story 1.2: Backend Project Structure and Health Endpoint

As a developer,  
I want the FastAPI project wired up with its full module structure and a working health endpoint,  
So that the backend scaffolding is in place and ready for feature development.

**Acceptance Criteria:**

**Given** the backend container starts  
**When** `GET /health` is called  
**Then** the response is `{ "status": "ok" }` with HTTP 200

**Given** the backend is running  
**When** the developer opens `http://localhost:8000/docs`  
**Then** the OpenAPI Swagger UI loads and shows the available endpoints

**Given** the backend makes any database query  
**When** the request completes  
**Then** the SQLAlchemy session is always closed (success or failure)

**Given** any unhandled exception occurs in the backend  
**When** FastAPI returns the error response  
**Then** the response body is `{ "detail": "Internal server error" }` and contains no stack trace

**Given** the CORS_ORIGINS env var is set to `http://localhost:5173`  
**When** the frontend origin makes a cross-origin request  
**Then** the response includes the correct `Access-Control-Allow-Origin` header

**Tasks:**

- Create `backend/app/main.py`: FastAPI app, include `todos` router, add `CORSMiddleware` reading from `CORS_ORIGINS` env var, add global exception handler returning `{ "detail": "Internal server error" }` for 500s
- Create `backend/app/database.py`: SQLAlchemy engine from `DATABASE_URL` env var, `SessionLocal`, `Base`, `get_db` dependency using `try/finally`
- Create `backend/app/models.py`: `Todo` ORM model with UUID pk, title, is_done, created_at, updated_at
- Create `backend/app/schemas.py`: `TodoCreate`, `TodoUpdate`, `TodoResponse` Pydantic models
- Create `backend/app/crud.py`: stub functions for `get_todos`, `create_todo`, `update_todo`, `delete_todo`
- Create `backend/app/routers/todos.py`: register router at `/api/v1/todos`
- Add `GET /health` route to `main.py`
- Create `backend/pyproject.toml` with dependencies: fastapi, uvicorn, sqlalchemy, alembic, psycopg2-binary, pydantic, python-dotenv
- Configure Black + Ruff in `pyproject.toml`

---

### Story 1.3: Database Schema and Alembic Migration

As a developer,  
I want the `todos` table created in PostgreSQL via an Alembic migration that runs automatically on startup,  
So that the database schema is version-controlled and reproducible.

**Acceptance Criteria:**

**Given** the backend container starts for the first time  
**When** the entrypoint runs `alembic upgrade head`  
**Then** the `todos` table is created with columns: `id` (UUID PK), `title` (VARCHAR 500, NOT NULL), `is_done` (BOOLEAN NOT NULL DEFAULT FALSE), `created_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW()), `updated_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW())

**Given** the migration has already run  
**When** the backend starts again  
**Then** Alembic detects no pending migrations and starts without error

**Given** a developer creates a new migration  
**When** they run `alembic revision --autogenerate -m "description"`  
**Then** a new migration file is created in `alembic/versions/`

**Tasks:**

- Initialize Alembic: `alembic init alembic` inside `backend/`
- Configure `alembic/env.py` to use `DATABASE_URL` from env and import `Base` from `app.models`
- Create first migration `0001_create_todos_table.py` that creates the `todos` table with all columns
- Verify migration runs cleanly on fresh DB and is idempotent on re-run

---

## Epic 2: Backend REST API

**Goal:** Implement all five CRUD endpoints for the `todos` resource with full validation, error handling, and test coverage, so the frontend has a reliable, well-defined API to integrate against.

**Definition of Done:** All 5 endpoints work correctly; all FRs in the API contract (FR-21–FR-28) pass; automated tests cover every endpoint including happy path, validation errors, and 404 cases.

---

### Story 2.1: GET /api/v1/todos — List All Todos

As a user,  
I want to retrieve all my todos via the API,  
So that the frontend can display my complete task list on load.

**Acceptance Criteria:**

**Given** the database contains todos  
**When** `GET /api/v1/todos` is called  
**Then** the response is HTTP 200 with a JSON array of todo objects, each with fields: `id`, `title`, `is_done`, `created_at`, `updated_at`

**Given** the database is empty  
**When** `GET /api/v1/todos` is called  
**Then** the response is HTTP 200 with an empty array `[]`

**Given** multiple todos exist  
**When** `GET /api/v1/todos` is called  
**Then** todos are ordered by `created_at` ascending (oldest first)

**Given** the endpoint is called  
**When** the response is returned  
**Then** it completes in < 200ms under normal local conditions

**Tasks:**

- Implement `crud.get_todos(db)`: query all `Todo` records ordered by `created_at` ascending
- Implement `GET /api/v1/todos` route in `routers/todos.py`: call `crud.get_todos`, return `list[TodoResponse]`
- Write tests: empty DB returns `[]`; populated DB returns correct ordered list

---

### Story 2.2: POST /api/v1/todos — Create a Todo

As a user,  
I want to create a new todo via the API,  
So that my new tasks are persisted to the database.

**Acceptance Criteria:**

**Given** a valid request body `{ "title": "Buy groceries" }`  
**When** `POST /api/v1/todos` is called  
**Then** the response is HTTP 201 with the created todo object including server-generated `id`, `is_done: false`, `created_at`, `updated_at`

**Given** a request body with an empty title `{ "title": "" }`  
**When** `POST /api/v1/todos` is called  
**Then** the response is HTTP 422 with `{ "detail": "..." }` describing the validation error

**Given** a request body with a whitespace-only title `{ "title": "   " }`  
**When** `POST /api/v1/todos` is called  
**Then** the response is HTTP 422 with a validation error

**Given** a request body with a title exceeding 500 characters  
**When** `POST /api/v1/todos` is called  
**Then** the response is HTTP 422 with a validation error

**Given** the todo is created  
**When** `GET /api/v1/todos` is subsequently called  
**Then** the new todo appears in the list

**Tasks:**

- Add validator to `TodoCreate` schema: strip whitespace; raise `ValueError` if result is empty; enforce max length 500
- Implement `crud.create_todo(db, todo: TodoCreate)`: create `Todo` ORM instance, `db.add`, `db.commit`, `db.refresh`, return
- Implement `POST /api/v1/todos` route: call `crud.create_todo`, return `TodoResponse` with status 201
- Normalize 422 validation error response in global exception handler to `{ "detail": "..." }` format
- Write tests: valid create returns 201; empty title returns 422; whitespace title returns 422; created todo appears in subsequent GET

---

### Story 2.3: PATCH /api/v1/todos/{id} — Update a Todo

As a user,  
I want to update the completion status of a todo via the API,  
So that I can mark tasks as done or revert them to active.

**Acceptance Criteria:**

**Given** a todo with `is_done: false` exists  
**When** `PATCH /api/v1/todos/{id}` is called with `{ "is_done": true }`  
**Then** the response is HTTP 200 with the updated todo showing `is_done: true` and an updated `updated_at`

**Given** a todo with `is_done: true` exists  
**When** `PATCH /api/v1/todos/{id}` is called with `{ "is_done": false }`  
**Then** the response is HTTP 200 with `is_done: false` (toggle back to active)

**Given** a non-existent todo ID  
**When** `PATCH /api/v1/todos/{id}` is called  
**Then** the response is HTTP 404 with `{ "detail": "Todo not found" }`

**Given** an invalid UUID format for `{id}`  
**When** `PATCH /api/v1/todos/{id}` is called  
**Then** the response is HTTP 422 with a validation error

**Tasks:**

- Implement `crud.update_todo(db, todo_id: UUID, data: TodoUpdate)`: query by id; if not found return `None`; update `is_done` and `updated_at`; commit; return updated record
- Implement `PATCH /api/v1/todos/{id}` route: call `crud.update_todo`; raise `HTTPException(404)` if `None` returned; return `TodoResponse`
- Write tests: toggle true→false and false→true; 404 on missing ID; 422 on invalid UUID

---

### Story 2.4: DELETE /api/v1/todos/{id} — Delete a Todo

As a user,  
I want to delete a todo via the API,  
So that tasks I no longer need are permanently removed.

**Acceptance Criteria:**

**Given** an existing todo  
**When** `DELETE /api/v1/todos/{id}` is called  
**Then** the response is HTTP 204 No Content

**Given** the todo was deleted  
**When** `GET /api/v1/todos` is subsequently called  
**Then** the deleted todo does not appear in the list

**Given** a non-existent todo ID  
**When** `DELETE /api/v1/todos/{id}` is called  
**Then** the response is HTTP 404 with `{ "detail": "Todo not found" }`

**Tasks:**

- Implement `crud.delete_todo(db, todo_id: UUID)`: query by id; if not found return `False`; delete; commit; return `True`
- Implement `DELETE /api/v1/todos/{id}` route: call `crud.delete_todo`; raise `HTTPException(404)` if `False`; return `Response(status_code=204)`
- Write tests: successful delete returns 204; deleted todo absent from subsequent GET; 404 on missing ID

---

### Story 2.5: API Test Suite and CORS Validation

As a developer,  
I want a complete automated test suite for all API endpoints and CORS behavior validated,  
So that regressions are caught immediately and the API contract is verifiable.

**Acceptance Criteria:**

**Given** the test suite runs  
**When** `pytest` is executed inside the backend container or via `docker compose run`  
**Then** all tests pass with no failures

**Given** the test database is used  
**When** tests run  
**Then** they use a separate test DB (not the development DB) and clean up after each test

**Given** a request from a non-allowed origin  
**When** the backend receives the CORS preflight  
**Then** the response does not include `Access-Control-Allow-Origin` for that origin

**Given** a request from the allowed origin (`http://localhost:5173`)  
**When** the backend responds  
**Then** `Access-Control-Allow-Origin: http://localhost:5173` is in the response headers

**Tasks:**

- Create `backend/tests/conftest.py`: in-memory SQLite engine for tests; `TestClient` fixture with DB override; session-scoped DB setup
- Create `backend/tests/test_todos.py`: tests for all 5 endpoints (GET list, POST create, PATCH update, DELETE delete, GET health)
- Add CORS integration test: verify allowed origin gets CORS header; verify random origin does not
- Add Ruff lint check to test run (`ruff check app/`)

---

## Epic 3: Frontend React SPA

**Goal:** Build the complete React frontend that provides the full todo management experience: viewing, adding, completing, and deleting tasks — with proper loading, empty, and error states — working on both desktop and mobile.

**Definition of Done:** All core user flows from the UX spec work end-to-end; the app passes the responsive layout check at 375px; keyboard navigation works for all actions; accessibility checks pass; FR-01 through FR-20 and FR-29–FR-30 are satisfied.

---

### Story 3.1: Frontend Scaffold, Design Tokens, and API Module

As a developer,  
I want the React/Vite project scaffolded with TypeScript, design tokens in CSS, and a working API module,  
So that all feature components have a consistent foundation to build on.

**Acceptance Criteria:**

**Given** the frontend container starts  
**When** the developer opens `http://localhost:5173`  
**Then** the Vite dev server serves the React app without errors

**Given** a component makes an API call using `api.ts`  
**When** the call succeeds or fails  
**Then** the response is returned as a typed `Todo` object or a meaningful error is thrown (no raw `fetch` calls in components)

**Given** the developer inspects the browser  
**When** they check the computed styles of any interactive element  
**Then** the CSS custom property tokens from the UX spec design system are present (`--color-accent`, `--color-bg`, etc.)

**Given** the developer runs `pnpm lint` or `npm run lint`  
**When** the command executes  
**Then** Prettier and ESLint run without errors

**Tasks:**

- Scaffold Vite + React + TypeScript project in `frontend/`
- Create `src/types.ts` with `Todo` interface: `id: string`, `title: string`, `is_done: boolean`, `created_at: string`, `updated_at: string`
- Create `src/api.ts` with `getTodos()`, `createTodo(title)`, `updateTodo(id, is_done)`, `deleteTodo(id)` — using `VITE_API_BASE_URL` env var
- Create `src/index.css` with all CSS custom properties from UX spec (color palette, typography, spacing, border radius)
- Add `prefers-reduced-motion` media query disabling transitions
- Configure Vite proxy (`/api` → `http://localhost:8000`) in `vite.config.ts`
- Configure Prettier + ESLint + TypeScript strict mode
- Create `frontend/.env.example`

---

### Story 3.2: Todo List Display (Loading, Empty, Error States)

As a user,  
I want to open the app and immediately see my todo list — or a clear state indicating it's loading, empty, or unavailable,  
So that I always understand the current state of the application.

**Acceptance Criteria:**

**Given** the app loads  
**When** the API call to `GET /api/v1/todos` is in progress  
**Then** a loading skeleton (2–3 pulsing placeholder bars) is shown in the list area (FR-17)

**Given** the API returns an empty array  
**When** the list renders  
**Then** the empty state message is shown: "Nothing to do — enjoy the quiet." with subtext "Add your first task above." (FR-16)

**Given** the API returns todos  
**When** the list renders  
**Then** all todos are displayed in ascending `created_at` order (FR-14)

**Given** the API call fails (network error)  
**When** the error is caught  
**Then** an error banner is displayed with message "Couldn't load tasks. Check your connection." and a "Try Again" button (FR-18, FR-19)

**Given** the error banner is visible  
**When** the user clicks "Try Again"  
**Then** the API call is retried and the list re-fetches (FR-19)

**Given** the error banner renders  
**When** a screen reader reads the page  
**Then** the banner is announced immediately via `role="alert"` (UX spec accessibility)

**Tasks:**

- Create `src/hooks/useTodos.ts`: `useState` for `todos`, `loading`, `error`; `useEffect` calls `fetchTodos` on mount; exports `todos`, `loading`, `error`, `addTodo`, `toggleTodo`, `removeTodo`, `retry`
- Create `src/components/LoadingState.tsx`: 2–3 animated skeleton bars; list container has `aria-busy="true"` and `aria-label="Loading tasks"`
- Create `src/components/EmptyState.tsx`: centered icon + message; `role="status"`
- Create `src/components/ErrorBanner.tsx`: error message + retry button; `role="alert"`
- Create `src/components/TodoList.tsx`: conditionally renders `<LoadingState>`, `<ErrorBanner>`, `<EmptyState>`, or list of `<TodoItem>`
- Create `src/App.tsx`: calls `useTodos()`; renders `<Header>`, `<AddTodoForm>`, `<TodoList>` passing correct props

---

### Story 3.3: Add Todo Form

As a user,  
I want to type a task and press Enter or click Add to create it,  
So that I can quickly capture new tasks without leaving the keyboard.

**Acceptance Criteria:**

**Given** the app loads on desktop  
**When** the page renders  
**Then** the task input field is auto-focused (FR-02 UX)

**Given** the user types "Buy groceries" in the input and presses Enter  
**When** the form submits  
**Then** `POST /api/v1/todos` is called; on success the input clears, re-focuses, and the new task appears in the list (FR-02, FR-04)

**Given** the user clicks the "Add" button with text in the input  
**When** the form submits  
**Then** the same behavior as pressing Enter occurs

**Given** the user submits with an empty or whitespace-only input  
**When** the form attempts to submit  
**Then** no API call is made; an inline validation message appears below the input: "Task description is required." (FR-03)

**Given** the user starts typing after seeing the validation message  
**When** any key is pressed  
**Then** the validation message disappears immediately

**Given** the API call to create a todo fails  
**When** the error is caught  
**Then** an inline error message is shown below the form; the user's typed text is not cleared (FR-20)

**Given** the input is focused  
**When** a screen reader reads the input  
**Then** the input has an accessible label (visually hidden `<label>` or `aria-label`)

**Tasks:**

- Create `src/components/AddTodoForm.tsx`: controlled input; `<form onSubmit>`; client-side trim + empty validation; calls `useTodos.addTodo()`; shows inline error on validation failure or API failure; `autoFocus` prop (desktop only)
- In `useTodos.addTodo()`: call `api.createTodo(title)`, on success call `fetchTodos()`, on failure set mutation error state
- Pass mobile-aware `autoFocus` from `App.tsx` (check `window.innerWidth > 640` or use media query)
- Ensure input `font-size` is `16px` minimum (iOS Safari zoom prevention)

---

### Story 3.4: Todo Item — Complete and Delete Actions

As a user,  
I want to mark a task as done (or undo it) and delete tasks I no longer need,  
So that I can track progress and keep my list clean.

**Acceptance Criteria:**

**Given** an active todo is displayed  
**When** the user clicks the checkbox  
**Then** `PATCH /api/v1/todos/{id}` is called with `{ is_done: true }`; on success the todo shows strikethrough text and dimmed styling (FR-05, FR-15)

**Given** a completed todo is displayed  
**When** the user clicks the checkbox again  
**Then** `PATCH /api/v1/todos/{id}` is called with `{ is_done: false }`; on success the todo returns to active styling (FR-06)

**Given** any todo is displayed  
**When** the user clicks the delete button  
**Then** `DELETE /api/v1/todos/{id}` is called; on success the todo is immediately removed from the list (FR-07)

**Given** the todo was deleted  
**When** the user refreshes the page  
**Then** the todo does not reappear (FR-08)

**Given** a keyboard user focuses the checkbox  
**When** they press Space  
**Then** the completion toggle fires (FR-14 keyboard nav)

**Given** a keyboard user focuses the delete button  
**When** they press Enter  
**Then** the delete action fires

**Given** the checkbox renders  
**When** a screen reader reads it  
**Then** it has `aria-label="Mark 'Buy groceries' as complete"` (UX spec accessibility)

**Given** the delete button renders  
**When** a screen reader reads it  
**Then** it has `aria-label="Delete task 'Buy groceries'"`

**Given** all interactive elements render  
**When** measured  
**Then** checkbox and delete button have minimum touch target of 44px × 44px (FR-30)

**Tasks:**

- Create `src/components/TodoItem.tsx`: renders checkbox (`<input type="checkbox">`), title (with conditional `line-through` + `opacity` for `is_done`), delete button
- Wire checkbox `onChange` → `useTodos.toggleTodo(id, !is_done)`
- Wire delete button `onClick` → `useTodos.removeTodo(id)`
- Apply `aria-label` to checkbox and delete button using todo title
- Ensure 44px minimum touch targets via CSS (padding, min-width/height)
- In `useTodos.toggleTodo()`: call `api.updateTodo(id, is_done)`, on success call `fetchTodos()`
- In `useTodos.removeTodo()`: call `api.deleteTodo(id)`, on success call `fetchTodos()`

---

### Story 3.5: Responsive Layout and Accessibility Validation

As a user,  
I want the app to work correctly on mobile (375px) and pass accessibility checks,  
So that I can use it from any device and it is usable by everyone.

**Acceptance Criteria:**

**Given** the app is viewed at 375px viewport width  
**When** the layout renders  
**Then** no horizontal scroll bar appears; all content is readable; all actions are reachable (FR-29)

**Given** the app is viewed on desktop (≥ 640px)  
**When** the layout renders  
**Then** content is centered with max-width 640px, white card with subtle shadow, 24px padding

**Given** a keyboard-only user opens the app  
**When** they press Tab repeatedly  
**Then** focus moves through: input → Add button → first todo checkbox → first delete button → next todo... in a logical order (NFR-14)

**Given** `axe` or Lighthouse accessibility audit runs  
**When** the audit completes  
**Then** no critical or serious accessibility violations are reported (NFR-15)

**Given** the OS has `prefers-reduced-motion: reduce` set  
**When** the app renders  
**Then** skeleton pulse animation and task add fade-in are disabled

**Tasks:**

- Add responsive CSS to `index.css`: full-width with `16px` padding below 640px; centered max-width 640px card with shadow above 640px
- Verify Tab order is logical in `App.tsx` component tree (no `tabIndex` hacks needed if DOM order is correct)
- Run `axe` browser extension or `npx lighthouse` against local dev server; fix any critical violations
- Add `@media (prefers-reduced-motion: reduce)` rules to `index.css` disabling `animation` and `transition` on affected elements
- Manual mobile test at 375px using browser devtools responsive mode: test add, complete, delete flows

---

_Epics and Stories generated via BMAD workflow — Phase 3 Solutioning — Agent: John (📋 Product Manager)_  
_Project: bmad-todo-app | Author: Boz | Date: 2026-03-09_
