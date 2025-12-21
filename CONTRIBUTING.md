# Contributing to MODELE-NEXTJS-FULLSTACK

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome diverse perspectives
- Focus on constructive feedback
- Report inappropriate behavior

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/MODELE-NEXTJS-FULLSTACK.git`
3. Create a feature branch: `git checkout -b feat/your-feature`
4. Make your changes
5. Commit with clear messages: `git commit -m "feat: add new feature"`
6. Push to your fork: `git push origin feat/your-feature`
7. Open a Pull Request

## Development Setup

```bash
# Install dependencies
npm install

# Setup environment
cp backend/.env.example backend/.env
cp apps/web/.env.example apps/web/.env.local

# Start development
docker-compose up
# or
npm run dev
```

## Code Style

### Frontend (TypeScript/React)

- Use TypeScript for type safety
- Follow ESLint rules
- Format with Prettier
- Use functional components with hooks
- Keep components small and focused

```bash
npm run lint
npm run format
npm run type-check
```

### Backend (Python)

- Follow PEP 8 style guide
- Use type hints
- Write docstrings
- Keep functions focused

```bash
cd backend
ruff check .
ruff format .
mypy app
```

## Testing

### Backend

```bash
cd backend
pytest
pytest --cov=app --cov-report=html
```

### Frontend

```bash
cd apps/web
npm run test
npm run test:ui
```

## Commit Messages

Use conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Build/dependencies

Example:

```
feat: add user profile page

- Add profile page component
- Add profile API endpoint
- Add profile tests
```

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass: `npm run test`
4. Ensure code quality: `npm run lint`
5. Update CHANGELOG.md
6. Provide clear PR description

## Reporting Issues

Include:

- Clear description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details
- Screenshots/logs if applicable

## Feature Requests

Describe:

- Use case
- Proposed solution
- Alternatives considered
- Additional context

## Documentation

- Update README.md for user-facing changes
- Add docstrings to code
- Update API docs if applicable
- Add comments for complex logic

## Questions?

- Open a discussion on GitHub
- Check existing issues/discussions
- Read the documentation

## License

By contributing, you agree your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🙏
