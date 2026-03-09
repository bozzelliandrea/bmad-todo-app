"""Todos router — route stubs wired to CRUD layer.

Story 1.2 establishes the router structure.
Epic 2 stories implement the CRUD logic in crud.py.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/api/v1/todos", tags=["todos"])


@router.get("", response_model=list[schemas.TodoResponse])
def list_todos(db: Session = Depends(get_db)) -> list[schemas.TodoResponse]:
    """GET /api/v1/todos — list all todos. Implemented in Story 2.1."""
    return crud.get_todos(db)


@router.post("", response_model=schemas.TodoResponse, status_code=201)
def create_todo(
    payload: schemas.TodoCreate, db: Session = Depends(get_db)
) -> schemas.TodoResponse:
    """POST /api/v1/todos — create a todo. Implemented in Story 2.2."""
    return crud.create_todo(db, payload)


@router.patch("/{todo_id}", response_model=schemas.TodoResponse)
def update_todo(
    todo_id: UUID, payload: schemas.TodoUpdate, db: Session = Depends(get_db)
) -> schemas.TodoResponse:
    """PATCH /api/v1/todos/{id} — toggle completion. Implemented in Story 2.3."""
    result = crud.update_todo(db, todo_id, payload)
    if result is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return result


@router.delete("/{todo_id}", status_code=204)
def delete_todo(todo_id: UUID, db: Session = Depends(get_db)) -> Response:
    """DELETE /api/v1/todos/{id} — delete a todo. Implemented in Story 2.4."""
    found = crud.delete_todo(db, todo_id)
    if not found:
        raise HTTPException(status_code=404, detail="Todo not found")
    return Response(status_code=204)
