# Shelfwise

A minimal full-stack library management application for managing a shared book catalog and personal reading shelves.

Shelfwise supports role-based access for readers and administrators, book discovery, catalog management, personal reading status, and lightweight catalog analytics.

## Features

### Authentication & Roles
- JWT-based authentication
- Reader and Admin roles
- Reader registration
- Backend-enforced authorization
- Development/demo accounts

### Library
- Browse books
- Search by title, author, genre, and ISBN
- Genre filtering
- Sorting by recently added, title, author, and publication year
- Book details
- Discover Shelves
- Consistent genre filtering across the application

### Personal Shelf
- Save books to My Shelf
- Remove books from My Shelf
- Want to Read status
- Reading status
- Finished status
- Per-user shelf and reading state

### Administration
- Add books
- Edit books
- Delete books
- Cover color selection
- Catalog search and filtering
- Library statistics
- Books by genre
- Recently added books

### Reliability & Testing
- FastAPI backend
- OpenAPI-generated API hooks with Orval
- TanStack React Query
- Backend authorization
- Automated backend tests
- Shelf filtering regression tests
- Per-user shelf isolation tests
- CRUD and authentication tests
- TypeScript type checking

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native, React Native Web, Expo SDK 57, TypeScript |
| Routing | Expo Router |
| Styling | React Native StyleSheet, React Native Web, Vanilla CSS |
| Data Fetching | TanStack React Query v5 |
| API Client | Orval (OpenAPI-generated React Query hooks), Fetch API |
| Backend | FastAPI, Uvicorn, Python 3.12+ |
| ORM | SQLAlchemy 2.0 |
| Validation | Pydantic v2, Pydantic Settings |
| Authentication | JWT (python-jose), Passlib (bcrypt) |
| Database | SQLite (default), PostgreSQL (via psycopg 3) |
| Infrastructure | Docker, Docker Compose |

## Architecture

```text
Frontend (Expo / React Native Web)
  └── TanStack React Query
        └── Orval-generated API hooks
              └── FastAPI
                    └── SQLAlchemy
                          └── SQLite / PostgreSQL
```

- **OpenAPI Code Generation**: The frontend API hooks and TypeScript schemas are automatically generated from the backend's OpenAPI contract (`/openapi.json`) using Orval.
- **Server State & Cache Invalidation**: TanStack React Query manages remote data caching, background re-validation, and targeted query cache invalidation after create, update, and delete mutations.

## Project Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py          # Signup, registration, login, and current user routes
│   │   │   ├── books.py         # Book CRUD and search (admin-restricted writes)
│   │   │   └── shelf.py         # Personal shelf and reading status routes
│   │   ├── config.py            # Pydantic Settings configuration
│   │   ├── database.py          # SQLAlchemy engine and session factory
│   │   ├── deps.py              # Dependency injection for DB session and auth
│   │   ├── main.py              # FastAPI app instance, CORS, lifespan startup seed
│   │   ├── models.py            # SQLAlchemy models (User, Book, ShelfEntry)
│   │   ├── schemas.py           # Pydantic request and response schemas
│   │   ├── security.py          # Password hashing and JWT helpers
│   │   └── seed.py              # Initial demo users and starter book catalog
│   ├── tests/
│   │   ├── conftest.py          # Pytest fixtures and isolated in-memory DB setup
│   │   ├── test_auth_roles.py   # Authentication and role authorization tests
│   │   ├── test_health.py       # Health check endpoint test
│   │   ├── test_my_shelf.py     # Personal shelf isolation and lifecycle tests
│   │   └── test_shelf_filtering.py # Discover shelves and search regression tests
│   ├── .env.example             # Backend environment variable template
│   ├── Dockerfile               # Production-ready backend Dockerfile
│   ├── pyproject.toml           # Python project metadata
│   ├── pytest.ini               # Pytest configuration
│   ├── requirements.txt         # Pinned Python package dependencies
│   └── test_shelf_flow.py       # Standalone script for live shelf flow checks
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── generated/       # Orval-generated API client and React Query hooks
│   │   │   └── utils.ts         # API error message normalization
│   │   ├── app/                 # Expo Router screens
│   │   │   ├── _layout.tsx      # Root provider wrapper and layout navigation
│   │   │   ├── index.tsx        # Library catalog view (search, filter, sort)
│   │   │   ├── explore.tsx      # Discover Shelves directory view
│   │   │   ├── my-shelf.tsx     # Personal shelf view with reading statuses
│   │   │   ├── analytics.tsx    # Admin catalog statistics and metrics
│   │   │   ├── book/
│   │   │   │   └── [id].tsx     # Book details view
│   │   │   ├── shelf/
│   │   │   │   └── [genre].tsx  # Shelf deep-link route
│   │   │   ├── sign-in.tsx      # Sign-in authentication screen
│   │   │   └── sign-up.tsx      # Reader registration screen
│   │   ├── components/          # Reusable UI components (BookCard, modals, top nav)
│   │   ├── constants/           # Colors and styling tokens
│   │   ├── hooks/               # Custom utility hooks
│   │   ├── providers/           # Context providers (Auth, TanStack Query)
│   │   ├── services/            # Storage and API utilities
│   │   └── utils/
│   │       └── genres.ts        # Canonical genre normalization and aggregation
│   ├── .env.example             # Frontend environment variable template
│   ├── app.json                 # Expo project configuration
│   ├── orval.config.ts          # Orval generation config targeting /openapi.json
│   ├── package.json             # Node dependencies and NPM scripts
│   └── tsconfig.json            # TypeScript configuration
├── .env.example                 # Root environment variable template
└── docker-compose.yml           # Multi-container setup (FastAPI + PostgreSQL)
```

## Getting Started

### Prerequisites

- **Python**: 3.12+ (tested with Python 3.13)
- **Node.js**: 20+
- **Package Manager**: npm (or pnpm)
- **Docker**: Optional (required only for PostgreSQL multi-container run)

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv .venv
   ```
