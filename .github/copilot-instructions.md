# Project Coding Instructions

Stack: **FastAPI 0.115 + Python 3.11 / React 18 + TypeScript / PostgreSQL 16 / Playwright**.

> These rules apply to every file in the repository. Follow them exactly — do not invent alternatives.

---

## Rule 1 — Layered architecture: never skip layers

```
Router → crud.py → SQLAlchemy Session
Component → Hook → api.ts → fetch
```

- **Backend**: Routers call `crud.*()`. No SQLAlchemy queries inside router functions.
- **Frontend**: Components call hook callbacks only. Hooks call `api.*()`. No raw `fetch()` anywhere except `api.ts`.

### ❌ Before

```python
# router calling db directly
@router.get("")
def list_todos(db: Session = Depends(get_db)):
    return db.query(Todo).all()   # ← DB logic in router
```

### ✅ After

```python
@router.get("")
def list_todos(db: Session = Depends(get_db)):
    return crud.get_todos(db)     # ← delegates to crud layer
```

---

## Rule 2 — Pydantic v2 only: use `field_validator`, `ConfigDict`, and `model_config`

Never use Pydantic v1 APIs (`@validator`, `class Config`, `orm_mode = True`).

### ❌ Before

```python
class TodoResponse(BaseModel):
    class Config:
        orm_mode = True

    @validator("title")
    def not_blank(cls, v): ...
```

### ✅ After

```python
class TodoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    @field_validator("title")
    @classmethod
    def not_blank(cls, v: str) -> str: ...
```

---

## Rule 3 — UTC timestamps: always `datetime.now(timezone.utc)`, never `datetime.utcnow()`

`datetime.utcnow()` returns a naïve datetime and is deprecated in Python 3.12+.

### ❌ Before

```python
db_todo.updated_at = datetime.utcnow()
```

### ✅ After

```python
from datetime import datetime, timezone
db_todo.updated_at = datetime.now(timezone.utc)
```

---

## Rule 4 — UUID primary keys: Python-side `default`, never `server_default`

`server_default` (a DB-generated UUID) is invisible to SQLite used in the test suite. Always generate UUIDs in Python so tests work without a real Postgres instance.

### ❌ Before

```python
id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
```

### ✅ After

```python
import uuid
id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
```

---

## Rule 5 — HTTP status codes are contract, not suggestion

| Operation       | Success code | Body  |
| --------------- | ------------ | ----- |
| `GET` / `PATCH` | 200          | JSON  |
| `POST`          | **201**      | JSON  |
| `DELETE`        | **204**      | empty |

Always call `db.refresh(obj)` before returning an ORM model after a commit. Return `Response(status_code=204)` explicitly on DELETE — FastAPI won't strip the body automatically for all serializers.

### ❌ Before

```python
@router.delete("/{id}")
def delete_todo(id: UUID, db: Session = Depends(get_db)):
    crud.delete_todo(db, id)
    return {"ok": True}   # ← wrong status + wrong body
```

### ✅ After

```python
@router.delete("/{todo_id}", status_code=204)
def delete_todo(todo_id: UUID, db: Session = Depends(get_db)) -> Response:
    found = crud.delete_todo(db, todo_id)
    if not found:
        raise HTTPException(status_code=404, detail="Todo not found")
    return Response(status_code=204)
```

---

## Rule 6 — TypeScript: explicit return types, no `any`

Every function (including React components, hooks, and api helpers) must declare its return type. Use `unknown` + narrowing instead of `any`.

### ❌ Before

```typescript
export function useTodos() {            // no return type
  const [todos, setTodos] = useState([]); // inferred as never[]
  async function addTodo(title) { ... }   // no parameter type
}
```

### ✅ After

```typescript
export function useTodos(): UseTodosReturn {
  const [todos, setTodos] = useState<Todo[]>([]);
  async function addTodo(title: string): Promise<void> { ... }
}
```

---

## Rule 7 — Server-authoritative UI: re-fetch after every mutation

Never optimistically patch local state. After `createTodo`, `updateTodo`, or `deleteTodo` resolves, call `fetchTodos()` so the UI always reflects server truth.

### ❌ Before

```typescript
const addTodo = async (title: string) => {
  const newTodo = await api.createTodo(title);
  setTodos((prev) => [...prev, newTodo]); // ← local mutation, may drift from server
};
```

### ✅ After

```typescript
const addTodo = async (title: string): Promise<void> => {
  await api.createTodo(title);
  await fetchTodos(); // re-fetch; server is the source of truth
};
```

---

## Rule 8 — Accessibility is non-negotiable on every interactive element

- Every `<input>` must be associated with a `<label>` (via `htmlFor` / `aria-label`).
- Every icon-only button needs `aria-label` with a human-readable description.
- Error messages live in an element with `role="alert"` so screen readers announce them.
- Touch targets must be ≥ 44 × 44 px (enforced via CSS `min-width`/`min-height`).

### ❌ Before

```tsx
<button onClick={onDelete}>✕</button>
<input placeholder="Add task" />
<div className="error">{error}</div>
```

### ✅ After

```tsx
<button onClick={onDelete} aria-label={`Delete task '${todo.title}'`}>
  <span aria-hidden="true">✕</span>
</button>
<label htmlFor="new-todo-input" className="visually-hidden">New task</label>
<input id="new-todo-input" placeholder="What needs doing?" />
<p role="alert">{error}</p>
```

---

## Rule 9 — Use design tokens, never hardcoded colours or magic numbers

All colours, radii, shadows, and spacing are defined as CSS custom properties in `frontend/src/index.css`. Reference them everywhere; never repeat raw values.

### ❌ Before

```css
.btn--primary {
  background: #4f46e5;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}
```

### ✅ After

```css
.btn--primary {
  background: var(--color-accent);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
```

---

## Rule 10 — Tests: class grouping, FR references, semantic E2E locators

**Backend (pytest)**

- Group tests in classes named `Test<Resource><Scenario>` (e.g. `TestCreateTodo`).
- Every test docstring must cite the FR number or story AC it covers.
- Never instantiate `TestClient` directly — use the `client` fixture from `conftest.py`.

**E2E (Playwright)**

- Use `getByRole`, `getByLabel`, `getByText` — **never** CSS selectors or `locator('[data-testid]')` unless there is no semantic alternative.
- Each test must start from a clean slate: call the REST API in `beforeEach` to delete all todos.

### ❌ Before

```typescript
test("delete button works", async ({ page }) => {
  await page.locator(".todo-item:first-child .btn-delete").click(); // ← fragile CSS
});
```

### ✅ After

```typescript
test("removes a task from the list", async ({ page }) => {
  // beforeEach already cleared state; create the fixture via UI
  await page.getByLabel("New task").fill("Task to delete");
  await page.getByLabel("New task").press("Enter");
  await page
    .getByRole("button", { name: "Delete task 'Task to delete'" })
    .click();
  await expect(page.getByText("Task to delete")).not.toBeVisible();
});
```
