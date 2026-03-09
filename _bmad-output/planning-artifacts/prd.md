---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-bmad-todo-app-2026-03-09.md
workflowType: prd
status: complete
classification:
  projectType: full-stack-web-app
  domain: personal-productivity
  complexity: low
  greenfield: true
---

# Product Requirements Document — bmad-todo-app

**Author:** Boz  
**Date:** 2026-03-09  
**Status:** Complete  
**Version:** 1.0

---

## Executive Summary

bmad-todo-app is a minimal full-stack personal task management application. It provides individual users with a single, reliable place to create, track, complete, and delete tasks — with all data persisted across browser sessions via a PostgreSQL backend exposed through a FastAPI REST API.

The application is deliberately scoped to four core interactions: add a task, read all tasks, mark a task complete, delete a task. Everything outside this core is deferred to future iterations. The result is a product that is immediately usable, technically sound, and designed to be extended rather than replaced as the product matures.

### What Makes This Special

In a landscape of productivity tools that overwhelm users with features, bmad-todo-app stands out by doing exactly one thing well: giving a person a persistent, distraction-free task list that works immediately without onboarding, authentication, or setup. The experience is intentionally spare and immediately functional.

The codebase is designed as a clean, well-patterned reference implementation of the React + FastAPI + PostgreSQL stack — making it as valuable as a learning artifact as it is as a working product.

## Project Classification

| Attribute               | Value                                       |
| ----------------------- | ------------------------------------------- |
| Project type            | Full-stack web application (SPA + REST API) |
| Domain                  | Personal productivity / task management     |
| Complexity              | Low                                         |
| Greenfield / Brownfield | Greenfield                                  |
| Frontend                | React (Vite), TypeScript                    |
| Backend                 | Python, FastAPI                             |
| Database                | PostgreSQL                                  |
| Deployment target       | Local development (Docker Compose)          |

---

## Success Criteria

### User Success

| Criterion                 | Definition of Done                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| Zero-friction first use   | A user with no instructions can add their first task within 30 seconds of opening the app |
| All CRUD actions work     | Create, read, complete, and delete all function correctly end-to-end                      |
| Session persistence       | All task data survives a full page refresh                                                |
| Visual state clarity      | Active and completed tasks are visually distinguishable at a glance                       |
| Empty state communication | A new user understands the list is empty, not broken                                      |
| Error state handling      | Backend failures show a non-destructive error state without clearing the UI               |
| Mobile usability          | All core actions are usable on a 375px viewport without horizontal scroll                 |

### Technical Success

| Criterion                    | Target                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| API response time            | < 200ms per request under local conditions                                         |
| Frontend time-to-interactive | < 1 second on local dev machine                                                    |
| Zero data loss               | No task data lost on refresh, network hiccup, or error recovery                    |
| No unhandled exceptions      | Zero browser console errors and zero unhandled server exceptions during normal use |
| Test coverage                | Core API endpoints covered by unit/integration tests                               |

### Business / Learning Success

| Criterion                  | Definition                                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| BMAD workflow completion   | All BMAD phases (Analysis → Planning → Solutioning → Implementation) completed successfully              |
| Architecture extensibility | Adding authentication or multi-user support requires no rewrite of core components                       |
| Dev experience             | A new developer can clone the repo, run `docker compose up`, and have the app running in under 5 minutes |

### Measurable Outcomes

- 100% of create/complete/delete actions result in correct state in the database
- 0 unhandled exceptions across standard use scenarios
- Page load from cold start < 1s (local), < 3s (hosted)
- Full CRUD cycle covered by automated tests

## Product Scope

### MVP

Create, read, complete (toggle), and delete todo items. Data persists in PostgreSQL. UI works on desktop and mobile. Clear loading, empty, and error states.

### Growth Features (Post-MVP)

- In-place task description editing
- User authentication (email + password or OAuth)
- Per-user task isolation
- Task due dates with overdue indicators

### Vision

Multi-user collaboration, shared lists, task prioritization, tags, search, and native mobile app.

---

## User Journeys

### Journey 1 — First-Time User (Alex, Individual Task Manager)

**Opening Scene:** Alex hears about a simple personal task manager. No signup required. They open the URL in a browser on their laptop.

**Rising Action:** The app loads in under a second. There is no login screen, no welcome modal, no tutorial overlay. The task list area shows a clean empty state: _"No tasks yet. Add your first one above."_ An input field and an "Add" button are immediately visible at the top of the page.

