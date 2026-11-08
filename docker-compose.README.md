# Docker Compose Usage Guide

This docker-compose setup lets you run the backend and frontend services separately or together using **profiles**.

## Quick Start

```bash
docker compose --profile backend up --build    # API + static site on :8000
docker compose --profile frontend up --build   # Next.js dev server on :3000
docker compose --profile full up --build       # both
```

## Development

### Backend live reload
```bash
docker compose --profile backend watch
```
Changes under `src/backend/` are synced into the container and the service restarts. A change to `uv.lock` triggers an image rebuild.

### Frontend hot reload
The `frontend` profile mounts `src/frontend/` into the container and runs `next dev`. Set `NEXT_PUBLIC_API_BASE_PATH` (e.g. `http://localhost:8000/api`) in `src/frontend/.env.local`. The file is optional.

## Common commands
```bash
docker compose --profile full up -d        # detached
docker compose --profile full down         # stop
docker compose logs -f backend             # logs
docker compose --profile full build        # rebuild images
```

## Environment Variables

Set these in a `.env` file in the project root or in your shell:

- `BACKEND_PORT`: Host port for the backend (default: 8000)
- `FRONTEND_PORT`: Host port for the frontend dev server (default: 3000)

## Profiles

- **`backend`**: FastAPI API plus the statically exported frontend
- **`frontend`**: Next.js dev server only
- **`full`**: both services

## How the backend image is built

`src/backend/Dockerfile.backend` uses the repo root as its build context (filtered by the root `.dockerignore`) and has three stages:

1. **frontend-builder** (Node 24, pnpm): installs from `pnpm-lock.yaml` and runs `next build`, which writes a static export.
2. **preprocess** (Python 3.13, uv): installs the `preprocess` dependency group, downloads the Hugging Face datasets, and writes `processed_dataset.parquet`. Downloads are kept in a BuildKit cache, and this stage reruns only when `pyproject.toml`, `uv.lock` or `core/preprocess_dataset.py` changes.
3. **runtime**: Python 3.13 with only the runtime dependencies. It runs as a non-root user and serves the API at `/api` and the static site at `/`.

The dataset is baked into the image at `/data/processed_dataset.parquet`. No volume is mounted there, so a rebuild always ships the new dataset.

To force the dataset to be downloaded again, run `docker builder prune --filter type=exec.cachemount` or `docker compose build --no-cache backend`.

## Health check

The backend health check calls `GET /api/`. That endpoint returns dataset metadata, so the container is reported healthy only once the dataset has loaded.

## Troubleshooting

- **Backend won't start:** check whether port 8000 is in use, then check `docker compose logs backend`.
- **Frontend can't reach the API:** check `NEXT_PUBLIC_API_BASE_PATH` in `src/frontend/.env.local`, then run `curl http://localhost:8000/api/`.
- **Upgrading from the old setup:** remove the obsolete dataset volume with `docker volume rm viral-images-backend-data`.

## Production

The `backend` image is the same one deployed to AWS App Runner, built for linux/amd64. See [deploy/README.md](deploy/README.md).
