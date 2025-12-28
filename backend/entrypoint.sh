#!/bin/sh
# Don't use set -e to allow graceful error handling

# Use PORT environment variable if set, otherwise default to 8000
# Railway automatically sets PORT to the port the service should listen on
PORT=${PORT:-8000}

echo "=========================================="
echo "Backend startup configuration:"
echo "PORT environment variable: ${PORT}"
echo "DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo 'yes' || echo 'no')"
echo "Environment: ${ENVIRONMENT:-development}"
echo "Python version: $(python --version 2>&1 || echo 'unknown')"
echo "Working directory: $(pwd)"
echo "=========================================="

# Verify Python and uvicorn are available
if ! command -v python >/dev/null 2>&1; then
    echo "ERROR: Python not found!"
    exit 1
fi

if ! python -c "import uvicorn" 2>/dev/null; then
    echo "ERROR: uvicorn not installed!"
    exit 1
fi

# Run database migrations before starting the server (non-blocking with timeout)
# Use timeout to prevent migrations from blocking startup indefinitely
if [ -n "$DATABASE_URL" ]; then
    echo "=========================================="
    echo "Running database migrations..."
    echo "=========================================="
    
    # Note: Alembic env.py handles URL conversion automatically
    # No need to modify DATABASE_URL here
    
    # Run migrations with timeout (60 seconds max) - don't fail if migrations fail
    # Use timeout command if available, otherwise run directly
    if command -v timeout >/dev/null 2>&1; then
        if timeout 60 alembic upgrade head 2>&1; then
            MIGRATION_STATUS="success"
        else
            MIGRATION_STATUS="timeout_or_failed"
        fi
    else
        # Fallback: run without timeout if timeout command not available
        if alembic upgrade head 2>&1; then
            MIGRATION_STATUS="success"
        else
            MIGRATION_STATUS="failed"
        fi
    fi
    
    if [ "$MIGRATION_STATUS" = "success" ]; then
        echo "✅ Database migrations completed successfully"
        
        # Ensure default theme exists after migrations (with timeout)
        echo "=========================================="
        echo "Ensuring default theme exists..."
        echo "=========================================="
        if command -v timeout >/dev/null 2>&1; then
            timeout 30 python scripts/create_default_theme.py 2>&1 || echo "⚠️  Could not ensure default theme (will be created on first API call)"
        else
            python scripts/create_default_theme.py 2>&1 || echo "⚠️  Could not ensure default theme (will be created on first API call)"
        fi
    else
        echo "⚠️  Database migrations failed, timed out, or skipped!"
        echo "This may be due to:"
        echo "  - Database connection issues"
        echo "  - Migration conflicts"
        echo "  - Missing database permissions"
        echo "  - Migration timeout (taking too long)"
        echo ""
        echo "Continuing startup anyway - the application will attempt to start."
        echo "Database operations may fail until migrations are resolved."
        echo "Migrations will be retried on next startup or can be run manually."
    fi
else
    echo "⚠️  Warning: DATABASE_URL not set, skipping migrations..."
    echo "The application will start but database operations may fail."
fi

# Start Uvicorn directly for FastAPI
# Railway will route traffic to this port
echo "=========================================="
echo "Starting Uvicorn on 0.0.0.0:$PORT..."
echo "=========================================="
echo "Application will be available at http://0.0.0.0:$PORT"
echo "Health check endpoint: http://0.0.0.0:$PORT/api/v1/health"
echo "=========================================="

# Use exec to replace shell process with uvicorn
# This ensures signals are properly handled
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --log-level info --access-log

