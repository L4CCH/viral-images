# Viral Images

This repository contains the code for the Viral Images project

## Docker Setup

### Unified backend + SPA (production-like)
Build and run the unified FastAPI container that also serves the statically exported Next.js app at `/`:

```bash
docker-compose --profile backend up --build
```

The app will be available at `http://localhost:${BACKEND_PORT:-8000}`.

### Frontend dev server (optional)
For local frontend development with hot reload, you can still run the standalone Next.js dev server:

```bash
docker-compose --profile frontend up --build
```

The dev server will be available at `http://localhost:${FRONTEND_PORT:-3000}` and will call the backend API at `/api`.