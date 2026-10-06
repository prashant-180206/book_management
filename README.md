# Shelfwise

A full-stack personal library manager. Browse and search a shared book
catalog, explore genre shelves, keep a personal shelf with reading
statuses, and (as an admin) manage the catalog and view catalog analytics.

Built with **Expo (React Native / Web)** + **FastAPI**, sharing one
OpenAPI contract via an **Orval-generated** TypeScript client backed by
**TanStack React Query**.

## Features

**Everyone (authenticated)**
- Library catalog with search across title, author, genre, and ISBN
- Genre filtering and sorting (recent, title A–Z/Z–A, author A–Z, newest published)
- Discover shelves — genre directory where every shelf count and every
  shelf listing come from the same books query (no hardcoded counts)
- Book detail pages with cover, metadata, and description
- My Shelf — save books to a personal shelf persisted per user in the database
- Reading statuses per saved book: Want to Read / Reading / Finished,
  with status filtering on My Shelf
- Registration (new accounts are always readers) plus demo quick-login

**Admins**
- Add, edit, and delete books (with confirmation on delete)
- Catalog analytics derived live from the database: totals, books by
  genre, recently added
- Changing a book's genre moves it between shelves immediately;
  deleting a book removes it everywhere, including saved shelves

**Platform**
- JWT authentication, role enforcement on the backend (reader vs admin)
- SQLite by default, PostgreSQL via `DATABASE_URL`
- Health endpoint for load-balancer checks, interactive API docs
- 20 automated backend tests (auth, roles, shelf regression, favorites, CRUD)

## Tech stack

| Layer    | Technology                                                  |
|----------|-------------------------------------------------------------|
| Client   | Expo 57, React Native, React Native Web, TypeScript, Expo Router |
| Data     | TanStack React Query, Orval-generated hooks (`src/api/generated`) |
| API      | FastAPI, Pydantic, SQLAlchemy, JWT (python-jose), bcrypt     |
| Database | SQLite (default) / PostgreSQL                               |
| Ops      | Docker Compose, API container with `/health` checks          |

## Project structure

```text
backend/
  app/
    main.py          # FastAPI app, router wiring, lifespan seed
    models.py        # User, Book, ShelfEntry
    schemas.py       # Pydantic contracts (incl. reading statuses)
    routers/
      auth.py        # signup, login, me
      books.py       # book CRUD + search (admin-guarded writes)
      shelf.py       # personal shelf: list/add/status/remove
    security.py deps.py config.py database.py seed.py
  tests/             # pytest suite (isolated in-memory DB)
  test_shelf_flow.py # manual end-to-end shelf verification script
frontend/
  src/
    app/             # Expo Router screens: library, explore, shelf,
                     # my-shelf, analytics, book detail, auth
    api/generated/   # Orval client — do not edit by hand
    components/      # BookCard, modals, nav, page, status control
    utils/genres.ts  # single genre-matching rule used everywhere
```

## Run locally

Prerequisites: Python 3.13+, Node 20+.

### 1. API

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

- API: http://127.0.0.1:8000
- Interactive docs: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/health

### 2. Client

```powershell
cd frontend
npm install
# point the client at the API (create .env if missing):
# EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
npx expo start
```

Press `w` for desktop web, or scan the QR code with Expo Go for mobile.

### 3. Sign in

On first API startup the database seeds two demo accounts:

| Role  | Email                | Password   |
|-------|----------------------|------------|
| Admin | admin@shelfwise.dev  | Admin123!  |
| Reader| reader@shelfwise.dev | Reader123! |

You can also register a new reader from the sign-up screen.

## API reference

| Method | Endpoint               | Auth  | Description                              |
|--------|------------------------|-------|------------------------------------------|
| POST   | `/auth/signup`         | —     | Register (always creates a reader)       |
| POST   | `/auth/login`          | —     | Returns `access_token` + user            |
| GET    | `/auth/me`             | User  | Current user                             |
| GET    | `/books?search=`       | User  | List books (title/author/genre/ISBN)     |
| POST   | `/books`               | Admin | Create book                              |
| GET    | `/books/{id}`          | User  | Book details                             |
| PUT    | `/books/{id}`          | Admin | Replace book                             |
| PATCH  | `/books/{id}`          | Admin | Partial update                           |
| DELETE | `/books/{id}`          | Admin | Delete book (+ its shelf entries)        |
| GET    | `/shelf`               | User  | Own saved books                          |
| POST   | `/shelf`               | User  | Save book (`409` if already saved)       |
| PATCH  | `/shelf/{book_id}`     | User  | Set reading status                       |
| DELETE | `/shelf/{book_id}`     | User  | Remove from shelf                        |
| GET    | `/health`              | —     | Service status                           |

## Testing & quality

```powershell
# backend: full suite (20 tests)
cd backend
.\.venv\Scripts\python.exe -m pytest tests/ -q

# backend: manual shelf walkthrough against a running API
.\.venv\Scripts\python.exe test_shelf_flow.py

# frontend: typecheck + lint
cd frontend
npx tsc --noEmit
npx expo lint
```

Regenerate the API client after backend contract changes (API must be
running so Orval can read `/openapi.json`):

```powershell
cd frontend
npm run api:generate
```

## Deployment notes

- Set `DATABASE_URL` to PostgreSQL for production, e.g.
  `postgresql+psycopg://user:password@host:5432/shelfwise`
- Set a strong `SECRET_KEY`; expose `/health` to the load balancer
- `docker-compose.yml` runs the API against PostgreSQL locally:
  `docker compose up --build`