3. Activate the virtual environment:
   - On Windows (PowerShell):
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   - On macOS/Linux:
     ```bash
     source .venv/bin/activate
     ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env`)*
6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```

- API Base URL: `http://127.0.0.1:8000`
- Interactive API Documentation: `http://127.0.0.1:8000/docs`

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start
   ```
4. Run the web application:
   - Press `w` in the terminal to launch the web client in your default browser, or run:
     ```bash
     npx expo start --web
     ```

## Environment Variables

### Backend Configuration

The backend reads configuration using Pydantic Settings from `.env` in the `backend/` directory or system environment:

```env
DATABASE_URL=sqlite:///./shelfwise.db
SECRET_KEY=replace-this-with-a-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:8081,http://localhost:19006
```

- `DATABASE_URL`: Connection URL for the database. Defaults to SQLite file `sqlite:///./shelfwise.db`. Supports PostgreSQL connection URLs (e.g., `postgresql+psycopg://user:password@host:5432/dbname`).
- `SECRET_KEY`: Secret key used for signing JWT access tokens.
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Lifespan of issued JWT access tokens in minutes (default: `60`).
- `CORS_ORIGINS`: Comma-separated list of allowed frontend origin URLs.

### Frontend Configuration

The frontend reads configuration from `.env` in the `frontend/` directory:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
```

- `EXPO_PUBLIC_API_URL`: Base URL of the backend FastAPI service accessible by the client application.

## Demo Accounts

On initial startup, Shelfwise automatically seeds two demonstration accounts into the database:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@shelfwise.dev` | `Admin123!` |
| Reader | `reader@shelfwise.dev` | `Reader123!` |

> These credentials are for local development and demonstration only.

Readers can also self-register at any time from the sign-up interface.

## API

### Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Authenticates credentials and returns a JWT access token and user profile |
| `POST` | `/auth/register` | Public | Registers a new reader account and returns an access token (`/auth/signup` supported) |
| `GET` | `/auth/me` | Authenticated | Retrieves the profile of the currently authenticated user |

