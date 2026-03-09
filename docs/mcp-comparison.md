# MCP Server Comparison: PostgreSQL vs Playwright

Tested against **bmad-todo-app** (FastAPI + React + PostgreSQL 16) on 9 March 2026.

Versions: `@modelcontextprotocol/server-postgres@0.6.2` · `@playwright/mcp@0.0.68`

---

## TL;DR

|                      | PostgreSQL MCP                             | Playwright MCP                                        |
| -------------------- | ------------------------------------------ | ----------------------------------------------------- |
| **Best for**         | DB inspection, auditing, live data queries | UI automation, accessibility checks, bug reproduction |
| **Setup difficulty** | Low (one connection string)                | Medium (browser install required)                     |
| **Tools exposed**    | 1 (`query`)                                | 22 (navigate, click, snapshot, screenshot, …)         |
| **Safety model**     | Read-only by enforcement                   | Full browser control — no guard rails                 |
| **Output format**    | JSON rows                                  | YAML accessibility tree + Playwright code             |
| **Production safe**  | Yes (SELECT only)                          | With care                                             |

---

## 1. PostgreSQL MCP (`@modelcontextprotocol/server-postgres`)

### What it does

Exposes a single `query` tool that runs read-only SQL against a PostgreSQL database over a stdio JSON-RPC transport. The connection string is passed as a CLI argument. The server enforces a read-only transaction for every statement.

### Configuration (`.vscode/mcp.json`)

```json
{
  "servers": {
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres@0.6.2",
        "postgresql://todo_user:todo_password@localhost:5432/todo_db"
      ]
    }
  }
}
```

### Tools inventory

| Tool    | Description                                             |
| ------- | ------------------------------------------------------- |
| `query` | Run a read-only SQL query; returns rows as a JSON array |

### Tested interactions (against live `todos` table)

**Interaction 1 — Schema inspection**

> Prompt: _"What columns does the todos table have and what are their types?"_

```sql
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name='todos'
ORDER BY ordinal_position
```

Response:

```json
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "title",
    "data_type": "character varying",
    "character_maximum_length": 500,
    "is_nullable": "NO"
  },
  {
    "column_name": "is_done",
    "data_type": "boolean",
    "character_maximum_length": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "NO"
  }
]
```

**Interaction 2 — Live data read**

> Prompt: _"Show me the oldest 3 todos, in order."_

```sql
SELECT id, title, is_done, created_at
FROM todos ORDER BY created_at ASC LIMIT 3
```

Response:

```json
[
  {
    "id": "b7cdb7ef…",
    "title": "Buy groceries",
    "is_done": false,
    "created_at": "2026-03-09T17:19:24.036Z"
  },
  {
    "id": "ea5d78e3…",
    "title": "Write AGENT.md",
    "is_done": false,
    "created_at": "2026-03-09T17:19:24.135Z"
  },
  {
    "id": "67c6c6c1…",
    "title": "Review pull request",
    "is_done": false,
    "created_at": "2026-03-09T17:19:24.253Z"
  }
]
```

**Interaction 3 — Aggregate stats**

> Prompt: _"How many todos are done vs pending?"_

```sql
SELECT COUNT(*) AS total,
       SUM(CASE WHEN is_done THEN 1 ELSE 0 END) AS done,
       SUM(CASE WHEN NOT is_done THEN 1 ELSE 0 END) AS pending
FROM todos
```

Response:

```json
[{ "total": "6", "done": "0", "pending": "6" }]
```

**Interaction 4 — Disk size**

```json
[{ "table_size": "32 kB" }]
```

**Interaction 5 — Write-guard (deliberately attempted an INSERT)**

```sql
INSERT INTO todos (id, title, is_done, created_at, updated_at)
VALUES (gen_random_uuid(), 'injected', false, now(), now())
```

Response (from server):

```json
{
  "error": {
    "code": -32603,
    "message": "cannot execute INSERT in a read-only transaction"
  }
}
```

Write operations are **blocked at the protocol level** — not by ACL, but by wrapping every statement in a `SET TRANSACTION READ ONLY` context.

### What it does well

- **Zero friction for DB exploration.** An AI can answer "why is this record in this state?" without needing a separate DB client.
- **Confirmed read-only safety.** Every INSERT/UPDATE/DELETE raises an immediate error. Safe to configure against staging databases.
- **Rich `information_schema` access.** Agents can self-discover the schema, check constraints, and validate that migrations ran correctly.
- **Pairs perfectly with the backend test workflow.** When a pytest test fails with an unexpected value, an agent can query live data in the same conversation to correlate.

### Limitations

- **One tool only.** No `execute` (write), no stored procedure invocation, no `COPY`, no `\d` shortcuts.
- **No schema-aware autocomplete.** The agent must know table/column names from context or discover them with `information_schema` queries.
- **Connection string in plaintext.** The `.vscode/mcp.json` `inputs` prompt helps, but the URL still appears in process arguments — avoid committing real credentials.
- **Single database.** One server instance = one connection string. Cross-database queries require separate server registrations.
- **No streaming.** Large result sets are buffered in memory and returned in one JSON blob.

