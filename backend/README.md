# Shelfwise API

FastAPI service backing the Shelfwise client: JWT authentication with
reader/admin roles, book catalog CRUD with search, and a per-user
personal shelf with reading statuses.

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

- API: http://127.0.0.1:8000
- Docs: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/health

SQLite is the default database (`shelfwise.db`, auto-created and
seeded on startup). For PostgreSQL, set `DATABASE_URL`, e.g.
`postgresql+psycopg://user:password@host:5432/shelfwise`.

## Layout

- `app/main.py` — app, router wiring, startup seed
- `app/models.py` — `User`, `Book`, `ShelfEntry` (unique per user+book)
- `app/schemas.py` — request/response contracts, reading-status literal
- `app/routers/auth.py` — signup (always reader), login, me
- `app/routers/books.py` — CRUD; writes require admin; search covers
  title, author, genre, and ISBN; delete also clears shelf entries
- `app/routers/shelf.py` — list/add/update-status/remove for the
  authenticated user's own shelf (duplicate saves return 409)

## Tests

```powershell
.\.venv\Scripts\python.exe -m pytest tests/ -q
```

The suite runs against an isolated in-memory database and covers
health, the Discover shelf-filtering regression (two Fiction books
must both appear), favorites and reading-status isolation, signup and
role enforcement, and book CRUD. `test_shelf_flow.py` is a manual
walkthrough script to run against a live API.
