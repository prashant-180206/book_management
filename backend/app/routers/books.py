import base64
import binascii
import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, or_, select

from ..deps import DbSession, get_current_user, require_admin
from ..models import Book, ShelfEntry, User
from ..schemas import BookCreate, BookResponse, BooksPage, BookUpdate

router = APIRouter(prefix="/books", tags=["Books"])


MAX_PAGE_SIZE = 100
MAX_OFFSET = 10_000


def _encode_cursor(book: Book) -> str:
    value = json.dumps(
        {"created_at": book.created_at.isoformat(), "id": book.id},
        separators=(",", ":"),
    ).encode()
    return base64.urlsafe_b64encode(value).decode().rstrip("=")


def _decode_cursor(cursor: str) -> tuple[datetime, int]:
    try:
        padding = "=" * (-len(cursor) % 4)
        value = json.loads(base64.urlsafe_b64decode(cursor + padding))
        created_at = datetime.fromisoformat(value["created_at"])
        book_id = int(value["id"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError, binascii.Error):
        raise HTTPException(status_code=400, detail="Invalid pagination cursor")
    return created_at, book_id


@router.get("", response_model=BooksPage, operation_id="listBooks")
def list_books(
    db: DbSession,
    _: User = Depends(get_current_user),
    search: str | None = Query(default=None),
    cursor: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=MAX_PAGE_SIZE),
    offset: int | None = Query(default=None, ge=0, le=MAX_OFFSET),
) -> BooksPage:
    if cursor and offset is not None:
        raise HTTPException(
            status_code=400, detail="Use either cursor or offset, not both"
        )

    query = select(Book).order_by(Book.created_at.desc())

    if search:
        term = f"%{search}%"
        query = query.where(
            or_(
                Book.title.ilike(term),
                Book.author.ilike(term),
                Book.genre.ilike(term),
                Book.isbn.ilike(term),
            )
        )

    if cursor:
        created_at, book_id = _decode_cursor(cursor)
        query = query.where(
            or_(
                Book.created_at < created_at,
                and_(Book.created_at == created_at, Book.id < book_id),
            )
        )
    elif offset is not None and offset > 0:
        query = query.offset(offset)

    books = list(db.scalars(query.limit(limit + 1)).all())
    has_more = len(books) > limit
    items = books[:limit]
    return BooksPage(
        items=items,
        next_cursor=_encode_cursor(items[-1]) if has_more else None,
        has_more=has_more,
    )


@router.get("/{book_id}", response_model=BookResponse, operation_id="getBook")
def get_book(book_id: int, db: DbSession, _: User = Depends(get_current_user)) -> Book:

    book = db.get(Book, book_id)

    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    return book


@router.post(
    "",
    response_model=BookResponse,
    status_code=status.HTTP_201_CREATED,
    operation_id="createBook",
)
def create_book(
    payload: BookCreate, db: DbSession, _: User = Depends(require_admin)
) -> Book:

    if db.scalar(select(Book).where(Book.isbn == payload.isbn)):
        raise HTTPException(status_code=409, detail="ISBN already exists")

    book = Book(**payload.model_dump())

    db.add(book)
    db.commit()
    db.refresh(book)

    return book


@router.put("/{book_id}", response_model=BookResponse, operation_id="updateBook")
def update_book(
    book_id: int, payload: BookCreate, db: DbSession, _: User = Depends(require_admin)
) -> Book:

    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    duplicate = db.scalar(
        select(Book).where(Book.isbn == payload.isbn, Book.id != book_id)
    )

    if duplicate:
        raise HTTPException(status_code=409, detail="ISBN already exists")

    for key, value in payload.model_dump().items():
        setattr(book, key, value)

    db.commit()
    db.refresh(book)

    return book


@router.patch("/{book_id}", response_model=BookResponse, operation_id="patchBook")
def patch_book(
    book_id: int, payload: BookUpdate, db: DbSession, _: User = Depends(require_admin)
) -> Book:
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    values = payload.model_dump(exclude_unset=True)
    if "isbn" in values:
        duplicate = db.scalar(
            select(Book).where(Book.isbn == values["isbn"], Book.id != book_id)
        )
        if duplicate:
            raise HTTPException(status_code=409, detail="ISBN already exists")

    for key, value in values.items():
        setattr(book, key, value)

    db.commit()
    db.refresh(book)
    return book


@router.delete(
    "/{book_id}", status_code=status.HTTP_204_NO_CONTENT, operation_id="deleteBook"
)
def delete_book(book_id: int, db: DbSession, _: User = Depends(require_admin)) -> None:

    book = db.get(Book, book_id)

    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Remove personal-shelf references first so no broken references
    # remain (works identically on SQLite and PostgreSQL).
    for entry in db.scalars(select(ShelfEntry).where(ShelfEntry.book_id == book_id)).all():
        db.delete(entry)

    db.delete(book)
    db.commit()