### Recommended use cases for this project

| Scenario                    | How                                                           |
| --------------------------- | ------------------------------------------------------------- |
| Verify a migration ran      | `SELECT * FROM alembic_version`                               |
| Debug wrong ordering        | `SELECT id, title, created_at FROM todos ORDER BY created_at` |
| Check CORS config drift     | `SELECT current_setting('...') …`                             |
| Audit data during E2E debug | Cross-reference DB state with what the UI shows               |

---

## 2. Playwright MCP (`@playwright/mcp`)

### What it does

Launches a headless (or headed) Chromium browser and exposes it as a set of 22 MCP tools. The differentiator from standard Playwright is that actions return an **accessibility-tree snapshot** (YAML ARIA tree with `ref` IDs) alongside any Playwright code that was executed. This means an AI agent can navigate the DOM semantically without ever touching CSS selectors.

### Configuration (`.vscode/mcp.json`)

```json
{
  "servers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@playwright/mcp@0.0.68", "--headless"]
    }
  }
}
```

Remove `--headless` to watch the browser visually during debugging.

### Tools inventory (22 total)

| Category    | Tools                                                                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navigation  | `browser_navigate`, `browser_navigate_back`, `browser_tabs`                                                                                                |
| Interaction | `browser_click`, `browser_type`, `browser_press_key`, `browser_fill_form`, `browser_drag`, `browser_hover`, `browser_select_option`, `browser_file_upload` |
| Observation | `browser_snapshot`, `browser_take_screenshot`, `browser_console_messages`, `browser_network_requests`                                                      |
| Code        | `browser_evaluate`, `browser_run_code`                                                                                                                     |
| Control     | `browser_resize`, `browser_wait_for`, `browser_handle_dialog`, `browser_install`, `browser_close`                                                          |

### Tested interactions (against live `http://localhost:5173`)

**Interaction 1 — Navigate + automatic accessibility snapshot**

> Prompt: _"Open the todo app and describe what's on screen."_

```
browser_navigate({ url: "http://localhost:5173" })
```

Response (excerpt):

```
Page URL: http://localhost:5173/
Page Title: bmad-todo-app
Console: 1 errors, 0 warnings

Snapshot:
- main [ref=e3]:
  - heading "My Tasks" [level=1]
  - textbox "New task" [active] [ref=e10]
  - button "Add" [ref=e11]
  - list [ref=e12]:
    - listitem [ref=e13]:
      - checkbox "Mark 'Buy groceries' as complete" [ref=e15]
      - generic: Buy groceries
      - button "Delete task 'Buy groceries'" [ref=e17]
```

The accessibility tree is **semantically equivalent to what a screen reader sees** — same labels used in our ARIA attributes and `aria-label` attributes are confirmed present.

**Interaction 2 — Console error detection**

```
browser_console_messages({ level: "error" })
```

Response:

```
Total messages: 4 (Errors: 1, Warnings: 0)
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found)
        @ http://localhost:5173/favicon.ico
```

→ Immediately surfaced a missing `favicon.ico`. Easy to add to the project.

**Interaction 3 — Network request audit**

```
browser_network_requests({})
```

Response:

```
[GET] http://localhost:5173/api/v1/todos => [200] OK
[GET] http://localhost:5173/api/v1/todos => [200] OK
```

Confirms `fetchTodos()` is called twice on initial load (React StrictMode double-invoke in dev).

**Interaction 4 — Validation error surfaced via snapshot**

After pressing Enter with an empty input:

```yaml
- <changed> generic [ref=e4]:
    - alert [ref=e49]: Task description is required.
```

The ARIA diff shows the `role="alert"` element appearing with its exact error text — without any CSS knowledge.

**Interaction 5 — Viewport resize to mobile**

```
browser_resize({ width: 375, height: 812 })
```

→ Screenshot taken, layout confirmed responsive (verified via screenshot file saved to disk).

**Interaction 6 — `browser_fill_form` API gotcha**

Calling with `{fields: [{label: "New task", value: "…"}]}` returned a validation error:

```json
{"code": "invalid_type", "path": ["fields", 0, "name"], "message": "expected string, received undefined"}
{"code": "invalid_value", "path": ["fields", 0, "type"], "message": "expected one of textbox|checkbox|radio|combobox|slider"}
```

The tool expects `{fields: [{name: "New task", type: "textbox", value: "…"}]}` — the field name must match the accessible name, and `type` is required. Use `browser_type` for simpler single-field fills.

**Interaction 7 — `browser_click` requires a `ref`**

Attempting `browser_click({ element: "Delete task '…'", ref: "" })` fails if `ref` is empty. The correct flow is:

1. Call `browser_snapshot` to get the current ARIA tree with `ref` IDs
2. Extract the `ref` of the target element (e.g. `e17`)
3. Call `browser_click({ element: "Delete task '…'", ref: "e17" })`

