"""Pytest configuration and shared fixtures for the backend test suite."""

import os

# Set DATABASE_URL before any app imports so create_engine() doesn't fail
# with an empty URL if the variable isn't in the environment.
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402

# ── In-memory SQLite engine for tests ────────────────────────────────────────
# StaticPool keeps the same connection across threads so the TestClient can
# read rows written in the same test without an additional commit.
SQLITE_URL = "sqlite://"

engine = create_engine(
    SQLITE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Dependency override: provide a test-scoped SQLite session."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def reset_db():
    """Create all tables before each test; drop them after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    """Return a FastAPI TestClient with the DB dependency overridden."""
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
