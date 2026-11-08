# Viral Images

This repository contains the code for the Viral Images project

## Docker Setup

### Unified backend + SPA (production-like)
Build and run the unified FastAPI container that also serves the statically exported Next.js app at `/`:

```bash
docker compose --profile backend up --build
```

The app will be available at `http://localhost:${BACKEND_PORT:-8000}`.

### Frontend dev server (optional)
For local frontend development with hot reload, you can still run the standalone Next.js dev server:

```bash
docker compose --profile frontend up --build
```

The dev server will be available at `http://localhost:${FRONTEND_PORT:-3000}`. It calls the API at `NEXT_PUBLIC_API_BASE_PATH`, set in `src/frontend/.env.local` (for example `http://localhost:8000/api`).

See [docker-compose.README.md](docker-compose.README.md) for more options.

## Local development (without Docker)

### Backend (Python 3.13, [uv](https://docs.astral.sh/uv/))
```bash
cd src/backend
uv sync                                  # runtime deps
uv run --group preprocess python core/preprocess_dataset.py   # builds processed_dataset.parquet
uv run uvicorn main:app --reload
```
Dependencies are declared in `pyproject.toml` and locked in `uv.lock`. Use `uv add <pkg>` to add one and `uv lock --upgrade` to upgrade.

### Frontend (Node 24, pnpm)
```bash
cd src/frontend
corepack enable
pnpm install
pnpm dev       # dev server
pnpm lint      # ESLint
pnpm build     # static export to out/
```

## Deployment

Production runs on AWS App Runner at https://viral-images.org. Deploy from your machine with `deploy/deploy-apprunner.sh`, which builds a linux/amd64 image, pushes it to ECR and starts the App Runner deployment. See [deploy/README.md](deploy/README.md).
