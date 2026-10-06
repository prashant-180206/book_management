from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select

from ..deps import DbSession, get_current_user, require_admin
from ..models import Book, ShelfEntry, User
from ..schemas import BookCreate, BookResponse, BookUpdate

router = APIRouter(prefix="/books", tags=["Books"])


@router.get("", response_model=list[BookResponse], operation_id="listBooks")
def list_books(
    db: DbSession,
    _: User = Depends(get_current_user),
    search: str | None = Query(default=None),
) -> list[Book]:

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

    return list(db.scalars(query).all())


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
