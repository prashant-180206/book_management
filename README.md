# Shelfwise

A full-stack book management app built with Expo (React Native Web) and FastAPI.

## Stack

- **Client:** Expo, React Native, React Native Web, TypeScript
- **API:** FastAPI, SQLAlchemy, Pydantic, JWT
- **Database:** SQLite by default; PostgreSQL/AWS RDS via `DATABASE_URL`
- **Operations:** Docker Compose, AWS App Runner/ECS-ready API container, Postman collection

## Run locally

### API

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

API docs: http://127.0.0.1:8000/docs

### Client

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npx expo start
```

Press `w` for desktop web, or scan the QR code with Expo Go for mobile.

## Demo users

On first API startup, the database seeds:

- `admin@shelfwise.dev` / `Admin123!` (admin)
- `reader@shelfwise.dev` / `Reader123!` (reader)

## RDS deployment

Set `DATABASE_URL` to a PostgreSQL connection string such as:

```text
postgresql+psycopg://user:password@your-rds-endpoint:5432/shelfwise
```

Set a strong `SECRET_KEY` in the deployment environment. The API exposes `/health` for load balancer checks.

## API workflow

1. `POST /auth/login` to receive a bearer token.
2. Send `Authorization: Bearer <token>` to `/books`.
3. Readers can browse; admins can create, update, and delete books.
4. Import `postman/Shelfwise.postman_collection.json` for a ready-made workflow.