**Climax:** Alex types `"Buy groceries"` into the input. They press Enter. The task appears instantly in the list below. Alex types `"Call dentist"`, clicks the Add button. That task appears too. The list now shows two items. Alex checks off `"Buy groceries"` using the checkbox — it gets a strikethrough and appears visually dimmed.

**Resolution:** Alex closes the browser tab and reopens the URL an hour later. Both tasks are still there. `"Buy groceries"` is still marked complete. The experience feels reliable. Alex bookmarks the URL.

**Journey Requirements:**

- App loads without authentication
- Empty state communicates purpose clearly
- Task input visible and focused on load
- Tasks added via Enter key or button click
- New tasks appear immediately in the list
- Completion state is togglable and visually distinct
- All state persists across page refreshes

---

### Journey 2 — Daily User (Alex, returning session)

**Opening Scene:** Alex opens the bookmarked URL at 9am Monday morning. They have a fresh mental list of things to do today.

**Rising Action:** The list shows 4 tasks from last week. Three are completed (dimmed). Alex deletes all three with the delete button next to each. One open task remains: `"Submit expense report"`. Alex adds 6 new tasks for today.

**Climax:** Throughout the day, Alex works through the list, ticking off tasks one by one. By 5pm, all 7 tasks are complete. Alex deletes the ones they no longer need, leaving 2 that carry over to tomorrow.

**Resolution:** The list is clean and accurate. Tomorrow Alex opens it and sees exactly what carried over. The app has become a reliable daily ritual.

**Journey Requirements:**

- Delete action is immediately visible on each task
- Deletion is permanent and reflected immediately
- Completed tasks remain in the list until manually deleted
- List order is stable (chronological by creation)

---

### Journey 3 — Mobile User

**Opening Scene:** Alex is away from their desk and wants to quickly add a task on their phone.

**Rising Action:** They open the bookmark on a 375px mobile viewport. The layout adapts without horizontal scrolling. The input field and button are accessible. The task list is readable.

**Climax:** Alex adds `"Pick up dry cleaning"` and taps the Add button. Task appears. Alex taps the checkbox on an already-completed item to un-complete it (they realized they still need to do it). The state toggles back.

**Resolution:** The experience is identical to desktop — fast, reliable, no loss of state.

**Journey Requirements:**

- Responsive layout at 375px width, no horizontal scroll
- Touch targets large enough for comfortable use (min 44px)
- Input and button both accessible on mobile

---

### Journey 4 — Error Recovery (Alex, backend unavailable)

**Opening Scene:** Alex opens the app. The backend is temporarily down.

**Rising Action:** Instead of a blank page or crash, the UI shows a graceful error state: _"Unable to connect. Please try again."_ with a retry button. The interface does not clear any previously loaded data.

**Climax:** Alex clicks "Retry". The backend is back up. The task list loads correctly.

**Resolution:** Alex continues their work without having lost context or data. The app's error handling protected the user experience.

**Journey Requirements:**

- API fetch errors handled; error state shown
- No unhandled exceptions or blank pages on API failure
- Retry mechanism available
- Data not cleared from UI on fetch failure

### Journey Requirements Summary

| Requirement                            | Source Journeys |
| -------------------------------------- | --------------- |
| Load without auth                      | J1, J2, J3      |
| Empty state display                    | J1              |
| Add task via Enter or button           | J1, J3          |
| Immediate UI update on mutations       | J1, J2, J3      |
| Completion toggle (done/undone)        | J1, J3          |
| Visual distinction for completed tasks | J1              |
| Delete task permanently                | J2              |
| Data persistence across sessions       | J1, J2          |
| Responsive 375px layout                | J3              |
| API error state with retry             | J4              |

---

## Full-Stack Web Application Specific Requirements

### Technical Architecture Overview

The application follows a clear three-tier architecture:

| Tier     | Technology               | Responsibility                                  |
| -------- | ------------------------ | ----------------------------------------------- |
| Frontend | React (Vite), TypeScript | SPA: task list UI, state, API calls             |
| Backend  | Python, FastAPI          | REST API: business logic, validation, DB access |
| Database | PostgreSQL               | Persistent storage of todo records              |

Communication between frontend and backend is via HTTP REST. The frontend and backend run on separate ports (e.g., `:5173` and `:8000`) and are connected via CORS. All data is server-authoritative — the frontend does not maintain local persistence (no localStorage, no IndexedDB).

### API Design

The backend exposes a single resource: `/todos`. All endpoints follow REST conventions.

