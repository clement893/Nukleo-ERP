# Component Library

A comprehensive, production-ready React component library with **270+ components** built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

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

Components are organized into **32 categories**:

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

See the component showcase pages at `/components` for interactive examples.

## 🎨 Component Showcase

View all components in action at `/components`:

**Available Showcase Pages:**
- `/components` - Main component showcase index
- `/components/monitoring` - Monitoring and performance components
- `/components/errors` - Error handling components
- `/components/i18n` - Internationalization components
- `/components/admin` - Admin management components
- `/components/layout` - Layout components

**Component Categories (50+ total):**
- `ui/` - Core UI components (79 components)
- `auth/` - Authentication components (6 components)
- `billing/` - Billing and subscription components (8 components)
- `analytics/` - Analytics and reporting components (5 components)
- `monitoring/` - Monitoring and performance components (8 components)
- `errors/` - Error handling components (4 components)
- `i18n/` - Internationalization components (3 components)
- `admin/` - Admin management components (4 components)
- `layout/` - Layout components (11 components)
- `settings/` - Settings components (11 components)
- `activity/` - Activity tracking components (5 components)
- `notifications/` - Notification components (2 components)
- `performance/` - Performance optimization components (6 components)
- `rbac/` - Role-based access control components (1 component)
- `theme/` - Theme management components (2 components)
- `workflow/` - Workflow components (3 components)
- `collaboration/` - Collaboration components (4 components)
- `subscriptions/` - Subscription management components (4 components)
- `integrations/` - Integration components (4 components)
- `advanced/` - Advanced feature components (4 components)
- `sections/` - Section components (5 components)
- `providers/` - Provider components (5 components)
- `feature-flags/` - Feature flag management components (1 component)
- `preferences/` - User preferences components (1 component)
- `announcements/` - Announcements and banners components (1 component)
- `feedback/` - Feedback and support components (2 components)
- `onboarding/` - Onboarding wizard components (6 components)
- `documentation/` - Documentation and help components (2 components)
- `scheduled-tasks/` - Scheduled tasks management components (1 component)
- `backups/` - Backup and restore components (1 component)
- `email-templates/` - Email template management components (1 component)
- `audit-trail/` - Audit trail viewer components (1 component)
- `ai/` - AI and chat components (1 component)
- `blog/` - Blog components (2 components)
- `client/` - Client portal components (2 components)
- `cms/` - CMS components (4 components)
- `content/` - Content management components (9 components)
- `data/` - Data import/export components (2 components)
- `erp/` - ERP portal components (2 components)
- `favorites/` - Favorites components (2 components)
- `help/` - Help center components (7 components)
- `marketing/` - Marketing components (3 components)
- `page-builder/` - Page builder components (3 components)
- `profile/` - Profile components (2 components)
- `search/` - Search components (2 components)
- `seo/` - SEO components (1 component)
- `sharing/` - Sharing components (2 components)
- `surveys/` - Survey components (3 components)
- `tags/` - Tag components (2 components)
- `templates/` - Template components (2 components)
- `versions/` - Version components (2 components)

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

- **Total Components**: 270+
- **UI Components**: 96
- **Feature Components**: 171+
- **Storybook Stories**: 61+
- **Showcase Pages**: 35
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

