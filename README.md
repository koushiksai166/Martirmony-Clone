
# Matrimony application

## Local Docker development

Copy `.env.example` to `.env` at the repository root and replace both JWT secrets before starting the stack:

```powershell
docker compose up --build
```

The frontend is available at `http://localhost:8080`, the API at `http://localhost:5001`, Swagger at `http://localhost:5001/api`, and Postgres is exposed on port `5433`.

Compose waits for Postgres readiness and runs `prisma migrate deploy` before starting the backend. Keep `.env` files out of Git.

## Manual development

Install dependencies in both `backend` and `frontend`, configure `backend/.env`, then run `npm run start:dev` and `npm run dev` from their respective directories.
