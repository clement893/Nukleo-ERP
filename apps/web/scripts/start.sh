#!/bin/sh
set -e

# Use PORT from Railway environment, fallback to 3000
# Next.js standalone mode automatically uses process.env.PORT
PORT=${PORT:-3000}
export PORT

echo "Starting server on port $PORT..."

# Check if we're in standalone mode (server.js exists in /app)
# Use absolute paths to avoid cd command issues
if [ -f /app/server.js ]; then
  echo "Starting in standalone mode..."
  exec node /app/server.js "$@"
elif [ -f server.js ]; then
  echo "Starting in standalone mode (current directory)..."
  exec node server.js "$@"
else
  echo "Starting in development mode..."
  exec next start -p "$PORT" "$@"
fi

