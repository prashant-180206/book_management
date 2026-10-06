"""Regression tests for the Discover shelf filtering bug.

The Explore page derives both the per-genre count and the shelf book
list from the same /books payload. These tests assert the backend
contract that makes that possible, plus the add/edit/delete flows
that keep counts and contents in sync.
"""

from fastapi.testclient import TestClient

from conftest import auth_headers, login


def _books(client: TestClient, token: str) -> list:
    resp = client.get("/books", headers=auth_headers(token))
    assert resp.status_code == 200, resp.text
    return resp.json()


def _in_genre(books: list, genre: str) -> list:
    key = genre.strip().lower()
    return [b for b in books if (b.get("genre") or "").strip().lower() == key]


def test_fiction_shelf_returns_both_books(client: TestClient) -> None:
    """Given two Fiction books, the Fiction shelf shows both (not one)."""
    token = login(client, "reader@shelfwise.dev", "Reader123!")
    books = _books(client, token)

    # Directory count and shelf contents come from the same payload.
    fiction = _in_genre(books, "Fiction")
    assert len(fiction) == 2
    titles = {b["title"] for b in fiction}
    assert titles == {
        "Tomorrow, and Tomorrow, and Tomorrow",
        "Klara and the Sun",
    }


def test_design_and_self_growth_single_book_shelves(client: TestClient) -> None:
    token = login(client, "reader@shelfwise.dev", "Reader123!")
    books = _books(client, token)
    assert len(_in_genre(books, "Design")) == 1
    assert len(_in_genre(books, "Self-growth")) == 1


def test_add_book_to_existing_genre_updates_shelf(client: TestClient) -> None:
    admin = login(client, "admin@shelfwise.dev", "Admin123!")
    before = _in_genre(_books(client, admin), "Fiction")
    assert len(before) == 2

    create = client.post(
        "/books",
        headers=auth_headers(admin),
        json={
            "title": "Project Hail Mary",
            "author": "Andy Weir",
            "isbn": "9780593135204",
            "genre": "Fiction",
            "published_year": 2021,
            "description": "A lone astronaut saves the Earth.",
            "cover_color": "#4A6FA5",
        },
    )
    assert create.status_code == 201, create.text

    # Simulate React Query refetch after invalidation: fresh GET.
    after = _in_genre(_books(client, admin), "Fiction")
    assert len(after) == len(before) + 1
    assert "Project Hail Mary" in {b["title"] for b in after}


def test_edit_book_genre_moves_it_between_shelves(client: TestClient) -> None:
    admin = login(client, "admin@shelfwise.dev", "Admin123!")
    books = _books(client, admin)
    target = next(b for b in books if b["title"] == "Klara and the Sun")

    payload = {**target, "genre": "Design"}
    payload.pop("id", None)
    payload.pop("created_at", None)
    update = client.put(
        f"/books/{target['id']}", headers=auth_headers(admin), json=payload
    )
    assert update.status_code == 200, update.text

    fresh = _books(client, admin)
    assert len(_in_genre(fresh, "Fiction")) == 1
    assert len(_in_genre(fresh, "Design")) == 2
    assert "Klara and the Sun" in {b["title"] for b in _in_genre(fresh, "Design")}


def test_delete_book_updates_shelf_count_and_contents(client: TestClient) -> None:
    admin = login(client, "admin@shelfwise.dev", "Admin123!")
    books = _books(client, admin)
    target = next(b for b in books if b["title"] == "Klara and the Sun")

    delete = client.delete(f"/books/{target['id']}", headers=auth_headers(admin))
    assert delete.status_code == 204, delete.text

    fresh = _books(client, admin)
    fiction = _in_genre(fresh, "Fiction")
    assert len(fiction) == 1
    assert "Klara and the Sun" not in {b["title"] for b in fiction}


def test_search_finds_title_author_genre_and_isbn(client: TestClient) -> None:
    token = login(client, "reader@shelfwise.dev", "Reader123!")

    for term, expected in [
        ("Atomic", ["Atomic Habits"]),
        ("Clear", ["Atomic Habits"]),
        ("Design", ["The Design of Everyday Things"]),
        ("9780735211292", ["Atomic Habits"]),
    ]:
        resp = client.get(
            "/books", headers=auth_headers(token), params={"search": term}
        )
        assert resp.status_code == 200, resp.text
        titles = [b["title"] for b in resp.json()]
        assert titles == expected, f"search={term!r}"
