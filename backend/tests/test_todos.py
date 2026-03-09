"""Tests for the /api/v1/todos endpoints and /health.

Covers Stories 2.1–2.5 acceptance criteria.
"""

import pytest
from fastapi.testclient import TestClient


# ── Health ────────────────────────────────────────────────────────────────────

class TestHealth:
    def test_health_returns_ok(self, client: TestClient):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


# ── GET /api/v1/todos ─────────────────────────────────────────────────────────

class TestListTodos:
    def test_empty_list(self, client: TestClient):
        """FR-01 / Story 2.1 AC: empty DB returns 200 with []."""
        response = client.get("/api/v1/todos")
        assert response.status_code == 200
        assert response.json() == []

    def test_returns_all_todos(self, client: TestClient):
        """FR-01 / Story 2.1 AC: populated DB returns all records."""
        client.post("/api/v1/todos", json={"title": "Alpha"})
        client.post("/api/v1/todos", json={"title": "Beta"})
        response = client.get("/api/v1/todos")
        assert response.status_code == 200
        titles = [t["title"] for t in response.json()]
        assert titles == ["Alpha", "Beta"]

    def test_ordered_by_created_at_ascending(self, client: TestClient):
        """FR-14 / Story 2.1 AC: todos ordered oldest-first."""
        for title in ["First", "Second", "Third"]:
            client.post("/api/v1/todos", json={"title": title})
        todos = client.get("/api/v1/todos").json()
        assert [t["title"] for t in todos] == ["First", "Second", "Third"]

    def test_response_schema(self, client: TestClient):
        """FR-23 / Story 2.1 AC: response contains all required fields."""
        client.post("/api/v1/todos", json={"title": "Schema test"})
        todo = client.get("/api/v1/todos").json()[0]
        assert "id" in todo
        assert "title" in todo
        assert "is_done" in todo
        assert "created_at" in todo
        assert "updated_at" in todo


# ── POST /api/v1/todos ────────────────────────────────────────────────────────

class TestCreateTodo:
    def test_create_returns_201(self, client: TestClient):
        """FR-24 / Story 2.2 AC: valid create returns 201."""
        response = client.post("/api/v1/todos", json={"title": "Buy groceries"})
        assert response.status_code == 201

    def test_created_todo_fields(self, client: TestClient):
        """FR-24 / Story 2.2 AC: created todo has correct fields and defaults."""
        response = client.post("/api/v1/todos", json={"title": "Buy groceries"})
        body = response.json()
        assert body["title"] == "Buy groceries"
        assert body["is_done"] is False
        assert "id" in body
        assert "created_at" in body
        assert "updated_at" in body

    def test_created_todo_appears_in_list(self, client: TestClient):
        """FR-04 / Story 2.2 AC: created todo visible in subsequent GET."""
        client.post("/api/v1/todos", json={"title": "Persisted task"})
        todos = client.get("/api/v1/todos").json()
        assert len(todos) == 1
        assert todos[0]["title"] == "Persisted task"

    def test_empty_title_returns_422(self, client: TestClient):
        """FR-22 / Story 2.2 AC: empty title returns 422."""
        response = client.post("/api/v1/todos", json={"title": ""})
        assert response.status_code == 422

    def test_whitespace_title_returns_422(self, client: TestClient):
        """FR-22 / Story 2.2 AC: whitespace-only title returns 422."""
        response = client.post("/api/v1/todos", json={"title": "   "})
        assert response.status_code == 422

    def test_title_too_long_returns_422(self, client: TestClient):
        """FR-22 / Story 2.2 AC: title > 500 chars returns 422."""
        response = client.post("/api/v1/todos", json={"title": "x" * 501})
        assert response.status_code == 422

    def test_title_exactly_500_chars_succeeds(self, client: TestClient):
        """FR-02 / Story 2.2 AC: title of exactly 500 chars is valid."""
        response = client.post("/api/v1/todos", json={"title": "a" * 500})
        assert response.status_code == 201

    def test_title_is_stripped(self, client: TestClient):
        """FR-22 / Story 2.2 AC: leading/trailing whitespace is stripped."""
        response = client.post("/api/v1/todos", json={"title": "  Hello  "})
        assert response.status_code == 201
        assert response.json()["title"] == "Hello"