| Endpoint      | Method | Description                                         |
| ------------- | ------ | --------------------------------------------------- |
| `/todos`      | GET    | Return all todos, ordered by `created_at` ascending |
| `/todos`      | POST   | Create a new todo; returns the created resource     |
| `/todos/{id}` | PATCH  | Partial update — toggle `is_done`, update `title`   |
| `/todos/{id}` | DELETE | Delete a todo permanently                           |
| `/health`     | GET    | Health check endpoint (returns 200 OK)              |

All endpoints return JSON. Error responses follow a consistent shape: `{ "detail": "..." }`.

### Database Schema

Single table: `todos`

| Column       | Type         | Constraints                                |
| ------------ | ------------ | ------------------------------------------ |
| `id`         | UUID         | Primary key, generated on insert           |
| `title`      | VARCHAR(500) | NOT NULL, non-empty                        |
| `is_done`    | BOOLEAN      | NOT NULL, default FALSE                    |
| `created_at` | TIMESTAMPTZ  | NOT NULL, default NOW()                    |
| `updated_at` | TIMESTAMPTZ  | NOT NULL, default NOW(), updated on change |

No foreign keys in MVP (no users table). The schema is designed to add a `user_id` FK in a future migration without changing any existing columns.

### Frontend Architecture

- **Component structure:** `App` → `TodoList` → `TodoItem` + `AddTodoForm`
- **State management:** React hooks (`useState`, `useEffect`) — no external state library for MVP
- **API layer:** Dedicated `api.ts` module wrapping `fetch` calls; all components call only this module
- **Error boundary:** Top-level error boundary catches unexpected render errors
- **Loading states:** Spinner or skeleton shown during initial fetch
- **Optimistic vs server-confirmed:** Updates are reflected after server confirms (not optimistic), keeping state simple

### Implementation Considerations

- Alembic (or SQLModel) handles database migrations — no raw SQL schema management
- Pydantic models used for request/response validation in FastAPI
- Environment variables (`.env`) used for all configuration (DB URL, CORS origin)
- Docker Compose orchestrates all three services for local development: `frontend`, `backend`, `db`
- CORS middleware configured in FastAPI to allow the frontend origin only

---

## Project Scoping & Phased Development

### MVP Strategy

The MVP philosophy is **problem-solving focused**: ship the smallest possible version that demonstrably solves the core problem (persistent personal task tracking) with no unnecessary features.

Every feature in MVP was tested against: _"Is the app broken without this?"_ If yes → include. If no → defer.

### MVP Feature Set

| Feature                       | Rationale                                                        |
| ----------------------------- | ---------------------------------------------------------------- |
| View all todos on load        | Core reading interaction — app is useless without it             |
| Add a todo (title only)       | Core creation interaction                                        |
| Toggle todo completion        | Core status interaction                                          |
| Delete a todo                 | Core deletion interaction; list becomes unusable without cleanup |
| Data persistence (PostgreSQL) | Without this, the app is just a demo                             |
| Loading state                 | Without this, users think the app is broken on slow connections  |
| Empty state                   | Without this, new users think the app is broken                  |
| Error state                   | Without this, backend failures cause user confusion              |
| Responsive layout (≥375px)    | Without this, the app is unusable on mobile                      |

### Post-MVP Features (Phase 2)

- Edit todo title in-place
- Drag-and-drop reordering
- Filter by status (all / active / completed)
- Keyboard navigation and accessibility improvements (WCAG 2.1 AA)

### Post-MVP Features (Phase 3 — Auth & Multi-User)

- User registration and login (JWT-based)
- Per-user todo isolation
- Session management (refresh tokens)

### Risk Mitigation Strategy

| Risk                           | Mitigation                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------- |
| Scope creep                    | Strict MVP filter: any new feature deferred unless the app is broken without it |
| DB connection issues in Docker | Health check on `db` service; backend waits for DB before starting              |
| CORS misconfiguration          | Configured and tested in first sprint; blocked by integration test              |
| State inconsistency (FE/BE)    | Always refetch from server after mutations (no optimistic updates in MVP)       |

---

## Functional Requirements

### Task Management

