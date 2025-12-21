# MODELE-NEXTJS-FULLSTACK

A production-ready full-stack template with Next.js 16 frontend and FastAPI backend.

## 🎯 Features

### Frontend (Next.js 16)
- ✅ Next.js 16 with App Router
- ✅ React 19
- ✅ TypeScript 5
- ✅ Tailwind CSS 3
- ✅ Zustand state management
- ✅ JWT authentication
- ✅ Responsive design
- ✅ API integration

### Backend (FastAPI)
- ✅ FastAPI web framework
- ✅ SQLAlchemy ORM with async support
- ✅ PostgreSQL database
- ✅ JWT authentication
- ✅ Redis caching
- ✅ Celery for async tasks
- ✅ Comprehensive test suite
- ✅ Auto-generated API documentation

### DevOps
- ✅ Docker & Docker Compose
- ✅ Railway deployment ready
- ✅ GitHub Actions CI/CD
- ✅ Environment configuration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose (optional)

### Development Setup

1. Clone the repository:

```bash
git clone https://github.com/clement893/MODELE-NEXTJS-FULLSTACK.git
cd MODELE-NEXTJS-FULLSTACK
```

2. Install dependencies:

```bash
npm install
```

3. Setup environment variables:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp apps/web/.env.example apps/web/.env.local
```

4. Start with Docker Compose:

```bash
docker-compose up
```

Or start manually:

```bash
# Terminal 1: Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd apps/web
npm run dev
```

5. Access the application:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📁 Project Structure

```
MODELE-NEXTJS-FULLSTACK/
├── apps/
│   └── web/                    # Next.js 16 frontend
│       ├── src/
│       │   ├── app/           # Pages and layouts
│       │   ├── components/    # React components
│       │   └── lib/           # Utilities
│       ├── package.json
│       ├── Dockerfile
│       └── railway.json
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/               # Endpoints
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   ├── tasks/             # Celery tasks
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── railway.json
├── packages/                   # Shared code
│   ├── types/
│   ├── schemas/
│   ├── config/
│   └── utils/
├── docker-compose.yml
├── turbo.json
└── package.json
```

## 🔗 API Endpoints

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

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest
pytest --cov=app --cov-report=html
```

### Frontend Tests

```bash
cd apps/web
npm run test
npm run test:ui
```

## 📦 Deployment

### Railway

1. Push to GitHub:

```bash
git push origin main
```

2. Connect Railway to GitHub repository

3. Set environment variables in Railway dashboard:

**Backend:**
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SECRET_KEY=your-secret-key
FRONTEND_URL=https://your-frontend.railway.app
```

**Frontend:**
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXTAUTH_URL=https://your-frontend.railway.app
NEXTAUTH_SECRET=your-secret-key
```

4. Deploy

### Docker

Build and run locally:

```bash
docker-compose up --build
```

## 🛠️ Development

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Formatting
npm run format

# All checks
npm run build
```

### Database Migrations

```bash
cd backend

# Create migration
alembic revision --autogenerate -m "Add new table"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Celery Tasks

```bash
# Start worker
celery -A app.celery_app worker --loglevel=info

# Monitor tasks
celery -A app.celery_app events
```

## 📚 Documentation

- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./apps/web/README.md)
- [API Documentation](http://localhost:8000/docs) (Swagger)
- [ReDoc](http://localhost:8000/redoc)

## 🔐 Security

- JWT authentication
- Password hashing with bcrypt
- CORS protection
- SQL injection prevention (SQLAlchemy)
- Environment variable management
- HTTPS ready

## 📝 Environment Variables

### Backend (.env)

```
ENVIRONMENT=development
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/modele_db
REDIS_URL=redis://localhost:6379/0
FRONTEND_URL=http://localhost:3000
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-in-production
```

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feat/feature-name`
2. Make changes and commit: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feat/feature-name`
4. Submit a Pull Request

## 📄 License

MIT

## 👨‍💻 Author

Created by [clement893](https://github.com/clement893)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [SQLAlchemy](https://www.sqlalchemy.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Railway](https://railway.app/)

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Happy coding! 🚀**
