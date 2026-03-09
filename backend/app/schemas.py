from datetime import datetime
from uuid import UUID

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
