# Component Library

A comprehensive, production-ready React component library with **255+ components** built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

## 📚 Overview

This component library provides a complete set of reusable UI components, feature components, and utilities for building modern full-stack applications. All components are:

- ✅ **Type-safe** - Full TypeScript support with exported types
- ✅ **Accessible** - WCAG AA compliant with ARIA attributes
- ✅ **Responsive** - Mobile-first design with breakpoint support
- ✅ **Themeable** - Dark mode support and customizable themes
- ✅ **Documented** - Storybook stories and showcase pages
- ✅ **Tested** - Unit tests and E2E test coverage

## 🚀 Quick Start

### Installation

Components are already included in this project. Import them using:

```tsx
import { Button, Card, Input } from '@/components/ui';
import { BillingDashboard } from '@/components/billing';
```

### Basic Usage

```tsx
import { Button, Card, Input } from '@/components/ui';

export default function MyPage() {
  return (
    <Card>
      <Input label="Email" type="email" />
      <Button variant="primary">Submit</Button>
    </Card>
  );
}
```

## 📁 Component Organization

Components are organized into **22 categories**:

### Core UI Components (`/ui`)
Foundation components used throughout the application:
- **Forms**: Input, Select, Textarea, Checkbox, Radio, Switch, DatePicker, etc.
- **Layout**: Card, Container, Tabs, Accordion, Sidebar, etc.
- **Data Display**: DataTable, Chart, Kanban, Calendar, Timeline, etc.
- **Feedback**: Alert, Toast, Modal, Loading, Progress, etc.
- **Navigation**: Breadcrumb, Pagination, CommandPalette, etc.

### Feature Components
Domain-specific components organized by feature:
- **Billing** (`/billing`) - Subscription management, invoices, payments
- **Auth** (`/auth`) - Authentication, MFA, social login
- **Analytics** (`/analytics`) - Dashboards, reports, data export
- **Settings** (`/settings`) - User, organization, security settings
- **Activity** (`/activity`) - Activity logs, audit trails
- **Monitoring** (`/monitoring`) - System metrics, health status, error tracking
- **And more...**

See [COMPONENTS_ORGANIZATION.md](./COMPONENTS_ORGANIZATION.md) for complete details.

## 🎨 Component Showcase

View all components in action at `/components`:

- `/components/data` - Data display components
- `/components/forms` - Form components
- `/components/feedback` - Feedback components
- `/components/billing` - Billing components
- `/components/auth` - Authentication components
- `/components/monitoring` - Monitoring components
- `/components/errors` - Error handling components
- `/components/i18n` - Internationalization components
- `/components/admin` - Admin components
- `/components/layout` - Layout components
- And 15+ more categories...

## 📖 Documentation

### Component Documentation

Each component category has its own README:
- [UI Components](./ui/README.md) - Core UI component library
- [Billing Components](./billing/README.md) - Billing and payment components
- [Auth Components](./auth/README.md) - Authentication components
- [Analytics Components](./analytics/README.md) - Analytics components
- [Settings Components](./settings/README.md) - Settings components
- [Activity Components](./activity/README.md) - Activity tracking components
- [Monitoring Components](./monitoring/README.md) - Monitoring components
- [Error Components](./errors/README.md) - Error handling components
- [i18n Components](./i18n/README.md) - Internationalization components
- [Admin Components](./admin/README.md) - Admin management components
- [Layout Components](./layout/README.md) - Layout components

### Storybook

Interactive component documentation:
```bash
pnpm storybook
```

View components at `http://localhost:6006`

## 🎯 Component Patterns

### Importing Components

```tsx
// UI Components (barrel export)
import { Button, Card, Input, DataTable } from '@/components/ui';

// Feature Components (barrel export)
import { BillingDashboard, InvoiceList } from '@/components/billing';

// Individual Components
import ErrorBoundary from '@/components/errors/ErrorBoundary';
```

### Using Components

```tsx
// Basic usage
<Button variant="primary" onClick={handleClick}>
  Click me
</Button>

// With props
<DataTable
  data={users}
  columns={columns}
  onRowClick={handleRowClick}
  pagination
/>

// With error handling
<ErrorBoundary fallback={<ErrorFallback />}>
  <MyComponent />
</ErrorBoundary>
```

## 🎨 Theming

All components support theming via CSS variables:

```tsx
// Components automatically use theme variables
<Button variant="primary">Themed Button</Button>

// Custom theme
<div style={{ '--color-primary-500': '#FF6B6B' }}>
  <Button variant="primary">Custom Color</Button>
</div>
```

See [Theme Components](./theme/README.md) for details.

## 🌍 Internationalization

Components support i18n with `next-intl`:

```tsx
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';

export default function MyPage() {
  const t = useTranslations('common');
  
  return (
    <div>
      <LanguageSwitcher />
      <h1>{t('welcome')}</h1>
    </div>
  );
}
```

## ♿ Accessibility

All components follow accessibility best practices:

- ✅ ARIA labels and roles
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Screen reader support
- ✅ WCAG AA compliance

## 🧪 Testing

Components include tests:

```bash
# Run component tests
pnpm test

# Run Storybook for visual testing
pnpm storybook
```

## 📊 Component Statistics

- **Total Components**: 255+
- **UI Components**: 80
- **Feature Components**: 175+
- **Storybook Stories**: 61+
- **Showcase Pages**: 25
- **TypeScript Coverage**: 100%

## 🔧 Development

### Adding a New Component

1. Create component file: `ComponentName.tsx`
2. Add types: `ComponentNameProps` interface
3. Export from `index.ts`
4. Create Storybook story: `ComponentName.stories.tsx`
5. Add to showcase page if needed
6. Add JSDoc comments

### Component Template

```tsx
/**
 * ComponentName Component
 * 
 * Brief description of what the component does
 * 
 * @example
 * ```tsx
 * <ComponentName prop="value" />
 * ```
 */
'use client';

import { ComponentNameProps } from './types';

export default function ComponentName({
  prop,
  ...props
}: ComponentNameProps) {
  return <div>{/* Component implementation */}</div>;
}
```

## 📝 Contributing

When contributing components:

1. Follow the existing component patterns
2. Add TypeScript types for all props
3. Include JSDoc comments
4. Add Storybook stories
5. Ensure accessibility compliance
6. Add tests
7. Update relevant README files

## 🔗 Resources

- [Component Organization Guide](./COMPONENTS_ORGANIZATION.md)
- [Component Showcase Analysis](./COMPONENTS_SHOWCASE_ANALYSIS.md)
- [Storybook Documentation](http://localhost:6006)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📄 License

This component library is part of the MODELE-NEXTJS-FULLSTACK project.

---

**Last Updated**: December 25, 2025  
**Version**: 1.0.0  
**Branch**: INITIALComponentRICH

