# E2E Tests — bmad-todo-app

End-to-end tests written with [Playwright](https://playwright.dev/) for the bmad-todo-app React + FastAPI stack.

## Prerequisites

The full stack must be running before executing the tests:

```bash
# From project root — start everything with Docker Compose
docker compose up --build
```

Or run services individually:

```bash
# Terminal 1 — backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm run dev
```

Expected URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

## Install dependencies

```bash
cd e2e
npm install
npx playwright install --with-deps
```

## Run tests

```bash
# Headless (CI-style)
npm test

# Watch the browser (useful for debugging)
npm run test:headed

# Interactive Playwright UI
npm run test:ui
```

## View report

After a test run an HTML report is saved to `playwright-report/`.

```bash
npm run report
```

## Structure

```
e2e/
├── package.json
├── playwright.config.ts      # Base URL, browser projects, reporters
└── tests/
    └── todo-app.spec.ts      # All E2E scenarios
```

## Test strategy

Each test:

1. **Resets state** — deletes all todos via the REST API in `beforeEach`
2. **Sets up its own data** — creates the todos it needs through the UI
3. **Asserts visible outcomes** — uses semantic locators (roles, labels, text)

### Covered scenarios

| Area          | Scenarios                                                                                                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Page load     | Heading visible, input + button visible                                                                                      |
| Empty state   | "Nothing to do" shown when list is empty                                                                                     |
| Add task      | Enter key, Add button, input cleared, validation error, no API call on blank, error clears on type, persistence after reload |
| Complete task | Checkbox checks, aria-label toggles, state persists after reload                                                             |
| Delete task   | Task removed from DOM, empty state shown after last delete                                                                   |
| Full workflow | Add → Complete → Delete; insertion order; selective delete                                                                   |
| Accessibility | Accessible label, keyboard navigation, role=alert, aria-label toggling, mobile viewport (375px)                              |

## CI integration

Set `CI=true` to enable Playwright's retry-on-failure and `forbidOnly` (prevents `.only` tests from being committed).

```yaml
# Example GitHub Actions step
- name: Run E2E tests
  run: |
    cd e2e
    npm ci
    npx playwright install --with-deps
    npm test
  env:
    CI: true
```
