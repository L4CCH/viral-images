# Docker Compose Usage Guide

This docker-compose setup allows you to run the backend and frontend services separately or together using **profiles**.

## Quick Start

### Run Both Services Together
```bash
docker-compose --profile full up
```

### Run Only Backend
```bash
docker-compose --profile backend up
```

### Run Only Frontend
```bash
docker-compose --profile frontend up
```

## Usage Examples

### Development Mode (with hot reload)
```bash
# Set DEV_MODE=true in .env file or export it
export DEV_MODE=true
docker-compose --profile full up
```

### Production Mode (without hot reload)
```bash
export DEV_MODE=false
docker-compose --profile full up
```

### Run in Background (Detached Mode)
```bash
docker-compose --profile full up -d
```

### Stop Services
```bash
docker-compose --profile full down
```

### View Logs
```bash
# All services
docker-compose --profile full logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Rebuild Services
```bash
# Rebuild all
docker-compose --profile full build

# Rebuild specific service
docker-compose build backend
docker-compose build frontend
```

## Environment Variables

Create a `.env` file in the project root (see `.env.example`):

- `BACKEND_PORT`: Backend API port (default: 8000)
- `FRONTEND_PORT`: Frontend port (default: 3000)
- `DEV_MODE`: Enable hot reload for backend (default: false)
- `NODE_ENV`: Node environment (development/production)
- `NEXT_PUBLIC_API_URL`: Backend API URL for frontend

## Profiles Explained

- **`full`**: Runs both backend and frontend
- **`backend`**: Runs only the backend service
- **`frontend`**: Runs only the frontend service

## Service Details

### Backend
- **Port**: 8000 (configurable via `BACKEND_PORT`)
- **Health Check**: Monitors `/` endpoint
- **Data**: Parquet file stored in named volume `viral-images-backend-data`
- **Hot Reload**: Enabled when `DEV_MODE=true`

### Frontend
- **Port**: 3000 (configurable via `FRONTEND_PORT`)
- **Health Check**: Monitors root endpoint
- **Hot Reload**: Always enabled in dev mode
- **Dependencies**: Waits for backend to be healthy (optional)

## Network

Services communicate via the `viral-images-network` bridge network.

## Volumes

- `backend_data`: Persists the processed parquet dataset
- Frontend code is mounted for development hot reload

## Troubleshooting

### Backend won't start
- Check if port 8000 is already in use
- Verify the parquet file exists in `/data/processed_dataset.parquet`
- Check logs: `docker-compose logs backend`

### Frontend can't connect to backend
- Ensure both services are on the same network
- Check `NEXT_PUBLIC_API_URL` environment variable
- Verify backend health: `curl http://localhost:8000/`

### Volume conflicts
- The backend volume mount is read-only (`:ro`) to prevent overwriting built files
- If you need to modify code, rebuild the image instead of mounting volumes