- **FR-01:** A user can view all existing todos when the application loads.
- **FR-02:** A user can create a new todo by entering a title (1–500 characters) and submitting via button click or Enter key.
- **FR-03:** A user cannot create a todo with an empty or whitespace-only title; the form shows a validation message.
- **FR-04:** A newly created todo appears in the list immediately after server confirmation without a full page reload.
- **FR-05:** A user can toggle the completion status of a todo between done and not done.
- **FR-06:** A user can toggle a completed todo back to incomplete.
- **FR-07:** A user can delete any todo permanently; deletion is reflected in the list immediately after server confirmation.
- **FR-08:** Deleted todos do not reappear after page refresh.
- **FR-09:** Completed todos remain visible in the list until explicitly deleted.

### Persistence & Sessions

- **FR-10:** All todo data persists across browser refreshes.
- **FR-11:** All todo data persists across browser close and reopen (server-side persistence, not local storage).
- **FR-12:** The `created_at` timestamp is assigned by the server at creation time and is immutable.
- **FR-13:** The `updated_at` timestamp is updated by the server whenever a todo is modified.

### List Presentation

- **FR-14:** Todos are displayed in ascending order by `created_at` (oldest first).
- **FR-15:** Active and completed todos are visually distinguishable (e.g., strikethrough + dimmed for completed).
- **FR-16:** The application displays a clear empty state when no todos exist.
- **FR-17:** The application displays a loading indicator while the initial todo list is being fetched.

### Error Handling

- **FR-18:** When the API is unreachable, the frontend displays a non-destructive error state with a user-readable message.
- **FR-19:** A retry action is available when in an error state.
- **FR-20:** Failed create/update/delete operations show an inline error message without reverting the user's input.
- **FR-21:** The backend returns structured error responses (`{ "detail": "..." }`) for all 4xx and 5xx cases.
- **FR-22:** The backend validates that todo `title` is non-empty; returns `422` for invalid input.

### API

- **FR-23:** `GET /todos` returns an array of all todos with fields: `id`, `title`, `is_done`, `created_at`, `updated_at`.
- **FR-24:** `POST /todos` accepts `{ "title": "string" }` and returns the created todo with all fields.
- **FR-25:** `PATCH /todos/{id}` accepts `{ "is_done": bool }` and returns the updated todo.
- **FR-26:** `DELETE /todos/{id}` returns `204 No Content` on success.
- **FR-27:** `GET /health` returns `{ "status": "ok" }` with HTTP 200.
- **FR-28:** All endpoints enforce CORS, allowing only the configured frontend origin.

### Responsive Layout

- **FR-29:** The UI is fully usable on viewport widths ≥ 375px without horizontal scrolling.
- **FR-30:** All interactive elements (checkbox, delete button, input, submit button) have touch targets ≥ 44px × 44px.

---

## Non-Functional Requirements

### Performance

- **NFR-01:** The frontend must reach time-to-interactive in < 1 second on a local development machine.
- **NFR-02:** All API endpoints must respond in < 200ms under normal local conditions with < 1000 todos in the database.
- **NFR-03:** The initial todo list fetch must display results before any interaction timeout occurs in the browser.

### Reliability

- **NFR-04:** The application must not lose any user-submitted data due to a transient network error; failed mutations must leave the database in a consistent state.
- **NFR-05:** The backend must restart cleanly after a crash without data corruption (PostgreSQL transaction isolation guarantees this).
- **NFR-06:** The backend must wait for a healthy database connection before accepting requests (Docker Compose `depends_on + healthcheck`).

### Maintainability

- **NFR-07:** All environment-specific configuration (database URL, CORS origins, frontend API base URL) must be stored in environment variables, not hardcoded.
- **NFR-08:** The codebase must follow consistent formatting (Prettier for frontend, Black/Ruff for backend).
- **NFR-09:** The project must include a `README.md` documenting how to start the application, run tests, and add a migration.
- **NFR-10:** A new developer must be able to run the full application stack with a single command (`docker compose up`).

### Security (Baseline)

- **NFR-11:** CORS is restricted to the configured frontend origin; wildcard `*` is not acceptable in production configuration.
- **NFR-12:** SQL queries use parameterized statements only (via SQLAlchemy ORM); no raw string interpolation in queries.
- **NFR-13:** The backend does not expose stack traces or internal error details in API error responses.

### Accessibility

- **NFR-14:** All interactive elements are keyboard-accessible (Tab, Enter, Space).
- **NFR-15:** The application passes automated accessibility checks for missing labels, contrast ratios, and ARIA roles (axe or Lighthouse).

---

_PRD generated via BMAD workflow — Phase 2 Planning — Agent: John (📋 Product Manager)_  
_Project: bmad-todo-app | Author: Boz | Date: 2026-03-09_
