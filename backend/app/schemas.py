from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

# Per-user reading states. Stored on the shelf entry so each user's
# status for a book is independent of every other user's.
ReadingStatus = Literal["want_to_read", "reading", "finished"]


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    role: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class BookBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    author: str = Field(min_length=1, max_length=255)
    isbn: str = Field(min_length=10, max_length=32)
    genre: str = Field(default="Other", max_length=80)
    published_year: int | None = Field(default=None, ge=0, le=2100)
    description: str = Field(default="", max_length=4000)
    cover_color: str = Field(default="#1F6F78", max_length=20)


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    author: str | None = Field(default=None, min_length=1, max_length=255)
    isbn: str | None = Field(default=None, min_length=10, max_length=32)
    genre: str | None = Field(default=None, max_length=80)
    published_year: int | None = Field(default=None, ge=0, le=2100)
    description: str | None = Field(default=None, max_length=4000)
    cover_color: str | None = Field(default=None, max_length=20)


class BookResponse(BookBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime | None = None


class ShelfAddRequest(BaseModel):
    book_id: int


class ShelfStatusUpdate(BaseModel):
    status: ReadingStatus


class ShelfEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    book_id: int
    status: str
    created_at: datetime | None = None
