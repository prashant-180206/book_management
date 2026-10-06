"""Tests for My Shelf (favorites) and per-user reading status."""

from fastapi.testclient import TestClient

from conftest import auth_headers, login


def _books(client: TestClient, token: str) -> list:
    resp = client.get("/books", headers=auth_headers(token))
    assert resp.status_code == 200, resp.text
    return resp.json()


def test_add_list_remove_shelf_entry(client: TestClient) -> None:
    token = login(client, "reader@shelfwise.dev", "Reader123!")
    headers = auth_headers(token)
    book_id = _books(client, token)[0]["id"]

    add = client.post("/shelf", headers=headers, json={"book_id": book_id})
    assert add.status_code == 201, add.text
    assert add.json()["book_id"] == book_id
    assert add.json()["status"] == "want_to_read"
    # Book details come from the shared /books payload, not the entry.
    assert book_id in {b["id"] for b in _books(client, token)}

    listing = client.get("/shelf", headers=headers)
    assert listing.status_code == 200, listing.text
    assert [e["book_id"] for e in listing.json()] == [book_id]

    remove = client.delete(f"/shelf/{book_id}", headers=headers)
    assert remove.status_code == 204, remove.text

    listing = client.get("/shelf", headers=headers)
    assert listing.json() == []


def test_duplicate_favorite_is_rejected(client: TestClient) -> None:
    token = login(client, "reader@shelfwise.dev", "Reader123!")
    headers = auth_headers(token)
    book_id = _books(client, token)[0]["id"]

    assert client.post("/shelf", headers=headers, json={"book_id": book_id}).status_code == 201
    dup = client.post("/shelf", headers=headers, json={"book_id": book_id})
    assert dup.status_code == 409, dup.text


def test_shelf_requires_existing_book(client: TestClient) -> None:
    token = login(client, "reader@shelfwise.dev", "Reader123!")
    resp = client.post(
        "/shelf", headers=auth_headers(token), json={"book_id": 999999}
    )
    assert resp.status_code == 404, resp.text


def test_shelf_requires_auth(client: TestClient) -> None:
    assert client.get("/shelf").status_code in (401, 403)
    assert client.post("/shelf", json={"book_id": 1}).status_code in (401, 403)


def test_shelf_data_isolated_per_user(client: TestClient) -> None:
    token_a = login(client, "reader@shelfwise.dev", "Reader123!")
    token_b = login(client, "reader2@shelfwise.dev", "Reader123!")
    book_id = _books(client, token_a)[0]["id"]

    add = client.post(
        "/shelf", headers=auth_headers(token_a), json={"book_id": book_id}
    )
    assert add.status_code == 201, add.text

    other = client.get("/shelf", headers=auth_headers(token_b))
    assert other.status_code == 200, other.text
    assert other.json() == []

    # Other user cannot change or remove this entry.
    assert (
        client.patch(
            f"/shelf/{book_id}",
            headers=auth_headers(token_b),
            json={"status": "reading"},
        ).status_code
        == 404
    )
    assert client.delete(f"/shelf/{book_id}", headers=auth_headers(token_b)).status_code == 404


def test_reading_status_lifecycle_and_isolation(client: TestClient) -> None:
    token_a = login(client, "reader@shelfwise.dev", "Reader123!")
    token_b = login(client, "reader2@shelfwise.dev", "Reader123!")
    book_id = _books(client, token_a)[0]["id"]

    client.post("/shelf", headers=auth_headers(token_a), json={"book_id": book_id})
    client.post("/shelf", headers=auth_headers(token_b), json={"book_id": book_id})

    for status in ("reading", "finished", "want_to_read"):
        resp = client.patch(
            f"/shelf/{book_id}",
            headers=auth_headers(token_a),
            json={"status": status},
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == status

    # Other user's status is untouched.
    other = client.get("/shelf", headers=auth_headers(token_b))
    assert other.json()[0]["status"] == "want_to_read"

    bad = client.patch(
        f"/shelf/{book_id}",
        headers=auth_headers(token_a),
        json={"status": "abandoned"},
    )
    assert bad.status_code == 422, bad.text


def test_deleting_book_cleans_up_shelf_entries(client: TestClient) -> None:
    admin = login(client, "admin@shelfwise.dev", "Admin123!")
    reader = login(client, "reader@shelfwise.dev", "Reader123!")
    book_id = _books(client, reader)[0]["id"]

    assert (
        client.post("/shelf", headers=auth_headers(reader), json={"book_id": book_id}).status_code
        == 201
    )
    assert (
        client.delete(f"/books/{book_id}", headers=auth_headers(admin)).status_code == 204
    )

    listing = client.get("/shelf", headers=auth_headers(reader))
    assert listing.status_code == 200, listing.text
    assert listing.json() == []
