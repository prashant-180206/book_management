"""Shared fixtures: isolated in-memory DB with seeded users and books."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Book, User
from app.security import hash_password


def _seed(db) -> dict:
    admin = User(
        email="admin@shelfwise.dev",
        password_hash=hash_password("Admin123!"),
        role="admin",
    )
    reader = User(
        email="reader@shelfwise.dev",
        password_hash=hash_password("Reader123!"),
        role="reader",
    )
    reader2 = User(
        email="reader2@shelfwise.dev",
        password_hash=hash_password("Reader123!"),
        role="reader",
    )
    db.add_all([admin, reader, reader2])
    db.flush()
    books = [
        Book(
            title="Tomorrow, and Tomorrow, and Tomorrow",
            author="Gabrielle Zevin",
            isbn="9780593321201",
            genre="Fiction",
            published_year=2022,
            description="Friendship and creativity.",
            cover_color="#6D8B74",
        ),
        Book(
            title="Klara and the Sun",
            author="Kazuo Ishiguro",
            isbn="9780593318171",
            genre="Fiction",
            published_year=2021,
            description="An Artificial Friend watches the world.",
            cover_color="#7FA6A3",
        ),
        Book(
            title="The Design of Everyday Things",
            author="Don Norman",
            isbn="9780465050659",
            genre="Design",
            published_year=2013,
            description="Thoughtful design.",
            cover_color="#E58F65",
        ),
        Book(
            title="Atomic Habits",
            author="James Clear",
            isbn="9780735211292",
            genre="Self-growth",
            published_year=2018,
            description="Small consistent changes.",
            cover_color="#C96B54",
        ),
    ]
    db.add_all(books)
    db.commit()
    return {"admin": admin, "reader": reader, "reader2": reader2}


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    with TestingSession() as db:
        _seed(db)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=engine)


def login(client: TestClient, email: str, password: str) -> str:
    resp = client.post("/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