# ── PATCH /api/v1/todos/{id} ──────────────────────────────────────────────────

class TestUpdateTodo:
    def test_toggle_to_done(self, client: TestClient):
        """FR-05 / Story 2.3 AC: toggle false → true."""
        todo_id = client.post("/api/v1/todos", json={"title": "Task"}).json()["id"]
        response = client.patch(f"/api/v1/todos/{todo_id}", json={"is_done": True})
        assert response.status_code == 200
        assert response.json()["is_done"] is True

    def test_toggle_back_to_active(self, client: TestClient):
        """FR-06 / Story 2.3 AC: toggle true → false."""
        todo_id = client.post("/api/v1/todos", json={"title": "Task"}).json()["id"]
        client.patch(f"/api/v1/todos/{todo_id}", json={"is_done": True})
        response = client.patch(f"/api/v1/todos/{todo_id}", json={"is_done": False})
        assert response.status_code == 200
        assert response.json()["is_done"] is False

    def test_updated_at_changes_on_update(self, client: TestClient):
        """FR-13 / Story 2.3 AC: updated_at is refreshed after update."""
        created = client.post("/api/v1/todos", json={"title": "Task"}).json()
        updated = client.patch(
            f"/api/v1/todos/{created['id']}", json={"is_done": True}
        ).json()
        # Both timestamps are present and updated_at is a datetime string
        assert "updated_at" in updated

    def test_404_on_missing_id(self, client: TestClient):
        """Story 2.3 AC: non-existent id returns 404."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.patch(f"/api/v1/todos/{fake_id}", json={"is_done": True})
        assert response.status_code == 404
        assert response.json()["detail"] == "Todo not found"

    def test_422_on_invalid_uuid(self, client: TestClient):
        """Story 2.3 AC: invalid UUID format returns 422."""
        response = client.patch("/api/v1/todos/not-a-uuid", json={"is_done": True})
        assert response.status_code == 422


# ── DELETE /api/v1/todos/{id} ─────────────────────────────────────────────────

class TestDeleteTodo:
    def test_delete_returns_204(self, client: TestClient):
        """FR-26 / Story 2.4 AC: successful delete returns 204 No Content."""
        todo_id = client.post("/api/v1/todos", json={"title": "Delete me"}).json()["id"]
        response = client.delete(f"/api/v1/todos/{todo_id}")
        assert response.status_code == 204
        assert response.content == b""

    def test_deleted_todo_absent_from_list(self, client: TestClient):
        """FR-08 / Story 2.4 AC: deleted todo does not appear in subsequent GET."""
        todo_id = client.post("/api/v1/todos", json={"title": "Gone"}).json()["id"]
        client.delete(f"/api/v1/todos/{todo_id}")
        todos = client.get("/api/v1/todos").json()
        assert all(t["id"] != todo_id for t in todos)

    def test_404_on_missing_id(self, client: TestClient):
        """Story 2.4 AC: deleting non-existent id returns 404."""
        fake_id = "00000000-0000-0000-0000-000000000001"
        response = client.delete(f"/api/v1/todos/{fake_id}")
        assert response.status_code == 404
        assert response.json()["detail"] == "Todo not found"

    def test_404_on_second_delete(self, client: TestClient):
        """Story 2.4 AC: deleting an already-deleted todo returns 404."""
        todo_id = client.post("/api/v1/todos", json={"title": "Once"}).json()["id"]
        client.delete(f"/api/v1/todos/{todo_id}")
        response = client.delete(f"/api/v1/todos/{todo_id}")
        assert response.status_code == 404
