#!/bin/sh
set -e

# Use PORT environment variable if set, otherwise default to 8000
PORT=${PORT:-8000}

# Start Gunicorn with dynamic port support
exec gunicorn -w 4 -b 0.0.0.0:$PORT --timeout 120 app.main:app

