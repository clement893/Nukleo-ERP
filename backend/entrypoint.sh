#!/bin/sh
set -e

# Use PORT environment variable if set, otherwise default to 8000
PORT=${PORT:-8000}

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Start Gunicorn with Uvicorn workers (ASGI) for FastAPI
echo "Starting Gunicorn with Uvicorn workers on port $PORT..."
exec gunicorn -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:$PORT --timeout 120 app.main:app