### Books

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/books` | Authenticated | Returns the book catalog; supports optional `?search=` filtering across title, author, genre, and ISBN |
| `GET` | `/books/{id}` | Authenticated | Retrieves detailed information for a specific book |
| `POST` | `/books` | Admin | Creates a new book entry in the catalog |
| `PUT` | `/books/{id}` | Admin | Replaces an existing book's details |
| `PATCH` | `/books/{id}` | Admin | Partially updates specified fields of an existing book |
| `DELETE` | `/books/{id}` | Admin | Deletes a book and removes all associated shelf entries |

### Personal Shelf

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/shelf` | Authenticated | Retrieves personal shelf entries for the authenticated user |
| `POST` | `/shelf` | Authenticated | Adds a book to the personal shelf (default status: `want_to_read`; returns `409` if already saved) |
| `PATCH` | `/shelf/{book_id}` | Authenticated | Updates reading status (`want_to_read`, `reading`, `finished`) for a saved book |
| `DELETE` | `/shelf/{book_id}` | Authenticated | Removes a book from the user's personal shelf |

### System

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Returns service health status (`{"status": "ok", "service": "shelfwise-api"}`) |

## Testing

Backend tests run using `pytest` against an isolated in-memory SQLite database.

Run the test suite:

```bash
pytest tests/
```

*(On Windows using the project virtual environment: `.\.venv\Scripts\python.exe -m pytest tests/`)*

The test suite contains **20 verified automated tests** covering:
- **Authentication**: JWT token generation, invalid credential rejection, token expiration handling
- **Role Authorization**: Role-based access enforcement (reader vs. admin boundaries)
- **Book CRUD**: Creation, reading, updating, duplicate ISBN prevention, and deletion
- **Shelf Filtering Regression**: Discover shelf counts and contents staying synchronized across mutations
- **Shelf Isolation**: Strict per-user isolation of saved books and reading statuses
- **Reading Status**: Lifecycle transitions between `want_to_read`, `reading`, and `finished`
- **Shelf Cleanup After Book Deletion**: Automatic cleanup of shelf entries when a book is deleted from the catalog
- **ISBN Search**: Exact and partial search queries across ISBN, title, author, and genre
- **Registration**: Reader account creation and restriction from claiming admin privileges

Frontend verification:
```bash
# Type checking
cd frontend
npx tsc --noEmit
```

## Development

- **OpenAPI Schema**: FastAPI automatically exposes the full OpenAPI specification at `/openapi.json`.
- **Code Generation**: Orval reads `/openapi.json` to generate TypeScript types and TanStack React Query hooks.
  ```bash
  cd frontend
  npm run api:generate
  ```
- **Generated Client**: Generated code resides under `frontend/src/api/generated/`. Do not edit these files manually.
- **Server State Management**: TanStack React Query manages caching and invalidates relevant queries on mutations.
- **Shared Genre Utilities**: `frontend/src/utils/genres.ts` provides a single source of truth for normalizing and deriving genre lists across Explore, Library, and Analytics.

Prefer existing generated API hooks over creating duplicate manual API wrappers.

## Design Principles

Shelfwise intentionally follows a design direction that is:
- **minimal**
- **editorial**
- **library-focused**
- **professional**
- **accessible**
- **functional**

The interface prioritizes reading clarity, typographic hierarchy, and structural consistency over decorative effects.

## Docker

Docker Compose provides an optional local multi-container environment running the FastAPI application against PostgreSQL.

To start all services:

```bash
docker compose up --build
```

Services started:
- `api`: FastAPI application container built from `backend/Dockerfile`, exposed on port `8000`.
- `db`: PostgreSQL 16 container (`postgres:16-alpine`), exposed on port `5432`, with persistent data volume `shelfwise-data` and health checking.

Docker is optional; the project can be run locally using SQLite without Docker.

## API Documentation

FastAPI provides interactive API documentation when the backend server is running:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

## Security Notes

- Never commit `.env` files or credentials to version control.
- Configure a strong, cryptographically secure `SECRET_KEY` in production environments.
- Seed demo credentials are intended for local development only.
- Authorization checks are strictly enforced by backend dependencies; reader tokens cannot execute administrative endpoints.
- Readers cannot escalate privileges during registration or manipulate other users' shelf data.

## Roadmap

- Cursor-based or page-based pagination for larger book catalogs
- Book cover image uploads and storage integration
- Automated CI/CD deployment pipelines

## License

The root repository does not currently specify an open-source license. The frontend template includes an MIT License (`frontend/LICENSE`).

## Contributing

1. Create a branch for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make focused changes conforming to existing code style.
3. Run tests and type checks:
   ```bash
   pytest tests/
   npx tsc --noEmit
   ```
4. Open a pull request with a clear description of changes.
