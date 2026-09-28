from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Book, User
from .security import hash_password


def seed_database(db: Session) -> None:
    if not db.scalar(select(User).where(User.email == "admin@shelfwise.dev")):
        db.add_all([
            User(email="admin@shelfwise.dev", password_hash=hash_password("Admin123!"), role="admin"),
            User(email="reader@shelfwise.dev", password_hash=hash_password("Reader123!"), role="reader"),
        ])
    if not db.scalar(select(Book)):
        db.add_all([
            Book(title="The Design of Everyday Things", author="Don Norman", isbn="9780465050659", genre="Design", published_year=2013, description="A practical look at how thoughtful design shapes the way we move through the world.", cover_color="#E58F65"),
            Book(title="Tomorrow, and Tomorrow, and Tomorrow", author="Gabrielle Zevin", isbn="9780593321201", genre="Fiction", published_year=2022, description="A sweeping story about friendship, creativity, and the games we play across a lifetime.", cover_color="#6D8B74"),
            Book(title="Atomic Habits", author="James Clear", isbn="9780735211292", genre="Self-growth", published_year=2018, description="An accessible framework for building better habits through small, consistent changes.", cover_color="#C96B54"),
        ])
    db.commit()
