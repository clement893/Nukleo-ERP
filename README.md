# MODELE-NEXTJS-FULLSTACK

A production-ready full-stack template with Next.js 16 frontend and FastAPI backend, perfect for building modern web applications.

## 🎯 Features

### Frontend (Next.js 16)
- ✅ **Next.js 16** with App Router and Turbopack
- ✅ **React 19** with Server Components
- ✅ **TypeScript 5** with strict configuration
- ✅ **Tailwind CSS 3** for styling
- ✅ **Complete UI Library** (20+ ERP components)
- ✅ **Reusable Hooks** (useForm, usePagination, useFilters, usePermissions)
- ✅ **NextAuth.js v5** with Google OAuth
- ✅ **Route Protection** middleware
- ✅ **Centralized Error Handling**
- ✅ **Structured Logging**

### Backend (FastAPI)
- ✅ **FastAPI** with auto-generated OpenAPI/Swagger docs
- ✅ **Pydantic v2** for data validation
- ✅ **SQLAlchemy async** ORM
- ✅ **Alembic** for database migrations
- ✅ **PostgreSQL** with async support
- ✅ **JWT Authentication** with refresh tokens
- ✅ **SendGrid Email Service** with 7+ transaction templates
- ✅ **Celery** for background task processing
- ✅ **Tests** with pytest
- ✅ **Logging** with loguru
- ✅ **Standardized Error Handling**

### Shared Types
- ✅ **`@modele/types` package** for shared TypeScript types
- ✅ **Automatic generation** from Pydantic schemas
- ✅ **Frontend/backend synchronization**

### DevOps & Tools
- ✅ **Turborepo** for optimized monorepo
- ✅ **pnpm workspaces** for dependency management
- ✅ **GitHub Actions** CI/CD
- ✅ **Pre-commit hooks** with Husky
- ✅ **Docker & Docker Compose**
- ✅ **Railway** deployment ready
- ✅ **Code generators** (components, pages, API routes)
- ✅ **Database migration scripts**

## 🚀 Quick Start

> 📖 **Complete guide**: [GETTING_STARTED.md](./GETTING_STARTED.md)

### Prerequisites

- **Node.js** 22+ ([download](https://nodejs.org/))
- **pnpm** 9+ (`npm install -g pnpm`)
- **Python** 3.11+ ([download](https://www.python.org/downloads/))
- **PostgreSQL** 14+ ([download](https://www.postgresql.org/download/))
- **Docker & Docker Compose** (optional)

### Installation

```bash
# 1. Clone the project
git clone https://github.com/clement893/MODELE-NEXTJS-FULLSTACK.git
cd MODELE-NEXTJS-FULLSTACK

# 2. Install dependencies
pnpm install

# 3. Configure environment variables
cp backend/.env.example backend/.env
cp apps/web/.env.example apps/web/.env.local
# Edit .env files with your values

# 4. Initialize database
createdb modele_db
cd backend && alembic upgrade head && cd ..

# 5. Start the project
npm run dev:full
```

**Access:**
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
│       └── Dockerfile
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/               # API endpoints
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   └── main.py
│   ├── alembic/               # Database migrations
│   └── requirements.txt
├── packages/                   # Shared code
│   └── types/                 # Shared TypeScript types
├── scripts/                    # Utility scripts
│   └── generate/              # Code generators
├── docker-compose.yml
├── turbo.json                 # Turborepo config
└── package.json               # Root package.json
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/refresh` - Refresh access token

### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update current user
- `GET /api/users/{user_id}` - Get user by ID
- `GET /api/users` - List all users

### Organizations
- `GET /api/organizations` - List organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/{id}` - Get organization
- `PUT /api/organizations/{id}` - Update organization

### Donateurs (Donors)
- `GET /api/donateurs` - List donors
- `POST /api/donateurs` - Create donor
- `GET /api/donateurs/{id}` - Get donor
- `PUT /api/donateurs/{id}` - Update donor
- `POST /api/donateurs/import` - Import donors from file
- `POST /api/donateurs/export` - Export donors to file

### Email (SendGrid)
- `POST /api/email/welcome` - Send welcome email
- `POST /api/email/invoice` - Send invoice email
- `POST /api/email/subscription/created` - Send subscription created email
- `POST /api/email/subscription/cancelled` - Send subscription cancelled email
- `POST /api/email/trial/ending` - Send trial ending email
- `POST /api/email/test` - Send test email
- `GET /api/email/health` - Email service health check

### Health
- `GET /health` - Health check
- `GET /api/health` - API health check

> 📡 **Full API documentation**: http://localhost:8000/docs (Swagger) or http://localhost:8000/redoc (ReDoc)
> 📧 **Email Setup Guide**: [docs/SENDGRID_SETUP.md](./docs/SENDGRID_SETUP.md)

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev:full          # Start frontend + backend
npm run dev:frontend      # Start frontend only
npm run dev:backend       # Start backend only

# Code Generation
npm run generate:component ComponentName
npm run generate:page page-name
npm run generate:api route-name
npm run generate:types    # Generate TypeScript types from Pydantic

# Database Migrations
npm run migrate create MigrationName
npm run migrate upgrade
npm run migrate downgrade

# Code Quality
npm run lint              # Lint code
npm run lint:fix          # Fix linting issues
npm run type-check        # TypeScript type checking
npm run format            # Format code with Prettier

# Testing
npm run test              # Run all tests
npm run test:web          # Frontend tests
npm run test:backend      # Backend tests
npm run test:e2e          # E2E tests with Playwright

# Build
npm run build             # Build all packages
npm run build:web         # Build frontend only
```

### Database Migrations

```bash
cd backend

# Create a new migration
alembic revision --autogenerate -m "Add new table"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

## 📦 Deployment

### Railway

1. Push to GitHub
2. Connect Railway to your GitHub repository
3. Set environment variables in Railway dashboard (see [GETTING_STARTED.md](./GETTING_STARTED.md))
4. Deploy automatically

### Docker

```bash
# Build and run locally
docker-compose up --build
```

## 📚 Documentation

- 📖 [Getting Started Guide](./GETTING_STARTED.md) - Complete setup guide
- 🛠️ [Development Guide](./DEVELOPMENT.md) - Development tools and workflows
- 📧 [SendGrid Email Setup](./docs/SENDGRID_SETUP.md) - Email service configuration
- 🤝 [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- 📝 [Changelog](./CHANGELOG.md) - Version history
- 🎨 [Backend Documentation](./backend/README.md)
- ⚛️ [Frontend Documentation](./apps/web/README.md)

## 🔐 Security

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- CORS protection
- SQL injection prevention (SQLAlchemy)
- Environment variable management
- HTTPS ready

## 📝 Environment Variables

### Backend (.env)

```env
ENVIRONMENT=development
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/modele_db
SECRET_KEY=your-secret-key-change-in-production
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# SendGrid Email Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Your App Name
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-in-production
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

> See `.env.example` files for complete configuration options.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/feature-name`
3. Make your changes
4. Commit with clear messages: `git commit -m "feat: add new feature"`
5. Push to your fork: `git push origin feat/feature-name`
6. Open a Pull Request

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
