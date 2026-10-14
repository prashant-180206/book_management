"""Registration and reader/admin authorization tests."""

from fastapi.testclient import TestClient

from conftest import auth_headers, login


def _book_payload(**overrides) -> dict:
    payload = {
        "title": "Test Book",
        "author": "Test Author",
        "isbn": "9780000000001",
        "genre": "Fiction",
        "published_year": 2020,
        "description": "A test book.",
        "cover_color": "#000000",
    }
    payload.update(overrides)
    return payload


def test_signup_creates_reader_and_can_login(client: TestClient) -> None:
    signup = client.post(
        "/auth/signup",
        json={"email": "newreader@shelfwise.dev", "password": "Reader123!"},
    )
    assert signup.status_code == 201, signup.text
    assert signup.json()["user"]["role"] == "reader"

    token = login(client, "newreader@shelfwise.dev", "Reader123!")
    me = client.get("/auth/me", headers=auth_headers(token))
    assert me.status_code == 200, me.text
    assert me.json()["role"] == "reader"


def test_signup_cannot_grant_admin_role(client: TestClient) -> None:
    # The signup schema accepts no role field; even if one is sent it
    # must be ignored and the account stays a reader.
    signup = client.post(
        "/auth/signup",
        json={
            "email": "sneaky@shelfwise.dev",
            "password": "Reader123!",
            "role": "admin",
        },
    )
    assert signup.status_code == 201, signup.text
    assert signup.json()["user"]["role"] == "reader"


def test_signup_rejects_duplicate_and_weak_password(client: TestClient) -> None:
    dup = client.post(
        "/auth/signup",
        json={"email": "reader@shelfwise.dev", "password": "Reader123!"},
    )
    assert dup.status_code == 409, dup.text

    weak = client.post(
        "/auth/signup",
        json={"email": "weak@shelfwise.dev", "password": "short"},
    )
    assert weak.status_code == 422, weak.text


def test_reader_cannot_use_admin_book_apis(client: TestClient) -> None:
    reader = login(client, "reader@shelfwise.dev", "Reader123!")
    headers = auth_headers(reader)

    assert client.post("/books", headers=headers, json=_book_payload()).status_code == 403

    book_id = client.get("/books", headers=headers).json()["items"][0]["id"]
    assert (
        client.put(f"/books/{book_id}", headers=headers, json=_book_payload()).status_code
        == 403
    )
    assert client.delete(f"/books/{book_id}", headers=headers).status_code == 403

    # Readers can still read.
    assert client.get("/books", headers=headers).status_code == 200
    assert client.get(f"/books/{book_id}", headers=headers).status_code == 200


def test_unauthenticated_requests_are_rejected(client: TestClient) -> None:
    assert client.get("/books").status_code in (401, 403)
    assert client.post("/books", json=_book_payload()).status_code in (401, 403)


def test_admin_book_crud_round_trip(client: TestClient) -> None:
    admin = login(client, "admin@shelfwise.dev", "Admin123!")
    headers = auth_headers(admin)

    create = client.post(
        "/books", headers=headers, json=_book_payload(isbn="9780000000002")
    )
    assert create.status_code == 201, create.text
    book_id = create.json()["id"]

    dup = client.post(
        "/books", headers=headers, json=_book_payload(isbn="9780000000002")
    )
    assert dup.status_code == 409, dup.text

    update = client.put(
        f"/books/{book_id}",
        headers=headers,
        json=_book_payload(isbn="9780000000002", title="Updated Title"),
    )
    assert update.status_code == 200, update.text
    assert update.json()["title"] == "Updated Title"

    assert client.get(f"/books/{book_id}", headers=headers).status_code == 200
    assert client.delete(f"/books/{book_id}", headers=headers).status_code == 204
    assert client.get(f"/books/{book_id}", headers=headers).status_code == 404


def test_book_pagination_and_refresh_tokens(client: TestClient) -> None:
    login_response = client.post(
        "/auth/login",
        json={"email": "reader@shelfwise.dev", "password": "Reader123!"},
    )
    assert login_response.status_code == 200
    tokens = login_response.json()
    assert tokens["refresh_token"]

    refreshed = client.post(
        "/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert refreshed.status_code == 200
    assert refreshed.json()["access_token"]

    page = client.get(
        "/books",
        headers=auth_headers(tokens["access_token"]),
        params={"limit": 2},
    )
    assert page.status_code == 200
    assert len(page.json()["items"]) == 2
    assert page.json()["has_more"] is True
    next_page = client.get(
        "/books",
        headers=auth_headers(tokens["access_token"]),
        params={"limit": 2, "cursor": page.json()["next_cursor"]},
    )
    assert next_page.status_code == 200
    assert not {
        book["id"] for book in page.json()["items"]
    }.intersection(book["id"] for book in next_page.json()["items"])

    assert (
        client.get(
            "/books",
            headers=auth_headers(tokens["access_token"]),
            params={"cursor": page.json()["next_cursor"], "offset": 1},
        ).status_code
        == 400
    )
