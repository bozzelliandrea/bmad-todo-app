# Story 1.3: Database Schema and Alembic Migration

Status: done

## Story

As a developer,
I want the `todos` table created in PostgreSQL via an Alembic migration that runs automatically on backend startup,
so that the database schema is version-controlled and reproducible across all environments.

## Acceptance Criteria

1. On first backend container start, `alembic upgrade head` creates the `todos` table with columns: `id` (UUID PK), `title` (VARCHAR 500 NOT NULL), `is_done` (BOOLEAN NOT NULL DEFAULT FALSE), `created_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW()), `updated_at` (TIMESTAMPTZ NOT NULL DEFAULT NOW()).
2. Running `alembic upgrade head` a second time detects no pending migrations and exits cleanly.
3. A developer can run `alembic revision --autogenerate -m "description"` inside the backend container to create a new migration file in `alembic/versions/`.
4. The `alembic.ini` reads the database URL from the `DATABASE_URL` environment variable, not hardcoded.

## Tasks / Subtasks

- [x] Task 1 — Alembic scaffold (AC: 3, 4)
  - [x] Create `backend/alembic.ini` with `script_location = alembic` and sqlalchemy.url overridden in env.py
  - [x] Create `backend/alembic/env.py` configured to import `Base` from `app.models` and read `DATABASE_URL` from env
  - [x] Create `backend/alembic/script.py.mako` (standard Alembic template)
  - [x] Create `backend/alembic/versions/` directory

- [x] Task 2 — Initial migration (AC: 1, 2)
  - [x] Created `backend/alembic/versions/0001_create_todos_table.py` with todos table and all required columns

## Dev Notes

### Alembic `env.py` pattern

The key change from default `env.py`: read `DATABASE_URL` from env var and set `target_metadata = Base.metadata` so autogenerate works.

```python
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.models import Base  # must import models so metadata is populated

config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)

# Override sqlalchemy.url from environment variable
config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])

target_metadata = Base.metadata
```

### Migration file shape for todos table

```python
def upgrade() -> None:
    op.create_table(
        "todos",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("is_done", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
```

### `alembic.ini` key settings

- `script_location = alembic` (relative to where alembic runs, which is `backend/`)
- `sqlalchemy.url` is overridden in `env.py` from env var — the ini value can be a placeholder or empty

### References

- [architecture.md — Infrastructure: Alembic migration workflow](_bmad-output/planning-artifacts/architecture.md)
- [prd.md — FR-12, FR-13](_bmad-output/planning-artifacts/prd.md)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (GitHub Copilot)

### Debug Log References

### Completion Notes List

- `alembic.ini` keeps `sqlalchemy.url` as a dummy placeholder; `env.py` overrides it from `DATABASE_URL` env var at runtime
- Migration uses `postgresql.UUID(as_uuid=True)` for full UUID support in PostgreSQL
- `app.models` import in `env.py` via `from app.models import Base` — requires `prepend_sys_path = .` in `alembic.ini` so `app` package is on Python path when running inside `backend/`

### File List

- `backend/alembic.ini`
- `backend/alembic/env.py`
- `backend/alembic/script.py.mako`
- `backend/alembic/versions/0001_create_todos_table.py`
