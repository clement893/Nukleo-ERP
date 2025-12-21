# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-21

### Added
- Initial release of MODELE-NEXTJS-FULLSTACK template
- Next.js 16 frontend with React 19
- FastAPI backend with async SQLAlchemy
- PostgreSQL database support
- Redis caching support
- JWT authentication system
- Docker Compose configuration
- Railway deployment configuration
- GitHub Actions CI/CD pipeline
- Comprehensive component library (UI, sections, layout)
- Zustand state management
- API client with interceptors
- User authentication pages (login, register)
- Dashboard page
- Responsive design with Tailwind CSS 3
- Nixpacks configuration for Railway
- pnpm workspace configuration
- Comprehensive documentation (README, CONTRIBUTING)
- Backend test suite with pytest
- Frontend test configuration with Vitest

### Fixed
- Tailwind CSS configuration (migrated from v4 to v3 for compatibility)
- Build errors with pnpm frozen-lockfile
- TypeScript errors (unused variables)
- Missing lib files (api.ts, store.ts)
- PostCSS configuration for Tailwind CSS

### Changed
- Updated Tailwind CSS from v4 to v3 for better Next.js compatibility
- Improved build configuration for Railway deployment

### Security
- JWT token authentication
- Password hashing with bcrypt
- CORS protection
- Environment variable management

## [Unreleased]

### Planned
- Alembic migrations setup
- Refresh token implementation
- File upload functionality
- Enhanced test coverage
- Rate limiting
- CSRF protection
- Email verification
- Password reset functionality

