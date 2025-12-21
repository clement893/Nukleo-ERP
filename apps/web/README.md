# Frontend - Next.js 16

Frontend for MODELE-NEXTJS-FULLSTACK built with Next.js 16 and React 19.

## Features

- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS 3
- Zustand for state management
- Axios for API calls
- Authentication with JWT
- Responsive design

## Installation

### Prerequisites

- Node.js 18+
- npm or pnpm

### Setup

1. Install dependencies:

```bash
npm install
# or
pnpm install
```

2. Create `.env.local` file:

```bash
cp .env.example .env.local
```

3. Update environment variables in `.env.local`

## Running Locally

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── auth/            # Authentication pages
│   ├── dashboard/       # Dashboard pages
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── components/          # Reusable components
├── lib/                 # Utilities and helpers
│   ├── api.ts          # API client
│   └── store.ts        # Zustand store
└── public/             # Static files
```

## Building

```bash
npm run build
npm start
```

## Testing

```bash
npm run test
npm run test:ui
```

## Code Quality

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run type-check
```

### Formatting

```bash
npm run format
```

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXTAUTH_URL` - NextAuth URL
- `NEXTAUTH_SECRET` - NextAuth secret key
- `GOOGLE_ID` - Google OAuth ID (optional)
- `GOOGLE_SECRET` - Google OAuth secret (optional)

## Pages

- `/` - Home page
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/dashboard` - Dashboard (protected)

## API Integration

The frontend communicates with the backend FastAPI through the `lib/api.ts` module.

### Example Usage

```typescript
import { authAPI, usersAPI } from '@/lib/api';

// Login
const response = await authAPI.login(email, password);

// Get current user
const user = await usersAPI.getCurrentUser();

// List users
const users = await usersAPI.listUsers();
```

## State Management

Using Zustand for global state:

```typescript
import { useAuthStore } from '@/lib/store';

const { user, token, login, logout } = useAuthStore();
```

## Deployment

### Railway

1. Push to GitHub
2. Connect Railway to GitHub repository
3. Set environment variables in Railway dashboard
4. Deploy

Environment variables needed:

```
NEXT_PUBLIC_API_URL=https://your-backend-api.railway.app
NEXTAUTH_URL=https://your-frontend.railway.app
NEXTAUTH_SECRET=your-secret-key
```

## Contributing

1. Create a feature branch
2. Make changes
3. Run tests and linting
4. Submit PR

## License

MIT
