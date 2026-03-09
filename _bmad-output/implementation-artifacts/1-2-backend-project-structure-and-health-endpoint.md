# Story 1.2: Backend Project Structure and Health Endpoint

Status: done

## Story

As a developer,
I want the FastAPI project wired up with its full module structure and production-ready middleware,
so that the backend scaffolding is complete and all subsequent API stories only need to fill in CRUD logic.

## Acceptance Criteria

1. `GET /health` returns `{ "status": "ok" }` with HTTP 200.
2. `GET http://localhost:8000/docs` loads the OpenAPI Swagger UI and shows the available endpoints.
3. All SQLAlchemy sessions are closed after every request (success or failure) via `try/finally` in `get_db()`.
4. Any unhandled exception returns `{ "detail": "Internal server error" }` with no stack trace in the body.
5. With `CORS_ORIGINS=http://localhost:5173`, a request from that origin receives `Access-Control-Allow-Origin: http://localhost:5173` in the response headers.
6. All todo routes are registered under the `/api/v1/todos` prefix.

## Tasks / Subtasks

- [x] Task 1 — `database.py` (AC: 3)
  - [x] Create SQLAlchemy engine from `DATABASE_URL` env var
  - [x] Create `SessionLocal` (autocommit=False, autoflush=False)
  - [x] Create `Base = declarative_base()`
  - [x] Implement `get_db()` generator with `try/finally` session close

- [x] Task 2 — `models.py` (AC: 6)
  - [x] Define `Todo` ORM model: id (UUID PK server_default), title (VARCHAR 500 NOT NULL), is_done (Boolean default False), created_at (TIMESTAMPTZ server_default NOW()), updated_at (TIMESTAMPTZ server_default NOW(), onupdate NOW())

- [x] Task 3 — `schemas.py` (AC: 1, 6)
  - [x] `TodoBase`: title validator (strip whitespace, raise ValueError if empty, max 500)
  - [x] `TodoCreate(TodoBase)`: no extra fields
  - [x] `TodoUpdate`: `is_done: bool` only
  - [x] `TodoResponse(TodoBase)`: id, is_done, created_at, updated_at; `model_config = ConfigDict(from_attributes=True)`

- [x] Task 4 — `crud.py` stubs (AC: 6)
  - [x] `get_todos(db)` → `list[models.Todo]`
  - [x] `create_todo(db, todo: schemas.TodoCreate)` → `models.Todo`
  - [x] `update_todo(db, todo_id: UUID, data: schemas.TodoUpdate)` → `models.Todo | None`
  - [x] `delete_todo(db, todo_id: UUID)` → `bool`

- [x] Task 5 — `routers/todos.py` stubs (AC: 6)
  - [x] Register APIRouter with `prefix="/api/v1/todos"`, `tags=["todos"]`
  - [x] All 4 route handlers stubbed with correct HTTP methods and return types

- [x] Task 6 — `main.py` full wiring (AC: 1, 2, 4, 5)
  - [x] `CORSMiddleware` from `CORS_ORIGINS` env var
  - [x] `@app.exception_handler(Exception)` returning safe 500 JSON
  - [x] Todos router included
  - [x] `/health` route retained

## Dev Notes

### Architecture Constraints

- **`DATABASE_URL` format**: `postgresql://user:pass@db:5432/dbname` (uses Docker service name `db`)
- **`CORS_ORIGINS`**: comma-separated string → split and strip → list of allowed origins; NEVER wildcard `*` (NFR-11)
- **get_db() pattern** (exact from architecture.md):
  ```python
  def get_db():
      db = SessionLocal()
      try:
          yield db
      finally:
          db.close()
  ```
- **UUID primary key** — use `uuid.uuid4` as Python-side default (not `gen_random_uuid()`) so it works with both PostgreSQL and SQLite test DB:
  ```python
  id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
  ```
- **`updated_at` server-side onupdate** — use SQLAlchemy `onupdate=func.now()` for automatic timestamp updates
- **Exception handler** — must be registered BEFORE the router inclusion so it catches all routes; must NOT expose tracebacks (NFR-13)
- **Global 422 override** — FastAPI's default 422 `RequestValidationError` response is acceptable; do NOT override it (it already conforms to `{"detail": [...]}`)
- **Pydantic v2** — use `model_config = ConfigDict(from_attributes=True)` NOT the old `class Config: orm_mode = True`

### Full `models.py` expected shape

```python
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base

class Todo(Base):
    __tablename__ = "todos"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    is_done: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)
```

### Full `schemas.py` expected shape

```python
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator

class TodoBase(BaseModel):
    title: str

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("title must not be empty or whitespace")
        if len(v) > 500:
            raise ValueError("title must be 500 characters or fewer")
        return v

class TodoCreate(TodoBase):
    pass

class TodoUpdate(BaseModel):
    is_done: bool

class TodoResponse(TodoBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    is_done: bool
    created_at: datetime
    updated_at: datetime
```

### Full `main.py` expected shape

```python
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .routers import todos

app = FastAPI(title="bmad-todo-app", version="0.1.0")

# CORS — origins from env var, never wildcard
origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler — no stack trace in response body
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

app.include_router(todos.router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

### Module structure created in this story

```
backend/app/
├── __init__.py
├── main.py          ← full wiring (replaces stub from 1.1)
├── database.py      ← NEW
├── models.py        ← NEW
├── schemas.py       ← NEW
├── crud.py          ← NEW (stubs; logic fills in Epic 2)
└── routers/
    ├── __init__.py  ← NEW
    └── todos.py     ← NEW (route stubs)
```

### References

- [architecture.md — Backend Patterns](_bmad-output/planning-artifacts/architecture.md)
- [prd.md — NFR-11, NFR-13](_bmad-output/planning-artifacts/prd.md)
- [epics.md — Story 1.2](_bmad-output/planning-artifacts/epics.md)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (GitHub Copilot)

### Debug Log References

### Completion Notes List

- Used `declarative_base()` from `sqlalchemy.orm` (SQLAlchemy 2.x compatible)
- UUID primary key uses Python-side `default=uuid.uuid4` so tests can use SQLite without UUID extension
- Exception handler registered before router inclusion to catch all routes
- CORS origins split on comma and stripped so trailing whitespace in env var is harmless
- crud.py stubs raise `NotImplementedError` — Epic 2 fills them in without changing router signatures

### File List

- `backend/app/main.py` (updated from Story 1.1 stub)
- `backend/app/database.py`
- `backend/app/models.py`
- `backend/app/schemas.py`
- `backend/app/crud.py`
- `backend/app/routers/__init__.py`
- `backend/app/routers/todos.py`