### What it does well

- **Accessibility validation for free.** Every navigation returns an ARIA tree. If a label is missing or wrong, the agent sees it immediately — no additional assertion needed.
- **Explains itself.** Responses show the Playwright code that was run, so a developer can copy it directly into a spec file.
- **Console + network telemetry.** Surfaces errors and unexpected requests without browser DevTools.
- **Semantic-first interactions.** No CSS selectors anywhere in the tool surface. The `ref` system ties interactions to the accessibility tree, not the DOM structure.
- **Mobile testing with one call.** `browser_resize` changes viewport instantly.

### Limitations

- **`ref` IDs are ephemeral.** They change after any DOM mutation. Every click sequence requires a fresh `browser_snapshot` before `browser_click`.
- **`browser_fill_form` schema is not obvious.** Requires `name` + `type` fields (not `label`), which differs from the Playwright testing-library idiom. The simpler `browser_type` is more predictable.
- **No `page.waitForResponse()` or request interception.** Network requests are read-only; mocking API responses to test error states requires `browser_run_code` with raw Playwright code.
- **Headless screenshots are not screenshots in the design sense.** They capture the rendered viewport at the moment of calling — no animation, no hover state.
- **Single tab by default.** Multi-tab flows need explicit `browser_tabs` management.
- **`favicon.ico` 404 in dev.** Not an MCP limitation, but the console error surface highlights a cosmetic gap in the project (no favicon served by Vite).

### Recommended use cases for this project

| Scenario                                    | How                                                             |
| ------------------------------------------- | --------------------------------------------------------------- |
| Verify ARIA labels after a component change | `browser_snapshot` after navigation                             |
| Catch console errors in CI                  | `browser_console_messages({ level: "error" })` and assert empty |
| Confirm API calls fire after mutations      | `browser_network_requests` before/after an action               |
| Debug E2E failures without video            | `browser_take_screenshot` at each step                          |
| Test the 375px mobile layout                | `browser_resize({ width: 375, height: 812 })`                   |

---

## Side-by-side comparison

| Dimension                  | PostgreSQL MCP                          | Playwright MCP                          |
| -------------------------- | --------------------------------------- | --------------------------------------- |
| **Package**                | `@modelcontextprotocol/server-postgres` | `@playwright/mcp`                       |
| **Version tested**         | 0.6.2                                   | 0.0.68                                  |
| **Transport**              | stdio JSON-RPC                          | stdio JSON-RPC                          |
| **Tool count**             | 1                                       | 22                                      |
| **Read-only by default**   | Yes (hard-enforced)                     | No                                      |
| **Needs running stack**    | Database only                           | Full stack (needs frontend)             |
| **Output format**          | JSON rows                               | YAML ARIA tree + JS snippets            |
| **Core value**             | DB state inspection                     | UI automation + a11y audit              |
| **Steeper learning curve** | None                                    | Ref-based click API                     |
| **Production safe**        | Yes                                     | Use staging/preview only                |
| **Pairs with**             | Debugging test failures, schema drift   | Replacing / generating Playwright specs |
| **Key gotcha**             | Port must be exposed to host            | `ref` IDs expire on DOM change          |

---

## Integration into this project's workflow

### When to reach for PostgreSQL MCP

- A pytest test fails with unexpected data → query the live DB to understand the actual state
- Suspecting a migration didn't apply cleanly → `SELECT * FROM alembic_version`
- Checking `created_at` / `updated_at` timestamps are correct timezone-aware values
- Auditing seeded data before an E2E run

### When to reach for Playwright MCP

- A component is merged and you want to verify its `aria-label` values without running the full Playwright suite
- Reproducing a UI bug reported by a user — navigate, snapshot, share the ARIA tree as context
- Generating a first-pass Playwright spec by recording actions and copying the emitted JS code
- Checking the 375 px mobile viewport after a CSS change

### Setup checklist

```bash
# 1. Expose Postgres to host (already done — see docker-compose.yml ports: - "5432:5432")
make up

# 2. Install Playwright browsers (one-time, needed for @playwright/mcp)
cd e2e && npx playwright install --with-deps

# 3. MCP configuration is in .vscode/mcp.json — VS Code Copilot picks it up automatically
```

---

## Verdict

**PostgreSQL MCP** is the more immediately practical tool for this stack. It's safe, simple, zero-configuration (past the connection string), and directly useful during backend development and debugging. Install it for any project with a relational database.

**Playwright MCP** is more powerful but has a steeper learning curve due to the ephemeral `ref` system and the non-obvious `browser_fill_form` API. Its killer feature is the ARIA accessibility tree returned on every action — it turns accessibility validation from an afterthought into a side-effect of every navigation. Most valuable when writing new Playwright specs or auditing component accessibility after a refactor.

Neither replaces the other: use PostgreSQL MCP for state inspection, Playwright MCP for behaviour verification.
