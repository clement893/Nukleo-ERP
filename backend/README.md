# Backend - FastAPI + SQLAlchemy

Backend for MODELE-NEXTJS-FULLSTACK built with FastAPI and SQLAlchemy.

## Features

- FastAPI web framework
- SQLAlchemy ORM with async support
- JWT authentication
- PostgreSQL database
- Redis caching
- Celery for async tasks
- Comprehensive test suite with pytest
- Docker support
- Railway deployment ready

## Installation

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Redis 7+

### Setup

1. Create virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create `.env` file:

```bash
cp .env.example .env
```

4. Update environment variables in `.env`

## Running Locally

### With Docker Compose

```bash
docker-compose up
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend on port 8000
- Celery worker

### Without Docker

1. Start PostgreSQL and Redis

2. Run migrations:

```bash
alembic upgrade head
```

3. Start the development server:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

4. Start Celery worker (in another terminal):

```bash
celery -A app.celery_app worker --loglevel=info
```

## API Documentation

Once the server is running, visit:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── api/              # API endpoints
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic
│   ├── tasks/            # Celery tasks
│   ├── core/             # Security and config
│   ├── database.py       # Database configuration
│   ├── dependencies.py   # FastAPI dependencies
│   ├── celery_app.py     # Celery configuration
│   └── main.py           # FastAPI application
├── tests/                # Test suite
├── alembic/              # Database migrations
│   ├── versions/         # Migration files
│   ├── env.py           # Alembic environment
│   └── script.py.mako   # Migration template
├── requirements.txt      # Python dependencies
├── Dockerfile            # Docker image
├── .env.example          # Environment template
└── README.md
```

## Database Migrations

### Create a migration

```bash
alembic revision --autogenerate -m "Add new table"
```

### Apply migrations

```bash
alembic upgrade head
```

### Rollback migrations

```bash
alembic downgrade -1
```

## Testing

Run tests:

```bash
pytest
```

Run tests with coverage:

```bash
pytest --cov=app --cov-report=html
```

## Code Quality

### Linting

```bash
ruff check .
```

### Formatting

```bash
ruff format .
```

### Type checking

```bash
mypy app
```

## Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token

### Users

- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update current user
- `GET /api/users/{user_id}` - Get user by ID
- `GET /api/users` - List all users
- `DELETE /api/users/{user_id}` - Delete user

### Resources

- `GET /api/resources` - List resources
- `POST /api/resources` - Create resource
- `GET /api/resources/{resource_id}` - Get resource
- `PUT /api/resources/{resource_id}` - Update resource
- `DELETE /api/resources/{resource_id}` - Delete resource

### Upload

- `POST /api/upload/file` - Upload file
- `GET /api/upload/{file_id}` - Get file
- `DELETE /api/upload/{file_id}` - Delete file

### Health

- `GET /health` - Health check
- `GET /api/health` - API health check

## Deployment

### Railway

1. Push to GitHub
2. Connect Railway to GitHub repository
3. Set environment variables in Railway dashboard
4. Deploy

Environment variables needed:

```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SECRET_KEY=your-secret-key
FRONTEND_URL=https://your-frontend-url
```

## Contributing

1. Create a feature branch
2. Make changes
3. Run tests and linting
4. Submit PR

## License

MIT
