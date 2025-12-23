# MODELE-NEXTJS-FULLSTACK

A comprehensive, production-ready full-stack template for building modern SaaS applications and websites with Next.js 16, React 19, and TypeScript.

## 🚀 Features

### Core Features
- ✅ **Next.js 16** with App Router and React Server Components
- ✅ **React 19** - Latest React features
- ✅ **TypeScript** - Strict mode for maximum type safety
- ✅ **Monorepo** - Turborepo for efficient builds
- ✅ **Tailwind CSS** - Utility-first CSS framework
- ✅ **Dark Mode** - Built-in theme support

### Authentication & Security
- ✅ **JWT Authentication** with httpOnly cookies (XSS protection)
- ✅ **Token Refresh** - Automatic token refresh
- ✅ **Route Protection** - Server-side and client-side
- ✅ **RBAC** - Role-Based Access Control
- ✅ **Security Headers** - CSP, HSTS, X-Frame-Options

### SaaS Features
- ✅ **Subscription Management** - Stripe integration ready
- ✅ **Team Management** - Multi-user teams
- ✅ **Invitations System** - User invitations
- ✅ **Payment History** - Transaction tracking
- ✅ **Customer Portal** - Self-service portal

### Developer Experience
- ✅ **React Query** - API state management with caching
- ✅ **Storybook** - Component documentation
- ✅ **Vitest** - Unit testing
- ✅ **Playwright** - E2E testing
- ✅ **ESLint & Prettier** - Code quality
- ✅ **Bundle Analyzer** - Performance monitoring
- ✅ **Web Vitals** - Performance tracking

### UI Components
- ✅ **20+ UI Components** - DataTable, Kanban, Calendar, Forms, etc.
- ✅ **Accessible** - WCAG compliant
- ✅ **Responsive** - Mobile-first design
- ✅ **Customizable** - Easy to theme

## 📋 Prerequisites

- **Node.js** 20.x or higher
- **pnpm** 9.x or higher (recommended) or npm/yarn
- **Git**

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/clement893/MODELE-NEXTJS-FULLSTACK.git
cd MODELE-NEXTJS-FULLSTACK
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create `.env.local` in `apps/web/`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Authentication
JWT_SECRET=your-secret-key-change-in-production
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Stripe (for subscriptions)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-key
STRIPE_SECRET_KEY=your-stripe-secret

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### 4. Run development server

```bash
# Run frontend and backend in parallel
pnpm dev

# Or run separately
pnpm dev:frontend  # Frontend only
pnpm dev:backend   # Backend only
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
MODELE-NEXTJS-FULLSTACK/
├── apps/
│   └── web/                 # Next.js frontend application
│       ├── src/
│       │   ├── app/         # Next.js App Router pages
│       │   ├── components/ # React components
│       │   ├── lib/         # Utilities and libraries
│       │   └── hooks/       # Custom React hooks
│       └── public/          # Static assets
├── packages/
│   └── types/               # Shared TypeScript types
├── backend/                 # FastAPI backend (if present)
└── scripts/                 # Automation scripts
```

## 🎯 Available Scripts

### Development
```bash
pnpm dev              # Start development servers
pnpm dev:frontend     # Frontend only
pnpm dev:backend      # Backend only
```

### Build
```bash
pnpm build            # Build all packages
pnpm build:web        # Build frontend only
pnpm build:optimized  # Optimized build
```

### Testing
```bash
pnpm test             # Run unit tests
pnpm test:watch       # Watch mode
pnpm test:e2e         # E2E tests
pnpm test:coverage    # Coverage report
```

### Code Quality
```bash
pnpm lint             # Lint code
pnpm lint:fix         # Auto-fix linting issues
pnpm format           # Format with Prettier
pnpm type-check       # TypeScript type checking
```

### Analysis
```bash
pnpm analyze         # Bundle size analysis
pnpm audit:security  # Security audit
```

## 🔧 Configuration

### TypeScript
Strict mode is enabled with comprehensive type checking. See `apps/web/tsconfig.json` for details.

### ESLint
Configured with Next.js, TypeScript, and React rules. See `apps/web/.eslintrc.json`.

### Tailwind CSS
Utility-first CSS with custom configuration. See `apps/web/tailwind.config.js`.

## 🧪 Testing

### Unit Tests
```bash
pnpm test
```

Tests are written with Vitest and React Testing Library.

### E2E Tests
```bash
pnpm test:e2e
```

E2E tests use Playwright.

### Coverage
Target: 70% coverage for lines, functions, branches, and statements.

## 📚 Documentation

### Component Documentation
```bash
pnpm storybook
```

View component documentation and examples in Storybook.

### API Documentation
API endpoints are documented in `apps/web/src/lib/api.ts` with JSDoc comments.

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy!

### Docker

```bash
# Build
docker build -t modele-nextjs-fullstack .

# Run
docker run -p 3000:3000 modele-nextjs-fullstack
```

### Standalone Build

The app is configured for standalone output:

```bash
pnpm build
cd apps/web/.next/standalone
node server.js
```

## 🔒 Security

### Implemented Security Features
- ✅ httpOnly cookies for tokens
- ✅ JWT verification server-side
- ✅ Content Security Policy (CSP)
- ✅ Security headers (X-Frame-Options, etc.)
- ✅ Input sanitization
- ✅ Error handling without data leakage

### Security Best Practices
- Use strong JWT secrets
- Enable HTTPS in production
- Regularly update dependencies
- Monitor security advisories
- Use environment variables for secrets

## 📊 Performance

### Optimizations
- ✅ Code splitting
- ✅ Lazy loading
- ✅ Image optimization
- ✅ Bundle optimization
- ✅ React Query caching
- ✅ Web Vitals monitoring

### Performance Targets
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **TTFB**: < 600ms

## 🌍 Internationalization

i18n support is configured with `next-intl`. See `apps/web/src/i18n/` for configuration.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow TypeScript best practices
- Use ESLint and Prettier
- Write tests for new features
- Update documentation

## 📝 License

This project is private and proprietary.

## 🆘 Support

For issues and questions:
- Open an issue on GitHub
- Check the documentation
- Review the code comments

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📈 Roadmap

### Planned Features
- [ ] Enhanced i18n support
- [ ] More test coverage
- [ ] CI/CD pipelines
- [ ] Advanced analytics
- [ ] Real-time features (WebSockets)

## 🙏 Acknowledgments

Built with:
- Next.js
- React
- TypeScript
- Tailwind CSS
- And many other amazing open-source projects

---

**Made with ❤️ for building amazing SaaS applications**
