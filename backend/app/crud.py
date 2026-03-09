"""CRUD operations for the todos resource."""

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import asc
from sqlalchemy.orm import Session

from . import models, schemas


def get_todos(db: Session) -> list[models.Todo]:
    """Return all todos ordered by created_at ascending (FR-14)."""
    return db.query(models.Todo).order_by(asc(models.Todo.created_at)).all()


def create_todo(db: Session, todo: schemas.TodoCreate) -> models.Todo:
    """Create and persist a new todo (FR-24). Title is already validated by Pydantic."""
    db_todo = models.Todo(title=todo.title)
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo


def update_todo(
    db: Session, todo_id: UUID, data: schemas.TodoUpdate
) -> models.Todo | None:
    """Toggle is_done for a todo (FR-25). Returns None if todo_id does not exist."""
    db_todo = db.query(models.Todo).filter(models.Todo.id == todo_id).first()
    if db_todo is None:
        return None
    db_todo.is_done = data.is_done
    db_todo.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_todo)
    return db_todo


def delete_todo(db: Session, todo_id: UUID) -> bool:
    """Permanently delete a todo (FR-26). Returns False if todo_id does not exist."""
    db_todo = db.query(models.Todo).filter(models.Todo.id == todo_id).first()
    if db_todo is None:
        return False
    db.delete(db_todo)
    db.commit()
    return True
