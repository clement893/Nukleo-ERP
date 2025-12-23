#!/bin/sh
set -e

# Use PORT environment variable if set, otherwise default to 8000
PORT=${PORT:-8000}

# Run database migrations (skip if DATABASE_URL is not set to avoid crashes)
if [ -n "$DATABASE_URL" ]; then
    echo "Running database migrations..."
    alembic upgrade head || echo "Warning: Database migrations failed, continuing anyway..."
else
    echo "Warning: DATABASE_URL not set, skipping migrations..."
fi

# Start Uvicorn directly for FastAPI
echo "Starting Uvicorn on port $PORT..."
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT --log-level info

