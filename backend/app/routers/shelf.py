from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from ..deps import DbSession, get_current_user
from ..models import Book, ShelfEntry, User
from ..schemas import ShelfAddRequest, ShelfEntryResponse, ShelfStatusUpdate

router = APIRouter(prefix="/shelf", tags=["Shelf"])


@router.get("", response_model=list[ShelfEntryResponse], operation_id="listShelf")
def list_shelf(db: DbSession, user: User = Depends(get_current_user)) -> list[ShelfEntry]:
    # Book details are joined client-side from the shared /books query,
    # so saved books always reflect the current catalog.
    return list(
        db.scalars(
            select(ShelfEntry)
            .where(ShelfEntry.user_id == user.id)
            .order_by(ShelfEntry.created_at.desc())
        ).all()
    )


@router.post(
    "",
    response_model=ShelfEntryResponse,
    status_code=status.HTTP_201_CREATED,
    operation_id="addToShelf",
)
def add_to_shelf(
    payload: ShelfAddRequest, db: DbSession, user: User = Depends(get_current_user)
) -> ShelfEntry:
    book = db.get(Book, payload.book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    existing = db.scalar(
        select(ShelfEntry).where(
            ShelfEntry.user_id == user.id, ShelfEntry.book_id == payload.book_id
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="Book is already on your shelf")

    entry = ShelfEntry(user_id=user.id, book_id=payload.book_id, status="want_to_read")
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.patch("/{book_id}", response_model=ShelfEntryResponse, operation_id="updateShelfStatus")
def update_shelf_status(
    book_id: int,
    payload: ShelfStatusUpdate,
    db: DbSession,
    user: User = Depends(get_current_user),
) -> ShelfEntry:
    entry = db.scalar(
        select(ShelfEntry).where(
            ShelfEntry.user_id == user.id, ShelfEntry.book_id == book_id
        )
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Book is not on your shelf")

    entry.status = payload.status
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT, operation_id="removeFromShelf")
def remove_from_shelf(
    book_id: int, db: DbSession, user: User = Depends(get_current_user)
) -> None:
    entry = db.scalar(
        select(ShelfEntry).where(
            ShelfEntry.user_id == user.id, ShelfEntry.book_id == book_id
        )
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Book is not on your shelf")

    db.delete(entry)
    db.commit()
