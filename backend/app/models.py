from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base

# Allowed per-user reading states for a saved book.
READING_STATUSES = ("want_to_read", "reading", "finished")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="reader")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    author: Mapped[str] = mapped_column(String(255), index=True)
    isbn: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    genre: Mapped[str] = mapped_column(String(80), default="Other")
    published_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str] = mapped_column(Text, default="")
    cover_color: Mapped[str] = mapped_column(String(20), default="#1F6F78")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class ShelfEntry(Base):
    """A book saved to a user's personal shelf, with a reading status.

    One row per (user, book); duplicates are prevented by a unique
    constraint. Rows are removed when the book is deleted (see the
    books router, which deletes related entries explicitly so SQLite
    and PostgreSQL behave identically).
    """

    __tablename__ = "shelf_entries"
    __table_args__ = (UniqueConstraint("user_id", "book_id", name="uq_shelf_user_book"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    book_id: Mapped[int] = mapped_column(
        ForeignKey("books.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[str] = mapped_column(String(20), default="want_to_read")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
