# Test Automation Summary

Generated as part of BMAD Phase 4 — QA / E2E Tests step.

---

## Generated Tests

### API / Integration Tests (Backend)

Already written in Story 2.5 — included here for completeness.

| File                                                                   | Coverage                            |
| ---------------------------------------------------------------------- | ----------------------------------- |
| [backend/tests/test_todos.py](../../../../backend/tests/test_todos.py) | 22 tests across all CRUD operations |

Test classes:

- `TestHealth` — `/health` endpoint returns 200
- `TestListTodos` — empty list, items ordered by `created_at` ASC, returns correct schema
- `TestCreateTodo` — 201 on valid input, UUID PK, strips whitespace, 400 on blank/too-long title
- `TestUpdateTodo` — 200 on `is_done` toggle, sets `updated_at`, 404 on unknown ID
- `TestDeleteTodo` — 204 on success, 404 on unknown ID, absent from subsequent GET

### E2E Tests (Frontend + Full Stack)

New. Uses **Playwright** with Chromium and Mobile Safari (iPhone 13) projects.

| File                                                                 | Scenarios                         |
| -------------------------------------------------------------------- | --------------------------------- |
| [e2e/tests/todo-app.spec.ts](../../../../e2e/tests/todo-app.spec.ts) | 22 scenarios across 7 test groups |

Test groups:

- **Page load** (2) — heading, input and button visible
- **Empty state** (1) — "Nothing to do" message
- **Add task** (7) — Enter key, Add button, input cleared, validation error shown, no API call on blank, error clears on type, persistence after reload
- **Complete task** (3) — checkbox checks, aria-label toggles Unmark/Mark, state persists after reload
- **Delete task** (2) — task removed, empty state after last delete
- **Full workflow** (3) — add→complete→delete, insertion order, selective delete
- **Accessibility** (4) — accessible label, keyboard Tab+Enter, role=alert, aria-label change, mobile 375px viewport

---

## Coverage

| Layer              | Endpoints / Features                      | Tests |
| ------------------ | ----------------------------------------- | ----- |
| API — List todos   | `GET /api/v1/todos`                       | 4     |
| API — Create todo  | `POST /api/v1/todos`                      | 8     |
| API — Update todo  | `PATCH /api/v1/todos/{id}`                | 5     |
| API — Delete todo  | `DELETE /api/v1/todos/{id}`               | 4     |
| API — Health       | `GET /health`                             | 1     |
| UI — Page load     | Heading, input, button                    | 2     |
| UI — Empty state   | Empty-state message                       | 1     |
| UI — Add task      | Client validation, API call, state update | 7     |
| UI — Complete task | Toggle, persistence                       | 3     |
| UI — Delete task   | Removal, empty state                      | 2     |
| UI — Full workflow | Multi-step user journeys                  | 3     |
| UI — Accessibility | Labels, keyboard, ARIA, responsive        | 4     |

**Total: 44 automated tests** (22 API integration + 22 E2E)

---

## Test Framework

| Layer   | Framework                 | Runner                         |
| ------- | ------------------------- | ------------------------------ |
| Backend | pytest + httpx TestClient | `pytest` (SQLite in-memory)    |
| E2E     | Playwright v1.48+         | `playwright test` (real stack) |

---

## How to Run

### Backend unit/integration tests

```bash
cd backend
pip install -e ".[dev]"
pytest -v
```

### E2E tests

```bash
# Start the full stack first
docker compose up --build   # or start services manually

# In another terminal
cd e2e
npm install
npx playwright install --with-deps
npm test
```

---

## Next Steps

- Wire `npm test` in `e2e/` into your CI pipeline (set `CI=true`)
- Add a `docker compose --profile test` service that runs Playwright so E2E tests can run entirely in containers
- Expand coverage as new features are added
